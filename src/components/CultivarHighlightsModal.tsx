"use client";

import Link from "next/link";
import { X, Star } from "lucide-react";
import type { Cultivar } from "@/types/domain";
import ThumbnailCell from "@/components/ThumbnailCell";

type CultivarHighlightsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cultivars: Cultivar[];
};

const CultivarHighlightsModal = ({
  isOpen,
  onClose,
  cultivars,
}: CultivarHighlightsModalProps) => {
  if (!isOpen) return null;

  const sortedCultivars = [...cultivars].sort(
    (a, b) => b.avgRating - a.avgRating,
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Beliebte Stecklinge</h2>
            <p className="text-sm text-gray-500">
              Die aktuell meistbewerteten Cuts und Sorten der Community.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Sorten schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCultivars.map((cultivar) => (
              <Link
                key={cultivar.id}
                href={`/cultivars/${cultivar.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md"
              >
                <div className="grid grid-cols-3 gap-0.5 bg-gray-50 p-1.5">
                  {cultivar.thumbnails.slice(0, 6).map((thumb, index) => (
                    <ThumbnailCell
                      key={index}
                      value={thumb}
                      alt={`${cultivar.name} Thumbnail ${index + 1}`}
                      className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-green-100 text-base"
                      imgClassName="h-full w-full object-cover"
                    />
                  ))}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <h3 className="flex-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-600">
                      {cultivar.name}
                    </h3>
                    <span className="text-sm">🔥</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {cultivar.avgRating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{cultivar.reportCount} Berichte</span>
                    <span>•</span>
                    <span>{cultivar.imageCount} Fotos</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultivarHighlightsModal;
