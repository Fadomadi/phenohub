"use client";

import { X } from "lucide-react";

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Über PhenoHub</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Über uns schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-8 px-6 py-8 text-base leading-relaxed text-gray-700">
          <section className="space-y-4">
            <p>
              PhenoHub ist aus einem einfachen Problem entstanden: Ich habe selbst lange nach
              hochwertigen Stecklingen gesucht – und schnell gemerkt, wie schwer es ist, verlässliche
              Informationen zu finden. Foren, Reddit-Posts, vage Aussagen … aber nie echte
              Vergleichsdaten oder ehrliche Erfahrungsberichte an einem Ort.
            </p>
            <p>
              Genau da setzt PhenoHub an. Hier geht es nicht um Werbung oder Verkauf, sondern um echte
              Erfahrungen aus der Community. Grower teilen ihre eigenen Berichte, Bilder und
              Bewertungen, damit andere nicht im Dunkeln tappen müssen.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Warum ich das gestartet habe
            </h3>
            <p>
              Ich bin selbst passionierter Grower – jemand, der unzählige Stunden damit verbracht hat,
              Sorten zu vergleichen, Stecklinge zu testen und echte Qualität zu finden. PhenoHub ist
              meine Antwort auf dieses Chaos. Ich will eine Plattform schaffen, die in ein, zwei Jahren
              zur zentralen Anlaufstelle für ehrliche Stecklings- und Samenvergleiche in Europa wird.
            </p>
            <p>
              Ein Ort, an dem Erfahrung, Transparenz und Qualität zählen – nicht Marketingversprechen.
              Der Anfang wird klein sein – mit meinen eigenen Berichten und Sorten, die ich selbst
              getestet habe. Aber das Ziel ist groß: eine Community aufzubauen, in der Grower sich
              gegenseitig helfen, die besten Cuts, Sorten und Anbieter zu finden.
            </p>
            <p>
              PhenoHub soll die Brücke sein zwischen ehrlicher Erfahrung und echter Qualität. Kein
              Hype, kein Fake – nur Fakten.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
