import Link from "next/link";
import { notFound } from "next/navigation";
import ThumbnailCell from "@/components/ThumbnailCell";
import { mockCultivars } from "@/data/mockData";
import { mockReports } from "@/data/mockData";

type CultivarPageProps = {
  params: Promise<{ slug: string }>;
};

const CultivarDetailPage = async ({ params }: CultivarPageProps) => {
  const { slug } = await params;
  const cultivar = mockCultivars.find((item) => item.slug === slug);

  if (!cultivar) {
    notFound();
  }

  const relatedReports = mockReports
    .filter((report) => report.cultivarSlug === slug)
    .slice(0, 10);

  const providerNames = Array.from(
    new Set(relatedReports.map((report) => report.provider)),
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
              <div className="grid grid-cols-3 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
                {cultivar.thumbnails.slice(0, 6).map((thumb, index) => (
                  <ThumbnailCell
                    key={index}
                    value={thumb}
                    alt={`${cultivar.name} Thumbnail ${index + 1}`}
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-green-50 text-xl"
                    imgClassName="h-full w-full object-cover"
                  />
                ))}
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
                        <span>@{report.author.replace("@", "")}</span>
                        <span>•</span>
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
