"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import type { Report } from "@/types/domain";
import { normalizeTmpfilesUrl } from "@/lib/images";
import ReportLikeToggle from "@/components/ReportLikeToggle";

type ReportCardProps = {
  report: Report;
};

const ReportCard = ({ report }: ReportCardProps) => {
  const images = useMemo(
    () =>
      (report.images ?? []).map((img) =>
        typeof img === "string" ? normalizeTmpfilesUrl(img).direct : img,
      ),
    [report.images],
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const next = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setCurrentImageIndex((prev) =>
        prev < images.length - 1 ? prev + 1 : 0,
      );
    },
    [images.length],
  );

  const prev = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setCurrentImageIndex((prev) =>
        prev > 0 ? prev - 1 : images.length - 1,
      );
    },
    [images.length],
  );

  const currentImage = images[currentImageIndex];
  const hasImageUrl = typeof currentImage === "string" && currentImage.startsWith("http");
  const proxiedCurrentImage = hasImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(currentImage)}`
    : null;

  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500">
      <div className="relative bg-gray-100 dark:bg-slate-900/70">
        <Link
          href={`/reports/${report.id}`}
          className="block"
          aria-label={`${report.cultivar} Report öffnen`}
        >
          <div className="relative aspect-square overflow-hidden rounded-b-none bg-green-100 dark:bg-slate-800">
            {proxiedCurrentImage ? (
              <Image
                src={proxiedCurrentImage}
                alt={report.title || report.cultivar}
                fill
                sizes="(max-width: 768px) 60vw, 200px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                {currentImage || "🌱"}
              </div>
            )}
          </div>
        </Link>

        {images.length > 1 && (
          <>
            <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-0.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Bild ${idx + 1} anzeigen`}
                  className={`h-1 w-1 rounded-full transition-all ${idx === currentImageIndex ? "w-2 bg-green-600" : "bg-white/70"}`}
                />
              ))}
            </div>
            <button
              onClick={prev}
              className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-black/10 to-transparent opacity-0 hover:opacity-100"
              aria-label="Vorheriges Bild"
            />
            <button
              onClick={next}
              className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent opacity-0 hover:opacity-100"
              aria-label="Nächstes Bild"
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-1.5">
        <Link href={`/reports/${report.id}`} className="group/link block">
          <div className="mb-0.5 flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-900">
              {report.overall}
            </span>
          </div>
          <h3 className="mb-0.5 line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover/link:text-green-600 dark:text-slate-100 dark:group-hover/link:text-sky-300">
            {report.cultivar}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <ReportLikeToggle
            reportId={report.id}
            initialLiked={Boolean(report.liked)}
            initialLikes={report.likes}
            variant="compact"
          />
          <div className="flex items-center gap-0.5">
            <MessageCircle className="h-2.5 w-2.5" />
            <span className="text-xs">{report.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
