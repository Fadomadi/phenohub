import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

const MODERATED_STATUS_VALUES = ["PENDING", "PUBLISHED", "REJECTED"] as const;
type ModeratedStatus = (typeof MODERATED_STATUS_VALUES)[number];
const isModeratedStatus = (value: string): value is ModeratedStatus =>
  MODERATED_STATUS_VALUES.includes(value as ModeratedStatus);

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam ? statusParam.toUpperCase() : null;

  const normalizedStatus: ModeratedStatus | undefined =
    status && status !== "ALL" && isModeratedStatus(status) ? status : undefined;

  const where = normalizedStatus ? { status: normalizedStatus } : undefined;

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
