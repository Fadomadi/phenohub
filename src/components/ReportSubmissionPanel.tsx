"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  Upload,
  Lamp,
  Ruler,
  Leaf,
  Building2,
  FileText,
  ChevronDown,
  Sparkles,
  Sun,
  Star as StarIcon,
  Trash2,
} from "lucide-react";
import type { Cultivar, Provider } from "@/types/domain";

type FormState = {
  cultivarSlug: string;
  providerSlug: string;
  lampType: string;
  tentSize: string;
  cultivationType: string;
  medium: string;
  summary: string;
  images: File[];
  authorName: string;
  anonymous: boolean;
  washerGenetics: string;
  growthRating: number;
  stabilityRating: number;
  shippingRating: number;
  careRating: number;
};

const defaultState: FormState = {
  cultivarSlug: "",
  providerSlug: "",
  lampType: "",
  tentSize: "",
  cultivationType: "",
  medium: "",
  summary: "",
  images: [],
  authorName: "",
  anonymous: false,
  washerGenetics: "",
  growthRating: 0,
  stabilityRating: 0,
  shippingRating: 0,
  careRating: 0,
};

type ReportSubmissionPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  cultivars: Cultivar[];
  providers: Provider[];
};

const tentOptions = [
  { value: "60x60", label: "60 × 60 cm" },
  { value: "80x80", label: "80 × 80 cm" },
  { value: "100x100", label: "100 × 100 cm" },
  { value: "120x120", label: "120 × 120 cm" },
  { value: "growroom", label: "Eigener Raum" },
];

const mediumOptions = [
  { value: "soil", label: "Erde" },
  { value: "coco", label: "Kokos" },
  { value: "hydro", label: "Hydro" },
  { value: "aero", label: "Aeroponik" },
];

const cultivationOptions = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
];

const ratingHints: Record<
  keyof Pick<FormState, "growthRating" | "stabilityRating" | "shippingRating" | "careRating">,
  [string, string, string, string, string]
> = {
  growthRating: [
    "Sehr schwaches Wachstum",
    "Unterdurchschnittlich",
    "Solide Entwicklung",
    "Starkes Wachstum",
    "Außergewöhnlich vital",
  ],
  stabilityRating: [
    "Sehr instabil",
    "Merkliche Unterschiede",
    "Weitestgehend einheitlich",
    "Sehr stabil",
    "Perfekt gleichmäßig",
  ],
  shippingRating: [
    "Sehr schlechte Erfahrung",
    "Eher schlecht",
    "In Ordnung",
    "Gut",
    "Hervorragend",
  ],
  careRating: [
    "Sehr anspruchsvoll",
    "Anspruchsvoll",
    "Mittlerer Aufwand",
    "Einfach",
    "Sehr einfach / anfängerfreundlich",
  ],
};

const ReportSubmissionPanel = ({
  isOpen,
  onClose,
  cultivars,
  providers,
}: ReportSubmissionPanelProps) => {
  const { data: session } = useSession();
  const sessionUser = session?.user;
  const displayHandle =
    (typeof sessionUser?.username === "string" && sessionUser.username.trim().length > 0
      ? sessionUser.username.trim()
      : sessionUser?.name ?? ""
    ).trim();
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ ...defaultState, images: [] });
  const [availableCultivars, setAvailableCultivars] = useState<Cultivar[]>(cultivars);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cultivarInput, setCultivarInput] = useState("");
  const [isCultivarLoading, setCultivarLoading] = useState(false);
  const [cultivarFetchError, setCultivarFetchError] = useState<string | null>(null);
  const [hasManualProviderSelection, setHasManualProviderSelection] = useState(false);
  const [ratingHover, setRatingHover] = useState<{
    growthRating: number;
    stabilityRating: number;
    shippingRating: number;
    careRating: number;
  }>({
    growthRating: 0,
    stabilityRating: 0,
    shippingRating: 0,
    careRating: 0,
  });
  const baseFieldClasses =
    "rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-base text-gray-900 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 sm:text-[15px] md:text-sm";

  useEffect(() => {
    if (!session?.user) return;
    const suggested = displayHandle;
    if (!suggested) return;
    setFormState((prev) => {
      if (prev.anonymous || prev.authorName.trim().length > 0) {
        return prev;
      }
      return { ...prev, authorName: suggested };
    });
  }, [session, displayHandle]);

  const cultivarOptions = useMemo(
    () =>
      availableCultivars.map((cultivar) => ({ value: cultivar.slug, label: cultivar.name })),
    [availableCultivars],
  );
  const providerOptions = useMemo(
    () => providers.map((provider) => ({ value: provider.slug, label: provider.name })),
    [providers],
  );

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    setCultivarLoading(true);
    setCultivarFetchError(null);

    fetch("/api/cultivars")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!isActive) return;
        if (Array.isArray(data?.cultivars)) {
          setAvailableCultivars(data.cultivars as Cultivar[]);
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error("[CULTIVAR_FETCH]", error);
        setCultivarFetchError("Sortenliste konnte nicht geladen werden.");
      })
      .finally(() => {
        if (isActive) {
          setCultivarLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!formState.cultivarSlug) {
      return;
    }

    const matchedOption = cultivarOptions.find(
      (option) => option.value === formState.cultivarSlug,
    );
    if (matchedOption && cultivarInput !== matchedOption.label) {
      setCultivarInput(matchedOption.label);
    }

    const cultivarData = availableCultivars.find(
      (cultivar) => cultivar.slug === formState.cultivarSlug,
    );
    if (!cultivarData) {
      return;
    }

    const offerings = cultivarData.offerings ?? [];
    const providerMatches = offerings.some(
      (offering) => offering.providerSlug === formState.providerSlug,
    );

    if (!providerMatches && !hasManualProviderSelection) {
      const suggestedProvider = offerings[0]?.providerSlug;
      if (suggestedProvider && suggestedProvider !== formState.providerSlug) {
        setFormState((prev) => ({ ...prev, providerSlug: suggestedProvider }));
        setHasManualProviderSelection(false);
      }
    }
  }, [
    formState.cultivarSlug,
    formState.providerSlug,
    cultivarOptions,
    availableCultivars,
    cultivarInput,
    hasManualProviderSelection,
  ]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === "providerSlug") {
      setHasManualProviderSelection(true);
    }
  };


  const handleAnonymousToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setFormState((prev) => {
      if (checked) {
        return { ...prev, anonymous: true, authorName: "" };
      }
      const suggested = displayHandle;
      return {
        ...prev,
        anonymous: false,
        authorName: prev.authorName.trim().length > 0 ? prev.authorName : suggested,
      };
    });
  };

  const handleCultivarInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setCultivarInput(value);
    const matched = cultivarOptions.find(
      (option) => option.label.toLowerCase() === value.toLowerCase(),
    );
    if (matched) {
      const cultivarData = availableCultivars.find(
        (cultivar) => cultivar.slug === matched.value,
      );
      const suggestedProvider = cultivarData?.offerings?.[0]?.providerSlug ?? "";

      setFormState((prev) => ({
        ...prev,
        cultivarSlug: matched.value,
        providerSlug: suggestedProvider || "",
      }));
      setHasManualProviderSelection(false);
    } else {
      setFormState((prev) => ({
        ...prev,
        cultivarSlug: "",
        ...(value.trim() === "" ? { providerSlug: "" } : {}),
      }));
      if (value.trim() === "") {
        setHasManualProviderSelection(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);
    const MAX_FILES = 10;
    const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

    setFormState((prev) => {
      const existing = prev.images;
      const combined = [...existing, ...selectedFiles];
      const unique: File[] = [];
      const seen = new Set<string>();

      for (const file of combined) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(file);
        }
      }

      if (unique.length > MAX_FILES) {
        setImageError(`Maximal ${MAX_FILES} Bilder erlaubt.`);
        return prev;
      }

      const totalSize = unique.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_BYTES) {
        setImageError("Maximale Gesamtgröße 10 MB überschritten.");
        return prev;
      }

      setImageError(null);
      return { ...prev, images: unique };
    });

    event.target.value = "";
  };

  const resetForm = useCallback(() => {
    setFormState(() => {
      const nextState: FormState = { ...defaultState, images: [] };
      if (displayHandle) {
        nextState.authorName = displayHandle;
      }
      return nextState;
    });
    setCultivarInput("");
    setErrorMessage(null);
    setImageError(null);
    setHasManualProviderSelection(false);
  }, [displayHandle]);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1] ?? "";
          resolve(base64);
        } else {
          reject(new Error("Ungültiger Dateiinhalt"));
        }
      };
      reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (!formState.cultivarSlug) {
        throw new Error("Bitte eine Sorte aus den Vorschlägen auswählen.");
      }

      const matchedCultivar = cultivarOptions.find((option) => option.value === formState.cultivarSlug);
      const generatedTitle = matchedCultivar
        ? `${matchedCultivar.label} Erfahrungsbericht`
        : `Community Erfahrungsbericht ${new Date().toISOString()}`;

      const trimmedAuthorName = formState.authorName.trim();

      const ratingInputs = [
        formState.growthRating,
        formState.stabilityRating,
        formState.shippingRating,
        formState.careRating,
      ];

      if (ratingInputs.some((value) => value === 0)) {
        throw new Error("Bitte alle Bewertungskategorien (1-5 Sterne) ausfüllen.");
      }

      const overallRating =
        ratingInputs.reduce((sum, value) => sum + value, 0) / ratingInputs.length;

      const imagesPayload = await Promise.all(
        formState.images.slice(0, 10).map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await fileToBase64(file),
        })),
      );

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedTitle,
          cultivarSlug: formState.cultivarSlug,
          providerSlug: formState.providerSlug,
          lampType: formState.lampType,
          tentSize: formState.tentSize,
          cultivationType: formState.cultivationType,
          medium: formState.medium,
          washerGenetics: formState.washerGenetics,
          summary: formState.summary,
          images: imagesPayload,
          authorName: trimmedAuthorName,
          anonymous: formState.anonymous,
          ratings: {
            growth: formState.growthRating,
            stability: formState.stabilityRating,
            shipping: formState.shippingRating,
            care: formState.careRating,
            overall: Number(overallRating.toFixed(2)),
          },
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error ?? "Speichern fehlgeschlagen.");
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onClose();
        router.refresh();
      }, 1600);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unbekannter Fehler beim Speichern.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderRatingInput = (
    name: keyof Pick<FormState, "growthRating" | "stabilityRating" | "shippingRating" | "careRating">,
    label: string,
    description: string,
  ) => {
    const currentValue = formState[name];
    const hoverValue = ratingHover[name];
    const displayValue = hoverValue > 0 ? hoverValue : currentValue;
    const hints = ratingHints[name];
    const setValue = (value: number) => {
      setFormState((prev) => ({ ...prev, [name]: value }));
      setRatingHover((prev) => ({ ...prev, [name]: 0 }));
    };

    return (
      <div className="flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
        <div>
          <p className="text-[13px] font-semibold text-gray-800 dark:text-slate-100">{label}</p>
          <p className="text-[11px] leading-snug text-gray-500 dark:text-slate-400">{description}</p>
        </div>
        <div
          className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-1"
          onMouseLeave={() => setRatingHover((prev) => ({ ...prev, [name]: 0 }))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue(value)}
              title={hints?.[value - 1] ?? `${value} Sterne`}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition sm:h-9 sm:w-9 ${
                value <= displayValue
                  ? "bg-yellow-400 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              aria-label={
                hints?.[value - 1]
                  ? `${value} Sterne (${hints[value - 1]}) für ${label}`
                  : `${value} Sterne für ${label}`
              }
              onMouseEnter={() => setRatingHover((prev) => ({ ...prev, [name]: value }))}
              onFocus={() => setRatingHover((prev) => ({ ...prev, [name]: value }))}
              onBlur={() => setRatingHover((prev) => ({ ...prev, [name]: 0 }))}
            >
              <StarIcon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="w-full text-left text-[11px] text-gray-500 dark:text-slate-400 sm:ml-2 sm:w-auto">
            {displayValue > 0
              ? `${displayValue} von 5${
                  hints?.[displayValue - 1] ? ` – ${hints[displayValue - 1]}` : ""
                }`
              : "Noch nicht bewertet"}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400/80 dark:text-slate-500/80">
          1 ⭐ {hints?.[0] ?? "Sehr schlecht"} · 5 ⭐ {hints?.[4] ?? "Hervorragend"}
        </p>
      </div>
    );
  };

  const ratingInputValues = [
    formState.growthRating,
    formState.stabilityRating,
    formState.shippingRating,
    formState.careRating,
  ];
  const hasCompleteRatings = ratingInputValues.every((value) => value > 0);
  const averageRatingValue = hasCompleteRatings
    ? (
        ratingInputValues.reduce((sum, value) => sum + value, 0) / ratingInputValues.length
      ).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex min-h-full w-full overflow-hidden bg-black/45 backdrop-blur-sm sm:items-center sm:justify-center sm:px-4 sm:py-10">
      <div className="relative flex h-full w-full flex-col overflow-hidden overflow-y-auto rounded-none bg-white shadow-none sm:mx-auto sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:overflow-hidden sm:rounded-3xl sm:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bericht einreichen</h2>
            <p className="text-sm text-gray-500">
              Teile deine Erfahrungen – wir führen dich Schritt für Schritt durch die wichtigsten Angaben.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Panel schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-4 py-4 sm:max-h-[70vh] sm:space-y-6 sm:px-6 sm:py-5"
        >
          <div className="grid gap-3 min-[380px]:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Leaf className="h-4 w-4 text-green-600" />
                Sorte
              </span>
              <div className="relative">
                <input
                  list="cultivar-suggestions"
                  name="cultivarInput"
                  value={cultivarInput}
                  onChange={handleCultivarInputChange}
                  placeholder="z. B. Amnesia Core Cut"
                  className={`${baseFieldClasses} pr-8`}
                  inputMode="text"
                  autoComplete="off"
                  required
                />
                <datalist id="cultivar-suggestions">
                  {cultivarOptions.map((option) => (
                    <option key={option.value} value={option.label} />
                  ))}
                </datalist>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              {isCultivarLoading && (
                <span className="text-xs text-gray-400">Sorten werden geladen …</span>
              )}
              {cultivarFetchError && !isCultivarLoading && (
                <span className="text-xs text-red-600">{cultivarFetchError}</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Building2 className="h-4 w-4 text-green-600" />
                Anbieter
              </span>
              <div className="relative">
                <select
                  name="providerSlug"
                  value={formState.providerSlug}
                  onChange={handleInputChange}
                  className={`${baseFieldClasses} appearance-none pr-10`}
                  required
                >
                  <option value="">Bitte auswählen …</option>
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <FileText className="h-4 w-4 text-green-600" />
                Anzeigename (optional)
              </span>
              <input
                type="text"
                name="authorName"
                value={formState.authorName}
                onChange={handleInputChange}
                placeholder={formState.anonymous ? "Anonym" : "z. B. @mygrow"}
                disabled={formState.anonymous}
                className={`${baseFieldClasses} ${formState.anonymous ? "bg-gray-100 text-gray-500" : ""}`}
              />
              <span className="text-[11px] text-gray-400">
                {formState.anonymous
                  ? "Anonyme Beiträge werden ohne Namen gespeichert."
                  : "Wenn leer, verwenden wir deinen Kontonamen (falls vorhanden)."}
              </span>
              <div className="mt-1 inline-flex items-center gap-2 text-[11px] font-medium text-gray-600">
                <input
                  id="anonymous-toggle"
                  type="checkbox"
                  checked={formState.anonymous}
                  onChange={handleAnonymousToggle}
                  className="h-4 w-4"
                />
                <label htmlFor="anonymous-toggle" className="cursor-pointer select-none">
                  Anonym posten (Name wird nicht angezeigt, kein Konto-Bezug)
                </label>
              </div>
            </label>
            {formState.anonymous && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Hinweis: Anonyme Beiträge lassen sich später nicht mehr bearbeiten oder löschen, weil
                sie keinem Konto zugeordnet sind.
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Sun className="h-4 w-4 text-green-600" />
                Indoor / Outdoor
              </span>
              <div className="relative">
                <select
                  name="cultivationType"
                  value={formState.cultivationType}
                  onChange={handleInputChange}
                  className={`${baseFieldClasses} w-full appearance-none pr-6`}
                >
                  <option value="">Bitte auswählen …</option>
                  {cultivationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Lamp className="h-4 w-4 text-green-600" />
                Beleuchtung (Watt)
              </span>
              <input
                type="text"
                name="lampType"
                value={formState.lampType}
                onChange={handleInputChange}
                placeholder="z. B. 480W LED Panel"
                className={baseFieldClasses}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Sparkles className="h-4 w-4 text-green-600" />
                Washer-Genetik (optional)
              </span>
              <div className="relative">
                <select
                  name="washerGenetics"
                  value={formState.washerGenetics}
                  onChange={handleInputChange}
                  className={`${baseFieldClasses} w-full appearance-none pr-6`}
                >
                  <option value="">Keine Angabe</option>
                  <option value="yes">Ja – gute Washer-Genetik</option>
                  <option value="no">Nein – nicht geeignet</option>
                  <option value="unknown">Unbekannt / nicht getestet</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Ruler className="h-4 w-4 text-green-600" />
                Zeltgröße / Setup
              </span>
              <div className="relative">
                <select
                  name="tentSize"
                  value={formState.tentSize}
                  onChange={handleInputChange}
                  className={`${baseFieldClasses} w-full appearance-none pr-6 py-1`}
                >
                  <option value="">Optional auswählen …</option>
                  {tentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Leaf className="h-4 w-4 text-green-600" />
                Medium
              </span>
              <div className="relative">
                <select
                  name="medium"
                  value={formState.medium}
                  onChange={handleInputChange}
                  className={`${baseFieldClasses} w-full appearance-none pr-6`}
                >
                  <option value="">Optional auswählen …</option>
                  {mediumOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Bewertungen (1–5 Sterne)
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {renderRatingInput(
                "growthRating",
                "Wuchsverhalten",
                "Stärke, Wachstumsgeschwindigkeit, Resistenz",
              )}
              {renderRatingInput(
                "stabilityRating",
                "Genetische Stabilität",
                "Einheitlichkeit zwischen Pflanzen, keine Ausreißer",
              )}
              {renderRatingInput(
                "shippingRating",
                "Lieferung & Service",
                "Verpackung, Geschwindigkeit, Kommunikation",
              )}
              {renderRatingInput(
                "careRating",
                "Pflegeaufwand / Schwierigkeitsgrad",
                "Wie anspruchsvoll ist der Steckling im Grow? Bewertet wird die Toleranz gegenüber pH-, Düngungs-, Klima-, Licht- oder Trainingsfehlern.",
              )}
              <div className="flex flex-col justify-center gap-2 rounded-2xl border border-green-200 bg-green-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-sm font-semibold text-green-700 dark:text-sky-200">
                  Gesamtbewertung
                </p>
                <p className="text-xs text-green-700/80 dark:text-sky-300/80">
                  Durchschnitt aller Teilkategorien
                </p>
                <div className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-green-700 dark:text-sky-200">
                  {averageRatingValue ?? "–"}
                  <span className="text-base font-semibold text-green-600/70 dark:text-sky-300/80">
                    / 5
                  </span>
                </div>
              </div>
            </div>
          </section>

          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 text-green-600" />
              Zusammenfassung / Highlights
            </span>
            <textarea
              name="summary"
              value={formState.summary}
              onChange={handleInputChange}
              placeholder="Wie verlief der Grow? Besonderheiten, Geruch, Ertrag, Stabilität …"
              rows={4}
              className={`${baseFieldClasses} min-h-[160px] resize-none leading-relaxed`}
              required
            />
          </label>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Upload className="h-4 w-4 text-green-600" />
              Bilder hinzufügen (optional)
            </span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-6 text-center text-sm text-gray-500 transition hover:border-green-400 hover:text-gray-700">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="mb-3 h-8 w-8 text-green-500" />
              <span>Dateien hier ablegen oder klicken zum Auswählen</span>
              <span className="mt-1 text-xs text-gray-400">JPG, PNG, HEIC – bis zu 10 Bilder</span>
            </label>
            {imageError && <p className="mt-2 text-xs text-red-600">{imageError}</p>}
            {formState.images.length > 0 && (
              <ul className="mt-3 space-y-2 text-xs text-gray-500">
                {formState.images.map((file, index) => (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    <span className="truncate pr-3">
                      {file.name} – {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, idx) => idx !== index),
                        }));
                        setImageError(null);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      aria-label={`${file.name} entfernen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {showSuccess ? (
              <span className="text-sm font-medium text-green-600">
                ✅ Bericht gespeichert! Er erscheint nach der Moderation.
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                Deine Angaben werden vor Veröffentlichung kurz geprüft.
              </span>
            )}
            {errorMessage && !showSuccess && (
              <span className="text-sm text-red-600">{errorMessage}</span>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                {isSubmitting ? "Wird gespeichert …" : "Bericht übermitteln"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportSubmissionPanel;
