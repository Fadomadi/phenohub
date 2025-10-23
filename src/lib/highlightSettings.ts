import type { PrismaClient } from "@prisma/client";
import type { Seed } from "@/types/domain";

export type HighlightSeedConfig = {
  showSeeds: boolean;
  showSupportCTA: boolean;
  showCommunityFeedback: boolean;
  showCommunityNav: boolean;
  plannedNotes: string;
  seeds: Seed[];
};

const HIGHLIGHT_SEEDS_KEY = "highlight-seeds";

const DEFAULT_SEED_CONFIG: HighlightSeedConfig = {
  showSeeds: true,
  showSupportCTA: true,
  showCommunityFeedback: true,
  showCommunityNav: true,
  plannedNotes: "",
  seeds: [],
};

const importPrisma = async () => {
  const prismaModule = await import("@/lib/prisma");
  return prismaModule.default;
};

const sanitizeSeed = (seed: unknown, fallbackId: number): Seed => {
  if (!seed || typeof seed !== "object") {
    return {
      id: fallbackId,
      slug: `seed-${fallbackId}`,
      name: "Unbenannte Genetik",
      breeder: "Unbekannt",
      genetics: "Keine Angaben",
      type: "Feminisiert",
      floweringTime: "Unbekannt",
      yield: "Keine Angaben",
      popularity: 0,
      thumbnails: [],
    };
  }

  const record = seed as Record<string, unknown>;
  const coerceNumber = (value: unknown, fallback = 0) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const id = coerceNumber(record.id, fallbackId);
  const popularity = Math.max(0, coerceNumber(record.popularity, 0));
  const thumbnails = Array.isArray(record.thumbnails)
    ? record.thumbnails
        .map((entry) => (typeof entry === "string" ? entry : null))
        .filter((entry): entry is string => Boolean(entry))
    : [];

  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name.trim()
      : "Unbenannte Genetik";

  const slug =
    typeof record.slug === "string" && record.slug.trim().length > 0
      ? record.slug.trim()
      : name.toLowerCase().replace(/\s+/g, "-");

  const normalizeString = (key: string, fallback: string) => {
    const value = record[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
  };

  const typeValue = normalizeString("type", "Feminisiert");
  const allowedTypes = new Set(["Feminisiert", "Regular", "Autoflower"]);

  return {
    id,
    slug,
    name,
    breeder: normalizeString("breeder", "Unbekannt"),
    genetics: normalizeString("genetics", "Keine Angaben"),
    type: allowedTypes.has(typeValue) ? (typeValue as Seed["type"]) : "Feminisiert",
    floweringTime: normalizeString("floweringTime", "Unbekannt"),
    yield: normalizeString("yield", "Keine Angaben"),
    popularity,
    thumbnails,
  };
};

export const normalizeHighlightSeedConfig = (value: unknown): HighlightSeedConfig => {
  if (!value || typeof value !== "object") {
    return DEFAULT_SEED_CONFIG;
  }

  const record = value as Record<string, unknown>;
  const showSeeds =
    typeof record.showSeeds === "boolean" ? record.showSeeds : DEFAULT_SEED_CONFIG.showSeeds;
  const showSupportCTA =
    typeof record.showSupportCTA === "boolean"
      ? record.showSupportCTA
      : DEFAULT_SEED_CONFIG.showSupportCTA;
  const showCommunityFeedback =
    typeof record.showCommunityFeedback === "boolean"
      ? record.showCommunityFeedback
      : DEFAULT_SEED_CONFIG.showCommunityFeedback;
  const showCommunityNav =
    typeof record.showCommunityNav === "boolean"
      ? record.showCommunityNav
      : DEFAULT_SEED_CONFIG.showCommunityNav;
  const plannedNotes =
    typeof record.plannedNotes === "string" ? record.plannedNotes : DEFAULT_SEED_CONFIG.plannedNotes;

  const seedsRaw = Array.isArray(record.seeds) ? record.seeds : [];
  const seeds = seedsRaw.map((seed, index) => sanitizeSeed(seed, index + 1));

  return {
    showSeeds,
    showSupportCTA,
    showCommunityFeedback,
    showCommunityNav,
    plannedNotes,
    seeds,
  };
};

export const getHighlightSeedConfig = async (
  prismaClient?: PrismaClient | null,
): Promise<HighlightSeedConfig> => {
  const prisma = prismaClient ?? (await importPrisma());
  if (!prisma) return DEFAULT_SEED_CONFIG;

  const setting = await prisma.siteSetting.findUnique({
    where: { key: HIGHLIGHT_SEEDS_KEY },
  });

  if (!setting) {
    return DEFAULT_SEED_CONFIG;
  }

  return normalizeHighlightSeedConfig(setting.value);
};

export const saveHighlightSeedConfig = async (
  config: HighlightSeedConfig,
  prismaClient?: PrismaClient | null,
) => {
  const prisma = prismaClient ?? (await importPrisma());
  if (!prisma) {
    throw new Error("Prisma client nicht verfügbar.");
  }

  const sanitized = {
    showSeeds: Boolean(config.showSeeds),
    showSupportCTA: Boolean(
      typeof config.showSupportCTA === "boolean"
        ? config.showSupportCTA
        : DEFAULT_SEED_CONFIG.showSupportCTA,
    ),
    showCommunityFeedback: Boolean(
      typeof config.showCommunityFeedback === "boolean"
        ? config.showCommunityFeedback
        : DEFAULT_SEED_CONFIG.showCommunityFeedback,
    ),
    showCommunityNav: Boolean(
      typeof config.showCommunityNav === "boolean"
        ? config.showCommunityNav
        : DEFAULT_SEED_CONFIG.showCommunityNav,
    ),
    plannedNotes:
      typeof config.plannedNotes === "string" ? config.plannedNotes.trim() : DEFAULT_SEED_CONFIG.plannedNotes,
    seeds: config.seeds.map((seed, index) => sanitizeSeed(seed, index + 1)),
  };

  await prisma.siteSetting.upsert({
    where: { key: HIGHLIGHT_SEEDS_KEY },
    create: {
      key: HIGHLIGHT_SEEDS_KEY,
      value: sanitized,
    },
    update: {
      value: sanitized,
    },
  });

  return sanitized;
};
