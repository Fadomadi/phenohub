import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const MODERATED_STATUSES = new Set(["PENDING", "PUBLISHED", "REJECTED"]);

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam ? statusParam.toUpperCase() : null;

  type ModeratedStatus = "PENDING" | "PUBLISHED" | "REJECTED";
  const normalizedStatus =
    status && status !== "ALL" && MODERATED_STATUSES.has(status)
      ? (status as ModeratedStatus)
      : undefined;

  const where: NonNullable<Parameters<typeof prisma.report.findMany>[0]>["where"] =
    normalizedStatus ? { status: normalizedStatus } : undefined;

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
