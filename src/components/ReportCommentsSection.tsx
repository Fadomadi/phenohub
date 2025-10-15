"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import type { ReportComment } from "@/types/domain";

type ReportCommentsSectionProps = {
  reportId: number;
  initialComments: ReportComment[];
  canComment: boolean;
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const ReportCommentsSection = ({
  reportId,
  initialComments,
  canComment,
}: ReportCommentsSectionProps) => {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<ReportComment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isOwner = session?.user?.role === "OWNER";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canComment || status !== "authenticated") {
      setError("Bitte melde dich an, um zu kommentieren.");
      return;
    }
    if (!commentText.trim()) {
      setError("Bitte einen Kommentar eingeben.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);
      try {
        const response = await fetch(`/api/reports/${reportId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: commentText }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "Kommentar konnte nicht gespeichert werden.");
        }
        const newComment = result?.comment as ReportComment | undefined;
        if (newComment) {
          setComments((prev) => [...prev, newComment]);
        }
        setCommentText("");
        setSuccess("Kommentar veröffentlicht.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  };

  const handleDelete = async (commentId: number) => {
    if (!isOwner) {
      return;
    }
    setError(null);
    setSuccess(null);
    setDeletingId(commentId);

    try {
      const response = await fetch(`/api/reports/${reportId}/comments/${commentId}`, {
        method: "DELETE",
      });
      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }
      if (!response.ok) {
        throw new Error(result?.error || "Kommentar konnte nicht gelöscht werden.");
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kommentar konnte nicht gelöscht werden.");
    } finally {
      setDeletingId((current) => (current === commentId ? null : current));
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Kommentare</h2>
        <span className="text-xs text-gray-500 dark:text-slate-400">{comments.length} Beiträge</span>
      </div>

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-300">Noch keine Kommentare vorhanden.</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block font-semibold text-gray-900 dark:text-slate-100">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed dark:hover:bg-slate-800"
                    aria-label={`Kommentar von ${comment.authorName} löschen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                {comment.body}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4 dark:border-slate-700">
        {canComment ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
              rows={3}
              placeholder="Teile deine Erfahrung oder stelle eine Frage…"
              disabled={isPending}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                {isPending ? "Speichere…" : "Kommentar senden"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-slate-300">
            Bitte melde dich an, um Kommentare zu schreiben.
          </p>
        )}
      </div>
    </section>
  );
};

export default ReportCommentsSection;
