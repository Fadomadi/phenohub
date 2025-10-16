import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { LIKE_COOKIE_NAME } from "@/lib/likes";

type RouteParams = { id: string };

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[REPORT_LIKE] Prisma unavailable", error);
    return null;
  }
};

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Datenbank nicht verfügbar. Bitte später erneut versuchen." },
      { status: 503 },
    );
  }

  const session = await getServerSession(authConfig);
  const params = await context.params;
  const reportId = Number(params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const cookieStore = await cookies();
  let clientId = cookieStore.get(LIKE_COOKIE_NAME)?.value ?? null;
  let shouldSetCookie = false;
  if (!clientId) {
    clientId = randomUUID();
    shouldSetCookie = true;
  }

  const identifiers: Array<{ userId?: number; clientId?: string }> = [];
  let userId: number | undefined;
  if (session?.user?.id) {
    const parsed = Number(session.user.id);
    if (!Number.isNaN(parsed)) {
      userId = parsed;
      identifiers.push({ userId: parsed });
    }
  }

  if (clientId) {
    identifiers.push({ clientId });
  }

  if (identifiers.length === 0) {
    return NextResponse.json({ error: "Identifikation fehlgeschlagen." }, { status: 400 });
  }

  const existing = await prisma.reportLike.findFirst({
    where: {
      reportId,
      OR: identifiers,
    },
  });

  let liked: boolean;

  if (existing) {
    await prisma.reportLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.reportLike.create({
      data: {
        reportId,
        userId: userId ?? null,
        clientId,
      },
    });
    liked = true;
  }

  const totalLikes = await prisma.reportLike.count({ where: { reportId } });

  await prisma.report.update({
    where: { id: reportId },
    data: { likes: totalLikes },
  });

  const response = NextResponse.json({ liked, likes: totalLikes });

  if (shouldSetCookie && clientId) {
    response.cookies.set(LIKE_COOKIE_NAME, clientId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: "/",
    });
  }

  return response;
}
