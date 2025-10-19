import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { getClientLikeId } from "@/lib/likes";
import { mockCultivars, mockProviders, mockReports, mockSeeds } from "@/data/mockData";
import { getHighlightSeedConfig } from "@/lib/highlightSettings";

const TAKE = 6;

type AuthSession = Awaited<ReturnType<typeof getServerSession>>;

const hasSessionUser = (
  value: AuthSession | null,
): value is AuthSession & { user: { id?: string | null } } =>
  Boolean(value && typeof value === "object" && "user" in value);

type ReportHighlight = {
  id: number;
  title: string;
  cultivar: string;
  cultivarSlug: string;
  provider: string;
  providerSlug: string;
  author: string | null;
  shipping: number;
  vitality: number;
  stability: number;
  overall: number;
  status: string;
  thumbnail: string;
  images: string[];
  date: string;
  likes: number;
  liked: boolean;
  comments: number;
  views: number;
  excerpt: string | null;
};

type CultivarInput = {
  id: number;
  slug: string;
  name: string;
  aka: string[];
  cloneOnly: boolean | null;
  reportCount: number;
  avgRating?: unknown;
  imageCount: number;
  trending?: unknown;
  thumbnails?: unknown;
  breeder: string | null;
  offerings?: Array<{
    provider?: { name?: string | null; slug?: string | null } | null;
    priceEur?: unknown;
    category?: string | null;
  }> | null;
  reports?: Array<{
    images: string[];
  }>;
};

type ProviderInput = {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  countryFlag: string | null;
  avgScore: unknown;
  reportCount: number;
  shippingScore: unknown;
  vitalityScore: unknown;
};

type ReportInput = {
  id: number;
  title: string;
  cultivar?: { name: string; slug: string } | null;
  provider?: { name: string; slug: string } | null;
  authorHandle?: string | null;
  shipping?: unknown;
  vitality?: unknown;
  stability?: unknown;
  overall?: unknown;
  status?: string | null;
  images: string[];
  publishedAt?: Date | null;
  createdAt: Date;
  likes: number;
  comments: number;
  views: number;
  excerpt?: string | null;
};

const mapCultivar = (cultivar: CultivarInput) => {
  const thumbnails = Array.isArray(cultivar.thumbnails)
    ? cultivar.thumbnails.filter((value): value is string => typeof value === "string")
    : [];
  const recentImages = (cultivar.reports ?? [])
    .flatMap((report) => (Array.isArray(report.images) ? report.images : []))
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  const uniqueRecent = Array.from(new Set(recentImages)).slice(0, TAKE);

  return {
    id: cultivar.id,
    slug: cultivar.slug,
    name: cultivar.name,
    aka: cultivar.aka,
    cloneOnly: cultivar.cloneOnly,
    reportCount: cultivar.reportCount,
    avgRating: Number(cultivar.avgRating),
    imageCount: cultivar.imageCount,
    trending: cultivar.trending,
    thumbnails,
    recentImages: uniqueRecent.length > 0 ? uniqueRecent : undefined,
    breeder: cultivar.breeder ?? null,
    offerings: (cultivar.offerings ?? []).map((offering) => ({
      providerName: offering.provider?.name ?? "",
      providerSlug: offering.provider?.slug ?? "",
      priceEur:
        offering.priceEur !== null && offering.priceEur !== undefined
          ? Number(offering.priceEur)
          : null,
      category: offering.category ?? null,
    })),
  };
};

const mapProvider = (provider: ProviderInput) => ({
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

const mapReport = (report: ReportInput, liked = false): ReportHighlight => ({
  id: report.id,
  title: report.title,
  cultivar: report.cultivar?.name ?? "",
  cultivarSlug: report.cultivar?.slug ?? "",
  provider: report.provider?.name ?? "",
  providerSlug: report.provider?.slug ?? "",
  author: report.authorHandle ?? null,
  shipping: Number(report.shipping ?? 0),
  vitality: Number(report.vitality ?? 0),
  stability: Number(report.stability ?? 0),
  overall: Number(report.overall ?? 0),
  status: report.status ?? "PUBLISHED",
  thumbnail: report.images?.[0] ?? "🌱",
  images: report.images ?? [],
  date: (report.publishedAt ?? report.createdAt).toISOString(),
  likes: Number(report.likes ?? 0),
  liked,
  comments: Number(report.comments ?? 0),
  views: Number(report.views ?? 0),
  excerpt: report.excerpt ?? null,
});

const mapMockReport = (report: (typeof mockReports)[number]): ReportHighlight => {
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
    excerpt: report.excerpt ?? null,
  };
};

type CultivarHighlight = ReturnType<typeof mapCultivar>;
type ProviderHighlight = ReturnType<typeof mapProvider>;

const mapMockCultivar = (cultivar: (typeof mockCultivars)[number]): CultivarHighlight => ({
  id: cultivar.id,
  slug: cultivar.slug,
  name: cultivar.name,
  aka: cultivar.aka,
  cloneOnly: cultivar.cloneOnly,
  reportCount: cultivar.reportCount,
  avgRating: cultivar.avgRating,
  imageCount: cultivar.imageCount,
  trending: cultivar.trending,
  thumbnails: cultivar.thumbnails,
  recentImages: cultivar.thumbnails.slice(0, TAKE),
  breeder: cultivar.breeder ?? null,
  offerings: [],
});

const mapMockProvider = (provider: (typeof mockProviders)[number]): ProviderHighlight => ({
  id: provider.id,
  slug: provider.slug,
  name: provider.name,
  country: provider.country,
  countryFlag: provider.countryFlag,
  avgScore: provider.avgScore,
  reportCount: provider.reportCount,
  shippingScore: provider.shippingScore,
  vitalityScore: provider.vitalityScore,
});

const mapSeed = (seed: (typeof mockSeeds)[number]) => ({
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

let prismaClientCache: Awaited<ReturnType<typeof importPrismaClient>> | undefined;

const importPrismaClient = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[HIGHLIGHTS_API] Prisma unavailable – falling back to mock data", error);
    return null;
  }
};

const getPrismaClient = async () => {
  if (prismaClientCache !== undefined) {
    return prismaClientCache;
  }
  prismaClientCache = await importPrismaClient();
  return prismaClientCache;
};

const buildMockResponse = () => ({
  cultivars: mockCultivars.slice(0, TAKE).map(mapMockCultivar),
  providers: mockProviders.slice(0, TAKE).map(mapMockProvider),
  reports: mockReports.slice(0, TAKE).map(mapMockReport),
  seeds: mockSeeds.slice(0, TAKE).map(mapSeed),
});

export async function GET() {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return NextResponse.json(buildMockResponse());
  }
  let session: AuthSession | null = null;
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
      where: {
        reportCount: { gt: 0 },
      },
      include: {
        offerings: {
          include: {
            provider: { select: { name: true, slug: true } },
          },
        },
        reports: {
          where: { status: "PUBLISHED" },
          orderBy: [
            { publishedAt: "desc" },
            { createdAt: "desc" },
          ],
          take: TAKE,
          select: {
            images: true,
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
      ? cultivarsResult.value.map(mapCultivar)
      : (() => {
          console.error("[HIGHLIGHTS_API] cultivars query failed – using mock data", cultivarsResult.reason);
          return mockCultivars
            .filter((cultivar) => cultivar.reportCount > 0)
            .slice(0, TAKE)
            .map(mapMockCultivar);
        })();

  const providers =
    providersResult.status === "fulfilled"
      ? providersResult.value.map(mapProvider)
      : (() => {
          console.error("[HIGHLIGHTS_API] providers query failed – using mock data", providersResult.reason);
          return mockProviders.slice(0, TAKE).map(mapMockProvider);
        })();

  let likedIds = new Set<number>();
  let reportsPayload: ReportHighlight[] = [];

  if (reportsResult.status === "fulfilled") {
    const reports = reportsResult.value;
    if (reports.length > 0) {
      const clientId = await getClientLikeId();
      const orConditions: Array<{ userId?: number; clientId?: string }> = [];
      if (hasSessionUser(session) && session.user.id) {
        const parsed = Number(session.user.id);
        if (!Number.isNaN(parsed)) {
          orConditions.push({ userId: parsed });
        }
      }
      if (clientId) {
        orConditions.push({ clientId });
      }

      if (orConditions.length > 0) {
        try {
          const likes = await prisma.reportLike.findMany({
            where: {
              reportId: { in: reports.map((report: ReportInput) => report.id) },
              OR: orConditions,
            },
          });
          likedIds = new Set(
            likes.map((like: { reportId: number }) => like.reportId),
          );
        } catch (error) {
          console.warn("[HIGHLIGHTS_API] likes lookup failed", error);
        }
      }
    }

    reportsPayload = reports.map((report: ReportInput) =>
      mapReport(report, likedIds.has(report.id)),
    );
  } else {
    console.error("[HIGHLIGHTS_API] reports query failed – using mock data", reportsResult.reason);
    reportsPayload = mockReports.slice(0, TAKE).map(mapMockReport);
  }

  let seedsEnabled = true;
  let seeds = mockSeeds.slice(0, TAKE).map(mapSeed);

  try {
    const seedConfig = await getHighlightSeedConfig(prisma);
    seedsEnabled = Boolean(seedConfig.showSeeds);
    if (seedsEnabled) {
      seeds =
        seedConfig.seeds.length > 0
          ? seedConfig.seeds.map((seed, index) => ({
              ...seed,
              id: seed.id ?? index + 1,
              popularity: Number.isFinite(seed.popularity) ? seed.popularity : 0,
            }))
          : mockSeeds.slice(0, TAKE).map(mapSeed);
    } else {
      seeds = [];
    }
  } catch (error) {
    console.warn("[HIGHLIGHTS_API] seed config lookup failed – falling back to defaults", error);
    seedsEnabled = seeds.length > 0;
  }

  return NextResponse.json({
    cultivars,
    providers,
    reports: reportsPayload,
    seeds,
    seedsEnabled,
  });
}
