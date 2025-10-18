"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MINIMUM_AGE } from "@/lib/ageGate";

type ConsentResponse = {
  redirectTo?: string;
};

export default function AgeCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnTo = useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo") ?? "/";
    return rawReturnTo.startsWith("/") ? rawReturnTo : "/";
  }, [searchParams]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/age-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as ConsentResponse;
      const target =
        typeof payload.redirectTo === "string" && payload.redirectTo.startsWith("/")
          ? payload.redirectTo
          : "/";

      router.replace(target);
      router.refresh();
    } catch (error) {
      console.error("[AGE_CONSENT_CONFIRM]", error);
      setErrorMessage("Die Bestätigung konnte nicht gespeichert werden. Bitte versuche es erneut.");
      setSubmitting(false);
    }
  }, [isSubmitting, returnTo, router]);

  const handleReject = useCallback(() => {
    const previousUrl = document.referrer;

    if (previousUrl && !previousUrl.startsWith(window.location.origin)) {
      window.location.href = previousUrl;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "https://www.google.de";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-6 text-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-400/80">
              Altersprüfung
            </p>
            <h1 className="text-3xl font-bold text-white">
              Bist du mindestens {MINIMUM_AGE} Jahre alt?
            </h1>
            <p className="text-sm text-slate-300">
              PhenoHub richtet sich ausschließlich an volljährige Nutzerinnen und Nutzer. Bitte
              bestätige, dass du mindestens {MINIMUM_AGE} Jahre alt bist.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Ja, ich bin 18 oder älter
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Nein, ich bin noch keine {MINIMUM_AGE}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Mit deiner Bestätigung setzen wir ein Cookie, damit die Abfrage beim nächsten Besuch
            nicht erneut erscheint. Weitere Informationen findest du in unseren Datenschutz-Hinweisen.
          </p>
        </div>
      </div>
    </main>
  );
}
