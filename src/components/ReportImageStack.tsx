"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type ReportImageStackItem = {
  id: string;
  alt: string;
  loading?: "eager" | "lazy";
  sources: string[];
};

type ReportImageStackProps = {
  items: ReportImageStackItem[];
  className?: string;
};

const ReportImageEntry = ({ item }: { item: ReportImageStackItem }) => {
  const { alt, loading } = item;
  const [sourceIndex, setSourceIndex] = useState(0);

  const sources = useMemo(() => item.sources.filter(Boolean), [item.sources]);
  const currentSource = sources[sourceIndex] ?? sources[0] ?? "";

  const handleError = useCallback(() => {
    setSourceIndex((previous) => {
      if (previous >= sources.length - 1) {
        return previous;
      }
      return previous + 1;
    });
  }, [sources.length]);

  if (!currentSource) {
    return null;
  }

  return (
    <figure className="relative mx-auto aspect-[5/6] w-full max-w-[180px] overflow-hidden rounded-2xl bg-gray-100/80 shadow-md ring-1 ring-white/60 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-green-200 dark:bg-slate-950/60 dark:ring-slate-800 md:mx-0 md:max-w-[210px] lg:max-w-[240px]">
      <div className="group block h-full w-full cursor-zoom-in">
        <div className="relative h-full w-full">
          <Image
            src={currentSource}
            alt={alt}
            fill
            className="object-contain transition duration-200 group-hover:scale-105"
            priority={loading === "eager"}
            loading={loading === "eager" ? undefined : loading}
            sizes="(max-width: 768px) 60vw, 240px"
            onError={handleError}
            unoptimized
          />
        </div>
      </div>
    </figure>
  );
};

const ReportImageStack = ({ items, className }: ReportImageStackProps) => {
  const normalizedItems = Array.isArray(items) ? items : [];
  const hasItems = normalizedItems.length > 0;

  const containerClassName = [
    "space-y-4 md:flex md:w-auto md:flex-col md:items-end md:space-y-4 md:self-start md:shrink-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
    setActiveSourceIndex(0);
  }, []);

  const closeModal = useCallback(() => {
    setActiveIndex(null);
    setActiveSourceIndex(0);
  }, []);

  const nextImage = useCallback(() => {
    setActiveIndex((previous) => {
      if (previous === null) return previous;
      return (previous + 1) % normalizedItems.length;
    });
    setActiveSourceIndex(0);
  }, [normalizedItems.length]);

  const previousImage = useCallback(() => {
    setActiveIndex((previous) => {
      if (previous === null) return previous;
      return (previous - 1 + normalizedItems.length) % normalizedItems.length;
    });
    setActiveSourceIndex(0);
  }, [normalizedItems.length]);

  const activeItem = activeIndex !== null ? normalizedItems[activeIndex] : null;
  const modalSources = useMemo(
    () => (activeItem ? activeItem.sources.filter(Boolean) : []),
    [activeItem],
  );
  const modalSource = modalSources[activeSourceIndex] ?? modalSources[0] ?? null;

  const handleModalError = useCallback(() => {
    setActiveSourceIndex((previous) => {
      if (previous >= modalSources.length - 1) {
        return previous;
      }
      return previous + 1;
    });
  }, [modalSources.length]);

  useEffect(() => {
    if (activeItem) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeModal();
        } else if (event.key === "ArrowRight") {
          nextImage();
        } else if (event.key === "ArrowLeft") {
          previousImage();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
    return undefined;
  }, [activeItem, closeModal, nextImage, previousImage]);

  if (!hasItems) {
    return null;
  }

  return (
    <>
      <div className={containerClassName}>
        {normalizedItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openModal(index)}
            className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            aria-label={`${item.alt} vergrößern`}
          >
            <ReportImageEntry item={item} />
          </button>
        ))}
      </div>

      {activeItem && modalSource && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Bildvorschau"
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white"
            aria-label="Vorschau schließen"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={previousImage}
            className="absolute left-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 p-3 text-white transition hover:bg-white/40 md:flex"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={nextImage}
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 p-3 text-white transition hover:bg-white/40 md:flex"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="w-full max-w-4xl space-y-4">
            <div className="relative max-h-[75vh] overflow-hidden rounded-3xl border border-white/30 bg-black/30 backdrop-blur">
              <Image
                src={modalSource}
                alt={activeItem.alt}
                fill
                className="object-contain"
                priority
                sizes="90vw"
                onError={handleModalError}
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-white/80">
              <span className="truncate">{activeItem.alt}</span>
            </div>

            {normalizedItems.length > 1 && (
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
                {normalizedItems.map((item, index) => (
                  <button
                    key={`${item.id}-thumb`}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setActiveSourceIndex(0);
                    }}
                    className={`relative h-20 overflow-hidden rounded-xl border ${index === activeIndex ? "border-green-400 ring-2 ring-green-300" : "border-white/30"}`}
                    aria-label={`${item.alt} auswählen`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={item.sources[0]}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:hidden"
              aria-label="Vorschau schließen"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export type { ReportImageStackItem };
export default ReportImageStack;
