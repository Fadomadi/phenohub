import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mockCultivars, mockProviders, mockReports } from "@/data/mockData";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { getClientLikeId } from "@/lib/likes";

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
    priceEur:
      offering.priceEur !== null && offering.priceEur !== undefined
        ? Number(offering.priceEur)
        : null,
    category: offering.category ?? null,
  })),
});

const take = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({
      cultivars: [],
      providers: [],
      reports: [],
    });
  }

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDatabaseUrl) {
    const lower = query.toLowerCase();
    const cultivars = mockCultivars
      .filter(
        (cultivar) =>
          cultivar.name.toLowerCase().includes(lower) ||
          cultivar.aka.some((alias) => alias.toLowerCase().includes(lower)),
      )
      .slice(0, take);
    const providers = mockProviders
      .filter((provider) =>
        provider.name.toLowerCase().includes(lower),
      )
      .slice(0, take);
    const reports = mockReports
      .filter(
        (report) =>
          report.title.toLowerCase().includes(lower) ||
          report.cultivar.toLowerCase().includes(lower) ||
          report.provider.toLowerCase().includes(lower),
      )
      .slice(0, take);

    return NextResponse.json({ cultivars, providers, reports });
  }

  try {
    const session = await getServerSession(authConfig);
    const clientId = getClientLikeId();

    const [cultivars, providers, reports] = await Promise.all([
      prisma.cultivar.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { aka: { hasSome: [query] } },
          ],
        },
        take,
        orderBy: { trending: "desc" },
        include: {
          offerings: {
            include: {
              provider: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.provider.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        take,
        orderBy: { avgScore: "desc" },
      }),
      prisma.report.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { cultivar: { name: { contains: query, mode: "insensitive" } } },
            {
              provider: { name: { contains: query, mode: "insensitive" } },
            },
          ],
        },
        include: {
          cultivar: { select: { name: true, slug: true } },
          provider: { select: { name: true, slug: true } },
        },
        take,
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    let likedIds = new Set<number>();
    if (reports.length > 0) {
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
          const likes = await reportLikeClient.findMany({
            where: {
              reportId: { in: reports.map((report) => report.id) },
              OR: orConditions,
            },
          });
          likedIds = new Set(likes.map((like: { reportId: number }) => like.reportId));
        } else {
          console.warn("[SEARCH_API] reportLike client not available – skipping likedIds resolution");
        }
      }
    }

    const normalizedCultivars = cultivars.map(toCultivar);
    const normalizedReports = reports.map((report) => ({
      id: report.id,
      title: report.title,
      cultivar: report.cultivar.name,
      cultivarSlug: report.cultivar.slug,
      provider: report.provider.name,
      providerSlug: report.provider.slug,
      author: report.authorHandle,
      shipping: Number(report.shipping ?? 0),
      vitality: Number(report.vitality ?? 0),
      stability: Number(report.stability ?? 0),
      overall: Number(report.overall),
      status: report.status,
      thumbnail: report.images[0] ?? "🌱",
      images: report.images,
      date: report.publishedAt?.toISOString() ?? report.createdAt.toISOString(),
      likes: report.likes,
      liked: likedIds.has(report.id),
      comments: report.comments,
      views: report.views,
      excerpt: report.excerpt,
    }));

    return NextResponse.json({
      cultivars: normalizedCultivars,
      providers,
      reports: normalizedReports,
    });
  } catch (error) {
    console.error("[SEARCH_API]", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
