import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { getClientLikeId } from "@/lib/likes";
import { mockCultivars, mockProviders, mockReports, mockSeeds } from "@/data/mockData";

const TAKE = 6;

const toCultivar = (cultivar: any) => ({
  id: cultivar.id,
  slug: cultivar.slug,
  name: cultivar.name,
  aka: cultivar.aka,
  cloneOnly: cultivar.cloneOnly,
  reportCount: cultivar.reportCount,
  avgRating: Number(cultivar.avgRating),
  imageCount: cultivar.imageCount,
  trending: cultivar.trending,
  thumbnails: cultivar.thumbnails,
  breeder: cultivar.breeder ?? null,
  offerings: (cultivar.offerings ?? []).map((offering: any) => ({
    providerName: offering.provider?.name ?? "",
    providerSlug: offering.provider?.slug ?? "",
    priceEur: offering.priceEur !== null && offering.priceEur !== undefined ? Number(offering.priceEur) : null,
    category: offering.category ?? null,
  })),
});

const toProvider = (provider: any) => ({
  id: provider.id,
  slug: provider.slug,
  name: provider.name,
  country: provider.country,
  countryFlag: provider.countryFlag,
  avgScore: Number(provider.avgScore),
  reportCount: provider.reportCount,
  shippingScore: Number(provider.shippingScore),
  vitalityScore: Number(provider.vitalityScore),
});

const toReport = (report: any, liked = false) => ({
  id: report.id,
  title: report.title,
  cultivar: report.cultivar?.name ?? "",
  cultivarSlug: report.cultivar?.slug ?? "",
  provider: report.provider?.name ?? "",
  providerSlug: report.provider?.slug ?? "",
  author: report.authorHandle,
  shipping: Number(report.shipping ?? 0),
  vitality: Number(report.vitality ?? 0),
  stability: Number(report.stability ?? 0),
  overall: Number(report.overall),
  status: report.status ?? "PUBLISHED",
  thumbnail: report.images?.[0] ?? "🌱",
  images: report.images ?? [],
  date: (report.publishedAt ?? report.createdAt).toISOString(),
  likes: Number(report.likes ?? 0),
  liked,
  comments: Number(report.comments ?? 0),
  views: Number(report.views ?? 0),
  excerpt: report.excerpt ?? "",
});

const toMockReport = (report: (typeof mockReports)[number]): ReturnType<typeof toReport> => {
  const date = report.date ? new Date(report.date) : new Date();
  const isValidDate = !Number.isNaN(date.getTime());

  return {
    id: report.id,
    title: report.title,
    cultivar: report.cultivar,
    cultivarSlug: report.cultivarSlug,
    provider: report.provider,
    providerSlug: report.providerSlug,
    author: report.author,
    shipping: Number(report.shipping ?? 0),
    vitality: Number(report.vitality ?? 0),
    stability: Number(report.stability ?? 0),
    overall: Number(report.overall ?? 0),
    status: report.status ?? "PUBLISHED",
    thumbnail: report.images?.[0] ?? report.thumbnail ?? "🌱",
    images: report.images ?? [],
    date: isValidDate ? date.toISOString() : new Date().toISOString(),
    likes: Number(report.likes ?? 0),
    liked: Boolean(report.liked ?? false),
    comments: Number(report.comments ?? 0),
    views: Number(report.views ?? 0),
    excerpt: report.excerpt ?? "",
  };
};

const toSeed = (seed: any) => ({
  id: seed.id,
  slug: seed.slug,
  name: seed.name,
  breeder: seed.breeder,
  genetics: seed.genetics,
  type: seed.type,
  floweringTime: seed.floweringTime,
  yield: seed.yield,
  popularity: seed.popularity,
  thumbnails: seed.thumbnails ?? [],
});

export async function GET() {
  let session: Awaited<ReturnType<typeof getServerSession>> | null = null;
  try {
    session = await getServerSession(authConfig);
  } catch (error) {
    console.warn("[HIGHLIGHTS_API] session lookup failed – fallback to anonymous", error);
    session = null;
  }

  const [cultivarsResult, providersResult, reportsResult] = await Promise.allSettled([
    prisma.cultivar.findMany({
      orderBy: [
        { trending: "desc" },
        { avgRating: "desc" },
        { reportCount: "desc" },
      ],
      take: TAKE,
      include: {
        offerings: {
          include: {
            provider: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    prisma.provider.findMany({
      orderBy: [
        { avgScore: "desc" },
        { reportCount: "desc" },
      ],
      take: TAKE,
    }),
    prisma.report.findMany({
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: TAKE,
      where: { status: "PUBLISHED" },
      include: {
        cultivar: { select: { name: true, slug: true } },
        provider: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const cultivars =
    cultivarsResult.status === "fulfilled"
      ? cultivarsResult.value.map(toCultivar)
      : (() => {
          console.error("[HIGHLIGHTS_API] cultivars query failed – using mock data", cultivarsResult.reason);
          return mockCultivars.slice(0, TAKE);
        })();

  const providers =
    providersResult.status === "fulfilled"
      ? providersResult.value.map(toProvider)
      : (() => {
          console.error("[HIGHLIGHTS_API] providers query failed – using mock data", providersResult.reason);
          return mockProviders.slice(0, TAKE);
        })();

  let likedIds = new Set<number>();
  let reportsPayload: ReturnType<typeof toReport>[] = [];

  if (reportsResult.status === "fulfilled") {
    const reports = reportsResult.value;
    if (reports.length > 0) {
      const clientId = getClientLikeId();
      const orConditions: Array<{ userId?: number; clientId?: string }> = [];
      if (session?.user?.id) {
        const parsed = Number(session.user.id);
        if (!Number.isNaN(parsed)) {
          orConditions.push({ userId: parsed });
        }
      }
      if (clientId) {
        orConditions.push({ clientId });
      }

      if (orConditions.length > 0) {
        const reportLikeClient = (prisma as any).reportLike;
        if (reportLikeClient?.findMany) {
          try {
            const likes = await reportLikeClient.findMany({
              where: {
                reportId: { in: reports.map((report) => report.id) },
                OR: orConditions,
              },
            });
            likedIds = new Set(likes.map((like: { reportId: number }) => like.reportId));
          } catch (error) {
            console.warn("[HIGHLIGHTS_API] likes lookup failed", error);
          }
        } else {
          console.warn("[HIGHLIGHTS_API] reportLike client not available – skipping likedIds resolution");
        }
      }
    }

    reportsPayload = reports.map((report) => toReport(report, likedIds.has(report.id)));
  } else {
    console.error("[HIGHLIGHTS_API] reports query failed – using mock data", reportsResult.reason);
    reportsPayload = mockReports.slice(0, TAKE).map(toMockReport);
  }

  const seeds = mockSeeds.slice(0, TAKE).map(toSeed);

  return NextResponse.json({
    cultivars,
    providers,
    reports: reportsPayload,
    seeds,
  });
}
