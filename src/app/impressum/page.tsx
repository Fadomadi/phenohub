import Link from "next/link";

const ImpressumPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 px-4 py-12 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl space-y-10 rounded-3xl border border-green-100 bg-white/95 p-8 shadow-xl shadow-green-100/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40">
        <header className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-sky-500/60 dark:text-sky-200">
            Rechtliche Angaben
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Impressum</h1>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
            Angaben gemäß §&nbsp;5 TMG und Verantwortlicher für den Inhalt dieser Website.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Betreiber</h2>
          <address className="space-y-1 text-sm not-italic leading-relaxed text-gray-700 dark:text-slate-300">
            <p>PhenoHub – Andrej Petri</p>
            <p>Straße des 17. Juni 12</p>
            <p>10623 Berlin</p>
            <p>Deutschland</p>
          </address>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
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

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Verantwortlich für den Inhalt</h2>
          <p>
            Andrej Petri (Anschrift wie oben). Bei Fragen zu redaktionellen Inhalten oder zur Meldung von
            Rechtsverletzungen wende dich bitte an{" "}
            <a
              href="mailto:legal@phenohub.app"
              className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
            >
              legal@phenohub.app
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Haftungshinweise</h2>
          <p>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer
            Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
          </p>
          <p>
            Alle Informationen auf PhenoHub dienen ausschließlich zu Dokumentations- und Recherchezwecken. Es
            findet kein Verkauf und keine Vermittlung statt. Nutzer sind verpflichtet, die gesetzlichen
            Bestimmungen ihres Landes einzuhalten.
          </p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-green-100 pt-4 text-xs text-gray-500 dark:border-slate-800 dark:text-slate-400">
          <Link href="/" className="text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200">
            Zurück zur Startseite
          </Link>
          <span>Stand: Oktober 2025</span>
        </footer>
      </div>
    </main>
  );
};

export default ImpressumPage;
