"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

type ReportLikeToggleProps = {
  reportId: number;
  initialLiked: boolean;
  initialLikes: number;
  variant?: "compact" | "default";
};

const ReportLikeToggle = ({
  reportId,
  initialLiked,
  initialLikes,
  variant = "default",
}: ReportLikeToggleProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    if (isPending) return;
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(`/api/reports/${reportId}/like`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("Like-Request fehlgeschlagen");
        }
        const result = await response.json();
        setLiked(Boolean(result.liked));
        setLikes(typeof result.likes === "number" ? result.likes : initialLikes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
      }
    });
  };

  const baseClasses =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2";
  const styles = liked
    ? "border-rose-300 bg-rose-50 text-rose-600 focus:ring-rose-200"
    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 focus:ring-gray-200";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 text-xs font-semibold text-gray-600 transition hover:text-rose-500 focus:outline-none ${liked ? "text-rose-500" : ""}`}
        aria-pressed={liked}
        disabled={isPending}
      >
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
        <span>{likes}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-xs">
      <button
        type="button"
        onClick={handleToggle}
        className={`${baseClasses} ${styles}`}
        aria-pressed={liked}
        disabled={isPending}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-rose-500" : "text-gray-400"}`} />
        <span>{likes}</span>
        <span>{liked ? "Gefällt dir" : "Gefällt mir"}</span>
      </button>
      {error && <span className="text-rose-500">{error}</span>}
    </div>
  );
};

export default ReportLikeToggle;
