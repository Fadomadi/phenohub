import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { recalcAllMetrics } from "@/lib/metrics";

const MODERATED_STATUSES = new Set(["PENDING", "PUBLISHED", "REJECTED"]);

type RouteParams = Promise<{ params: { id: string } }>;

export async function PATCH(
  request: Request,
  context: RouteParams,
) {
  const { params } = await context;
  const auth = await requireAdmin();
  if (!auth.ok || !auth.session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const reportId = Number(params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { status, reviewNote } = body ?? {};

  if (typeof status !== "string" || !MODERATED_STATUSES.has(status.toUpperCase())) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report nicht gefunden." }, { status: 404 });
  }

  const normalizedStatus = status.toUpperCase();
  const moderatorId = auth.session.user.id ? Number(auth.session.user.id) : undefined;
  const moderatedAt = new Date();

  const updateData = {
    status: normalizedStatus,
    reviewNote: typeof reviewNote === "string" ? reviewNote : null,
    moderatedAt,
    moderatedById: moderatorId ?? null,
    publishedAt:
      normalizedStatus === "PUBLISHED"
        ? report.publishedAt ?? moderatedAt
        : null,
  } as const;

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: updateData,
    include: {
      cultivar: { select: { id: true } },
      provider: { select: { id: true } },
    },
  });

  const statusChanged = report.status !== updated.status;
  const affectedMetrics =
    statusChanged && (report.status === "PUBLISHED" || updated.status === "PUBLISHED");

  if (affectedMetrics) {
    await recalcAllMetrics(prisma);
  }

  return NextResponse.json({ ok: true, report: updated });
}

export async function DELETE(
  request: Request,
  context: RouteParams,
) {
  const { params } = await context;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const reportId = Number(params.id);
  if (Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Ungültige Report-ID." }, { status: 400 });
  }

  const deleted = await prisma.report.delete({
    where: { id: reportId },
    include: {
      cultivar: { select: { id: true } },
      provider: { select: { id: true } },
    },
  }).catch(() => null);

  if (!deleted) {
    return NextResponse.json({ error: "Report nicht gefunden." }, { status: 404 });
  }

  await recalcAllMetrics(prisma);

  return NextResponse.json({ ok: true });
}
