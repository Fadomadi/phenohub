import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const MODERATED_STATUS_VALUES = ["PENDING", "PUBLISHED", "REJECTED"] as const;
type ModeratedStatus = (typeof MODERATED_STATUS_VALUES)[number];
const MODERATED_STATUSES = new Set<ModeratedStatus>(MODERATED_STATUS_VALUES);

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam ? statusParam.toUpperCase() : null;

  const normalizedStatus =
    status && status !== "ALL" && MODERATED_STATUSES.has(status as ModeratedStatus)
      ? (status as ModeratedStatus)
      : undefined;

  const where: Prisma.ReportWhereInput | undefined = normalizedStatus
    ? { status: normalizedStatus }
    : undefined;

  const reports = await prisma.report.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      cultivar: { select: { name: true, slug: true } },
      provider: { select: { name: true, slug: true } },
      author: { select: { id: true, name: true, email: true } },
      moderatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ reports });
}
