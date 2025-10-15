import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const reportCommentClient = (prisma as any).reportComment;
  const reportId = Number(context.params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  if (!reportCommentClient?.findMany) {
    console.warn("[COMMENTS_API] reportComment client not available – returning empty comments");
    return NextResponse.json({ comments: [] });
  }

  const comments = await reportCommentClient.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      reportId: comment.reportId,
      userId: comment.userId,
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const reportCommentClient = (prisma as any).reportComment;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });
  }

  if (!reportCommentClient?.create) {
    console.warn("[COMMENTS_API] reportComment client not available – rejecting POST");
    return NextResponse.json({ error: "Kommentare derzeit nicht verfügbar." }, { status: 503 });
  }

  const reportId = Number(context.params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const { body } = await request.json().catch(() => ({ body: "" }));
  if (typeof body !== "string" || body.trim().length < 3) {
    return NextResponse.json({ error: "Kommentar ist zu kurz." }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ error: "Kommentar darf maximal 2000 Zeichen enthalten." }, { status: 400 });
  }

  const userId = Number(session.user.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Ungültige Session." }, { status: 400 });
  }

  const sessionUser = session.user as unknown as { username?: string | null; name?: string | null; email?: string | null };
  const authorName =
    sessionUser?.username?.trim() ||
    sessionUser?.name?.trim() ||
    sessionUser?.email?.split("@")[0] ||
    "Community";

  const created = await reportCommentClient.create({
    data: {
      reportId,
      userId,
      authorName,
      body: body.trim(),
    },
  });

  const totalComments = reportCommentClient.count
    ? await reportCommentClient.count({ where: { reportId } })
    : 0;
  await prisma.report.update({
    where: { id: reportId },
    data: { comments: totalComments },
  });

  return NextResponse.json({
    ok: true,
    comment: {
      id: created.id,
      reportId: created.reportId,
      userId: created.userId,
      authorName: created.authorName,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
