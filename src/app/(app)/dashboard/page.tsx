"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import ReportImageGallery from "@/components/ReportImageGallery";
import { normalizeTmpfilesUrl } from "@/lib/images";

type ReportSummary = {
  id: number;
  title: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  publishedAt: string | null;
  cultivar: { name: string; slug: string | null } | null;
  provider: { name: string; slug: string | null } | null;
  author: { id: number; name: string | null; email: string | null } | null;
  moderatedBy: { id: number; name: string | null; email: string | null } | null;
  excerpt?: string | null;
  content?: string | null;
  images?: string[] | null;
  gallery?: unknown;
};

type UserSummary = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
  status: string;
  plan: string;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

const REPORT_TABS: Array<"PENDING" | "PUBLISHED" | "REJECTED"> = [
  "PENDING",
  "PUBLISHED",
  "REJECTED",
];

const ROLE_OPTIONS = ["USER", "SUPPORTER", "VERIFIED", "MODERATOR", "ADMIN", "OWNER"];
const STATUS_OPTIONS = ["ACTIVE", "INVITED", "SUSPENDED"];

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"PENDING" | "PUBLISHED" | "REJECTED">("PENDING");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);

  const isModerator = useMemo(
    () =>
      session?.user?.role ? ["OWNER", "ADMIN", "MODERATOR"].includes(session.user.role) : false,
    [session?.user?.role],
  );

  const isOwner = session?.user?.role === "OWNER";

  const loadReports = useCallback(
    async (statusFilter: "PENDING" | "PUBLISHED" | "REJECTED") => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const response = await fetch(`/api/admin/reports?status=${statusFilter}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "Reports konnten nicht geladen werden.");
        }

        const reportsData = Array.isArray(result?.reports)
          ? (result.reports as ReportSummary[])
          : [];
        setReports(
          reportsData.map((report) => ({
            ...report,
            createdAt: report.createdAt,
            publishedAt: report.publishedAt,
          })),
        );
      } catch (error) {
        setReportsError(error instanceof Error ? error.message : "Unbekannter Fehler");
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    },
    [],
  );

  const reloadReports = useCallback(() => {
    if (isModerator) {
      void loadReports(activeTab);
    }
  }, [activeTab, isModerator, loadReports]);

  useEffect(() => {
    if (isModerator) {
      void loadReports(activeTab);
    }
  }, [activeTab, isModerator, loadReports]);

  const loadUsers = useCallback(async () => {
    if (!isOwner) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Nutzer konnten nicht geladen werden.");
      }
      setUsers(result.users ?? []);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Unbekannter Fehler");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (isOwner) {
      void loadUsers();
    }
  }, [isOwner, loadUsers]);

  const mutateReport = useCallback(
    async (id: number, nextStatus: "PENDING" | "PUBLISHED" | "REJECTED", note?: string | null) => {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reviewNote: note ?? null }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Aktion fehlgeschlagen");
      }
      return result.report as ReportSummary;
    },
    [],
  );

  const deleteReport = useCallback(async (id: number) => {
    const response = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || "Report konnte nicht gelöscht werden");
    }
  }, []);

  const updateUser = useCallback(
    async (id: number, payload: Record<string, unknown>) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Aktualisierung fehlgeschlagen");
      }
      return result.user as UserSummary;
    },
    [],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Lade Session…</p>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold text-gray-900">Kein Zugriff</h1>
          <p className="text-sm text-gray-600">
            Dieser Bereich steht nur Moderatoren und Ownern zur Verfügung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Moderations-Dashboard</h1>
            <p className="text-sm text-gray-500">
              Berichte prüfen, freischalten oder ablehnen. Rollenverwaltung findest du unten.
            </p>
          </div>
          <button
            onClick={reloadReports}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-700 transition hover:border-green-300 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 sm:w-auto"
          >
            Aktualisieren
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:w-auto"
          >
            ← Zur Startseite
          </Link>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 overflow-x-auto">
            {REPORT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab === "PENDING" && "Eingang"}
                {tab === "PUBLISHED" && "Freigeschaltet"}
                {tab === "REJECTED" && "Archiv"}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <p className="text-sm text-gray-500">Lade Reports…</p>
          ) : reportsError ? (
            <p className="text-sm text-red-600">{reportsError}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Reports in dieser Kategorie.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-green-400 hover:bg-white"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-600">
                        {report.cultivar?.name ?? "Unbekannte Sorte"} · {report.provider?.name ?? "Unbekannter Anbieter"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Eingereicht am {new Date(report.createdAt).toLocaleString("de-DE")}
                      </p>
                      {report.reviewNote && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                          Moderationshinweis: {report.reviewNote}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : report.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                    {report.author?.email && <span>Eingereicht von {report.author.email}</span>}
                    {report.moderatedBy?.email && <span>Moderiert von {report.moderatedBy.email}</span>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      Details ansehen
                    </button>
                    {activeTab !== "PUBLISHED" && (
                      <button
                        onClick={async () => {
                          try {
                            await mutateReport(report.id, "PUBLISHED");
                            reloadReports();
                          } catch (error) {
                            alert(error instanceof Error ? error.message : "Aktion fehlgeschlagen");
                          }
                        }}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                      >
                        Freigeben
                      </button>
                    )}
                    {activeTab !== "REJECTED" && (
                      <button
                        onClick={async () => {
                          const note = window.prompt("Optionaler Hinweis für den Autor:", report.reviewNote ?? "");
                          try {
                            await mutateReport(report.id, "REJECTED", note ?? null);
                            reloadReports();
                          } catch (error) {
                            alert(error instanceof Error ? error.message : "Aktion fehlgeschlagen");
                          }
                        }}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Ablehnen
                      </button>
                    )}
                    {activeTab !== "PENDING" && (
                      <button
                        onClick={async () => {
                          try {
                            await mutateReport(report.id, "PENDING");
                            reloadReports();
                          } catch (error) {
                            alert(error instanceof Error ? error.message : "Aktion fehlgeschlagen");
                          }
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        Zurückstellen
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!window.confirm("Report endgültig löschen?")) return;
                        try {
                          await deleteReport(report.id);
                          reloadReports();
                        } catch (error) {
                          alert(error instanceof Error ? error.message : "Löschen fehlgeschlagen");
                        }
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      Löschen
                    </button>
                  </div>
                </article>
              ))}
            </div>
        )}
      </section>

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {isOwner && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Benutzerverwaltung</h2>
              <button
                onClick={loadUsers}
                className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 transition hover:border-green-300 hover:bg-green-50"
              >
                Aktualisieren
              </button>
            </div>

            {usersLoading ? (
              <p className="text-sm text-gray-500">Lade Nutzer…</p>
            ) : usersError ? (
              <p className="text-sm text-red-600">{usersError}</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Nutzer gefunden.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.name ?? "Ohne Namen"} · Konto seit {new Date(user.createdAt).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <select
                          value={user.role}
                          onChange={async (event) => {
                            try {
                              const updated = await updateUser(user.id, { role: event.target.value });
                              setUsers((prev) =>
                                prev.map((item) => (item.id === user.id ? { ...item, role: updated.role } : item)),
                              );
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "Update fehlgeschlagen");
                            }
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <select
                          value={user.status}
                          onChange={async (event) => {
                            try {
                              const updated = await updateUser(user.id, { status: event.target.value });
                              setUsers((prev) =>
                                prev.map((item) => (item.id === user.id ? { ...item, status: updated.status } : item)),
                              );
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "Update fehlgeschlagen");
                            }
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1"
                        >
                          {STATUS_OPTIONS.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={async () => {
                            try {
                              const updated = await updateUser(user.id, { verified: !user.verifiedAt });
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === user.id ? { ...item, verifiedAt: updated.verifiedAt } : item,
                                ),
                              );
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "Update fehlgeschlagen");
                            }
                          }}
                          className={`rounded-lg px-2 py-1 font-semibold transition ${
                            user.verifiedAt
                              ? "border border-green-200 bg-green-50 text-green-700"
                              : "border border-gray-300 bg-white text-gray-600"
                          }`}
                        >
                          {user.verifiedAt ? "Verifiziert" : "Verifizieren"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

type ParsedGalleryEntry = {
  direct: string;
  preview?: string;
  alt: string;
  original?: string;
};

const toGalleryImages = (report: ReportSummary): ParsedGalleryEntry[] => {
  const alt = report.title || "Report Bild";

  const fromGallery =
    Array.isArray(report.gallery) || typeof report.gallery === "object"
      ? (Array.isArray(report.gallery) ? report.gallery : Object.values(report.gallery ?? {})).flatMap(
          (entry) => (Array.isArray(entry) ? entry : [entry]),
        )
      : [];

  const parsedFromGallery = Array.isArray(fromGallery)
    ? (fromGallery as unknown[])
        .flatMap((entry) => {
          if (!entry || typeof entry !== "object") {
            return [];
          }

          const record = entry as Record<string, unknown>;
          const directUrl = typeof record.directUrl === "string" ? record.directUrl : null;
          if (!directUrl) {
            return [];
          }

          const previewUrl = typeof record.previewUrl === "string" ? record.previewUrl : undefined;
          const normalized = normalizeTmpfilesUrl(directUrl);
          const normalizedPreview =
            typeof normalized.preview === "string" && normalized.preview.startsWith("http")
              ? normalized.preview
              : undefined;
          const previewCandidate =
            previewUrl && previewUrl.startsWith("http") ? previewUrl : normalizedPreview;

          const normalizedEntry: ParsedGalleryEntry = {
            direct:
              normalized.direct && normalized.direct.startsWith("http")
                ? normalized.direct
                : directUrl,
            original:
              typeof record.originalFileName === "string" && record.originalFileName.trim().length > 0
                ? record.originalFileName
                : directUrl,
            alt,
          };

          if (previewCandidate) {
            normalizedEntry.preview = previewCandidate;
          }

          return [normalizedEntry];
        })
    : [];

  if (parsedFromGallery.length > 0) {
    return parsedFromGallery;
  }

  const fallbackImages = (report.images ?? [])
    .flatMap((img) => {
      if (typeof img !== "string" || !img.trim()) {
        return [];
      }

      const normalized = normalizeTmpfilesUrl(img);
      const direct =
        typeof normalized.direct === "string" && normalized.direct.startsWith("http")
          ? normalized.direct
          : img.startsWith("http")
            ? img
            : null;

      if (!direct) {
        return [];
      }

      const normalizedPreview =
        typeof normalized.preview === "string" && normalized.preview.startsWith("http")
          ? normalized.preview
          : undefined;

      const entry: ParsedGalleryEntry = {
        direct,
        original: img,
        alt,
      };

      if (normalizedPreview) {
        entry.preview = normalizedPreview;
      }

      return [entry];
    });

  return fallbackImages;
};

const ReportDetailsModal = ({
  report,
  onClose,
}: {
  report: ReportSummary;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const galleryImages = useMemo(() => toGalleryImages(report), [report]);

  const contentParagraphs = useMemo(() => {
    if (!report.content) return [];
    return report.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [report.content]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-10 backdrop-blur">
      <div className="relative flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Report-Details schließen"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="pr-12">
          <h2 className="text-2xl font-semibold text-gray-900">{report.title}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {report.cultivar?.name ?? "Unbekannte Sorte"} ·{" "}
            {report.provider?.name ?? "Unbekannter Anbieter"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Eingereicht am {new Date(report.createdAt).toLocaleString("de-DE")} · Status{" "}
            {report.status}
          </p>
        </header>

        {galleryImages.length > 0 ? (
          <ReportImageGallery images={galleryImages} heading="Eingereichte Bilder" />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
            Keine Bilder vorhanden.
          </div>
        )}

        {report.excerpt && (
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Kurzfassung</h3>
            <p className="text-sm text-gray-700">{report.excerpt}</p>
          </section>
        )}

        {contentParagraphs.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Inhalt</h3>
            <div className="space-y-3 text-sm leading-relaxed text-gray-700">
              {contentParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {report.reviewNote && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Moderationshinweis: {report.reviewNote}
          </section>
        )}

        <footer className="flex flex-wrap gap-4 text-xs text-gray-500">
          {report.author?.email && <span>Eingereicht von {report.author.email}</span>}
          {report.moderatedBy?.email && <span>Letzte Moderation durch {report.moderatedBy.email}</span>}
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
