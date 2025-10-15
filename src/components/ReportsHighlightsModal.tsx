"use client";

import { X } from "lucide-react";
import ReportCard from "@/components/ReportCard";
import type { Report } from "@/types/domain";

type ReportsHighlightsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
};

const ReportsHighlightsModal = ({
  isOpen,
  onClose,
  reports,
}: ReportsHighlightsModalProps) => {
  if (!isOpen) return null;

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-2xl shadow-green-200/50 backdrop-blur">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Neueste Berichte</h2>
            <p className="text-sm text-gray-500">
              Alle aktuellen Erfahrungsberichte aus der Community auf einen Blick.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Berichte schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsHighlightsModal;
