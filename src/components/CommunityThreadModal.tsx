"use client";

import { useState } from "react";
import { X, MessageCircle, Tag, ThumbsUp } from "lucide-react";

export type CommunityThread = {
  id: number;
  title: string;
  content: string;
  flair: string;
  author: string;
  createdAt: string;
  replies: number;
  likes: number;
};

type CommunityThreadModalProps = {
  thread: CommunityThread;
  comments: string[];
  canComment: boolean;
  canModerate?: boolean;
  onAddComment: (threadId: number, comment: string) => boolean;
  onDeleteComment?: (threadId: number, commentIndex: number) => void;
  onClose: () => void;
};

const CommunityThreadModal = ({
  thread,
  comments,
  canComment,
  canModerate = false,
  onAddComment,
  onDeleteComment,
  onClose,
}: CommunityThreadModalProps) => {
  const [commentText, setCommentText] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canComment) {
      setError("Bitte melde dich an, um zu kommentieren.");
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;
    const success = onAddComment(thread.id, trimmed);
    if (!success) {
      setError("Bitte melde dich an, um zu kommentieren.");
      return;
    }
    setCommentText("");
    setStatus("success");
    setTimeout(() => setStatus("idle"), 1800);
    setError(null);
  };

  const flairClass =
    thread.flair === "Fehlt etwas?"
      ? "inline-flex items-center gap-2 rounded-full border border-green-500 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 shadow-sm"
      : "inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700";

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={flairClass}>
                <Tag className="h-3.5 w-3.5" />
                {thread.flair}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(thread.createdAt).toLocaleString("de-DE")}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {thread.title}
            </h2>
            <p className="text-sm text-gray-500">
              @{thread.author.replace("@", "")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Thread schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid max-h-[75vh] grid-cols-1 overflow-y-auto px-6 py-6 gap-6 lg:grid-cols-[1fr_14rem]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-sm">
              <p className="text-sm leading-relaxed text-gray-700">
                {thread.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {thread.replies} Antworten
                </span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {thread.likes} Likes
                </span>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">
                Kommentare
              </h3>
              {comments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
                  Noch keine Kommentare – schreib als erste:r deine Gedanken oder Ergänzungen.
                </p>
              ) : (
                <ul className="space-y-3 text-sm text-gray-700">
                  {comments.map((comment, index) => (
                    <li
                      key={`${thread.id}-comment-${index}`}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                    >
                      <span className="flex-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {comment}
                      </span>
                      {canModerate && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment?.(thread.id, index)}
                          className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                        >
                          Entfernen
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-4 rounded-3xl border border-green-100 bg-green-50/80 p-5 shadow-inner">
            <h3 className="text-sm font-semibold text-gray-900">
              Kommentar schreiben
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                rows={4}
                placeholder="Teile deine Erfahrungen, Tipps oder Fragen …"
                className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                disabled={!canComment}
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
                disabled={!commentText.trim() || !canComment}
              >
                <MessageCircle className="h-4 w-4" />
                Kommentar posten
              </button>
            </form>
            {!canComment && (
              <p className="text-xs font-medium text-emerald-900/80">
                Bitte melde dich an, um Kommentare zu schreiben.
              </p>
            )}
            {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
            {status === "success" && (
              <p className="text-xs font-medium text-green-700">
                Danke für deinen Beitrag! Er wurde hinzugefügt.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CommunityThreadModal;
