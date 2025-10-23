"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import type { Seed } from "@/types/domain";

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

type HighlightSeedConfig = {
  showSeeds: boolean;
  showSupportCTA: boolean;
  showCommunityFeedback: boolean;
  showCommunityNav: boolean;
  plannedNotes: string;
  seeds: Seed[];
};

type HighlightFeedbackAdminEntry = {
  id: number;
  body: string;
  createdAt: string;
  displayName: string;
  archivedAt: string | null;
};

const createSeedTemplate = (id: number): Seed => ({
  id,
  slug: `seed-${id}`,
  name: "",
  breeder: "",
  genetics: "",
  type: "Feminisiert",
  floweringTime: "",
  yield: "",
  popularity: 0,
  thumbnails: [],
});

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
  const [highlightSettings, setHighlightSettings] = useState<HighlightSeedConfig | null>(null);
  const [highlightSettingsLoading, setHighlightSettingsLoading] = useState(false);
  const [highlightSettingsError, setHighlightSettingsError] = useState<string | null>(null);
  const [highlightSettingsSaveError, setHighlightSettingsSaveError] = useState<string | null>(
    null,
  );
  const [highlightSettingsSuccess, setHighlightSettingsSuccess] = useState<string | null>(null);
  const [highlightSettingsSaving, setHighlightSettingsSaving] = useState(false);
  const [highlightFeedbackEntries, setHighlightFeedbackEntries] = useState<
    HighlightFeedbackAdminEntry[]
  >([]);
  const [highlightFeedbackLoading, setHighlightFeedbackLoading] = useState(false);
  const [highlightFeedbackError, setHighlightFeedbackError] = useState<string | null>(null);
  const [highlightFeedbackActionIds, setHighlightFeedbackActionIds] = useState<Set<number>>(
    () => new Set<number>(),
  );
  const [highlightFeedbackSuccess, setHighlightFeedbackSuccess] = useState<string | null>(null);

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

  const loadHighlightSettings = useCallback(async () => {
    if (!isOwner) return;
    setHighlightSettingsLoading(true);
    setHighlightSettingsError(null);
    setHighlightSettingsSaveError(null);
    setHighlightSettingsSuccess(null);
    try {
      const response = await fetch("/api/admin/highlight-settings", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Highlight-Einstellungen konnten nicht geladen werden.");
      }
      const config = result?.config as HighlightSeedConfig | undefined;
      if (config) {
        setHighlightSettings({
          showSeeds: Boolean(config.showSeeds),
          showSupportCTA:
            typeof config.showSupportCTA === "boolean" ? config.showSupportCTA : true,
          showCommunityFeedback:
            typeof config.showCommunityFeedback === "boolean" ? config.showCommunityFeedback : true,
          showCommunityNav:
            typeof config.showCommunityNav === "boolean" ? config.showCommunityNav : true,
          plannedNotes:
            typeof config.plannedNotes === "string" ? config.plannedNotes : "",
          seeds: Array.isArray(config.seeds) ? config.seeds : [],
        });
      } else {
        setHighlightSettings({
          showSeeds: true,
          showSupportCTA: true,
          showCommunityFeedback: true,
          showCommunityNav: true,
          plannedNotes: "",
          seeds: [],
        });
      }
    } catch (error) {
      setHighlightSettingsError(
        error instanceof Error
          ? error.message
          : "Highlight-Einstellungen konnten nicht geladen werden.",
      );
      setHighlightSettings({
        showSeeds: true,
        showSupportCTA: true,
        showCommunityFeedback: true,
        showCommunityNav: true,
        plannedNotes: "",
        seeds: [],
      });
    } finally {
      setHighlightSettingsLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (isOwner) {
      void loadHighlightSettings();
    }
  }, [isOwner, loadHighlightSettings]);

  const normalizeHighlightFeedbackEntry = useCallback(
    (value: unknown): HighlightFeedbackAdminEntry | null => {
      if (!value || typeof value !== "object") return null;
      const record = value as Record<string, unknown>;
      const idRaw = record.id;
      const id =
        typeof idRaw === "number"
          ? idRaw
          : typeof idRaw === "string" && Number.isFinite(Number(idRaw))
            ? Number(idRaw)
            : null;
      if (!id) return null;

      const body =
        typeof record.body === "string"
          ? record.body.trim()
          : typeof record.body === "number"
            ? String(record.body)
            : "";
      if (!body) return null;

      const displayName =
        typeof record.displayName === "string" && record.displayName.trim().length > 0
          ? record.displayName.trim()
          : typeof record.authorName === "string" && record.authorName.trim().length > 0
            ? record.authorName.trim()
            : "Community-Mitglied";

      const createdAtValue = record.createdAt;
      const createdAt =
        createdAtValue instanceof Date
          ? createdAtValue.toISOString()
          : typeof createdAtValue === "string" && createdAtValue.length > 0
            ? createdAtValue
            : new Date().toISOString();

      const archivedRaw = record.archivedAt;
      let archivedAt: string | null = null;
      if (archivedRaw instanceof Date) {
        archivedAt = archivedRaw.toISOString();
      } else if (typeof archivedRaw === "string" && archivedRaw.length > 0) {
        archivedAt = archivedRaw;
      }

      return {
        id,
        body,
        displayName,
        createdAt,
        archivedAt,
      };
    },
    [],
  );

  const loadHighlightFeedbackEntries = useCallback(async () => {
    if (!isOwner) return;
    setHighlightFeedbackLoading(true);
    setHighlightFeedbackError(null);
    setHighlightFeedbackSuccess(null);
    try {
      const response = await fetch("/api/admin/highlight-feedback?includeArchived=true", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Feedback-Einträge konnten nicht geladen werden.");
      }
      const entries = Array.isArray(result?.feedback)
        ? (result.feedback
            .map((item: unknown) => normalizeHighlightFeedbackEntry(item))
            .filter(
              (item: HighlightFeedbackAdminEntry | null): item is HighlightFeedbackAdminEntry =>
                Boolean(item),
            ) as HighlightFeedbackAdminEntry[])
        : [];
      setHighlightFeedbackEntries(entries);
    } catch (error) {
      setHighlightFeedbackError(
        error instanceof Error ? error.message : "Feedback-Einträge konnten nicht geladen werden.",
      );
      setHighlightFeedbackEntries([]);
    } finally {
      setHighlightFeedbackLoading(false);
    }
  }, [isOwner, normalizeHighlightFeedbackEntry]);

  useEffect(() => {
    if (isOwner) {
      void loadHighlightFeedbackEntries();
    }
  }, [isOwner, loadHighlightFeedbackEntries]);

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

  const updateSeedAtIndex = useCallback(
    (index: number, updater: (seed: Seed) => Seed) => {
      setHighlightSettings((previous) => {
        if (!previous) return previous;
        if (index < 0 || index >= previous.seeds.length) {
          return previous;
        }
        const nextSeeds = [...previous.seeds];
        nextSeeds[index] = updater(nextSeeds[index]);
        return { ...previous, seeds: nextSeeds };
      });
    },
    [],
  );

  const handleSeedFieldChange = useCallback(
    (index: number, field: keyof Seed, value: string | number) => {
      updateSeedAtIndex(index, (seed) => {
        if (field === "popularity") {
          const numericValue =
            typeof value === "number"
              ? value
              : Number.isFinite(Number(value))
                ? Number(value)
                : seed.popularity;
          return { ...seed, popularity: numericValue };
        }

        if (field === "thumbnails") {
          const entries =
            typeof value === "string"
              ? value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0)
              : seed.thumbnails;
          return { ...seed, thumbnails: entries };
        }

        const nextValue = typeof value === "string" ? value : String(value);
        return { ...seed, [field]: nextValue };
      });
    },
    [updateSeedAtIndex],
  );

  const addSeedEntry = useCallback(() => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      const id = Date.now();
      return {
        ...previous,
        seeds: [...previous.seeds, createSeedTemplate(id)],
      };
    });
  }, []);

  const removeSeedEntry = useCallback((index: number) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        seeds: previous.seeds.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }, []);

  const moveSeedEntry = useCallback((index: number, direction: "up" | "down") => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.seeds.length) {
        return previous;
      }
      const seeds = [...previous.seeds];
      const [current] = seeds.splice(index, 1);
      seeds.splice(targetIndex, 0, current);
      return { ...previous, seeds };
    });
  }, []);

  const handleHighlightVisibilityToggle = useCallback((next: boolean) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return { ...previous, showSeeds: next };
    });
  }, []);

  const handleSupportCtaToggle = useCallback((next: boolean) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return { ...previous, showSupportCTA: next };
    });
  }, []);

  const handleCommunityNavToggle = useCallback((next: boolean) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return { ...previous, showCommunityNav: next };
    });
  }, []);

  const handleCommunityFeedbackToggle = useCallback((next: boolean) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return { ...previous, showCommunityFeedback: next };
    });
  }, []);

  const handlePlannedNotesChange = useCallback((value: string) => {
    setHighlightSettings((previous) => {
      if (!previous) return previous;
      return { ...previous, plannedNotes: value };
    });
  }, []);

  const handleHighlightFeedbackArchive = useCallback(
    async (id: number, archived: boolean) => {
      setHighlightFeedbackActionIds((previous) => {
        const next = new Set(previous);
        next.add(id);
        return next;
      });
      setHighlightFeedbackError(null);
      setHighlightFeedbackSuccess(null);
      try {
        const response = await fetch(`/api/admin/highlight-feedback/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "Aktion fehlgeschlagen.");
        }
        const entry = normalizeHighlightFeedbackEntry(result?.feedback);
        if (entry) {
          setHighlightFeedbackEntries((previous) => {
            const others = previous.filter((item) => item.id !== entry.id);
            return [entry, ...others].sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
          });
        } else {
          await loadHighlightFeedbackEntries();
        }
        setHighlightFeedbackSuccess(
          archived ? "Eintrag wurde archiviert." : "Eintrag wurde wiederhergestellt.",
        );
      } catch (error) {
        setHighlightFeedbackError(
          error instanceof Error ? error.message : "Aktion konnte nicht durchgeführt werden.",
        );
      } finally {
        setHighlightFeedbackActionIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    },
    [loadHighlightFeedbackEntries, normalizeHighlightFeedbackEntry],
  );

  const handleHighlightFeedbackDelete = useCallback(
    async (id: number) => {
      setHighlightFeedbackActionIds((previous) => {
        const next = new Set(previous);
        next.add(id);
        return next;
      });
      setHighlightFeedbackError(null);
      setHighlightFeedbackSuccess(null);
      try {
        const response = await fetch(`/api/admin/highlight-feedback/${id}`, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 204) {
          const result = await response.json();
          throw new Error(result?.error || "Eintrag konnte nicht gelöscht werden.");
        }
        setHighlightFeedbackEntries((previous) =>
          previous.filter((entry) => entry.id !== id),
        );
        setHighlightFeedbackSuccess("Eintrag wurde gelöscht.");
      } catch (error) {
        setHighlightFeedbackError(
          error instanceof Error ? error.message : "Eintrag konnte nicht gelöscht werden.",
        );
      } finally {
        setHighlightFeedbackActionIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  const handleSaveHighlightSettings = useCallback(async () => {
    if (!highlightSettings) return;
    setHighlightSettingsSaving(true);
    setHighlightSettingsSaveError(null);
    setHighlightSettingsSuccess(null);
    try {
      const response = await fetch("/api/admin/highlight-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(highlightSettings),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Einstellungen konnten nicht gespeichert werden.");
      }
      const config = result?.config as HighlightSeedConfig | undefined;
      if (config) {
        setHighlightSettings({
          showSeeds: Boolean(config.showSeeds),
          showSupportCTA:
            typeof config.showSupportCTA === "boolean" ? config.showSupportCTA : true,
          showCommunityFeedback:
            typeof config.showCommunityFeedback === "boolean" ? config.showCommunityFeedback : true,
          showCommunityNav:
            typeof config.showCommunityNav === "boolean" ? config.showCommunityNav : true,
          plannedNotes: typeof config.plannedNotes === "string" ? config.plannedNotes : "",
          seeds: Array.isArray(config.seeds) ? config.seeds : [],
        });
      }
      setHighlightSettingsSuccess("Highlight-Einstellungen gespeichert.");
    } catch (error) {
      setHighlightSettingsSaveError(
        error instanceof Error ? error.message : "Einstellungen konnten nicht gespeichert werden.",
      );
    } finally {
      setHighlightSettingsSaving(false);
    }
  }, [highlightSettings]);

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
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Startseiten-Highlights</h2>
              <p className="text-sm text-gray-500">
                Steuere, ob „Beliebte Samen“ angezeigt werden und passe Inhalte manuell an.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadHighlightSettings}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={highlightSettingsLoading}
              >
                Neu laden
              </button>
            </div>
          </div>

          {highlightSettingsError && (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {highlightSettingsError}
            </p>
          )}
          {highlightSettingsSaveError && (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {highlightSettingsSaveError}
            </p>
          )}
          {highlightSettingsSuccess && (
            <p className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {highlightSettingsSuccess}
            </p>
          )}

          {highlightSettingsLoading ? (
            <p className="text-sm text-gray-500">Lade Highlight-Einstellungen …</p>
          ) : highlightSettings ? (
            <div className="space-y-5">
              <label className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    „Beliebte Samen“ für Besucher anzeigen
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={highlightSettings.showSeeds}
                    onChange={(event) => handleHighlightVisibilityToggle(event.target.checked)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Wenn deaktiviert, sehen nur Admins diese Sektion. Besucher bekommen keine Samen-Highlights
                  auf der Startseite.
                </span>
              </label>

              <label className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    Supporter-Hinweisbox auf der Startseite anzeigen
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={highlightSettings.showSupportCTA}
                    onChange={(event) => handleSupportCtaToggle(event.target.checked)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Schaltet den Button „Du möchtest PhenoHub unterstützen?“ ein oder aus. Damit kannst du
                  die Supporter-Box bei Bedarf für Besucher ausblenden.
                </span>
              </label>

              <label className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    Community-Tab im Header anzeigen
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={highlightSettings.showCommunityNav}
                    onChange={(event) => handleCommunityNavToggle(event.target.checked)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Entfernt den „💬 Community“-Link aus der Navigation, wenn du die Community-Seite temporär
                  ausblenden möchtest.
                </span>
              </label>

              <label className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    Community-Feedback auf der Startseite anzeigen
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={highlightSettings.showCommunityFeedback}
                    onChange={(event) => handleCommunityFeedbackToggle(event.target.checked)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Blendet die Box „Was wir als Nächstes angehen“ inklusive Community-Kommentare für Besucher ein oder aus.
                </span>
              </label>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <label className="flex flex-col gap-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Geplante Bereiche & Hinweise (Startseite)
                  </span>
                  <span className="text-xs text-gray-500">
                    Beschreibe kurz, welche Features bald kommen (z.&nbsp;B. „Beliebte Samen“, „Apotheken-Sorten“).
                    Jede neue Zeile wird auf der Startseite als eigener Punkt angezeigt.
                  </span>
                  <textarea
                    value={highlightSettings.plannedNotes}
                    onChange={(event) => handlePlannedNotesChange(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder={"Beliebte Samen\nApotheken-Sorten"}
                  />
                </label>
              </div>

              <div className="space-y-4">
                {highlightSettings.seeds.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Noch keine Samen hinterlegt. Füge Einträge hinzu, um die Highlights manuell zu befüllen.
                  </p>
                ) : (
                  highlightSettings.seeds.map((seed, index) => (
                    <div
                      key={seed.id}
                      className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Seed #{index + 1}: {seed.name || "Unbenannt"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Zeigt Name, Breeder, Typ und Bilder in der „Beliebte Samen“-Sektion.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => moveSeedEntry(index, "up")}
                            disabled={index === 0}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nach oben
                          </button>
                          <button
                            onClick={() => moveSeedEntry(index, "down")}
                            disabled={index === highlightSettings.seeds.length - 1}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nach unten
                          </button>
                          <button
                            onClick={() => removeSeedEntry(index)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Name
                          </label>
                          <input
                            type="text"
                            value={seed.name}
                            onChange={(event) => handleSeedFieldChange(index, "name", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            placeholder="z. B. Amnesia Core Cut"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Breeder
                          </label>
                          <input
                            type="text"
                            value={seed.breeder}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "breeder", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            placeholder="z. B. Ripper Seeds"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Slug
                          </label>
                          <input
                            type="text"
                            value={seed.slug}
                            onChange={(event) => handleSeedFieldChange(index, "slug", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            placeholder="amnesia-core-cut"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Popularität (0–10)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={seed.popularity}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "popularity", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Typ
                          </label>
                          <select
                            value={seed.type}
                            onChange={(event) => handleSeedFieldChange(index, "type", event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                          >
                            <option value="Feminisiert">Feminisiert</option>
                            <option value="Regular">Regular</option>
                            <option value="Autoflower">Autoflower</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Blütezeit
                          </label>
                          <input
                            type="text"
                            value={seed.floweringTime}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "floweringTime", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            placeholder="z. B. 8–9 Wochen Indoor"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Ertrag
                          </label>
                          <input
                            type="text"
                            value={seed.yield}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "yield", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            placeholder="z. B. Hoch · 500 g/m²"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Genetik / Beschreibung
                          </label>
                          <textarea
                            value={seed.genetics}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "genetics", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            rows={2}
                            placeholder="Kurzbeschreibung der Genetik"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Vorschaubilder (ein Link pro Zeile)
                          </label>
                          <textarea
                            value={seed.thumbnails.join("\n")}
                            onChange={(event) =>
                              handleSeedFieldChange(index, "thumbnails", event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                            rows={3}
                            placeholder="https://…"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-green-200 hover:bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Community-Feedback verwalten
                    </h3>
                    <p className="text-xs text-gray-500">
                      Moderiere die Kommentare zur „Was wir als Nächstes angehen“-Sektion. Archivierte Einträge
                      bleiben intern erhalten, werden aber nicht öffentlich angezeigt.
                    </p>
                  </div>
                  <button
                    onClick={loadHighlightFeedbackEntries}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    disabled={highlightFeedbackLoading}
                  >
                    {highlightFeedbackLoading ? "Lade …" : "Feedback neu laden"}
                  </button>
                </div>

                {highlightFeedbackError && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {highlightFeedbackError}
                  </p>
                )}
                {highlightFeedbackSuccess && (
                  <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    {highlightFeedbackSuccess}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {highlightFeedbackLoading ? (
                    <p className="text-xs text-gray-500">Feedback-Einträge werden geladen …</p>
                  ) : highlightFeedbackEntries.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Noch keine Community-Kommentare vorhanden.
                    </p>
                  ) : (
                    highlightFeedbackEntries.map((entry) => {
                      const isBusy = highlightFeedbackActionIds.has(entry.id);
                      const createdLabel = new Date(entry.createdAt).toLocaleString("de-DE");
                      const isArchived = Boolean(entry.archivedAt);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-slate-950"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {entry.displayName}
                              </p>
                              <p className="text-xs text-gray-500">Erstellt am {createdLabel}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {isArchived && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                  Archiviert
                                </span>
                              )}
                              <button
                                onClick={() => void handleHighlightFeedbackArchive(entry.id, !isArchived)}
                                disabled={isBusy}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isArchived ? "Wiederherstellen" : "Archivieren"}
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Diesen Kommentar dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.",
                                    )
                                  ) {
                                    void handleHighlightFeedbackDelete(entry.id);
                                  }
                                }}
                                disabled={isBusy}
                                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Löschen
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                            {entry.body}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={addSeedEntry}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Seed hinzufügen
                </button>
                <button
                  onClick={handleSaveHighlightSettings}
                  disabled={highlightSettingsSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {highlightSettingsSaving ? "Speichere …" : "Einstellungen speichern"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Keine Einstellungen verfügbar.</p>
          )}
        </section>
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

  const previewUrl = useMemo(() => `/reports/${report.id}?preview=1`, [report.id]);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-10">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl sm:max-h-[90vh] sm:overflow-hidden">
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
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-200 px-3 py-1 font-semibold text-green-700 transition hover:border-green-300 hover:bg-green-50"
            >
              Vorschau in neuem Tab öffnen
            </a>
            {report.status !== "PUBLISHED" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 font-semibold text-yellow-800">
                Noch nicht freigeschaltet
              </span>
            )}
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <iframe
            src={previewUrl}
            title={`Report ${report.title} Vorschau`}
            className="h-[75vh] min-h-[420px] w-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
