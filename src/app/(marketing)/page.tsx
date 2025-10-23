"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Building2,
  Clock,
  ChevronRight,
  Droplets,
  FilePlus2,
  Info,
  Package,
  Search,
  Star,
  Sprout,
  TrendingUp,
} from "lucide-react";
import ReportCard from "@/components/ReportCard";
import ReportSubmissionPanel from "@/components/ReportSubmissionPanel";
import CultivarPreviewModal from "@/components/CultivarPreviewModal";
import AboutModal from "@/components/AboutModal";
import ReportsHighlightsModal from "@/components/ReportsHighlightsModal";
import CultivarHighlightsModal from "@/components/CultivarHighlightsModal";
import ProviderHighlightsModal from "@/components/ProviderHighlightsModal";
import SeedHighlightsModal from "@/components/SeedHighlightsModal";
import ThumbnailCell from "@/components/ThumbnailCell";
import type { Cultivar, Provider, Report, Seed } from "@/types/domain";

type SearchFilter = "all" | "cultivars" | "providers" | "reports";

type SearchResult =
  | { type: "cultivar"; item: Cultivar }
  | { type: "provider"; item: Provider }
  | { type: "report"; item: Report };

type Highlights = {
  cultivars: Cultivar[];
  providers: Provider[];
  reports: Report[];
  seeds: Seed[];
  seedsEnabled?: boolean;
  supportCtaEnabled?: boolean;
  plannedNotes?: string;
  showCommunityFeedback?: boolean;
  showCommunityNav?: boolean;
};

type PlannedFeedbackEntry = {
  id: number;
  body: string;
  displayName: string;
  createdAt: string;
  archivedAt: string | null;
};

const EMPTY_RESULTS: Highlights = {
  cultivars: [],
  providers: [],
  reports: [],
  seeds: [],
  seedsEnabled: true,
  supportCtaEnabled: true,
  plannedNotes: "",
  showCommunityFeedback: true,
  showCommunityNav: true,
};

const filters: { key: SearchFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "cultivars", label: "Stecklinge" },
  { key: "providers", label: "Anbieter" },
  { key: "reports", label: "Berichte" },
];

const StecklingsIndex = () => {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated" && Boolean(session?.user);
  const router = useRouter();
  const pathname = usePathname();
  const loginHref = useMemo(() => `/login?callbackUrl=${encodeURIComponent(pathname ?? "/")}`, [pathname]);
  const userRole = useMemo(() => {
    if (!session?.user) return null;
    const { role } = session.user as { role?: string | null };
    return role ?? null;
  }, [session?.user]);
  const isOwner = userRole === "OWNER";
  const userHandle = useMemo(() => {
    if (!session?.user) return null;
    const { username, name } = session.user as {
      username?: string | null;
      name?: string | null;
    };
    return (username && username.trim().length > 0 ? username : name) ?? null;
  }, [session?.user]);

  const handleSignOut = useCallback(() => {
    void signOut({ callbackUrl: "/" });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSubmissionOpen, setSubmissionOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isReportsModalOpen, setReportsModalOpen] = useState(false);
  const [isCultivarModalOpen, setCultivarModalOpen] = useState(false);
  const [isProvidersModalOpen, setProvidersModalOpen] = useState(false);
  const [isSeedsModalOpen, setSeedsModalOpen] = useState(false);
  const [previewCultivarSlug, setPreviewCultivarSlug] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [highlights, setHighlights] = useState<Highlights>(EMPTY_RESULTS);
  const [isHighlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Highlights>(EMPTY_RESULTS);
  const [isSearchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [plannedFeedback, setPlannedFeedback] = useState<PlannedFeedbackEntry[]>([]);
  const [plannedFeedbackLoading, setPlannedFeedbackLoading] = useState(true);
  const [plannedFeedbackError, setPlannedFeedbackError] = useState<string | null>(null);
  const [newPlannedFeedback, setNewPlannedFeedback] = useState("");
  const [isSubmittingPlannedFeedback, setSubmittingPlannedFeedback] = useState(false);
  const [plannedFeedbackSuccess, setPlannedFeedbackSuccess] = useState<string | null>(null);
  const [plannedFeedbackActionIds, setPlannedFeedbackActionIds] = useState<Set<number>>(
    () => new Set<number>(),
  );
  const [isImprintOpen, setImprintOpen] = useState(false);
  const [isPrivacyOpen, setPrivacyOpen] = useState(false);
  const [isTermsOpen, setTermsOpen] = useState(false);

  const formatPrice = useCallback((price?: number | null) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(price);
  }, []);

  const renderOfferingBadges = useCallback(
    (offerings?: Cultivar["offerings"]) => {
      const displayOfferings =
        (offerings ?? []).filter((offering) => offering.providerName).slice(0, 2);
      if (displayOfferings.length === 0) return null;
      return (
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-gray-500 dark:text-slate-400">
          {displayOfferings.map((offering) => {
            const priceLabel = formatPrice(offering.priceEur);
            return (
              <span
                key={`${offering.providerSlug ?? offering.providerName}`}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <Building2 className="h-3 w-3 text-green-600 dark:text-sky-300" />
                <span className="font-semibold">{offering.providerName}</span>
                {priceLabel && (
                  <>
                    <span>·</span>
                    <span>{priceLabel}</span>
                  </>
                )}
              </span>
            );
          })}
        </div>
      );
    },
    [formatPrice],
  );

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    if (
      isAboutOpen ||
      isSubmissionOpen ||
      previewCultivarSlug ||
      isReportsModalOpen ||
      isCultivarModalOpen ||
      isProvidersModalOpen ||
      isSeedsModalOpen ||
      isImprintOpen ||
      isPrivacyOpen ||
      isTermsOpen
    ) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [
    isAboutOpen,
    isSubmissionOpen,
    previewCultivarSlug,
    isReportsModalOpen,
    isCultivarModalOpen,
    isProvidersModalOpen,
    isSeedsModalOpen,
    isImprintOpen,
    isPrivacyOpen,
    isTermsOpen,
  ]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        setHighlightsLoading(true);
        setHighlightsError(null);
        const response = await fetch("/api/highlights", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        const data = (await response.json()) as Highlights;
        if (!isActive) return;
        setHighlights({
          cultivars: Array.isArray(data.cultivars) ? data.cultivars : [],
          providers: Array.isArray(data.providers) ? data.providers : [],
          reports: Array.isArray(data.reports) ? data.reports : [],
          seeds: Array.isArray(data.seeds) ? data.seeds : [],
          seedsEnabled:
            typeof data.seedsEnabled === "boolean"
              ? data.seedsEnabled
              : Array.isArray(data.seeds) && data.seeds.length > 0,
          supportCtaEnabled:
            typeof data.supportCtaEnabled === "boolean" ? data.supportCtaEnabled : true,
          plannedNotes: typeof data.plannedNotes === "string" ? data.plannedNotes : "",
          showCommunityFeedback:
            typeof data.showCommunityFeedback === "boolean" ? data.showCommunityFeedback : true,
          showCommunityNav:
            typeof data.showCommunityNav === "boolean" ? data.showCommunityNav : true,
        });
      } catch (error) {
        console.error("[MARKETING_HIGHLIGHTS]", error);
        if (isActive) {
          setHighlightsError("Highlights konnten nicht geladen werden.");
          setHighlights(EMPTY_RESULTS);
        }
      } finally {
        if (isActive) {
          setHighlightsLoading(false);
        }
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  const normalizePlannedFeedback = useCallback((entry: unknown): PlannedFeedbackEntry | null => {
    if (!entry || typeof entry !== "object") return null;
    const record = entry as Record<string, unknown>;
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

    const displayNameRaw =
      (typeof record.displayName === "string" && record.displayName.trim().length > 0
        ? record.displayName
        : typeof record.authorName === "string" && record.authorName.trim().length > 0
          ? record.authorName
          : "Community-Mitglied") ?? "Community-Mitglied";

    const createdAt =
      typeof record.createdAt === "string" && record.createdAt.length > 0
        ? record.createdAt
        : new Date().toISOString();

    const archivedRaw = record.archivedAt;
    const archivedAt =
      archivedRaw instanceof Date
        ? archivedRaw.toISOString()
        : typeof archivedRaw === "string" && archivedRaw.length > 0
          ? archivedRaw
          : null;

    if (archivedAt) {
      return null;
    }

    return {
      id,
      body,
      displayName: displayNameRaw.trim(),
      createdAt,
      archivedAt,
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        setPlannedFeedbackLoading(true);
        setPlannedFeedbackError(null);
        setPlannedFeedbackSuccess(null);
        const response = await fetch("/api/highlight-feedback?limit=40", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        const data = (await response.json()) as { feedback?: unknown };
        if (!isActive) return;
        const entries = Array.isArray(data.feedback)
          ? (data.feedback
              .map((item) => normalizePlannedFeedback(item))
              .filter((item): item is PlannedFeedbackEntry => Boolean(item)) as PlannedFeedbackEntry[])
          : [];
        setPlannedFeedback(entries);
      } catch (error) {
        console.error("[HIGHLIGHT_FEEDBACK_FETCH]", error);
        if (isActive) {
          setPlannedFeedbackError("Community-Feedback konnte nicht geladen werden.");
          setPlannedFeedback([]);
        }
      } finally {
        if (isActive) {
          setPlannedFeedbackLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [normalizePlannedFeedback]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(EMPTY_RESULTS);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError(null);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Search failed with ${response.status}`);
        }
        return response.json();
      })
      .then((data: Highlights) => {
        setSearchResults({
          cultivars: Array.isArray(data.cultivars) ? data.cultivars : [],
          providers: Array.isArray(data.providers) ? data.providers : [],
          reports: Array.isArray(data.reports) ? data.reports : [],
          seeds: Array.isArray(data.seeds) ? data.seeds : [],
          seedsEnabled:
            typeof data.seedsEnabled === "boolean"
              ? data.seedsEnabled
              : Array.isArray(data.seeds) && data.seeds.length > 0,
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error("[MARKETING_SEARCH]", error);
        setSearchError("Suche derzeit nicht verfügbar.");
        setSearchResults(EMPTY_RESULTS);
      })
      .finally(() => {
        setSearchLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const filteredResults = debouncedQuery.trim() ? searchResults : EMPTY_RESULTS;

  const allResults = useMemo(() => {
    const results: SearchResult[] = [];
    if (activeFilter === "all" || activeFilter === "cultivars") {
      filteredResults.cultivars.forEach((item) =>
        results.push({ type: "cultivar", item }),
      );
    }
    if (activeFilter === "all" || activeFilter === "providers") {
      filteredResults.providers.forEach((item) =>
        results.push({ type: "provider", item }),
      );
    }
    if (activeFilter === "all" || activeFilter === "reports") {
      filteredResults.reports.forEach((item) =>
        results.push({ type: "report", item }),
      );
    }
    return results;
  }, [activeFilter, filteredResults]);

  const hasResults = allResults.length > 0;

  const handleResultClick = useCallback(
    (type: SearchResult["type"], item: SearchResult["item"]) => {
      if (type === "cultivar") {
        setPreviewCultivarSlug((item as Cultivar).slug);
        return;
      }
      if (type === "provider") {
        window.location.href = `/providers/${(item as Provider).slug}`;
        return;
      }
      window.location.href = `/reports/${(item as Report).id}`;
    },
    [],
  );

  const keyHandler = useCallback(
    (event: KeyboardEvent) => {
      if (!hasResults) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (event.key === "Enter" && selectedIndex >= 0) {
        event.preventDefault();
        const result = allResults[selectedIndex];
        handleResultClick(result.type, result.item);
      } else if (event.key === "Escape") {
        setSearchQuery("");
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
      }
    },
    [allResults, handleResultClick, hasResults, selectedIndex],
  );

  useEffect(() => {
    if (!searchQuery) return undefined;

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [keyHandler, searchQuery]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery, activeFilter]);

  const topCultivars = useMemo(() => {
    const withReports = highlights.cultivars.filter((cultivar) => cultivar.reportCount > 0);
    const base = withReports.length > 0 ? withReports : highlights.cultivars;
    return [...base].sort((a, b) => b.reportCount - a.reportCount).slice(0, 6);
  }, [highlights.cultivars]);
  const topProviders = useMemo(
    () => highlights.providers.slice(0, 6),
    [highlights.providers],
  );
  const recentReports = useMemo(
    () => highlights.reports.slice(0, 6),
    [highlights.reports],
  );
  const seedsEnabled = highlights.seedsEnabled ?? highlights.seeds.length > 0;
  const supportCtaEnabled =
    typeof highlights.supportCtaEnabled === "boolean" ? highlights.supportCtaEnabled : true;
  const communityNavEnabled =
    typeof highlights.showCommunityNav === "boolean" ? highlights.showCommunityNav : true;
  const communityFeedbackEnabled =
    typeof highlights.showCommunityFeedback === "boolean"
      ? highlights.showCommunityFeedback
      : true;
  const plannedItems = useMemo(() => {
    const note = (highlights.plannedNotes ?? "").trim();
    if (!note) return [];
    return note.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  }, [highlights.plannedNotes]);

  const formatPlannedFeedbackTimestamp = useCallback((iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }, []);

  const handleSubmitPlannedFeedback = useCallback(async () => {
    const content = newPlannedFeedback.trim();
    if (content.length === 0 || isSubmittingPlannedFeedback) {
      return;
    }

    if (!isAuthenticated) {
      setPlannedFeedbackError("Bitte melde dich an, um Feedback zu senden.");
      const callbackUrl = encodeURIComponent(pathname ?? "/");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    try {
      setSubmittingPlannedFeedback(true);
      setPlannedFeedbackError(null);
      setPlannedFeedbackSuccess(null);
      const response = await fetch("/api/highlight-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: content }),
      });

      if (response.status === 401) {
        setPlannedFeedbackError("Bitte melde dich an, um Feedback zu senden.");
        const callbackUrl = encodeURIComponent(pathname ?? "/");
        router.push(`/login?callbackUrl=${callbackUrl}`);
        setSubmittingPlannedFeedback(false);
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        const errorMessage =
          typeof result?.error === "string" && result.error.length > 0
            ? result.error
            : "Feedback konnte nicht gespeichert werden.";
        throw new Error(errorMessage);
      }

      const entry = normalizePlannedFeedback(result?.feedback);
      if (entry) {
        setPlannedFeedback((previous) => [entry, ...previous].slice(0, 40));
      }
      setNewPlannedFeedback("");
      setPlannedFeedbackSuccess("Dein Feedback wurde gespeichert.");
    } catch (error) {
      console.error("[HIGHLIGHT_FEEDBACK_SUBMIT]", error);
      setPlannedFeedbackError(
        error instanceof Error ? error.message : "Feedback konnte nicht gespeichert werden.",
      );
    } finally {
      setSubmittingPlannedFeedback(false);
    }
  }, [
    isAuthenticated,
    isSubmittingPlannedFeedback,
    newPlannedFeedback,
    normalizePlannedFeedback,
    pathname,
    router,
  ]);

  const handleArchivePlannedFeedback = useCallback(
    async (id: number, archived: boolean) => {
      if (!isOwner) return;
      setPlannedFeedbackActionIds((previous) => {
        const next = new Set(previous);
        next.add(id);
        return next;
      });
      setPlannedFeedbackError(null);
      setPlannedFeedbackSuccess(null);
      try {
        const response = await fetch(`/api/admin/highlight-feedback/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "Aktion konnte nicht ausgeführt werden.");
        }
        if (archived) {
          setPlannedFeedback((previous) => previous.filter((item) => item.id !== id));
          setPlannedFeedbackSuccess("Kommentar wurde archiviert und verschwindet von der Seite.");
        } else {
          const entry = normalizePlannedFeedback(result?.feedback);
          if (entry) {
            setPlannedFeedback((previous) => {
              const others = previous.filter((item) => item.id !== entry.id);
              return [entry, ...others];
            });
          }
          setPlannedFeedbackSuccess("Kommentar wurde wiederhergestellt.");
        }
      } catch (error) {
        console.error("[HIGHLIGHT_FEEDBACK_ARCHIVE]", error);
        setPlannedFeedbackError(
          error instanceof Error ? error.message : "Kommentar konnte nicht aktualisiert werden.",
        );
      } finally {
        setPlannedFeedbackActionIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    },
    [isOwner, normalizePlannedFeedback],
  );

  const handleDeletePlannedFeedback = useCallback(
    async (id: number) => {
      if (!isOwner) return;
      setPlannedFeedbackActionIds((previous) => {
        const next = new Set(previous);
        next.add(id);
        return next;
      });
      setPlannedFeedbackError(null);
      setPlannedFeedbackSuccess(null);
      try {
        const response = await fetch(`/api/admin/highlight-feedback/${id}`, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 204) {
          const result = await response.json();
          throw new Error(result?.error || "Kommentar konnte nicht gelöscht werden.");
        }
        setPlannedFeedback((previous) => previous.filter((item) => item.id !== id));
        setPlannedFeedbackSuccess("Kommentar wurde gelöscht.");
      } catch (error) {
        console.error("[HIGHLIGHT_FEEDBACK_DELETE]", error);
        setPlannedFeedbackError(
          error instanceof Error ? error.message : "Kommentar konnte nicht gelöscht werden.",
        );
      } finally {
        setPlannedFeedbackActionIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    },
    [isOwner],
  );
  const topSeeds = useMemo(() => {
    if (!seedsEnabled) return [];
    return [...highlights.seeds].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  }, [highlights.seeds, seedsEnabled]);
  const showReportHighlights =
    activeFilter === "all" || activeFilter === "reports";
  const showCultivarHighlights =
    activeFilter === "all" || activeFilter === "cultivars";
  const showSeedHighlights =
    seedsEnabled && (activeFilter === "all" || activeFilter === "cultivars");
  const showProviderHighlights =
    activeFilter === "all" || activeFilter === "providers";
  const cultivarsLookup = useMemo(() => {
    const map = new Map<string, Cultivar>();
    highlights.cultivars.forEach((cultivar) => map.set(cultivar.slug, cultivar));
    searchResults.cultivars.forEach((cultivar) => {
      if (!map.has(cultivar.slug)) {
        map.set(cultivar.slug, cultivar);
      }
    });
    return map;
  }, [highlights.cultivars, searchResults.cultivars]);

  const allKnownReports = useMemo(() => {
    const map = new Map<number, Report>();
    highlights.reports.forEach((report) => map.set(report.id, report));
    searchResults.reports.forEach((report) => {
      if (!map.has(report.id)) {
        map.set(report.id, report);
      }
    });
    return Array.from(map.values());
  }, [highlights.reports, searchResults.reports]);

  const previewCultivar = useMemo(
    () => (previewCultivarSlug ? cultivarsLookup.get(previewCultivarSlug) ?? null : null),
    [cultivarsLookup, previewCultivarSlug],
  );

  const previewReports = useMemo(
    () =>
      previewCultivarSlug
        ? allKnownReports
            .filter((report) => report.cultivarSlug === previewCultivarSlug)
            .slice(0, 6)
        : [],
    [allKnownReports, previewCultivarSlug],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-green-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <header className="sticky top-0 z-50 border-b bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-900/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-green-700 transition-colors hover:text-green-800 dark:text-sky-200 dark:hover:text-sky-100"
          >
            🌱 PhenoHub
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
            {communityNavEnabled && (
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-green-50 via-white to-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:from-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:border dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800 dark:hover:text-sky-100"
              >
                💬 Community
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {userHandle && (
                  <span className="hidden text-xs text-gray-500 md:inline dark:text-slate-300">
                    {userHandle}
                  </span>
                )}
                <Link
                  href="/settings"
                  className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800"
                >
                  Profil
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:border-red-500/60 dark:bg-slate-900/80 dark:text-red-300 dark:hover:bg-slate-800"
                >
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-slate-800"
                >
                  Registrieren
                </Link>
              </>
            )}

            <button
              onClick={() => setAboutOpen(true)}
              className="inline-flex items-center rounded-xl bg-green-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              Über PhenoHub
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-8 pt-10">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-5xl font-bold leading-tight text-green-700 md:text-6xl dark:text-sky-100">
            Endlich Schluss mit Suchen.
          </h1>
          <p className="mb-4 text-2xl font-medium text-gray-700 dark:text-slate-200">
            Bevor dein Grow startet, weißt du schon, was dich erwartet.
          </p>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-slate-300">
            Vergleichsfotos, echte Erfahrungen und Bewertungen – alles an einem Ort.
          </p>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-300">
            Finde Sorten, Anbieter und Erfahrungen in Sekunden.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedIndex(-1);
                }}
                placeholder="Suche nach Sorte oder Anbieter – z. B. Amnesia Core Cut, Flowery Field..."
                className="w-full rounded-2xl border-2 border-gray-200 py-5 pl-14 pr-4 text-lg text-gray-900 shadow-sm transition-all placeholder:text-gray-500 hover:shadow-md focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:shadow-lg dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
                aria-label="Suche"
                role="combobox"
                aria-expanded={Boolean(searchQuery)}
                aria-controls="search-results"
              />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    setActiveFilter(filter.key);
                    setSelectedIndex(-1);
                  }}
                  className={`whitespace-nowrap rounded-xl px-5 py-2.5 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${activeFilter === filter.key ? "bg-green-600 text-white shadow-md dark:bg-sky-500" : "border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"}`}
                  aria-pressed={activeFilter === filter.key}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {searchQuery && (
              <div
                id="search-results"
                role="listbox"
                className="mt-4 max-h-[500px] overflow-y-auto rounded-2xl border-2 border-gray-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/70"
              >
                {isSearchLoading ? (
                  <div className="flex items-center justify-center gap-3 p-8 text-sm text-gray-600 dark:text-slate-300">
                    <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                    Suche läuft …
                  </div>
                ) : searchError ? (
                  <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">
                    {searchError}
                  </div>
                ) : !hasResults ? (
                  <div className="p-12 text-center">
                    <div className="mb-4 text-6xl">🔍</div>
                  <p className="text-lg text-gray-600">
                    Noch keine Treffer. Probier „Amnesia Core Cut“, „Papaya Punch“
                    oder „Flowery Field“.
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    {(activeFilter === "all" || activeFilter === "cultivars") &&
                      filteredResults.cultivars.length > 0 && (
                        <div className="mb-6">
                          <h3 className="mb-3 px-2 text-sm font-bold uppercase text-gray-500">
                            Sorten
                          </h3>
                          <div className="space-y-2">
                            {filteredResults.cultivars.map((cultivar) => {
                              const globalIdx = allResults.findIndex(
                                (result) =>
                                  result.type === "cultivar" &&
                                  result.item.id === cultivar.id,
                              );
                              return (
                                <button
                                  key={cultivar.id}
                                  role="option"
                                  aria-selected={selectedIndex === globalIdx}
                                  onClick={() =>
                                    handleResultClick("cultivar", cultivar)
                                  }
                                className={`w-full rounded-xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedIndex === globalIdx ? "border-2 border-green-500 bg-green-50 shadow-md dark:border-sky-500 dark:bg-slate-800" : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-3">
                                        <h4 className="text-lg font-bold text-gray-900">
                                          {cultivar.name}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                          <span className="font-semibold text-gray-900">
                                            {cultivar.avgRating}
                                          </span>
                                        </div>
                                      </div>
                                      {cultivar.aka.length > 0 && (
                                        <div className="mb-2 text-sm text-gray-500">
                                          aka {cultivar.aka.join(", ")}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-2">
                                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                          {cultivar.reportCount} Berichte
                                        </span>
                                        <span className="flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                          📸 {cultivar.imageCount} Bilder
                                        </span>
                                        {cultivar.cloneOnly && (
                                          <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                            Clone-Only
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-2 flex gap-1">
                                        {cultivar.thumbnails.slice(0, 6).map((thumb, index) => (
                                          <ThumbnailCell
                                            key={index}
                                            value={thumb}
                                            alt={`${cultivar.name} Vorschau ${index + 1}`}
                                            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-green-100 text-sm dark:bg-slate-800"
                                            imgClassName="h-full w-full object-cover"
                                          />
                                        ))}
                                      </div>
                                      {renderOfferingBadges(cultivar.offerings)}
                                    </div>
                                    <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-slate-500" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {(activeFilter === "all" || activeFilter === "providers") &&
                      filteredResults.providers.length > 0 && (
                        <div className="mb-6">
                          <h3 className="mb-3 px-2 text-sm font-bold uppercase text-gray-500">
                            Anbieter
                          </h3>
                          <div className="space-y-2">
                            {filteredResults.providers.map((provider) => {
                              const globalIdx = allResults.findIndex(
                                (result) =>
                                  result.type === "provider" &&
                                  result.item.id === provider.id,
                              );
                              return (
                                <button
                                  key={provider.id}
                                  role="option"
                                  aria-selected={selectedIndex === globalIdx}
                                  onClick={() =>
                                    handleResultClick("provider", provider)
                                  }
                                className={`w-full rounded-xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedIndex === globalIdx ? "border-2 border-green-500 bg-green-50 shadow-md dark:border-sky-500 dark:bg-slate-800" : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-3">
                                        <h4 className="text-lg font-bold text-gray-900">
                                          {provider.name}
                                        </h4>
                                        <span className="text-2xl">
                                          {provider.countryFlag}
                                        </span>
                                      </div>
                                      <div className="mb-2 flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                          <span className="font-bold text-gray-900">
                                            {provider.avgScore}
                                          </span>
                                          <span className="text-sm text-gray-500">
                                            Gesamt
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Package className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm font-medium">
                                            {provider.shippingScore}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Droplets className="h-4 w-4 text-green-600" />
                                          <span className="text-sm font-medium">
                                            {provider.vitalityScore}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {provider.reportCount} Berichte
                                      </span>
                                    </div>
                                    <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-slate-500" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {(activeFilter === "all" || activeFilter === "reports") &&
                      filteredResults.reports.length > 0 && (
                        <div>
                          <h3 className="mb-3 px-2 text-sm font-bold uppercase text-gray-500">
                            Berichte
                          </h3>
                          <div className="space-y-2">
                            {filteredResults.reports.map((report) => {
                              const globalIdx = allResults.findIndex(
                                (result) =>
                                  result.type === "report" &&
                                  result.item.id === report.id,
                              );
                              return (
                                <button
                                  key={report.id}
                                  role="option"
                                  aria-selected={selectedIndex === globalIdx}
                                  onClick={() =>
                                    handleResultClick("report", report)
                                  }
                                className={`w-full rounded-xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedIndex === globalIdx ? "border-2 border-green-500 bg-green-50 shadow-md dark:border-sky-500 dark:bg-slate-800" : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="flex gap-1">
                                      {report.images.slice(0, 4).map((img, index) => (
                                        <ThumbnailCell
                                          key={index}
                                          value={img}
                                          alt={`${report.title} Bild ${index + 1}`}
                                          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-green-100 text-2xl dark:bg-slate-800"
                                          imgClassName="h-full w-full object-cover"
                                        />
                                      ))}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="mb-1 line-clamp-1 font-bold text-gray-900">
                                        {report.title}
                                      </h4>
                                      <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                        {report.excerpt}
                                      </p>
                                      <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="font-medium text-green-700">
                                          {report.cultivar}
                                        </span>
                                        <span>•</span>
                                        <span>{report.provider}</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                          <span className="font-semibold text-gray-900">
                                            {report.overall}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-slate-500" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="flex-none rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-100/80 p-6 shadow-lg shadow-green-100/60 ring-1 ring-green-100/40 lg:w-80 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/60 dark:ring-slate-800/60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-slate-800 dark:text-sky-300">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Neuer Bericht
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Teile Bilder, Setup und dein Fazit mit der Community.
                </p>
              </div>
            </div>

            <ul className="mb-5 space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <li>• Upload von Bildern und Vergleichsfotos</li>
              <li>• Angaben zu Setup, Lampe und Zeltgröße</li>
              <li>• Verknüpfung mit Sorte & Anbieter</li>
            </ul>

            <button
              onClick={() => setSubmissionOpen(true)}
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            >
              Bericht einreichen
            </button>

            <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
              Du wirst durch alle Schritte geführt.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4">
        {highlightsError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-950/30 dark:text-red-200">
            {highlightsError}
          </div>
        )}
        {isHighlightsLoading && !highlightsError && topCultivars.length === 0 && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700 dark:border-sky-500/40 dark:bg-slate-900/60 dark:text-sky-200">
            Highlights werden geladen …
          </div>
        )}
        {showReportHighlights && (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-sky-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  Neueste Berichte
                </h2>
              </div>
              <button
                onClick={() => setReportsModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-800"
              >
                Alle <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
              {recentReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}

        {showCultivarHighlights && (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-sky-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  Beliebte Stecklinge
                </h2>
              </div>
              <button
                onClick={() => setCultivarModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-800"
              >
                Alle <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
              {topCultivars.map((cultivar) => {
                const previewImages = (cultivar.recentImages?.length
                  ? cultivar.recentImages
                  : cultivar.thumbnails
                ).slice(0, 6);

                return (
                  <button
                    key={cultivar.id}
                    type="button"
                    onClick={() => setPreviewCultivarSlug(cultivar.slug)}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-all hover:border-green-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500"
                  >
                    <div className="grid grid-cols-3 gap-0.5 bg-gray-50 p-0.5 dark:bg-slate-800/80">
                      {previewImages.length > 0 ? (
                        previewImages.map((thumb, index) => (
                          <ThumbnailCell
                            key={index}
                            value={thumb}
                            alt={`${cultivar.name} Bild ${index + 1}`}
                            className="flex aspect-square items-center justify-center overflow-hidden rounded bg-green-100 text-xs dark:bg-slate-900/70"
                            imgClassName="h-full w-full object-cover"
                          />
                        ))
                      ) : (
                        <div className="col-span-3 flex aspect-[3/1] items-center justify-center rounded bg-green-100 text-xs font-semibold text-green-700 dark:bg-slate-900/70 dark:text-sky-200">
                          Keine Bilder vorhanden
                        </div>
                      )}
                    </div>
                  <div className="p-1.5">
                    <div className="mb-0.5 flex items-center gap-0.5">
                      <h3 className="flex-1 line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-slate-100 dark:group-hover:text-sky-300">
                        {cultivar.name}
                      </h3>
                      <span className="text-xs">🔥</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {cultivar.avgRating}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">·</span>
                      <span className="text-xs text-gray-600 dark:text-slate-300">
                        {cultivar.reportCount}
                      </span>
                    </div>
                    {renderOfferingBadges(cultivar.offerings)}
                  </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showSeedHighlights && topSeeds.length > 0 && (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-emerald-600 dark:text-sky-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  Beliebte Samen
                </h2>
              </div>
              <button
                onClick={() => setSeedsModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-800"
              >
                Alle <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
              {topSeeds.map((seed) => (
                <div
                  key={seed.id}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-all hover:border-green-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500"
                >
                  <div className="grid grid-cols-3 gap-0.5 bg-gray-50 p-0.5 dark:bg-slate-800/80">
                    {seed.thumbnails.slice(0, 6).map((thumb, index) => (
                      <ThumbnailCell
                        key={index}
                        value={thumb}
                        alt={`${seed.name} Thumbnail ${index + 1}`}
                        className="flex aspect-square items-center justify-center overflow-hidden rounded bg-emerald-100 text-xs dark:bg-slate-900/70"
                        imgClassName="h-full w-full object-cover"
                      />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-1.5">
                    <div className="mb-0.5 flex items-center justify-between gap-1">
                      <h3 className="line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-slate-100 dark:group-hover:text-sky-300">
                        {seed.name}
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-slate-800/70 dark:text-sky-200">
                        {seed.type}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-gray-500 dark:text-slate-400">
                      von {seed.breeder}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                        <Clock className="h-3 w-3" />
                        {seed.floweringTime}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                        <Package className="h-3 w-3" />
                        {seed.yield}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showProviderHighlights && (
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500 dark:text-amber-300" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  Top Anbieter
                </h2>
              </div>
              <button
                onClick={() => setProvidersModalOpen(true)}
                className="flex items-center gap-1 rounded-full border border-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-800"
              >
                Alle <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
              {topProviders.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/providers/${provider.slug}`}
                  className="group rounded-lg border border-gray-200 bg-white p-2 transition-all hover:border-green-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-sky-500"
                >
                  <div className="mb-1 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-0.5 line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-slate-100 dark:group-hover:text-sky-300">
                        {provider.name}
                      </h3>
                      <span className="text-base">{provider.countryFlag}</span>
                    </div>
                    <div className="ml-1 flex flex-shrink-0 items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        {provider.avgScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                    <Package className="h-2.5 w-2.5 text-blue-600" />
                    <span>{provider.shippingScore}</span>
                    <Droplets className="h-2.5 w-2.5 text-green-600" />
                    <span>{provider.vitalityScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {communityFeedbackEnabled && plannedItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4">
          <div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/70 p-6 shadow-sm backdrop-blur-sm dark:border-sky-500/60 dark:bg-slate-900/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-sky-200">
                  Was wir als Nächstes angehen
                </h3>
                <p className="text-sm text-emerald-800/80 dark:text-sky-300/80">
                  Wir planen diese Bereiche – und die Community entscheidet mit, was Priorität bekommt.
                </p>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-emerald-900/90 dark:text-sky-100 sm:grid-cols-2">
              {plannedItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-white/40 backdrop-blur-sm dark:bg-slate-950/40 dark:ring-slate-800/60"
                >
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400 dark:bg-sky-400" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-sky-500/40 dark:bg-slate-950/50">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-emerald-900 dark:text-sky-200">
                    Community-Feedback
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-sky-300/80">
                    Teile Ideen, Wünsche oder Ergänzungen – wir berücksichtigen alles bei der nächsten Planung.
                  </p>
                </div>
                {!isAuthenticated && (
                  <Link
                    href={loginHref}
                    className="mt-2 inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-sky-500/50 dark:text-sky-200 dark:hover:bg-slate-900/60"
                  >
                    Anmelden & mitdiskutieren
                  </Link>
                )}
              </div>
              {plannedFeedbackError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {plannedFeedbackError}
                </p>
              )}
              {plannedFeedbackSuccess && (
                <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  {plannedFeedbackSuccess}
                </p>
              )}
              <div className="mt-4 space-y-3">
                {plannedFeedbackLoading ? (
                  <p className="text-xs text-emerald-700/70 dark:text-sky-300/80">
                    Lade Community-Stimmen …
                  </p>
                ) : plannedFeedback.length === 0 ? (
                  <p className="text-xs text-emerald-700/80 dark:text-sky-300/80">
                    Noch keine Kommentare – starte gerne mit deinem Vorschlag!
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {plannedFeedback.map((entry) => {
                      const isBusy = plannedFeedbackActionIds.has(entry.id);
                      return (
                        <li
                          key={entry.id}
                          className="rounded-2xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-sky-500/40 dark:bg-slate-950/60"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="block font-semibold text-emerald-900 dark:text-sky-100">
                                {entry.displayName}
                              </span>
                              <span className="text-xs text-emerald-700/70 dark:text-sky-300/70">
                                {formatPlannedFeedbackTimestamp(entry.createdAt)}
                              </span>
                            </div>
                            {isOwner && (
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => void handleArchivePlannedFeedback(entry.id, true)}
                                  disabled={isBusy}
                                  className="rounded-lg border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-500/50 dark:text-sky-200 dark:hover:bg-slate-900/60"
                                >
                                  Archivieren
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Diesen Kommentar endgültig löschen?",
                                      )
                                    ) {
                                      void handleDeletePlannedFeedback(entry.id);
                                    }
                                  }}
                                  disabled={isBusy}
                                  className="rounded-lg border border-red-200 px-2.5 py-1 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/60 dark:text-red-300 dark:hover:bg-red-950/40"
                                >
                                  Löschen
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-line text-sm leading-snug text-emerald-900/90 dark:text-sky-100/90">
                            {entry.body}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {isAuthenticated && (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={newPlannedFeedback}
                    onChange={(event) => {
                      if (event.target.value.length <= 600) {
                        setNewPlannedFeedback(event.target.value);
                      } else {
                        setNewPlannedFeedback(event.target.value.slice(0, 600));
                      }
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-sky-500/40 dark:bg-slate-950 dark:text-sky-100"
                    placeholder="Deine Idee oder Anmerkung …"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-emerald-700/70 dark:text-sky-300/70">
                      {Math.max(0, 600 - newPlannedFeedback.length)} Zeichen übrig
                    </span>
                    <button
                      type="button"
                      onClick={handleSubmitPlannedFeedback}
                      disabled={
                        newPlannedFeedback.trim().length < 5 ||
                        isSubmittingPlannedFeedback ||
                        newPlannedFeedback.length === 0
                      }
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 dark:bg-sky-500 dark:hover:bg-sky-400 dark:disabled:bg-slate-700"
                    >
                      {isSubmittingPlannedFeedback ? "Speichere …" : "Feedback senden"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {supportCtaEnabled && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-green-200 bg-white/95 p-5 text-right shadow-lg shadow-green-100/40 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-slate-950/40">
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                Du möchtest PhenoHub unterstützen?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                Freiwilliges 3,99&nbsp;€ Supporter-Abo für Serverkosten &amp; neue Features.
              </p>
              <Link
                href="/support"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                ❤️ Mehr erfahren & eintragen
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-amber-200 bg-amber-50 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-sky-300" />
            <div>
              <p className="mb-3 text-gray-800 dark:text-slate-200">
                Diese Plattform dient ausschließlich der Dokumentation und
                Recherche. Kein Verkauf, keine Vermittlung. Inhalte stammen von
                Nutzern. Bitte beachte lokale Gesetze.
              </p>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setImprintOpen(true)}
                  className="text-green-700 underline transition-colors hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus:ring-sky-400"
                >
                  Impressum
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="text-green-700 underline transition-colors hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus:ring-sky-400"
                >
                  Datenschutz
                </button>
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="text-green-700 underline transition-colors hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus:ring-sky-400"
                >
                  Nutzungsbedingungen
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 py-8 text-gray-400 dark:bg-slate-950 dark:text-slate-500">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm">©️ 2025 PhenoHub. Alle Rechte vorbehalten.</p>
        </div>
      </footer>

      <ReportSubmissionPanel
        isOpen={isSubmissionOpen}
        onClose={() => setSubmissionOpen(false)}
        cultivars={highlights.cultivars}
        providers={highlights.providers}
      />
      <ReportsHighlightsModal
        isOpen={isReportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        reports={highlights.reports}
      />
      <CultivarHighlightsModal
        isOpen={isCultivarModalOpen}
        onClose={() => setCultivarModalOpen(false)}
        cultivars={highlights.cultivars}
      />
      <ProviderHighlightsModal
        isOpen={isProvidersModalOpen}
        onClose={() => setProvidersModalOpen(false)}
        providers={highlights.providers}
      />
      <SeedHighlightsModal
        isOpen={isSeedsModalOpen && seedsEnabled && highlights.seeds.length > 0}
        onClose={() => setSeedsModalOpen(false)}
        seeds={highlights.seeds}
      />
      {previewCultivar && (
        <CultivarPreviewModal
          cultivar={previewCultivar}
          reports={previewReports}
          onClose={() => setPreviewCultivarSlug(null)}
        />
      )}
      <AboutModal isOpen={isAboutOpen} onClose={() => setAboutOpen(false)} />
      {isImprintOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="imprint-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-green-100 bg-white/95 p-6 shadow-2xl shadow-green-200/40 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-sky-500/60 dark:text-sky-200">
                  Rechtliche Angaben
                </p>
                <h2 id="imprint-title" className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  Impressum
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setImprintOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Impressum schließen"
              >
                ×
              </button>
            </div>
            <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Betreiber</h3>
                <address className="mt-2 space-y-1 not-italic">
                  <p>PhenoHub – Andrej Petri</p>
                  <p>Straße des 17. Juni 12</p>
                  <p>10623 Berlin</p>
                  <p>Deutschland</p>
                </address>
              </section>
              <section className="space-y-2">
                <p>
                  <span className="font-semibold">Kontakt:</span>{" "}
                  <a
                    href="mailto:support@phenohub.app"
                    className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    support@phenohub.app
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Telefon:</span> +49 (0)30 1234 5678
                </p>
                <p>
                  <span className="font-semibold">USt-IdNr.:</span> DE&nbsp;123&nbsp;456&nbsp;789
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Verantwortlich für den Inhalt
                </h3>
                <p>
                  Andrej Petri (Anschrift wie oben). Anfragen zu Inhalten oder Rechtsverstößen bitte an{" "}
                  <a
                    href="mailto:legal@phenohub.app"
                    className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    legal@phenohub.app
                  </a>
                  .
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Haftungshinweise</h3>
                <p>
                  Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für externe Links. Für deren Inhalte
                  sind ausschließlich die Betreiber verantwortlich.
                </p>
                <p>
                  Alle Informationen auf PhenoHub dienen ausschließlich zu Dokumentations- und Recherchezwecken.
                  Nutzer müssen geltende Gesetze beachten.
                </p>
              </section>
              <p className="text-xs text-gray-500 dark:text-slate-400">Stand: Oktober 2025</p>
            </div>
          </div>
        </div>
      )}
      {isPrivacyOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-green-100 bg-white/95 p-6 shadow-2xl shadow-green-200/40 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-sky-500/60 dark:text-sky-200">
                  Datenschutz
                </p>
                <h2 id="privacy-title" className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  Datenschutzerklärung
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Datenschutzerklärung schließen"
              >
                ×
              </button>
            </div>
            <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">1. Verantwortlicher</h3>
                <p>
                  Andrej Petri, Straße des 17. Juni 12, 10623 Berlin, Deutschland. Kontakt:{" "}
                  <a
                    href="mailto:privacy@phenohub.app"
                    className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    privacy@phenohub.app
                  </a>
                  .
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">2. Verarbeitete Daten</h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Account-Daten (E-Mail, Benutzername, Rollenstatus, optionale Profildetails)</li>
                  <li>Nutzungsdaten (Server-Logs, IP-Adresse, Interaktionen mit Berichten und Kommentaren)</li>
                  <li>Inhaltsdaten (hochgeladene Bilder, Bewertungen, Community-Beiträge)</li>
                  <li>Zahlungsdaten über Stripe (Bestell-ID, Rechnungsstatus, keine vollständigen Zahlungsdetails)</li>
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">3. Zwecke & Rechtsgrundlagen</h3>
                <p>
                  Betrieb und Verbesserung (Art. 6 Abs. 1 lit. b DSGVO), berechtigte Interessen (lit. f),
                  gesetzliche Pflichten (lit. c) sowie Einwilligungen (lit. a) für Newsletter und Supporter-Infos.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">4. Empfänger</h3>
                <p>
                  Hosting (Render, Supabase), E-Mail (Resend) und Zahlungsabwicklung (Stripe). Auftragsverarbeitungsverträge
                  nach Art. 28 DSGVO sind abgeschlossen.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">5. Speicherdauer</h3>
                <p>
                  Speicherung nur solange wie nötig oder gesetzlich geboten. Kontolöschung auf Anfrage via{" "}
                  <a
                    href="mailto:privacy@phenohub.app"
                    className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    privacy@phenohub.app
                  </a>
                  .
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">6. Rechte</h3>
                <p>
                  Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Beschwerden
                  bei Aufsichtsbehörden möglich.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">7. Cookies & Tracking</h3>
                <p>
                  Notwendige Cookies sowie optionale Analyse-Tools (z.&nbsp;B. Plausible) nur mit Einwilligung; IPs werden anonymisiert.
                </p>
              </section>
              <p className="text-xs text-gray-500 dark:text-slate-400">Stand: Oktober 2025</p>
            </div>
          </div>
        </div>
      )}
      {isTermsOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-green-100 bg-white/95 p-6 shadow-2xl shadow-green-200/40 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-sky-500/60 dark:text-sky-200">
                  Nutzungsbedingungen
                </p>
                <h2 id="terms-title" className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  Allgemeine Geschäfts- und Nutzungsbedingungen
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Nutzungsbedingungen schließen"
              >
                ×
              </button>
            </div>
            <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">1. Geltungsbereich</h3>
                <p>
                  Diese Bedingungen gelten für alle Nutzer der Plattform. Mit Nutzung von PhenoHub stimmst du ihnen zu.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">2. Registrierung & Account</h3>
                <p>
                  Für Berichte, Kommentare und Supporter-Abos ist ein Account erforderlich. Halte deine Zugangsdaten geheim und informiere uns bei Missbrauch.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">3. Nutzerinhalte</h3>
                <p>
                  Lade nur Inhalte hoch, an denen du die Rechte besitzt. Du gewährst PhenoHub ein einfaches Nutzungsrecht zur Darstellung und Archivierung. Unzulässig sind diskriminierende, strafbare oder urheberrechtsverletzende Beiträge.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">4. Supporter-Abos</h3>
                <p>
                  Supporter-Abos werden über Stripe verwaltet, verlängern sich monatlich und sind jederzeit kündbar. Gesetzliche Widerrufsrechte bleiben bestehen.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">5. Haftung</h3>
                <p>
                  Inhalte werden ohne Gewähr bereitgestellt. Wir haften nicht für Richtigkeit oder Vollständigkeit. Anbauentscheidungen triffst du eigenverantwortlich.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">6. Kündigung & Sperrung</h3>
                <p>
                  Wir können Accounts bei Verstößen sperren oder löschen. Du kannst deinen Account jederzeit löschen lassen.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">7. Änderungen</h3>
                <p>
                  Wir behalten uns Anpassungen vor und informieren über wesentliche Änderungen. Die aktuelle Fassung steht immer hier bereit.
                </p>
              </section>
              <p className="text-xs text-gray-500 dark:text-slate-400">Stand: Oktober 2025</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StecklingsIndex;
