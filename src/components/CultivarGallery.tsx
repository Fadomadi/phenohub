"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import ThumbnailCell from "@/components/ThumbnailCell";

type CultivarGalleryProps = {
  images: string[];
  name: string;
  className?: string;
};

const CultivarGallery = ({ images, name, className }: CultivarGalleryProps) => {
  const sanitizedImages = useMemo(
    () =>
      images.filter((image): image is string => typeof image === "string" && image.length > 0),
    [images],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openModal = useCallback(
    (index: number) => {
      if (index < 0 || index >= sanitizedImages.length) return;
      setActiveIndex(index);
      setIsOpen(true);
    },
    [sanitizedImages.length],
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const gotoPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + sanitizedImages.length) % sanitizedImages.length);
  }, [sanitizedImages.length]);

  const gotoNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % sanitizedImages.length);
  }, [sanitizedImages.length]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      } else if (event.key === "ArrowLeft") {
        gotoPrevious();
      } else if (event.key === "ArrowRight") {
        gotoNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, gotoNext, gotoPrevious, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (sanitizedImages.length === 0) {
    return (
      <div
        className={`col-span-3 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500 ${
          className ?? ""
        }`}
      >
        Noch keine Bilder aus Community-Berichten vorhanden.
      </div>
    );
  }

  return (
    <Fragment>
      <div className={`grid grid-cols-3 gap-2 ${className ?? ""}`}>
        {sanitizedImages.slice(0, 6).map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => openModal(index)}
            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-green-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/15 opacity-0 transition-opacity group-hover:opacity-100" />
            <ThumbnailCell
              value={image}
              alt={`${name} Bild ${index + 1}`}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-green-50 text-xl"
              imgClassName="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {isOpen && sanitizedImages[activeIndex] && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} Bildergalerie`}
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white md:right-10 md:top-10"
            aria-label="Galerie schließen"
          >
            <X className="h-5 w-5" />
          </button>

          {sanitizedImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={gotoPrevious}
                className="absolute left-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 p-3 text-white transition hover:bg-white/30 md:flex"
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={gotoNext}
                className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 p-3 text-white transition hover:bg-white/30 md:flex"
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="flex w-full max-w-4xl flex-col gap-4">
            <div className="relative max-h-[75vh] overflow-hidden rounded-3xl border border-white/20 bg-black/40">
              <Image
                key={`${sanitizedImages[activeIndex]}-${activeIndex}`}
                src={sanitizedImages[activeIndex]}
                alt={`${name} Bild ${activeIndex + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>

            {sanitizedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {sanitizedImages.slice(0, 12).map((thumb, index) => (
                  <button
                    key={`${thumb}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-20 overflow-hidden rounded-xl border ${
                      index === activeIndex
                        ? "border-green-400 ring-2 ring-green-300"
                        : "border-white/30"
                    }`}
                    aria-label={`${name} Bild ${index + 1} anzeigen`}
                  >
                    <Image
                      src={thumb}
                      alt={`${name} Bild ${index + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default CultivarGallery;
