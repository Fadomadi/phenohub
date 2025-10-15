"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type ReportImage = {
  direct: string;
  preview?: string;
  alt: string;
  original?: string;
};

type ReportImageGalleryProps = {
  images: ReportImage[];
  className?: string;
  showCover?: boolean;
  showThumbnails?: boolean;
  heading?: string | null;
  onImageOpen?: (image: ReportImage) => void;
  interactive?: boolean;
};

const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

const ReportImageGallery = ({
  images,
  className,
  showCover = true,
  showThumbnails = true,
  heading,
  onImageOpen,
  interactive = true,
}: ReportImageGalleryProps) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const [activeImage, setActiveImage] = useState<ReportImage | null>(null);
  const [modalSources, setModalSources] = useState<string[]>([]);
  const [coverImage, galleryImages] = useMemo(() => {
    if (images.length === 0) {
      return [undefined, [] as ReportImage[]] as const;
    }
    const [first, ...rest] = images;
    return [first, rest] as const;
  }, [images]);

  const containerClassName = ["space-y-8", className].filter(Boolean).join(" ");
  const thumbnails = showCover
    ? galleryImages
    : coverImage
      ? [coverImage, ...galleryImages]
      : galleryImages;
  const isInteractive = interactive !== false;
  const headingLabel = heading === undefined ? "Bildergalerie" : heading;
  const shouldRenderThumbnails = showThumbnails && thumbnails.length > 0;
  const thumbnailAltBase = showCover ? 2 : 1;

  const handleOpen = useCallback(
    (image: ReportImage) => {
      if (!isInteractive) return;
      setActiveImage(image);
      onImageOpen?.(image);
    },
    [isInteractive, onImageOpen],
  );

  const handleClose = useCallback(() => {
    setActiveImage(null);
  }, []);

  const encodeProxyUrl = useCallback((value: string) => {
    return `/api/image-proxy?url=${encodeURIComponent(value)}`;
  }, []);

  const resolveSource = useCallback(
    (image: ReportImage) => encodeProxyUrl(image.direct),
    [encodeProxyUrl],
  );

  useEffect(() => {
    if (!isInteractive || !activeImage) {
      setModalSources([]);
      return undefined;
    }

    const candidates = [
      activeImage.preview,
      activeImage.direct,
      activeImage.original,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => encodeProxyUrl(value));

    const unique = candidates.filter((value, index) => candidates.indexOf(value) === index);
    setModalSources(unique);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImage, encodeProxyUrl, isInteractive]);

  useEffect(() => {
    if (!isInteractive || !activeImage) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeImage, isInteractive]);

  return (
    <div className={containerClassName}>
      {showCover && coverImage && (
        isInteractive ? (
          <button
            type="button"
            onClick={() => handleOpen(coverImage)}
            className="block w-full rounded-3xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
            aria-label={`${coverImage.alt} vergrößert anzeigen`}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-950">
              <img
                src={resolveSource(coverImage)}
                alt={coverImage.alt}
                className="absolute inset-0 h-full w-full object-contain"
                loading="eager"
                onError={(event) => {
                  if (!coverImage.preview) return;
                  const fallbackSrc = encodeProxyUrl(coverImage.preview);
                  if (event.currentTarget.src !== fallbackSrc) {
                    event.currentTarget.src = fallbackSrc;
                  }
                }}
              />
            </div>
          </button>
        ) : (
          <div className="block w-full rounded-3xl border border-gray-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-950">
              <img
                src={resolveSource(coverImage)}
                alt={coverImage.alt}
                className="absolute inset-0 h-full w-full object-contain"
                loading="eager"
                onError={(event) => {
                  if (!coverImage.preview) return;
                  const fallbackSrc = encodeProxyUrl(coverImage.preview);
                  if (event.currentTarget.src !== fallbackSrc) {
                    event.currentTarget.src = fallbackSrc;
                  }
                }}
              />
            </div>
          </div>
        )
      )}

      {shouldRenderThumbnails && (
        <div className="space-y-4">
          {headingLabel && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {headingLabel}
            </h2>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {thumbnails.map((image, index) =>
              isInteractive ? (
                <button
                  type="button"
                  onClick={() => handleOpen(image)}
                  key={`${image.direct}-${index}`}
                  className="relative h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
                  aria-label={`${image.alt} vergrößert anzeigen`}
                >
                  <img
                    src={resolveSource(image)}
                    alt={`${image.alt} – Bild ${index + thumbnailAltBase}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      if (!image.preview) return;
                      const fallbackSrc = encodeProxyUrl(image.preview);
                      if (event.currentTarget.src !== fallbackSrc) {
                        event.currentTarget.src = fallbackSrc;
                      }
                    }}
                  />
                </button>
              ) : (
                <div
                  key={`${image.direct}-${index}`}
                  className="relative h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <img
                    src={resolveSource(image)}
                    alt={`${image.alt} – Bild ${index + thumbnailAltBase}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      if (!image.preview) return;
                      const fallbackSrc = encodeProxyUrl(image.preview);
                      if (event.currentTarget.src !== fallbackSrc) {
                        event.currentTarget.src = fallbackSrc;
                      }
                    }}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {isInteractive && activeImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Bildvorschau"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={stopPropagation}
            role="presentation"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute -top-4 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white"
              aria-label="Vorschau schließen"
            >
              <X className="h-5 w-5" />
            </button>
            {modalSources.length > 0 ? (
              <>
                <div className="relative h-[70vh] overflow-hidden rounded-3xl border border-white/30 bg-black/40 backdrop-blur">
                  <img
                    src={modalSources[0]}
                    alt={`${activeImage.alt} – Großansicht`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    onError={(event) => {
                      const target = event.currentTarget;
                      setModalSources((previousSources) => {
                        if (previousSources.length <= 1) {
                          target.alt = "Dieses Bild konnte nicht geladen werden.";
                          return [];
                        }
                        return previousSources.slice(1);
                      });
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/90">
                  <span className="truncate">{activeImage.alt}</span>
                  <a
                    href={activeImage.direct ?? activeImage.original ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/40"
                  >
                    Original öffnen
                  </a>
                </div>
              </>
            ) : (
              <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-3xl border border-white/30 bg-black/40 text-center text-sm text-white/80">
                <span>Dieses Bild konnte nicht geladen werden.</span>
                <a
                  href={activeImage.direct ?? activeImage.original ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/40"
                >
                  Original öffnen
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportImageGallery;
