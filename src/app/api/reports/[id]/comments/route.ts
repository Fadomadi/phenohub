import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[COMMENTS_API] Prisma unavailable", error);
    return null;
  }
};

type RouteParams = { id: string };

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json({ comments: [] });
  }

  const params = await context.params;
  const reportId = Number(params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const comments = await prisma.reportComment.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    comments: comments.map((comment: typeof comments[number]) => ({
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
  context: { params: Promise<RouteParams> },
) {
  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Kommentare derzeit nicht verfügbar." }, { status: 503 });
  }

  const params = await context.params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });
  }

  const reportId = Number(params.id);
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

  const created = await prisma.reportComment.create({
    data: {
      reportId,
      userId,
      authorName,
      body: body.trim(),
    },
  });

  const totalComments = await prisma.reportComment.count({ where: { reportId } });
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
