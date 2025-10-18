"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AGE_COOKIE_FULL, MINIMUM_AGE } from "@/lib/ageGate";

type ConsentResponse = {
  redirectTo?: string;
};

const hasAgeConsent = () => {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split("; ").some((item) => item.trim() === AGE_COOKIE_FULL);
};

const getReturnToFromPath = (pathname: string) => {
  if (!pathname || pathname === "/age-check") {
    return "/";
  }
  return pathname.startsWith("/") ? pathname : "/";
};

type AgeGateOverlayProps = {
  initialOpen?: boolean;
};

export default function AgeGateOverlay({ initialOpen }: AgeGateOverlayProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof initialOpen === "boolean") {
      return initialOpen;
    }
    return !hasAgeConsent();
  });
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnTo = useMemo(() => getReturnToFromPath(pathname ?? "/"), [pathname]);

  useEffect(() => {
    setIsOpen(!hasAgeConsent());
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;
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
      setIsOpen(false);

      if (payload?.redirectTo && payload.redirectTo.startsWith("/")) {
        router.replace(payload.redirectTo);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("[AGE_CONSENT_OVERLAY]", error);
      setErrorMessage("Deine Bestätigung konnte nicht gespeichert werden. Bitte versuche es erneut.");
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/85 backdrop-blur">
      <div className="mx-4 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center text-white">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-400/80">
              Altersprüfung
            </p>
            <h1 className="text-3xl font-bold">Bist du mindestens {MINIMUM_AGE} Jahre alt?</h1>
            <p className="text-sm text-slate-300">
              PhenoHub richtet sich ausschließlich an volljährige Nutzerinnen und Nutzer. Bitte
              bestätige uns, dass du mindestens {MINIMUM_AGE} Jahre alt bist.
            </p>
          </div>

          {errorMessage && (
            <div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Ja, ich bin {MINIMUM_AGE} oder älter
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
            Mit deiner Bestätigung speichern wir ein Cookie, damit die Abfrage beim nächsten Besuch
            nicht erneut erscheint.
          </p>
        </div>
      </div>
    </div>
  );
}
