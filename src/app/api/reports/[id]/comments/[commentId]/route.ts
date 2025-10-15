import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: { id: string; commentId: string } },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Nur Besitzer:innen dürfen Kommentare löschen." }, { status: 403 });
  }

  const reportId = Number(context.params.id);
  const commentId = Number(context.params.commentId);
  if (Number.isNaN(reportId) || Number.isNaN(commentId)) {
    return NextResponse.json({ error: "Ungültige IDs übermittelt." }, { status: 400 });
  }

  const existing = await prisma.reportComment.findUnique({ where: { id: commentId } });
  if (!existing || existing.reportId !== reportId) {
    return NextResponse.json({ error: "Kommentar wurde nicht gefunden." }, { status: 404 });
  }

  await prisma.reportComment.delete({ where: { id: commentId } });

  const totalComments = await prisma.reportComment.count({ where: { reportId } });
  await prisma.report.update({
    where: { id: reportId },
    data: { comments: totalComments },
  });

  return NextResponse.json({ ok: true });
}
