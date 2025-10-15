import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { LIKE_COOKIE_NAME } from "@/lib/likes";

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authConfig);
  const reportId = Number(context.params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const reportLikeClient = (prisma as any).reportLike;
  if (!reportLikeClient?.findFirst || !reportLikeClient?.create || !reportLikeClient?.delete) {
    console.warn("[LIKE_API] reportLike client not available – rejecting POST");
    return NextResponse.json({ error: "Likes derzeit nicht verfügbar." }, { status: 503 });
  }

  const cookieStore = cookies();
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

  const existing = await reportLikeClient.findFirst({
    where: {
      reportId,
      OR: identifiers,
    },
  });

  let liked: boolean;

  if (existing) {
    await reportLikeClient.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await reportLikeClient.create({
      data: {
        reportId,
        userId: userId ?? null,
        clientId,
      },
    });
    liked = true;
  }

  const totalLikes = reportLikeClient.count
    ? await reportLikeClient.count({ where: { reportId } })
    : 0;

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
