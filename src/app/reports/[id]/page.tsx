import { Buffer } from "node:buffer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lamp, Leaf, Ruler, Star as StarIcon, StarHalf as StarHalfIcon, Sun } from "lucide-react";
import prisma from "@/lib/prisma";
import { normalizeTmpfilesUrl } from "@/lib/images";
import ReportCommentsSection from "@/components/ReportCommentsSection";
import ReportImageStack, { type ReportImageStackItem } from "@/components/ReportImageStack";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { uploadImage } from "@/lib/uploads";
import { prepareImageUpload, resolveSuggestedFileName } from "@/lib/imageProcessing";

export const dynamic = "force-dynamic";

type RouteParams = { id: string };

type ReportPageProps = {
  params: Promise<RouteParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AdditionalInfo = {
  setup?: {
    lampType?: string | null;
    tentSize?: string | null;
    medium?: string | null;
    environment?: string | null;
  };
  extras?: {
    washerGenetics?: string | null;
  };
  ratings?: {
    overall?: number | null;
    growth?: number | null;
    stability?: number | null;
    shipping?: number | null;
    care?: number | null;
  };
};

const formatDate = (value: Date | null) => {
  if (!value) return "unveröffentlicht";
  return value.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const reportInclude = {
  cultivar: { select: { name: true, breeder: true, slug: true } },
  provider: { select: { name: true, slug: true } },
} as const;

const fetchReport = (id: number) =>
  prisma.report.findUnique({
    where: { id },
    include: reportInclude,
  });

type ReportWithRelations = NonNullable<Awaited<ReturnType<typeof fetchReport>>>;

type NormalizedGalleryEntry = {
  directUrl: string;
  previewUrl?: string | null;
  provider?: string | null;
  key?: string | null;
  originalFileName?: string | null;
};

const TMPFILES_PATTERN = /tmpfiles\.org/i;
const HEIC_URL_PATTERN = /\.heic(?:$|\?)/i;

const isTmpfilesUrl = (value: string | null | undefined) =>
  typeof value === "string" && TMPFILES_PATTERN.test(value);

const isHeicUrl = (value: string | null | undefined) =>
  typeof value === "string" && HEIC_URL_PATTERN.test(value);

const normalizeGalleryEntry = (value: unknown): NormalizedGalleryEntry | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directUrl = typeof record.directUrl === "string" ? record.directUrl : null;
  if (!directUrl) {
    return null;
  }

  return {
    directUrl,
    previewUrl: typeof record.previewUrl === "string" ? record.previewUrl : null,
    provider: typeof record.provider === "string" ? record.provider : null,
    key: typeof record.key === "string" ? record.key : null,
    originalFileName:
      typeof record.originalFileName === "string" ? record.originalFileName : null,
  };
};

const sanitizeGalleryEntries = (entries: NormalizedGalleryEntry[]) =>
  entries.map((entry) => ({
    directUrl: entry.directUrl,
    previewUrl: entry.previewUrl ?? null,
    provider: entry.provider ?? null,
    key: entry.key ?? null,
    originalFileName: entry.originalFileName ?? null,
  }));

const migrateReportImages = async (report: ReportWithRelations) => {
  const existingGalleryEntries = Array.isArray(report.gallery)
    ? (report.gallery as unknown[])
        .map((entry) => normalizeGalleryEntry(entry))
        .filter((entry): entry is NormalizedGalleryEntry => Boolean(entry))
    : [];

  const imageUrls = Array.isArray(report.images)
    ? report.images.filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
    : [];

  const mergedEntries: NormalizedGalleryEntry[] = [...existingGalleryEntries];

  imageUrls.forEach((url: string) => {
    if (!mergedEntries.some((entry) => entry.directUrl === url)) {
      mergedEntries.push({
        directUrl: url,
        previewUrl: null,
        provider: url.includes("supabase.co") ? "s3" : null,
        key: null,
        originalFileName: null,
      });
    }
  });

  if (mergedEntries.length === 0) {
    return report;
  }

  let hasChanges = existingGalleryEntries.length !== mergedEntries.length;
  const updatedEntries: NormalizedGalleryEntry[] = [];

  for (let index = 0; index < mergedEntries.length; index += 1) {
    const entry = mergedEntries[index];
    if (isTmpfilesUrl(entry.directUrl) || isHeicUrl(entry.directUrl)) {
      try {
        const response = await fetch(entry.directUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Legacy image fetch failed with status ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") ?? "image/jpeg";
        const suggestedName = resolveSuggestedFileName(
          entry.directUrl,
          entry.originalFileName,
          report.id,
          index,
        );

        const prepared = await prepareImageUpload({
          buffer,
          fileName: suggestedName,
          contentType,
        });

        const uploadResult = await uploadImage({
          buffer: prepared.buffer,
          fileName: prepared.fileName,
          contentType: prepared.contentType,
        });

        if (uploadResult.provider === "s3") {
          updatedEntries.push({
            directUrl: uploadResult.directUrl,
            previewUrl: uploadResult.previewUrl ?? uploadResult.directUrl,
            provider: uploadResult.provider,
            key: uploadResult.key ?? null,
            originalFileName: prepared.fileName,
          });
          hasChanges = true;
        } else {
          console.warn(
            "[REPORT_IMAGE_MIGRATION] Upload provider fallback encountered – retaining legacy URL",
            entry.directUrl,
          );
          updatedEntries.push(entry);
        }
      } catch (error) {
        console.error("[REPORT_IMAGE_MIGRATION]", entry.directUrl, error);
        updatedEntries.push(entry);
      }
    } else {
      updatedEntries.push(entry);
    }
  }

  // Ensure gallery entries exist even if legacy migration failed but we previously had none
  if (!hasChanges && existingGalleryEntries.length === 0) {
    hasChanges = true;
  }

  if (!hasChanges) {
    return report;
  }

  const sanitizedEntries = sanitizeGalleryEntries(updatedEntries);
  const updatedImages = sanitizedEntries
    .map((entry) => entry.directUrl)
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  const updatedReport = await prisma.report.update({
    where: { id: report.id },
    data: {
      gallery: sanitizedEntries,
      images: updatedImages,
    },
    include: reportInclude,
  });

  return updatedReport;
};

const parseAdditionalInfo = (value: unknown): AdditionalInfo => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  const result: AdditionalInfo = {};

  if (record.setup && typeof record.setup === "object") {
    const setupRecord = record.setup as Record<string, unknown>;
    result.setup = {
      lampType:
        typeof setupRecord.lampType === "string" && setupRecord.lampType.trim().length > 0
          ? setupRecord.lampType
          : null,
      tentSize:
        typeof setupRecord.tentSize === "string" && setupRecord.tentSize.trim().length > 0
          ? setupRecord.tentSize
          : null,
      medium:
        typeof setupRecord.medium === "string" && setupRecord.medium.trim().length > 0
          ? setupRecord.medium
          : null,
      environment:
        typeof setupRecord.environment === "string" && setupRecord.environment.trim().length > 0
          ? setupRecord.environment
          : null,
    };
  }

  if (record.extras && typeof record.extras === "object") {
    const extrasRecord = record.extras as Record<string, unknown>;
    result.extras = {
      washerGenetics:
        typeof extrasRecord.washerGenetics === "string" && extrasRecord.washerGenetics.trim().length > 0
          ? extrasRecord.washerGenetics
          : null,
    };
  }

  if (record.ratings && typeof record.ratings === "object") {
    const ratingsRecord = record.ratings as Record<string, unknown>;
    const parseRatingValue = (input: unknown) => {
      if (input === null || input === undefined) return null;
      const numeric = Number(input);
      return Number.isFinite(numeric) ? numeric : null;
    };
    const ratings = {
      overall: parseRatingValue(ratingsRecord.overall),
      growth: parseRatingValue(ratingsRecord.growth),
      stability: parseRatingValue(ratingsRecord.stability),
      shipping: parseRatingValue(ratingsRecord.shipping),
      care: parseRatingValue(ratingsRecord.care),
    };
    if (Object.values(ratings).some((value) => value !== null)) {
      result.ratings = ratings;
    }
  }

  return result;
};

const extractSetupFromContent = (content: string) => {
  const lampMatch = content.match(/-\s*(?:Lampe|Watt):\s*([^\n]+)/i);
  const environmentMatch = content.match(/-\s*Umgebung:\s*([^\n]+)/i);
  const tentMatch = content.match(/-\s*Zelt:\s*([^\n]+)/i);
  const mediumMatch = content.match(/-\s*Medium:\s*([^\n]+)/i);

  return {
    lampType: lampMatch?.[1]?.trim() || null,
    environment: environmentMatch?.[1]?.trim() || null,
    tentSize: tentMatch?.[1]?.trim() || null,
    medium: mediumMatch?.[1]?.trim() || null,
  };
};

const formatWasherGenetics = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "yes") return "Ja";
  if (normalized === "no") return "Nein";
  if (normalized === "unknown") return "Unbekannt";
  return value;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const clampRating = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
};

const ratingHintScale: Record<string, [string, string, string, string, string]> = {
  overall: [
    "Sehr schlechtes Gesamtergebnis",
    "Ausbaufähig",
    "Solide",
    "Sehr gut",
    "Hervorragend",
  ],
  growth: [
    "Sehr schwaches Wachstum",
    "Unterdurchschnittlich",
    "Solide Entwicklung",
    "Starkes Wachstum",
    "Außergewöhnlich vital",
  ],
  stability: [
    "Sehr instabil",
    "Merkliche Unterschiede",
    "Weitestgehend einheitlich",
    "Sehr stabil",
    "Perfekt gleichmäßig",
  ],
  shipping: [
    "Sehr schlechte Erfahrung",
    "Eher schlecht",
    "In Ordnung",
    "Gut",
    "Hervorragend",
  ],
  care: [
    "Sehr anspruchsvoll",
    "Anspruchsvoll",
    "Mittlerer Aufwand",
    "Einfach",
    "Sehr einfach / anfängerfreundlich",
  ],
};

const describeRating = (key: string, value: number) => {
  if (!value || value <= 0) return null;
  const hints = ratingHintScale[key] ?? ratingHintScale.overall;
  const index = Math.min(Math.max(Math.round(value) - 1, 0), hints.length - 1);
  return hints[index] ?? null;
};

const renderStars = (value: number, title?: string | null) => {
  if (!value || value <= 0) {
    return (
      <span className="text-xs text-gray-400 dark:text-slate-500" title="Keine Bewertung">
        Keine Bewertung
      </span>
    );
  }

  const clamped = clampRating(value);
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75;

  const stars = Array.from({ length: 5 }, (_, index) => {
    if (index < fullStars) {
      return (
        <StarIcon
          key={`star-${index}`}
          className="h-4 w-4 text-yellow-400"
          fill="currentColor"
        />
      );
    }
    if (index === fullStars && hasHalf) {
      return <StarHalfIcon key={`star-${index}`} className="h-4 w-4 text-yellow-400" />;
    }
    return <StarIcon key={`star-${index}`} className="h-4 w-4 text-gray-300" />;
  });

  return (
    <div className="flex items-center gap-1" title={title ?? undefined}>
      {stars}
    </div>
  );
};

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const previewFlag = resolvedSearchParams?.preview;
  const previewRequested = Array.isArray(previewFlag)
    ? previewFlag.includes("1") || previewFlag.includes("true")
    : previewFlag === "1" || previewFlag === "true";

  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) {
    notFound();
  }

  const session = await getServerSession(authConfig);
  const userRole = session?.user?.role ?? "USER";
  const isModerator = ["MODERATOR", "ADMIN", "OWNER"].includes(userRole);

  let report = await fetchReport(id);

  if (!report) {
    notFound();
  }

  if (report.status !== "PUBLISHED") {
    if (!(previewRequested && isModerator)) {
      notFound();
    }
  }

  try {
    report = await migrateReportImages(report);
  } catch (error) {
    console.error("[REPORT_IMAGE_MIGRATION_FATAL]", error);
    report = await fetchReport(id);
    if (!report) {
      notFound();
    }
  }


  type DbComment = {
    id: number;
    reportId: number;
    userId: number | null;
    authorName: string;
    body: string;
    createdAt: Date;
  };

  let comments: DbComment[] = [];
  try {
    comments = await prisma.reportComment.findMany({
      where: { reportId: id },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.warn("[REPORT_PAGE] reportComment lookup failed – returning empty comments", error);
  }

  const serializedComments = comments.map((comment) => ({
    id: comment.id,
    reportId: comment.reportId,
    userId: comment.userId,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  }));

  const canComment = Boolean(session?.user);

  type GalleryEntry = {
    directUrl: string;
    previewUrl?: string | null;
    originalFileName?: string | null;
  };

  type NormalizedReportImage = {
    direct: string;
    preview?: string | null;
    alt: string;
    original?: string | null;
  };

  const galleryEntries: GalleryEntry[] = Array.isArray(report.gallery)
    ? (report.gallery as unknown[]).flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const record = entry as Record<string, unknown>;
        const directUrl = typeof record.directUrl === "string" ? record.directUrl : null;
        if (!directUrl) {
          return [];
        }

        const normalized: GalleryEntry = {
          directUrl,
          previewUrl: typeof record.previewUrl === "string" ? record.previewUrl : undefined,
          originalFileName:
            typeof record.originalFileName === "string" ? record.originalFileName : undefined,
        };

        return [normalized];
      })
    : [];

  const fallbackImages: NormalizedReportImage[] = (report.images ?? []).flatMap((img: unknown) => {
    if (typeof img !== "string" || !img.trim()) {
      return [];
    }

    const normalized = normalizeTmpfilesUrl(img);
    const normalizedDirect =
      typeof normalized.direct === "string" && normalized.direct.startsWith("http")
        ? normalized.direct
        : null;
    const normalizedPreview =
      typeof normalized.preview === "string" && normalized.preview.startsWith("http")
        ? normalized.preview
        : null;

    const fallbackSource =
      normalizedDirect ??
      normalizedPreview ??
      (typeof img === "string" && img.startsWith("http") ? img : null);

    if (!fallbackSource) {
      return [];
    }

    const entry: NormalizedReportImage = {
      direct: fallbackSource,
      preview: normalizedPreview,
      alt: report.title,
      original: img,
    };

    return [entry];
  });

  const reportImages =
    galleryEntries.length > 0
      ? galleryEntries.map((entry) => {
          const normalized = normalizeTmpfilesUrl(entry.directUrl);
          return {
            direct:
              normalized.direct && normalized.direct.startsWith("http")
                ? normalized.direct
                : entry.directUrl,
            preview:
              entry.previewUrl && entry.previewUrl.startsWith("http")
                ? entry.previewUrl
                : normalized.preview,
            alt: report.title,
            original: entry.originalFileName ?? entry.directUrl,
          };
        })
      : fallbackImages;

  const reportImageStackItems: ReportImageStackItem[] = reportImages.map((image, index) => {
    const baseAlt = image.alt || report.title || "Report Bild";
    const altText = `${baseAlt} – Bild ${index + 1}`;
    const candidates = [
      image.direct,
      image.preview,
      image.original,
    ].filter((value): value is string => typeof value === "string" && value.length > 0);
    const proxiedCandidates = candidates.map(
      (value) => `/api/image-proxy?url=${encodeURIComponent(value)}`,
    );
    const uniqueSources = Array.from(new Set([...proxiedCandidates, ...candidates]));

    return {
      id: `${image.direct}-${index}`,
      alt: altText,
      loading: index === 0 ? "eager" : "lazy",
      sources: uniqueSources,
    };
  });

  const isPreviewMode = report.status !== "PUBLISHED";

  const publishedLabel = isPreviewMode
    ? "Noch nicht veröffentlicht"
    : formatDate(report.publishedAt ?? report.createdAt);

  const additionalInfo = parseAdditionalInfo((report as unknown as { additionalInfo?: unknown }).additionalInfo);
  const fallbackSetup = extractSetupFromContent(report.content ?? "");
  const tentLabelMap: Record<string, string> = {
    "60x60": "60 × 60 cm",
    "80x80": "80 × 80 cm",
    "100x100": "100 × 100 cm",
    "120x120": "120 × 120 cm",
    growroom: "Eigener Raum",
  };

  const mediumLabelMap: Record<string, string> = {
    soil: "Erde",
    coco: "Kokos",
    hydro: "Hydro",
    aero: "Aeroponik",
  };
  const environmentLabelMap: Record<string, string> = {
    indoor: "Indoor",
    outdoor: "Outdoor",
    greenhouse: "Greenhouse",
  };

  const rawLamp = additionalInfo.setup?.lampType ?? fallbackSetup.lampType;
  const rawEnvironment = additionalInfo.setup?.environment ?? fallbackSetup.environment;
  const rawTent = additionalInfo.setup?.tentSize ?? fallbackSetup.tentSize;
  const rawMedium = additionalInfo.setup?.medium ?? fallbackSetup.medium;

  const setupData = {
    lampType: rawLamp,
    environment:
      rawEnvironment && typeof rawEnvironment === "string"
        ? environmentLabelMap[rawEnvironment.toLowerCase()] ?? rawEnvironment
        : rawEnvironment ?? null,
    tentSize: rawTent ? tentLabelMap[rawTent] ?? rawTent : null,
    medium:
      rawMedium && typeof rawMedium === "string"
        ? mediumLabelMap[rawMedium.toLowerCase()] ?? rawMedium
        : rawMedium ?? null,
  };

  const washerGeneticsLabel = formatWasherGenetics(additionalInfo.extras?.washerGenetics ?? null);

  const baseMetaCards = [
    {
      key: "cultivar",
      label: "Sorte",
      value: report.cultivar.name,
      href: report.cultivar.slug ? `/cultivars/${report.cultivar.slug}` : undefined,
    },
    {
      key: "provider",
      label: "Anbieter",
      value: report.provider.name,
      href: `/providers/${report.provider.slug}`,
    },
    {
      key: "author",
      label: "Autor",
      value: report.authorHandle || "Community",
    },
  ];

  const metaCards = washerGeneticsLabel
    ? [
        ...baseMetaCards,
        {
          key: "washer",
          label: "Washer-Genetik",
          value: washerGeneticsLabel,
        },
      ]
    : baseMetaCards;

  const setupItems = [
    {
      key: "environment",
      label: "Umgebung",
      value: setupData.environment,
      icon: Sun,
    },
    {
      key: "lampType",
      label: "Watt",
      value: setupData.lampType,
      icon: Lamp,
    },
    {
      key: "tentSize",
      label: "Zelt",
      value: setupData.tentSize,
      icon: Ruler,
    },
    {
      key: "medium",
      label: "Medium",
      value: setupData.medium,
      icon: Leaf,
    },
  ].reduce<
    Array<{
      key: string;
      label: string;
      value: string;
      icon: typeof Lamp;
    }>
  >((accumulator, item) => {
    if (typeof item.value === "string" && item.value.trim().length > 0) {
      accumulator.push({
        key: item.key,
        label: item.label,
        value: item.value.trim(),
        icon: item.icon,
      });
    }
    return accumulator;
  }, []);

  const ratingValues = {
    overall: clampRating(toNumber(additionalInfo.ratings?.overall ?? report.overall)),
    growth: clampRating(toNumber(additionalInfo.ratings?.growth ?? report.vitality)),
    stability: clampRating(toNumber(additionalInfo.ratings?.stability ?? report.stability)),
    shipping: clampRating(toNumber(additionalInfo.ratings?.shipping ?? report.shipping)),
    care: clampRating(toNumber(additionalInfo.ratings?.care ?? 0)),
  };

  if (ratingValues.overall === 0) {
    const partialValues = [
      ratingValues.growth,
      ratingValues.stability,
      ratingValues.shipping,
      ratingValues.care,
    ].filter(
      (value) => value > 0,
    );
    if (partialValues.length > 0) {
      ratingValues.overall = clampRating(
        partialValues.reduce((sum, value) => sum + value, 0) / partialValues.length,
      );
    }
  }

  const ratingEntries = [
    {
      key: "overall",
      label: "Gesamtbewertung",
      description: "Durchschnitt aller Teilkategorien",
      value: ratingValues.overall,
      hint: describeRating("overall", ratingValues.overall),
    },
    {
      key: "growth",
      label: "Wuchsverhalten",
      description: "Stärke, Wachstumsgeschwindigkeit, Resistenz",
      value: ratingValues.growth,
      hint: describeRating("growth", ratingValues.growth),
    },
    {
      key: "stability",
      label: "Genetische Stabilität",
      description: "Einheitlichkeit zwischen Pflanzen, keine Ausreißer",
      value: ratingValues.stability,
      hint: describeRating("stability", ratingValues.stability),
    },
    {
      key: "shipping",
      label: "Lieferung & Service",
      description: "Verpackung, Geschwindigkeit, Kommunikation",
      value: ratingValues.shipping,
      hint: describeRating("shipping", ratingValues.shipping),
    },
    {
      key: "care",
      label: "Pflegeaufwand / Schwierigkeitsgrad",
      description:
        "Wie anspruchsvoll ist der Steckling im Grow? Bewertet wird die Toleranz gegenüber Fehlern bei pH, Düngung, Klima, Licht oder Training.",
      value: ratingValues.care,
      hint: describeRating("care", ratingValues.care),
    },
  ];
  const hasRatings = ratingEntries.some((entry) => entry.value > 0);

  const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

  const excerptText = typeof report.excerpt === "string" ? report.excerpt.trim() : "";
  const paragraphs = (report.content ?? "")
    .split(/\n{2,}/)
    .map((paragraph: string) => paragraph.trim())
    .filter(
      (paragraph: string) =>
        Boolean(paragraph) &&
        !/^setup:/i.test(paragraph) &&
        !/^- (Lampe|Zelt|Medium):/i.test(paragraph) &&
        normalizeText(paragraph) !== normalizeText(excerptText),
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-green-700 underline transition hover:text-green-800 dark:text-sky-300 dark:hover:text-sky-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Zur Übersicht
      </Link>

      {isPreviewMode && (
        <div className="mb-6 rounded-3xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 shadow-sm">
          <p className="font-semibold">Moderations-Vorschau</p>
          <p>
            Dieser Report ist noch nicht veröffentlicht. Du siehst eine Vorschau, die nur für
            Moderatoren sichtbar ist.
          </p>
        </div>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.6fr),minmax(0,0.9fr)]">
        <div className="space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-green-50/70 p-6 shadow-lg shadow-green-100/40 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 md:p-8">
            <span className="hidden md:inline-flex md:absolute md:right-8 md:top-8 md:items-center md:gap-1 md:rounded-full md:bg-gray-100 md:px-3 md:py-1 md:text-[11px] md:font-semibold md:uppercase md:tracking-wide md:text-gray-600 dark:md:bg-slate-800 dark:md:text-slate-300">
              Veröffentlicht am {publishedLabel}
            </span>
            <div className="space-y-10">
              <header className="space-y-4">
                <div className="flex w-full items-center justify-end text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                    Veröffentlicht am {publishedLabel}
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl font-semibold leading-tight text-gray-900 dark:text-slate-100 md:text-4xl">
                    {report.title}
                  </h1>
                </div>
              </header>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
                <section className="flex-1 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/70">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Grow-Notizen
                  </h2>
                  {paragraphs.length > 0 ? (
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                      {paragraphs.map((paragraph: string, index: number) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Noch keine Details ergänzt.
                    </p>
                  )}
                </section>

                <aside className="flex w-full flex-col gap-4 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/70 lg:w-[40%]">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    <span>Galerie</span>
                    {reportImageStackItems.length > 1 && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        {reportImageStackItems.length} Bilder
                      </span>
                    )}
                  </div>
                  {reportImageStackItems.length > 0 ? (
                    <ReportImageStack items={reportImageStackItems} className="w-full" />
                  ) : (
                    <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Keine Bilder hochgeladen.
                    </p>
                  )}
                </aside>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Überblick
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {metaCards.map((item) => (
                        <div
                          key={item.key}
                          className="min-w-[140px] flex-1 rounded-xl border border-gray-200 bg-white/85 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                            {item.label}
                          </p>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="mt-0.5 block text-[13px] font-semibold text-gray-900 underline decoration-green-400 decoration-2 underline-offset-4 transition hover:text-green-700 dark:text-slate-100 dark:hover:text-sky-300"
                            >
                              {item.value}
                            </Link>
                          ) : (
                            <p className="mt-0.5 text-[13px] font-semibold text-gray-900 dark:text-slate-100">
                              {item.value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {setupItems.length > 0 && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        Grow Setup
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {setupItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.key}
                              className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white/85 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600/10 text-green-700 dark:bg-sky-500/10 dark:text-sky-200">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                  {item.label}
                                </p>
                                <p className="text-[13px] font-semibold text-gray-900 dark:text-slate-100">
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>

                <section className="space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Bewertungen
                  </h2>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-green-200/60 bg-gradient-to-br from-green-50 via-white to-white px-4 py-4 shadow-sm dark:border-slate-700 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900">
                      <p className="text-[11px] uppercase tracking-wide text-green-600/80 dark:text-sky-300/90">
                        {ratingEntries[0].label}
                      </p>
                      <p className="text-xs text-green-700/80 dark:text-sky-300/80">
                        {ratingEntries[0].description}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        {renderStars(ratingEntries[0].value, ratingEntries[0].hint)}
                        <span
                          className="text-lg font-bold text-green-700 dark:text-sky-200"
                          title={ratingEntries[0].hint ?? undefined}
                        >
                          {ratingEntries[0].value > 0 ? ratingEntries[0].value.toFixed(1) : "–"}{" "}
                          <span className="text-sm font-semibold text-green-600/70 dark:text-sky-300/80">/ 5</span>
                        </span>
                      </div>
                      {ratingEntries[0].hint && ratingEntries[0].value > 0 && (
                        <p className="mt-2 text-xs text-green-700/80 dark:text-sky-300/80">
                          {ratingEntries[0].hint}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-green-600/60 dark:text-sky-400/60">
                        1 ⭐ {ratingHintScale[ratingEntries[0].key]?.[0] ?? ratingHintScale.overall[0]} · 5 ⭐{' '}
                        {ratingHintScale[ratingEntries[0].key]?.[4] ?? ratingHintScale.overall[4]}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {ratingEntries.slice(1).map((entry) => (
                        <div
                          key={entry.key}
                          className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
                        >
                          <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">
                            {entry.label}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            {entry.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {renderStars(entry.value, entry.hint)}
                            <span
                              className="text-sm font-semibold text-gray-900 dark:text-slate-100"
                              title={entry.hint ?? undefined}
                            >
                              {entry.value > 0 ? entry.value.toFixed(1) : "–"}
                            </span>
                          </div>
                          {entry.hint && entry.value > 0 && (
                            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                              {entry.hint}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400/80 dark:text-slate-500/80">
                            1 ⭐ {ratingHintScale[entry.key]?.[0] ?? ratingHintScale.overall[0]} · 5 ⭐{' '}
                            {ratingHintScale[entry.key]?.[4] ?? ratingHintScale.overall[4]}
                          </p>
                        </div>
                      ))}
                    </div>

                    {!hasRatings && (
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        Noch keine Bewertungen vorhanden.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>

          <ReportCommentsSection
            reportId={id}
            initialComments={serializedComments}
            canComment={canComment}
          />
        </div>

      </div>
    </div>
  );
}
