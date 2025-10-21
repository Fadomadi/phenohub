import Link from "next/link";
import { notFound } from "next/navigation";
import ThumbnailCell from "@/components/ThumbnailCell";
import ReportImageStack, { type ReportImageStackItem } from "@/components/ReportImageStack";
import { mockCultivars, mockReports } from "@/data/mockData";
import { normalizeTmpfilesUrl } from "@/lib/images";

type CultivarPageProps = {
  params: Promise<{ slug: string }>;
};

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[CULTIVAR_DETAIL] Prisma unavailable – falling back to mock", error);
    return null;
  }
};

const fetchCultivarFromDatabase = async (slug: string) => {
  const prisma = await importPrisma();
  if (!prisma) return null;

  const cultivar = await prisma.cultivar.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      aka: true,
      cloneOnly: true,
      reportCount: true,
      avgRating: true,
      imageCount: true,
      trending: true,
      thumbnails: true,
      breeder: true,
      reports: {
        where: { status: "PUBLISHED" },
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 12,
        select: {
          id: true,
          title: true,
          excerpt: true,
          images: true,
          overall: true,
          publishedAt: true,
          createdAt: true,
          provider: { select: { name: true } },
          authorHandle: true,
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!cultivar) return null;

  const reports = cultivar.reports.map((report) => ({
    id: report.id,
    title: report.title,
    excerpt: report.excerpt ?? "",
    images: Array.isArray(report.images) ? report.images : [],
    overall: Number(report.overall ?? 0).toFixed(1),
    date: (report.publishedAt ?? report.createdAt).toISOString(),
    provider: report.provider?.name ?? "Unbekannt",
    author: typeof report.authorHandle === "string" ? report.authorHandle : null,
    likes: Number(report.likes ?? 0),
    comments: Number(report.comments ?? 0),
  }));

  const previewImages = reports
    .flatMap((report) => report.images)
    .filter((image): image is string => typeof image === "string" && image.length > 0);
  const computedImageCount =
    previewImages.length > 0 ? previewImages.length : Number(cultivar.imageCount ?? 0);

  return {
    id: cultivar.id,
    name: cultivar.name,
    slug: cultivar.slug,
    aka: cultivar.aka ?? [],
    cloneOnly: Boolean(cultivar.cloneOnly),
    reportCount: Number(cultivar.reportCount ?? 0),
    avgRating: Number(cultivar.avgRating ?? 0),
    imageCount: computedImageCount,
    trending: Boolean(cultivar.trending),
    thumbnails: Array.isArray(cultivar.thumbnails)
      ? cultivar.thumbnails.filter((value): value is string => typeof value === "string")
      : [],
    breeder: cultivar.breeder ?? null,
    reports,
    previewImages,
  };
};

const fetchCultivarFallback = (slug: string) => {
  const cultivar = mockCultivars.find((item) => item.slug === slug);
  if (!cultivar) return null;

  const reports = mockReports
    .filter((report) => report.cultivarSlug === slug)
    .slice(0, 12)
    .map((report) => ({
      id: report.id,
      title: report.title,
      excerpt: report.excerpt ?? "",
      images: report.images ?? [],
      overall: Number(report.overall ?? 0).toFixed(1),
      date: new Date(report.date ?? Date.now()).toISOString(),
      provider: report.provider,
      author: report.author ?? null,
      likes: Number(report.likes ?? 0),
      comments: Number(report.comments ?? 0),
    }));

  const previewImages = reports
    .flatMap((report) => report.images)
    .filter((image): image is string => typeof image === "string" && image.length > 0);
  const computedImageCount =
    previewImages.length > 0 ? previewImages.length : Number(cultivar.imageCount ?? 0);

  return {
    ...cultivar,
    reports,
    previewImages,
    imageCount: computedImageCount,
  };
};

const CultivarDetailPage = async ({ params }: CultivarPageProps) => {
  const { slug } = await params;

  const cultivar = (await fetchCultivarFromDatabase(slug)) ?? fetchCultivarFallback(slug);

  if (!cultivar) {
    notFound();
  }

  const relatedReports = cultivar.reports ?? [];

  const aggregatedImages = relatedReports.flatMap((report) => {
    const images = Array.isArray(report.images) ? report.images : [];
    return images
      .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      .map((image) => ({ image, reportTitle: report.title }));
  });

  const fallbackThumbnails = (Array.isArray(cultivar.previewImages) && cultivar.previewImages.length > 0
    ? cultivar.previewImages
    : Array.isArray(cultivar.thumbnails)
      ? cultivar.thumbnails
      : []
  ).filter((image): image is string => typeof image === "string" && image.trim().length > 0);

  const previewCandidates =
    aggregatedImages.length > 0
      ? aggregatedImages.map((entry) => ({
          image: entry.image,
          alt: entry.reportTitle,
        }))
      : fallbackThumbnails.map((image) => ({
          image,
          alt: cultivar.name,
        }));

  const previewStackItems: ReportImageStackItem[] = previewCandidates.slice(0, 6).map((entry, index) => {
    const normalized = normalizeTmpfilesUrl(entry.image);
    const direct = typeof normalized.direct === "string" && normalized.direct.length > 0 ? normalized.direct : entry.image;
    const preview = typeof normalized.preview === "string" && normalized.preview.length > 0 ? normalized.preview : direct;
    const candidates = [direct, preview].filter((value, idx, arr) => value && arr.indexOf(value) === idx);
    const sources = candidates.flatMap((value) =>
      value.startsWith("http") ? [`/api/image-proxy?url=${encodeURIComponent(value)}`, value] : [value],
    );

    return {
      id: `${cultivar.slug}-preview-${index}`,
      alt: `${entry.alt} – Bild ${index + 1}`,
      loading: index === 0 ? "eager" : "lazy",
      sources: Array.from(new Set(sources)),
    };
  });

  const providerNames = Array.from(new Set(relatedReports.map((report) => report.provider))).filter(
    Boolean,
  );

  return (
    <div className="bg-gradient-to-b from-green-50 via-white to-white pb-16">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
        >
          ← Zurück zur Suche
        </Link>

        <div className="mt-6 rounded-3xl border border-green-100 bg-white/80 p-6 shadow-lg shadow-green-200/50 backdrop-blur">
          <div className="flex flex-col gap-0 lg:flex-row">
            {/* Linke Spalte: Details */}
            <div className="flex-1 pr-0 lg:pr-10 lg:border-r lg:border-gray-200">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Cultivar
                </span>
                {cultivar.cloneOnly && (
                  <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Clone Only
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl font-bold text-gray-900">
                {cultivar.name}
              </h1>
              {cultivar.aka.length > 0 && (
                <p className="mt-1 text-sm italic text-gray-500">
                  aka{" "}
                  {cultivar.aka
                    .map((alias) => `„${alias}“`)
                    .join(", ")}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {cultivar.avgRating.toFixed(1)}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    Rating
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {cultivar.reportCount}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    Berichte
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {cultivar.imageCount}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    Fotos
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {cultivar.trending ? "🔥" : "🌿"}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    {cultivar.trending ? "Gefragt" : "Klassiker"}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-gray-600">
                Für diesen Prototypen stammen alle Daten aus einem Mock-Datensatz.
                Später erscheinen hier Genetik, Wuchsverhalten, Terpenprofil und
                Setup-Empfehlungen basierend auf echten Berichten.
              </p>
            </div>


            {/* Rechte Spalte: Bilder */}
            <div className="flex flex-none flex-col gap-2 lg:w-72 lg:pl-10 lg:justify-center">
              <div className="mb-1 hidden lg:block text-sm font-medium text-gray-400 pl-1">Bilder</div>
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex justify-center">
                  {previewStackItems.length > 0 ? (
                    <ReportImageStack
                      items={previewStackItems}
                      className="w-full max-w-[232px] justify-items-center md:max-w-[256px] md:drop-shadow-xl"
                    />
                  ) : (
                    <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Noch keine Bilder aus Community-Berichten vorhanden.
                    </p>
                  )}
                </div>
              </div>

              {providerNames.length > 0 && (
                <div className="rounded-3xl border border-green-100 bg-green-50/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-green-600">
                    Beliebte Anbieter
                  </p>
                  <ul className="mt-2 space-y-1 text-sm font-medium text-green-900">
                    {providerNames.map((provider) => (
                      <li key={provider}>{provider}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Beschreibung & Hinweise
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Sobald echte Daten verfügbar sind, findest du hier Herkunft,
              Genetik, typische Terpene, Stretch-Verhalten, empfohlenes
              Setting (Topfgröße, EC/PH, Blütezeit) sowie Troubleshooting-Hinweise.
              Aktuell dient dieser Bereich als Platzhalter, damit du siehst, wo
              die Inhalte später landen.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Erfahrungsberichte ({relatedReports.length})
              </h2>
              <Link
                href={`/reports?cultivar=${slug}`}
                className="text-sm font-semibold text-green-700 transition hover:text-green-800"
              >
                Alle Berichte ansehen →
              </Link>
            </div>

            {relatedReports.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                Noch keine Community-Berichte für diese Sorte. Trag dich als erste:r ein!
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {relatedReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-green-200 hover:bg-white"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {report.images.slice(0, 4).map((img, idx) => (
                        <ThumbnailCell
                          key={idx}
                          value={img}
                          alt={`${report.title} Bild ${idx + 1}`}
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-green-100 text-xl"
                          imgClassName="h-full w-full object-cover"
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {report.overall}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(report.date).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {report.excerpt}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {report.author && (
                          <span>@{report.author.replace("@", "")}</span>
                        )}
                        {report.author && <span>•</span>}
                        <span>{report.provider}</span>
                        <span>•</span>
                        <span>Likes: {report.likes}</span>
                        <span>Kommentare: {report.comments}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CultivarDetailPage;
