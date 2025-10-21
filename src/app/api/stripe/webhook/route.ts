import { NextResponse } from "next/server";
import type { SubscriptionStatus as PrismaSubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[STRIPE_WEBHOOK] Prisma unavailable", error);
    return null;
  }
};

const parseUserId = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};

const toDate = (timestamp?: number | null) => {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return new Date();
  }
  return new Date(timestamp * 1000);
};

const getCurrentPeriodEnd = (subscription?: Stripe.Subscription | null) => {
  if (!subscription) {
    return new Date();
  }

  const legacyValue = (subscription as unknown as { current_period_end?: number | null }).current_period_end;
  if (typeof legacyValue === "number" && Number.isFinite(legacyValue)) {
    return toDate(legacyValue);
  }

  if (typeof subscription.cancel_at === "number" && Number.isFinite(subscription.cancel_at)) {
    return toDate(subscription.cancel_at);
  }

  if (subscription.pause_collection?.resumes_at) {
    return toDate(subscription.pause_collection.resumes_at);
  }

  if (typeof subscription.billing_cycle_anchor === "number" && Number.isFinite(subscription.billing_cycle_anchor)) {
    return toDate(subscription.billing_cycle_anchor);
  }

  return new Date();
};

const getInvoiceSubscriptionRef = (invoice: Stripe.Invoice) => {
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (legacy) {
    return legacy;
  }
  return invoice.parent?.subscription_details?.subscription ?? null;
};

const mapStripeStatus = (status?: Stripe.Subscription.Status | null): PrismaSubscriptionStatus => {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "CANCELED";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "PAST_DUE";
    case "active":
    default:
      return "ACTIVE";
  }
};

const shouldMarkAsSupporter = (status: PrismaSubscriptionStatus) => {
  return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
};

const markSupporter = async (params: {
  prisma: Awaited<ReturnType<typeof importPrisma>>;
  userId: number;
  customerId?: string | null;
  subscription?: Stripe.Subscription | null;
}) => {
  const { prisma, userId, customerId, subscription } = params;
  if (!prisma) return;

  const stripeSubId = subscription?.id ?? null;
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const status = subscription ? mapStripeStatus(subscription.status) : ("ACTIVE" as PrismaSubscriptionStatus);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      console.warn("[STRIPE_WEBHOOK] markSupporter: user not found", { userId });
      return;
    }

    const updateData: Record<string, unknown> = {
      plan: "STARTER",
    };

    if (customerId) {
      updateData.stripeCustomerId = customerId;
    }

    if (user.role === "USER") {
      updateData.role = "SUPPORTER";
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (stripeSubId && shouldMarkAsSupporter(status)) {
      await tx.subscription.upsert({
        where: { stripeSubId },
        create: {
          stripeSubId,
          userId,
          status,
          tier: "STARTER",
          currentPeriodEnd,
          cancelAtPeriodEnd,
        },
        update: {
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd,
        },
      });
    }
  });
};

const removeSupporter = async (params: {
  prisma: Awaited<ReturnType<typeof importPrisma>>;
  userId: number;
  subscriptionId?: string | null;
  status: PrismaSubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
}) => {
  const { prisma, userId, subscriptionId, status, cancelAtPeriodEnd, currentPeriodEnd } = params;
  if (!prisma) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      console.warn("[STRIPE_WEBHOOK] removeSupporter: user not found", { userId });
      return;
    }

    const updateData: Record<string, unknown> = {
      plan: "FREE",
    };

    if (user.role === "SUPPORTER") {
      updateData.role = "USER";
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (subscriptionId) {
      const endDate = currentPeriodEnd ?? new Date();
      await tx.subscription.upsert({
        where: { stripeSubId: subscriptionId },
        create: {
          stripeSubId: subscriptionId,
          userId,
          status,
          tier: "STARTER",
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: cancelAtPeriodEnd ?? true,
        },
        update: {
          status,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: cancelAtPeriodEnd ?? true,
        },
      });
    }
  });
};

const resolveUserId = async (prisma: Awaited<ReturnType<typeof importPrisma>>, candidate: {
  userId?: number | null;
  customerId?: string | null;
  email?: string | null;
}) => {
  if (!prisma) return null;
  if (candidate.userId) {
    return candidate.userId;
  }

  if (candidate.customerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: candidate.customerId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  if (candidate.email) {
    const user = await prisma.user.findUnique({
      where: { email: candidate.email.toLowerCase() },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return null;
};

const fetchSubscription = async (subscription: string | Stripe.Subscription | null | undefined) => {
  if (!subscription) return null;
  if (typeof subscription !== "string") return subscription;

  try {
    const stripe = getStripeClient();
    return await stripe.subscriptions.retrieve(subscription);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Failed to fetch subscription", error);
    return null;
  }
};

const handleCheckoutSessionCompleted = async (
  prisma: Awaited<ReturnType<typeof importPrisma>>,
  session: Stripe.Checkout.Session,
) => {
  const stripe = getStripeClient();
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const subscription = await fetchSubscription(session.subscription);
  const userId =
    (parseUserId(session.metadata?.userId) ??
      parseUserId(session.client_reference_id)) ??
    (await resolveUserId(prisma, {
      customerId,
      email: session.customer_details?.email ?? session.customer_email,
    }));

  if (!userId) {
    console.warn("[STRIPE_WEBHOOK] checkout.session.completed: no user reference", {
      sessionId: session.id,
    });
    return;
  }

  await markSupporter({
    prisma,
    userId,
    customerId,
    subscription: subscription ?? null,
  });

  // Store the subscription metadata if needed
  if (subscription && !subscription.metadata?.userId) {
    try {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          ...subscription.metadata,
          userId: String(userId),
        },
      });
    } catch (error) {
      console.warn("[STRIPE_WEBHOOK] Failed to backfill subscription metadata", error);
    }
  }
};

const handleSubscriptionUpdated = async (
  prisma: Awaited<ReturnType<typeof importPrisma>>,
  subscription: Stripe.Subscription,
) => {
  const userId = await resolveUserId(prisma, {
    userId: parseUserId(subscription.metadata?.userId),
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
  });

  if (!userId) {
    console.warn("[STRIPE_WEBHOOK] subscription.updated: no user reference", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const status = mapStripeStatus(subscription.status);

  if (shouldMarkAsSupporter(status)) {
    await markSupporter({
      prisma,
      userId,
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null,
      subscription,
    });
  } else {
    await removeSupporter({
      prisma,
      userId,
      subscriptionId: subscription.id,
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? true,
      currentPeriodEnd: getCurrentPeriodEnd(subscription),
    });
  }
};

const handleSubscriptionDeleted = async (
  prisma: Awaited<ReturnType<typeof importPrisma>>,
  subscription: Stripe.Subscription,
) => {
  const userId = await resolveUserId(prisma, {
    userId: parseUserId(subscription.metadata?.userId),
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
  });

  if (!userId) {
    console.warn("[STRIPE_WEBHOOK] subscription.deleted: no user reference", {
      subscriptionId: subscription.id,
    });
    return;
  }

  await removeSupporter({
    prisma,
    userId,
    subscriptionId: subscription.id,
    status: "CANCELED",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
  });
};

const handleInvoicePaymentFailed = async (
  prisma: Awaited<ReturnType<typeof importPrisma>>,
  invoice: Stripe.Invoice,
) => {
  const subscriptionRef = getInvoiceSubscriptionRef(invoice);
  const subscription = await fetchSubscription(subscriptionRef);
  const userId = await resolveUserId(prisma, {
    userId: parseUserId(subscription?.metadata?.userId),
    customerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
    email: invoice.customer_email ?? null,
  });

  if (!userId) {
    console.warn("[STRIPE_WEBHOOK] invoice.payment_failed: no user reference", {
      invoiceId: invoice.id,
    });
    return;
  }

  const status = subscription ? mapStripeStatus(subscription.status) : ("PAST_DUE" as PrismaSubscriptionStatus);

  await removeSupporter({
    prisma,
    userId,
    subscriptionId:
      subscription?.id ??
      (typeof subscriptionRef === "string" ? subscriptionRef : undefined),
    status,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? true,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
  });
};

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const secret = getStripeWebhookSecret();

  let event: Stripe.Event;
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new NextResponse("Missing Stripe signature", { status: 400 });
    }

    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] signature verification failed", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(prisma, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(prisma, event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(prisma, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(prisma, event.data.object as Stripe.Invoice);
        break;
      default:
        console.info("[STRIPE_WEBHOOK] Ignored event", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] handler error", error);
    return new NextResponse("Processing error", { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
