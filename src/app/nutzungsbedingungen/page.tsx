import Link from "next/link";

const TermsPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 px-4 py-12 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl space-y-10 rounded-3xl border border-green-100 bg-white/95 p-8 shadow-xl shadow-green-100/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40">
        <header className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-sky-500/60 dark:text-sky-200">
            Nutzungsbedingungen
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
            Allgemeine Geschäfts- und Nutzungsbedingungen
          </h1>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
            Diese Bedingungen regeln die Nutzung von PhenoHub. Bitte lies sie aufmerksam, bevor du Inhalte
            einreichst, kommentierst oder ein Supporter-Abo abschließt.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">1. Geltungsbereich</h2>
          <p>
            Die folgenden Bedingungen gelten für alle registrierten und nicht registrierten Nutzer der Plattform
            PhenoHub. Mit der Nutzung der Website erkennst du diese Bedingungen an.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">2. Registrierung & Account</h2>
          <p>
            Für bestimmte Funktionen (z.&nbsp;B. Berichte einreichen, kommentieren, Supporter-Status) ist ein
            kostenloser Account erforderlich. Du bist verpflichtet, deine Zugangsdaten geheim zu halten und uns
            bei Verdacht auf Missbrauch unverzüglich zu informieren.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">3. Inhalte der Nutzer</h2>
          <p>
            Du darfst nur Inhalte einstellen, an denen du die erforderlichen Rechte besitzt. Mit dem Upload
            gewährst du PhenoHub ein einfaches, zeitlich und räumlich unbeschränktes Nutzungsrecht zur Anzeige,
            Bearbeitung (z.&nbsp;B. fürs responsive Design) und Archivierung deiner Inhalte auf der Plattform.
          </p>
          <p>
            Verboten sind insbesondere Obszönitäten, diskriminierende Inhalte, Aufrufe zu Straftaten oder
            urheberrechtsverletzende Materialien. Wir behalten uns vor, Beiträge bei Verstößen zu entfernen.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">4. Supporter-Abos</h2>
          <p>
            Supporter-Abos werden über Stripe abgewickelt. Das Abo verlängert sich automatisch monatlich und kann
            jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Rückerstattungen erfolgen
            nach geltendem Recht.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">5. Haftung</h2>
          <p>
            PhenoHub stellt Inhalte ohne Gewähr bereit. Wir übernehmen keine Haftung für die Richtigkeit,
            Vollständigkeit oder Aktualität der Inhalte – insbesondere bei Erfahrungsberichten und Bewertungen.
            Eigene Anbauentscheidungen triffst du auf eigene Verantwortung.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">6. Kündigung & Sperrung</h2>
          <p>
            Wir können Accounts sperren oder löschen, wenn begründeter Verdacht auf Verstöße gegen diese
            Nutzungsbedingungen, auf Bots oder auf missbräuchliche Nutzung besteht. Du kannst deinen Account
            jederzeit löschen lassen, indem du uns kontaktierst.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">7. Änderungen</h2>
          <p>
            Wir behalten uns vor, diese Nutzungsbedingungen anzupassen. Über wesentliche Änderungen informieren
            wir dich per E-Mail oder durch einen Hinweis beim Einloggen. Die aktuelle Fassung findest du immer
            auf dieser Seite.
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

export default TermsPage;
