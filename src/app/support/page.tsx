"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Sprout } from "lucide-react";

const SupportPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Bitte eine E-Mail-Adresse eingeben.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, source: "support-page" }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Eintrag nicht möglich.");
      }
      setSuccess(
        typeof result?.message === "string"
          ? result.message
          : "Danke! Wir melden uns, sobald das Supporter-Abo live ist – checke dein Postfach.",
      );
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Eintrag nicht möglich. Bitte versuche es später erneut.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100/60">
      <header className="border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
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
              Zurück zur Startseite
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-br from-green-50 via-white to-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:from-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            >
              💬 Community
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
        <section className="rounded-3xl border border-green-200 bg-white/95 p-10 shadow-xl shadow-green-200/60 backdrop-blur">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-100 text-green-700">
              <Heart className="h-7 w-7" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Supporter werden – 4,00 € / Monat
            </h1>
            <p className="text-lg leading-relaxed text-gray-600">
              Hilf mit, dass PhenoHub online bleibt und weiter wächst. Dein Beitrag deckt Serverkosten,
              neue Features sowie unabhängige Tests und Recherchen.
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Was du bekommst
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Early Access zu neuen Funktionen & Roadmap-Updates</li>
              <li>• Stimmrecht bei Feature-Wünschen & neuen Datensätzen</li>
              <li>• Supporter-Badge in der Community (in Planung)</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Sprout className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Wohin die 4 € gehen
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Hosting & Datenbank (Render / CDN / Storage)</li>
              <li>• Ausbau der Vergleichsdaten, Steckling- & Samenprofile</li>
              <li>• Moderation & Qualitätsprüfung der Community-Beiträge</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-green-200 bg-white/95 p-8 shadow-inner shadow-green-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Wie kannst du aktuell beitragen?
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">
            Das Supporter-Abo startet in Kürze. Trage dich ein und wir melden uns, sobald das
            automatisierte 4,00 €-Monatsabo (Stripe) live geht. Alternativ kannst du jetzt schon
            manuell via PayPal oder Banktransfer unterstützen – Details erhältst du nach dem Eintrag.
          </p>
          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <label className="space-y-2 text-sm text-gray-700">
              <span>E-Mail-Adresse</span>
              <input
                type="email"
                placeholder="dein.name@email.de"
                className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error || success ? "support-signup-feedback" : undefined}
                disabled={isSubmitting}
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Trage dich ein…" : "Ich möchte Supporter werden"}
            </button>
            {(error || success) && (
              <p
                id="support-signup-feedback"
                className={`text-sm ${error ? "text-rose-600" : "text-green-600"}`}
              >
                {error ?? success}
              </p>
            )}
          </form>
          <p className="text-xs text-gray-500">
            Keine Sorge: Wir senden dir keine Werbung – nur Infos zum Start des Supporter-Abos und
            wichtige Plattform-News.
          </p>
        </section>

        <div className="text-center text-sm text-gray-500">
          Fragen? Schreib uns an{" "}
          <a
            href="mailto:support@phenohub.app"
            className="font-semibold text-green-700 underline"
          >
            support@phenohub.app
          </a>
        </div>
      </main>
    </div>
  );
};

export default SupportPage;
