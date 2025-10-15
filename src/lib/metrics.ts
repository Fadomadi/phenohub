import type { PrismaClient } from "@prisma/client";

const toOneDecimal = (value: number) =>
  Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;

export const recalcProviderMetrics = async (prisma: PrismaClient) => {
  const providers = await prisma.provider.findMany({ select: { id: true } });

  for (const provider of providers) {
    const metrics = await prisma.report.aggregate({
      where: { providerId: provider.id, status: "PUBLISHED" },
      _avg: { overall: true, shipping: true, vitality: true },
      _count: true,
    });

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        avgScore: toOneDecimal(Number(metrics._avg.overall ?? 0)),
        shippingScore: toOneDecimal(Number(metrics._avg.shipping ?? 0)),
        vitalityScore: toOneDecimal(Number(metrics._avg.vitality ?? 0)),
        reportCount: metrics._count ?? 0,
      },
    });
  }
};

export const recalcCultivarMetrics = async (prisma: PrismaClient) => {
  const cultivars = await prisma.cultivar.findMany({ select: { id: true } });

  for (const cultivar of cultivars) {
    const metrics = await prisma.report.aggregate({
      where: { cultivarId: cultivar.id, status: "PUBLISHED" },
      _avg: { overall: true },
      _count: true,
    });

    await prisma.cultivar.update({
      where: { id: cultivar.id },
      data: {
        avgRating: toOneDecimal(Number(metrics._avg.overall ?? 0)),
        reportCount: metrics._count ?? 0,
      },
    });
  }
};

export const recalcAllMetrics = async (prisma: PrismaClient) => {
  await recalcProviderMetrics(prisma);
  await recalcCultivarMetrics(prisma);
};
