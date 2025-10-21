import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getSiteUrl, getStripeClient } from "@/lib/stripe";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[CHECKOUT_SESSION] Prisma unavailable", error);
    return null;
  }
};

export async function POST() {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status ?? 401 });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error("[CHECKOUT_SESSION] Missing STRIPE_PRICE_ID");
    return NextResponse.json({ error: "Stripe price is not configured." }, { status: 500 });
  }

  const userId = Number(auth.session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid user context" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const stripe = getStripeClient();
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      success_url: `${siteUrl}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/support?status=cancelled`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      metadata: {
        userId: String(user.id),
      },
      client_reference_id: String(user.id),
      subscription_data: {
        metadata: {
          userId: String(user.id),
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[CHECKOUT_SESSION_POST]", error);
    return NextResponse.json({ error: "Checkout-Erstellung fehlgeschlagen." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
