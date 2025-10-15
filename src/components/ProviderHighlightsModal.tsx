"use client";

import Link from "next/link";
import { X, Star, Package, Droplets } from "lucide-react";
import type { Provider } from "@/types/domain";

type ProviderHighlightsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
};

const ProviderHighlightsModal = ({
  isOpen,
  onClose,
  providers,
}: ProviderHighlightsModalProps) => {
  if (!isOpen) return null;

  const sortedProviders = [...providers].sort(
    (a, b) => b.avgScore - a.avgScore,
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Anbieter</h2>
            <p className="text-sm text-gray-500">
              Die beliebtesten Shops und Breeder basierend auf Community-Bewertungen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Anbieter schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {sortedProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-green-500 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-600">
                        {provider.name}
                      </h3>
                      <span className="text-lg">{provider.countryFlag}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {provider.reportCount} Erfahrungsberichte
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {provider.avgScore.toFixed(1)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    <Package className="h-3.5 w-3.5" />
                    Versand {provider.shippingScore.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                    <Droplets className="h-3.5 w-3.5" />
                    Vitalität {provider.vitalityScore.toFixed(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderHighlightsModal;
