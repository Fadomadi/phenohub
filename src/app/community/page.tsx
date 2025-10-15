"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Users,
  Tag,
} from "lucide-react";
import CommunityThreadModal, { CommunityThread } from "@/components/CommunityThreadModal";

type Flair =
  | "Alle"
  | "Über Genetik"
  | "Meine Pflanze braucht Hilfe"
  | "Generelle Fragen"
  | "Diskussion"
  | "Tipps & Anleitungen"
  | "Ernte"
  | "Fehlt etwas?";

type Thread = CommunityThread & { flair: Exclude<Flair, "Alle"> };

const flairs: Flair[] = [
  "Alle",
  "Über Genetik",
  "Meine Pflanze braucht Hilfe",
  "Generelle Fragen",
  "Diskussion",
  "Tipps & Anleitungen",
  "Ernte",
  "Fehlt etwas?",
];

const initialThreads: Thread[] = [
  {
    id: 1,
    title: "Flowery Field Amnesia – Stretch zu krass?",
    content:
      "Hab den Core Cut zum ersten Mal im 120er. Bin jetzt Woche 3 Bloom und sie schießt richtig. Tipps zum Zudrahten oder ruhig lassen?",
    flair: "Meine Pflanze braucht Hilfe",
    author: "@grower420",
    createdAt: "2025-02-12T10:15:00Z",
    replies: 8,
    likes: 14,
  },
  {
    id: 2,
    title: "Welche Lampen fahrt ihr aktuell für Stecklings-Phenos?",
    content:
      "Nutze seit kurzem LED-Bars mit 2.7 µmol/J. Würde gern wissen, ob jemand von euch noch auf HPS schwört – und warum!",
    flair: "Diskussion",
    author: "@lightseeker",
    createdAt: "2025-02-11T19:42:00Z",
    replies: 12,
    likes: 21,
  },
  {
    id: 3,
    title: "Tipps & Anleitungen: Stecklinge richtig anwurzeln lassen",
    content:
      "Habe meine Schritt-für-Schritt-Checkliste zusammengestellt. Von Luftfeuchte bis erste Düngung – hoffe, das hilft euch!",
    flair: "Tipps & Anleitungen",
    author: "@rooted",
    createdAt: "2025-02-10T08:05:00Z",
    replies: 5,
    likes: 27,
  },
  {
    id: 4,
    title: "La Diva Erntebericht – 84g trocken, Terpenprofil wow!",
    content:
      "Kurzer Wrap-up zur letzten Runde. Setup: 80x80, LED 240W, BioBizz. Frostig und sehr fruchtig – hier meine Werte und Fotos.",
    flair: "Ernte",
    author: "@flowerbeat",
    createdAt: "2025-02-09T15:28:00Z",
    replies: 3,
    likes: 18,
  },
  {
    id: 5,
    title: "Über Genetik: Wer kennt die neue Strawberry Gelato Linie?",
    content:
      "Habe Seeds von einem spanischen Breeder bekommen, angeblich selektiert aus Capulator-Linien. Jemand Erfahrungswerte?",
    flair: "Über Genetik",
    author: "@pheno_hunter",
    createdAt: "2025-02-08T21:11:00Z",
    replies: 6,
    likes: 11,
  },
  {
    id: 6,
    title: "Portal-Wünsche & fehlende Cuts",
    content:
      "Welche Sorten, Anbieter oder Features fehlen dir noch? Lass es uns wissen – wir aktualisieren regelmäßig Datenbank und UX.",
    flair: "Fehlt etwas?",
    author: "@admin",
    createdAt: "2025-02-07T12:00:00Z",
    replies: 9,
    likes: 24,
  },
];

const CommunityPage = () => {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedFlair, setSelectedFlair] = useState<Flair>("Alle");
  const [title, setTitle] = useState("");
  const [flair, setFlair] = useState<Exclude<Flair, "Alle">>("Diskussion");
  const [content, setContent] = useState("");
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadComments, setThreadComments] = useState<Record<number, string[]>>({});

  const filteredThreads = useMemo(() => {
    if (selectedFlair === "Alle") return threads;
    return threads.filter((thread) => thread.flair === selectedFlair);
  }, [selectedFlair, threads]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newThread: Thread = {
      id: threads.length + 1,
      title: title.trim(),
      content: content.trim(),
      flair,
      author: "@me",
      createdAt: new Date().toISOString(),
      replies: 0,
      likes: 0,
    };

    setThreads((prev) => [newThread, ...prev]);
    setThreadComments((prev) => ({ ...prev, [newThread.id]: [] }));
    setTitle("");
    setContent("");
    setFlair("Diskussion");
    setSelectedFlair("Alle");
  };

  const handleAddComment = (threadId: number, comment: string) => {
    setThreadComments((prev) => {
      const existing = prev[threadId] ?? [];
      return { ...prev, [threadId]: [...existing, comment] };
    });
    setThreads((prev) => {
      const updated = prev.map((thread) =>
        thread.id === threadId
          ? { ...thread, replies: thread.replies + 1 }
          : thread,
      );
      if (activeThread && activeThread.id === threadId) {
        const refreshed = updated.find((thread) => thread.id === threadId);
        if (refreshed) {
          setActiveThread(refreshed);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    if (activeThread) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeThread]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <header className="border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-green-700 transition hover:text-green-800"
          >
            🌱 PhenoHub
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <Link
              href="/"
              className="rounded-lg px-3 py-1 transition hover:bg-green-50 hover:text-green-800"
            >
              Startseite
            </Link>
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-green-50 via-white to-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm">
              💬 Community
            </span>
            <Link
              href="/login"
              className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            >
              Anmelden / Registrieren
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16">
        <section className="rounded-3xl border border-green-100 bg-white/90 p-8 shadow-lg shadow-green-100/60 backdrop-blur">
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Community & Austausch
            </h1>
            <p className="text-lg text-gray-600">
              Teile Setups, stelle Fragen oder poste deine Erfolge – PhenoHub lebt von ehrlichen
              Erfahrungswerten. Wähle einen passenden Flair und starte ein neues Thema.
            </p>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Neuen Thread erstellen
              </h2>
              <p className="text-sm text-gray-500">
                Beschreibe dein Anliegen und markiere es mit dem passenden Flair.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Titel
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Z. B. Core Cut kippt – was tun?"
                className="w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="flair"
                className="text-sm font-medium text-gray-700"
              >
                Flair
              </label>
              <div className="relative">
                <select
                  id="flair"
                  value={flair}
                  onChange={(event) =>
                    setFlair(event.target.value as Thread["flair"])
                  }
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                >
                  {flairs
                    .filter((option): option is Exclude<Flair, "Alle"> => option !== "Alle")
                    .map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
                <Tag className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-gray-700"
              >
                Inhalt
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Beschreibe dein Anliegen oder teile deine Erkenntnisse mit der Community."
                rows={5}
                className="w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm leading-relaxed text-gray-900 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Hauptseite
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                <Sparkles className="h-4 w-4" />
                Thread veröffentlichen
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {flairs.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFlair(option)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${
                  selectedFlair === option
                    ? "border-green-600 bg-green-600 text-white shadow-md"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredThreads.map((thread) => {
              const flairClass =
                thread.flair === "Fehlt etwas?"
                  ? "inline-flex items-center gap-2 rounded-full border border-green-500 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 shadow-sm"
                  : "inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700";

              return (
                <article
                  key={thread.id}
                  className="cursor-pointer rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm transition hover:border-green-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                  onClick={() => setActiveThread(thread)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveThread(thread);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={flairClass}>
                      <Tag className="h-3 w-3" />
                      {thread.flair}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(thread.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-gray-900">
                    {thread.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">{thread.content}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>@{thread.author.replace("@", "")}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {thread.replies} Antworten
                    </span>
                    <span className="inline-flex items-center gap-1">
                      👍 {thread.likes}
                    </span>
                  </div>
                </article>
              );
            })}

            {filteredThreads.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white/70 p-8 text-center text-sm text-gray-500">
                Noch keine Beiträge für diesen Flair. Sei der erste und starte ein neues Thema!
              </div>
            )}
          </div>
        </section>
      </main>
      {activeThread && (
        <CommunityThreadModal
          thread={activeThread}
          comments={threadComments[activeThread.id] ?? []}
          onAddComment={handleAddComment}
          onClose={() => setActiveThread(null)}
        />
      )}
    </div>
  );
};

export default CommunityPage;
