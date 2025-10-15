import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  ArrowLeft,
  Leaf,
  Package,
  Sprout,
  Star,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import prisma from "@/lib/prisma";
import ReportCard from "@/components/ReportCard";
import type { Report } from "@/types/domain";

export const dynamic = "force-dynamic";

const toOneDecimal = (value: number) =>
  Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;

type ProviderPageParams = { slug: string };
type ProviderPageProps = { params: Promise<ProviderPageParams> };

const providerInclude = {
  offerings: {
    orderBy: { priceEur: "asc" },
    include: {
      cultivar: {
        select: {
          name: true,
          slug: true,
          breeder: true,
          thumbnails: true,
        },
      },
    },
  },
} as const;

type ProviderWithOfferings = Prisma.ProviderGetPayload<{
  include: typeof providerInclude;
}>;

const ProviderDetailPage = async ({ params }: ProviderPageProps) => {
  const { slug } = await params;

  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: providerInclude,
  });

  if (!provider) {
    notFound();
  }

  const typedProvider = provider as ProviderWithOfferings;

  const [reportMetrics, recentReports] = await Promise.all([
    prisma.report.aggregate({
      where: { providerId: typedProvider.id },
      _avg: { overall: true, shipping: true, vitality: true, stability: true },
      _count: true,
    }),
    prisma.report.findMany({
      where: { providerId: typedProvider.id },
      include: {
        cultivar: { select: { name: true, slug: true } },
        provider: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  type RecentReport = (typeof recentReports)[number];

  const recentReportCards: Report[] = recentReports.map((report: RecentReport) => ({
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
    overall: Number(report.overall ?? 0),
    thumbnail: report.images[0] ?? "🌱",
    images: report.images,
    date: (report.publishedAt ?? report.createdAt).toISOString(),
    likes: report.likes,
    comments: report.comments,
    views: report.views,
    excerpt: report.excerpt,
  }));

  const avgOverall =
    typedProvider.avgScore !== null && typedProvider.avgScore !== undefined
      ? toOneDecimal(Number(typedProvider.avgScore))
      : toOneDecimal(Number(reportMetrics._avg.overall ?? 0));
  const avgShipping =
    typedProvider.shippingScore !== null && typedProvider.shippingScore !== undefined
      ? toOneDecimal(Number(typedProvider.shippingScore))
      : toOneDecimal(Number(reportMetrics._avg.shipping ?? 0));
  const avgVitality =
    typedProvider.vitalityScore !== null && typedProvider.vitalityScore !== undefined
      ? toOneDecimal(Number(typedProvider.vitalityScore))
      : toOneDecimal(Number(reportMetrics._avg.vitality ?? 0));
  const avgStability = toOneDecimal(Number(reportMetrics._avg.stability ?? 0));
  const reportCount = reportMetrics._count ?? 0;
  const scoreDisplay = (value: number) =>
    reportCount > 0 && Number.isFinite(value) ? value.toFixed(1) : "–";

  type OfferingCard = {
    id: number;
    cultivarName: string;
    cultivarSlug?: string;
    breeder: string | null;
    price: number | null;
    category: string | null;
  };

  const offerings: OfferingCard[] = typedProvider.offerings.map(
    (offering: ProviderWithOfferings["offerings"][number]) => ({
      id: offering.id,
      cultivarName: offering.cultivar?.name ?? "Unbekannte Sorte",
      cultivarSlug: offering.cultivar?.slug ?? undefined,
      breeder: offering.cultivar?.breeder ?? null,
      price:
        offering.priceEur !== null && offering.priceEur !== undefined
          ? Number(offering.priceEur)
          : null,
      category: offering.category ?? null,
    }),
  );

  const uniqueCultivars = new Set(
    offerings
      .map((offering) => offering.cultivarSlug)
      .filter((value): value is string => Boolean(value)),
  ).size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Zur Startseite
      </Link>

      <section className="mb-10 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-lg shadow-green-100/40 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-slate-950/40 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                Anbieter
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                {provider.countryFlag} {provider.country}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-slate-800 dark:text-sky-200">
                {reportCount} Erfahrungsberichte
              </span>
            </div>

            <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100 md:text-4xl">
              {provider.name}
            </h1>

            <p className="text-base leading-relaxed text-gray-600 dark:text-slate-300">
              {provider.bio?.trim() ||
                "Noch keine Beschreibung hinterlegt. Berichte ergänzen die Eindrücke der Community."}
            </p>
          </div>

  <div className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-500">Ø Gesamt</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {scoreDisplay(avgOverall)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-900/80">
                <p className="text-[11px] uppercase text-gray-500">Versand</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                  {scoreDisplay(avgShipping)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-900/80">
                <p className="text-[11px] uppercase text-gray-500">Vitalität</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                  {scoreDisplay(avgVitality)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-900/80">
                <p className="text-[11px] uppercase text-gray-500">Stabilität</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                  {scoreDisplay(avgStability)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-900/80">
                <p className="text-[11px] uppercase text-gray-500">Sorten</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                  {uniqueCultivars}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: "overall",
            label: "Gesamtbewertung",
            helper: "Community Score",
            value: avgOverall,
            icon: Star,
            iconColor: "text-amber-500",
            badgeClass: "bg-amber-100 text-amber-700",
          },
          {
            key: "shipping",
            label: "Versand",
            helper: "Lieferung & Verpackung",
            value: avgShipping,
            icon: Package,
            iconColor: "text-blue-500",
            badgeClass: "bg-blue-100 text-blue-700",
          },
          {
            key: "vitality",
            label: "Vitalität",
            helper: "Startkraft der Stecklinge",
            value: avgVitality,
            icon: Sprout,
            iconColor: "text-green-500",
            badgeClass: "bg-green-100 text-green-700",
          },
          {
            key: "stability",
            label: "Stabilität",
            helper: "Konstanz im Grow",
            value: avgStability,
            icon: ShieldCheck,
            iconColor: "text-purple-500",
            badgeClass: "bg-purple-100 text-purple-700",
          },
        ].map((card) => (
          <div
            key={card.key}
            className="flex h-full flex-col justify-between rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {card.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${card.badgeClass}`}>
                {scoreDisplay(card.value)}
              </span>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {scoreDisplay(card.value)}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{card.helper}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.iconColor}`} />
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-sky-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Neueste Community-Berichte
            </h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {reportCount} Berichte insgesamt
          </span>
        </div>

        {recentReportCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            Noch keine Erfahrungsberichte zu diesem Anbieter. Reiche den ersten Bericht ein!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
            {recentReportCards.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600 dark:text-sky-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Stecklinge & Sorten in Angebot
            </h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {offerings.length} Einträge
          </span>
        </div>

        {offerings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            Noch keine Angebote hinterlegt.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering) => (
              <div
                key={offering.id}
                className="flex h-full flex-col justify-between rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="mb-3">
                  {offering.cultivarSlug ? (
                    <Link
                      href={`/cultivars/${offering.cultivarSlug}`}
                      className="text-base font-semibold text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      {offering.cultivarName}
                    </Link>
                  ) : (
                    <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                      {offering.cultivarName}
                    </p>
                  )}
                  {offering.breeder && (
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      {offering.breeder}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-300">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-slate-800/70 dark:text-sky-200">
                    {offering.category || "THC"}
                  </span>
                  <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {offering.price ? `${offering.price.toFixed(2)} €` : "Preis auf Anfrage"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProviderDetailPage;
