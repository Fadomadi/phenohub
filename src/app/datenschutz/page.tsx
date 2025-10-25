import Link from "next/link";

const DatenschutzPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 px-4 py-12 theme-dark:bg-gradient-to-b theme-dark:from-slate-950 theme-dark:via-slate-950 theme-dark:to-slate-900">
      <div className="mx-auto max-w-3xl space-y-10 rounded-3xl border border-green-100 bg-white/95 p-8 shadow-xl shadow-green-100/40 backdrop-blur-sm theme-dark:border-slate-800 theme-dark:bg-slate-900/80 theme-dark:shadow-slate-900/40">
        <header className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-green-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 theme-dark:border-sky-500/60 theme-dark:text-sky-200">
            Datenschutz
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 theme-dark:text-slate-100">
            Datenschutzerklärung
          </h1>
          <p className="text-sm leading-relaxed text-gray-600 theme-dark:text-slate-300">
            Wir nehmen Datenschutz ernst. Auf dieser Seite erfährst du, welche personenbezogenen Daten wir
            erheben, wie wir sie verarbeiten und welche Rechte du als betroffene Person hast.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">1. Verantwortlicher</h2>
          <p>
            Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist Andrej Petri, Straße des 17.
            Juni 12, 10623 Berlin, Deutschland. Kontakt:{" "}
            <a
              href="mailto:privacy@phenohub.app"
              className="text-green-700 underline transition hover:text-green-800 theme-dark:text-sky-300 theme-dark:hover:text-sky-200"
            >
              privacy@phenohub.app
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">2. Verarbeitete Daten</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold">Account-Daten:</span> E-Mail-Adresse, Benutzername, Rollenstatus,
              freiwillige Profildaten.
            </li>
            <li>
              <span className="font-semibold">Nutzungsdaten:</span> Server-Logs, IP-Adresse, Zeitstempel,
              Interaktionen mit Berichten, Kommentaren und Community-Beiträgen.
            </li>
            <li>
              <span className="font-semibold">Inhaltsdaten:</span> Hochgeladene Bilder, Bewertungen, Kommentare
              und Support-Anfragen.
            </li>
            <li>
              <span className="font-semibold">Zahlungsdaten:</span> Bei Supporter-Abos verarbeiten wir über
              Stripe Bestell-ID, Status und Rechnungsadresse (keine vollständigen Zahlungsdetails).
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">3. Zwecke & Rechtsgrundlagen</h2>
          <p>
            Wir verarbeiten deine Daten zur Bereitstellung und Verbesserung von PhenoHub (Art. 6 Abs. 1 lit. b
            DSGVO), zur Wahrung berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) sowie zur Erfüllung
            gesetzlicher Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO). Für den Versand von Newslettern oder
            Supporter-Informationen holen wir deine Einwilligung ein (Art. 6 Abs. 1 lit. a DSGVO).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">4. Empfänger der Daten</h2>
          <p>
            Wir nutzen ausgewählte Dienstleister, die deine Daten in unserem Auftrag verarbeiten, u.&nbsp;a.
            für Hosting (Render, Supabase), E-Mail-Versand (Resend) und Zahlungsabwicklung (Stripe). Mit allen
            Auftragsverarbeitern bestehen entsprechende Verträge nach Art. 28 DSGVO.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">
            5. Speicherdauer & Löschung
          </h2>
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist
            oder gesetzliche Aufbewahrungsfristen bestehen. Kontodaten können auf Wunsch gelöscht werden; sende
            uns dazu eine Nachricht an{" "}
            <a
              href="mailto:privacy@phenohub.app"
              className="text-green-700 underline transition hover:text-green-800 theme-dark:text-sky-300 theme-dark:hover:text-sky-200"
            >
              privacy@phenohub.app
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">6. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
            sowie Widerspruch gegen die Verarbeitung (Art. 15–21 DSGVO). Zudem hast du das Recht, dich bei einer
            Datenschutzaufsichtsbehörde zu beschweren.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-gray-700 theme-dark:text-slate-300">
          <h2 className="text-xl font-semibold text-gray-900 theme-dark:text-slate-100">7. Cookies & Tracking</h2>
          <p>
            PhenoHub verwendet ausschließlich technisch notwendige Cookies sowie optionale Analyse-Tools
            (z.&nbsp;B. Plausible Analytics). Letztere setzen wir nur mit deiner Einwilligung ein und anonymisieren IP-Adressen,
            um dein Verhalten nicht personenbeziehbar auszuwerten.
          </p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-green-100 pt-4 text-xs text-gray-500 theme-dark:border-slate-800 theme-dark:text-slate-400">
          <Link href="/" className="text-green-700 underline transition hover:text-green-800 theme-dark:text-sky-300 theme-dark:hover:text-sky-200">
            Zurück zur Startseite
          </Link>
          <span>Stand: Oktober 2025</span>
        </footer>
      </div>
    </main>
  );
};

export default DatenschutzPage;
