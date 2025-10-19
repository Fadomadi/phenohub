"use client";

import Link from "next/link";
import { X, TrendingUp } from "lucide-react";
import type { Cultivar, Report } from "@/types/domain";
import ThumbnailCell from "@/components/ThumbnailCell";
import ReportImageStack, { type ReportImageStackItem } from "@/components/ReportImageStack";
import { normalizeTmpfilesUrl } from "@/lib/images";

type CultivarPreviewModalProps = {
  cultivar: Cultivar;
  reports: Report[];
  onClose: () => void;
};

const CultivarPreviewModal = ({
  cultivar,
  reports,
  onClose,
}: CultivarPreviewModalProps) => {
  const aggregatedImages = reports.flatMap((report) => {
    const images = Array.isArray(report.images) ? report.images : [];
    return images
      .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      .map((image) => ({ image, alt: report.title }));
  });

  const fallbackImages = (Array.isArray(cultivar.recentImages) && cultivar.recentImages.length > 0
    ? cultivar.recentImages
    : cultivar.thumbnails
  ).filter((image): image is string => typeof image === "string" && image.trim().length > 0);

  const previewCandidates =
    aggregatedImages.length > 0
      ? aggregatedImages
      : fallbackImages.map((image) => ({ image, alt: cultivar.name }));

  const previewItems: ReportImageStackItem[] = previewCandidates.slice(0, 12).map((entry, index) => {
    const normalized = normalizeTmpfilesUrl(entry.image);
    const direct = typeof normalized.direct === "string" && normalized.direct.length > 0 ? normalized.direct : entry.image;
    const preview = typeof normalized.preview === "string" && normalized.preview.length > 0 ? normalized.preview : direct;
    const candidates = [direct, preview].filter((value, idx, arr) => value && arr.indexOf(value) === idx);
    const sources = candidates.flatMap((value) =>
      value.startsWith("http") ? [`/api/image-proxy?url=${encodeURIComponent(value)}`, value] : [value],
    );

    return {
      id: `${cultivar.slug}-modal-${index}`,
      alt: `${entry.alt} – Bild ${index + 1}`,
      loading: index === 0 ? "eager" : "lazy",
      sources: Array.from(new Set(sources)),
    };
  });

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-green-100 bg-white shadow-2xl shadow-green-200/40">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Cultivar
              </span>
              {cultivar.cloneOnly && (
                <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Clone Only
                </span>
              )}
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {cultivar.name}
            </h2>
            {cultivar.aka.length > 0 && (
              <p className="text-xs text-gray-500">
                aka {cultivar.aka.join(", ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Vorschau schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-[11px] uppercase text-gray-500">Bewertung</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {cultivar.avgRating}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-[11px] uppercase text-gray-500">Berichte</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {cultivar.reportCount}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-[11px] uppercase text-gray-500">Bilder</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {cultivar.imageCount}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-[11px] uppercase text-gray-500">Trend</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {cultivar.trending ? "🔥 Gefragt" : "🌿 Klassiker"}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Diese Vorschau zeigt dir die wichtigsten Kennzahlen aus den
              Community-Berichten. Für eine vollständige Beschreibung inkl.
              Genetik, Terpene und Setup-Details wechsle zur Detailseite.
            </p>

            <Link
              href={`/cultivars/${cultivar.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            >
              <TrendingUp className="h-4 w-4" />
              Vollständige Übersicht öffnen
            </Link>
          </div>

          <div className="space-y-4">
            {previewItems.length > 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-3">
                <ReportImageStack items={previewItems} className="md:ml-6 md:w-64 md:drop-shadow-xl" />
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Noch keine Bilder vorhanden.
              </div>
            )}

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Neueste Reports
              </p>

              {reports.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white p-4 text-xs text-gray-500">
                  Noch keine Erfahrungsberichte. Reiche den ersten Bericht ein,
                  um anderen Growern zu helfen.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {reports.slice(0, 3).map((report) => (
                    <li key={report.id}>
                      <Link
                        href={`/reports/${report.id}`}
                        className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left transition hover:border-green-200 hover:bg-white"
                      >
                        <div className="flex gap-1">
                          {report.images.slice(0, 2).map((img, idx) => (
                            <ThumbnailCell
                              key={idx}
                              value={img}
                              alt={`${report.title} Bild ${idx + 1}`}
                              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-green-100 text-lg"
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
                          <p className="mt-1 text-xs font-semibold text-gray-900">
                            {report.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-gray-500">
                            {report.excerpt}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-green-100 bg-green-50/50 p-4 text-sm text-green-900">
              <p className="font-semibold">Tipps</p>
              <p className="mt-1 text-xs text-green-700">
                Für genaue Setup-Empfehlungen später die Detailseite checken.
                Dort erscheinen Vegetationszeit, Stretch-Faktor und passende
                EC-/PH-Werte, sobald reale Daten vorliegen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultivarPreviewModal;
