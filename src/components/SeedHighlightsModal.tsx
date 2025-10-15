"use client";

import Link from "next/link";
import { Clock, Scale, Sprout, X } from "lucide-react";
import type { Seed } from "@/types/domain";
import ThumbnailCell from "@/components/ThumbnailCell";

type SeedHighlightsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  seeds: Seed[];
};

const SeedHighlightsModal = ({
  isOpen,
  onClose,
  seeds,
}: SeedHighlightsModalProps) => {
  if (!isOpen) return null;

  const sortedSeeds = [...seeds].sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Beliebte Samen</h2>
            <p className="text-sm text-gray-500">
              Gefragte Genetiken, basierend auf Community-Popularität und Erfahrungsberichten.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Samen schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {sortedSeeds.map((seed) => (
              <div
                key={seed.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-green-500 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-[48px] max-w-[120px] flex-wrap gap-1">
                    {seed.thumbnails.slice(0, 4).map((thumb, index) => (
                      <ThumbnailCell
                        key={index}
                        value={thumb}
                        alt={`${seed.name} Thumbnail ${index + 1}`}
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-green-100 text-base"
                        imgClassName="h-full w-full object-cover"
                      />
                    ))}
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {seed.name}
                    </h3>
                    <p className="text-xs text-gray-500">{seed.breeder}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {seed.genetics}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    ⭐ {seed.popularity.toFixed(1)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1">
                    <Sprout className="h-3.5 w-3.5" />
                    {seed.type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {seed.floweringTime}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1">
                    <Scale className="h-3.5 w-3.5" />
                    {seed.yield}
                  </span>
                </div>

                <div className="mt-3 text-xs">
                  <Link
                    href="/support"
                    className="text-green-600 underline transition hover:text-green-700"
                  >
                    Mehr Seed-Reviews gefällig? Unterstütze PhenoHub!
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeedHighlightsModal;
