"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ChevronLeft, ExternalLink, Sparkles } from "lucide-react";

type ReportSummary = {
  id: number;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  likes: number;
  comments: number;
  images: string[];
};

type ProfilePayload = {
  username: string | null;
  displayName: string;
  suggestedUsername: string;
  role: string;
  status: string;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  reports: ReportSummary[];
};

const SettingsPage = () => {
  const { status } = useSession();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [username, setUsername] = useState("");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data?.user) {
          const payload: ProfilePayload = {
            username: data.user.username ?? null,
            displayName: data.user.displayName ?? data.user.username ?? "",
            suggestedUsername: data.user.suggestedUsername ?? "",
            role: data.user.role,
            status: data.user.status,
            verifiedAt: data.user.verifiedAt ?? null,
            lastLoginAt: data.user.lastLoginAt ?? null,
            reports: Array.isArray(data.user.reports) ? data.user.reports : [],
          };
          setProfile(payload);
          setReports(payload.reports);
          const initial = payload.username ?? payload.suggestedUsername ?? "";
          setUsername(initial);
          if (!payload.username && payload.suggestedUsername) {
            setMessage(`Wähle einen Nutzernamen – Vorschlag: ${payload.suggestedUsername}`);
          }
        }
      })
      .catch(() => {
        setError("Profil konnte nicht geladen werden.");
      })
      .finally(() => setLoading(false));
  }, [status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Speichern fehlgeschlagen.");
      }
      setMessage("Nutzername aktualisiert.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username,
              displayName: username,
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "Noch nicht veröffentlicht";
    try {
      return new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const badgeLabel = useMemo(() => {
    if (!profile) return null;
    if (profile.role === "OWNER") return "Owner";
    if (profile.role === "ADMIN") return "Admin";
    if (profile.role === "MODERATOR") return "Moderator";
    if (profile.role === "SUPPORTER") return "Supporter";
    if (profile.role === "VERIFIED") return "Verifiziert";
    return null;
  }, [profile]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Lade Session…</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold text-gray-900">Bitte anmelden</h1>
          <p className="text-sm text-gray-600">Du benötigst ein Konto, um deine Profildaten zu bearbeiten.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profil Einstellungen</h1>
            <p className="mt-1 text-sm text-gray-500">
              Wähle deinen Nutzernamen. Er erscheint in Kommentaren und bei deinen Beiträgen.
            </p>
            {profile?.displayName && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                Aktuell sichtbar als:{" "}
                <span className="font-semibold text-green-600">{profile.displayName}</span>
              </p>
            )}
            {badgeLabel && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                <Sparkles className="h-3 w-3" />
                {badgeLabel}
              </span>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zur Startseite
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-username" className="mb-1 block text-sm font-medium text-gray-700">
              Nutzername
            </label>
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="z. B. mygrowname"
            />
            <p className="mt-1 text-xs text-gray-400">
              3-20 Zeichen, erlaubt sind a-z, 0-9, Unterstrich, Punkt und Bindestrich.
            </p>
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{message}</div>}

          <button
            type="submit"
            disabled={loading || username.trim().length < 3}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:bg-green-400"
          >
            {loading ? "Speichern…" : "Änderungen speichern"}
          </button>
        </form>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Meine Beiträge</h2>
            <span className="text-xs text-gray-400">{reports.length} Einträge</span>
          </div>
          {reports.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Noch keine Reports eingereicht. Teile deinen ersten Grow über die Startseite.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {reports.map((report) => {
                const previewImage = report.images?.[0] ?? null;
                const statusLabel =
                  report.status === "PUBLISHED"
                    ? "Veröffentlicht"
                    : report.status === "PENDING"
                      ? "In Moderation"
                      : "Abgelehnt";
                const statusColor =
                  report.status === "PUBLISHED"
                    ? "text-green-600 bg-green-50"
                    : report.status === "REJECTED"
                      ? "text-rose-600 bg-rose-50"
                      : "text-amber-600 bg-amber-50";
                return (
                  <Link
                    key={report.id}
                    href={`/reports/${report.slug}`}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-4">
                      {previewImage ? (
                        <div className="relative hidden h-16 w-16 overflow-hidden rounded-xl sm:block">
                          <Image
                            src={`/api/image-proxy?url=${encodeURIComponent(previewImage)}`}
                            alt={report.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="hidden h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400 sm:flex">
                          Kein Bild
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-gray-900">{report.title}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Eingereicht am {formatDate(report.createdAt)}
                          {report.status === "PUBLISHED"
                            ? ` · veröffentlicht am ${formatDate(report.publishedAt)}`
                            : " · wartet auf Freigabe"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👍 {report.likes}</span>
                          <span>💬 {report.comments}</span>
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <ExternalLink className="h-3 w-3" />
                            ansehen
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
