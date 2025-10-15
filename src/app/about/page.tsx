"use client";

import Link from "next/link";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <header className="border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-green-700 transition-colors hover:text-green-800"
          >
            🌱 PhenoHub
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link
              href="/"
              className="rounded-lg px-3 py-1 transition hover:bg-green-50 hover:text-green-800"
            >
              Startseite
            </Link>
            <Link
              href="/about"
              className="rounded-lg bg-green-600 px-3 py-1 text-white shadow-sm transition hover:bg-green-700"
            >
              Über uns
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16">
        <section className="rounded-3xl border border-green-100 bg-white/90 p-10 shadow-lg shadow-green-100/60 backdrop-blur">
          <h1 className="mb-6 text-center text-4xl font-bold text-gray-900">
            Über PhenoHub
          </h1>
          <div className="space-y-6 text-lg leading-relaxed text-gray-700">
            <p>
              PhenoHub ist aus einem einfachen Problem entstanden: Ich habe selbst lange nach
              hochwertigen Stecklingen gesucht – und schnell gemerkt, wie schwer es ist,
              verlässliche Informationen zu finden. Foren, Reddit-Posts, vage Aussagen … aber nie
              echte Vergleichsdaten oder ehrliche Erfahrungsberichte an einem Ort.
            </p>
            <p>
              Genau da setzt PhenoHub an. Hier geht es nicht um Werbung oder Verkauf, sondern um
              echte Erfahrungen aus der Community. Grower teilen ihre eigenen Berichte, Bilder und
              Bewertungen, damit andere nicht im Dunkeln tappen müssen.
            </p>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">
            Warum ich das gestartet habe
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            Ich bin selbst passionierter Grower – jemand, der unzählige Stunden damit verbracht hat,
            Sorten zu vergleichen, Stecklinge zu testen und echte Qualität zu finden. PhenoHub ist
            meine Antwort auf dieses Chaos. Ich will eine Plattform schaffen, die in ein, zwei Jahren
            zur zentralen Anlaufstelle für ehrliche Stecklings- und Samenvergleiche in Europa wird.
          </p>
          <p className="text-lg leading-relaxed text-gray-700">
            Ein Ort, an dem Erfahrung, Transparenz und Qualität zählen – nicht Marketingversprechen.
            Der Anfang wird klein sein – mit meinen eigenen Berichten und Sorten, die ich selbst
            getestet habe. Aber das Ziel ist groß: eine Community aufzubauen, in der Grower sich
            gegenseitig helfen, die besten Cuts, Sorten und Anbieter zu finden.
          </p>
          <p className="text-lg leading-relaxed text-gray-700">
            PhenoHub soll die Brücke sein zwischen ehrlicher Erfahrung und echter Qualität. Kein
            Hype, kein Fake – nur Fakten.
          </p>
        </section>

        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          >
            Zurück zur Hauptseite
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
