import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import {
  sendSupporterConfirmationMail,
  sendSupporterNotificationMail,
} from "@/lib/mailer";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[SUPPORT_WAITLIST] Prisma unavailable", error);
    return null;
  }
};

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export async function POST(request: Request) {
  try {
    const prisma = await importPrisma();
    if (!prisma) {
      return NextResponse.json(
        {
          error:
            "Eintrag nicht möglich. Bitte probiere es später erneut oder kontaktiere support@phenohub.app.",
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail: unknown = body?.email;
    const source: unknown = body?.source;

    if (typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
      return NextResponse.json(
        { error: "Bitte eine E-Mail-Adresse eingeben." },
        { status: 400 },
      );
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Bitte eine gültige E-Mail-Adresse angeben." },
        { status: 400 },
      );
    }

    const now = new Date();
    const persistedSource =
      typeof source === "string" && source.trim().length > 0
        ? source.trim().slice(0, 120)
        : "support-page";

    const existing = await prisma.supporterWaitlist.findUnique({
      where: { email: normalizedEmail },
    });

    const entry = existing
      ? await prisma.supporterWaitlist.update({
          where: { email: normalizedEmail },
          data: {
            status:
              existing.status === "UNSUBSCRIBED" ? "PENDING" : existing.status,
            confirmationSentAt: now,
            source: persistedSource,
          },
        })
      : await prisma.supporterWaitlist.create({
          data: {
            email: normalizedEmail,
            status: "PENDING",
            confirmationSentAt: now,
            source: persistedSource,
          },
        });

    await Promise.allSettled([
      sendSupporterConfirmationMail(normalizedEmail),
      sendSupporterNotificationMail(normalizedEmail),
    ]);

    return NextResponse.json({
      ok: true,
      status: entry.status,
      message:
        "Danke! Wir melden uns, sobald das Supporter-Abo live ist – checke dein Postfach.",
    });
  } catch (error) {
    console.error("[SUPPORT_WAITLIST_POST]", error);
    return NextResponse.json(
      {
        error:
          "Eintrag nicht möglich. Bitte probiere es später erneut oder kontaktiere support@phenohub.app.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json({ entries: [] });
  }

  const entries = await prisma.supporterWaitlist.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries });
}
