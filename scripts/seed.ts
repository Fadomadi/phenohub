import { PrismaClient } from "@prisma/client";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const prisma = new PrismaClient();

async function main() {
  const cultivarData = [
      {
        name: "Papaya Punch",
        slug: "papaya-punch",
        aka: ["Papaya"],
        cloneOnly: true,
        cutInfo: "US Clone",
        reportCount: 47,
        avgRating: "4.7",
        imageCount: 142,
        trending: true,
        thumbnails: ["🌱", "🌿", "🪴", "🌺", "💚", "🍃"],
      },
      {
        name: "Wedding Cake",
        slug: "wedding-cake",
        aka: ["Pink Cookies"],
        cloneOnly: false,
        reportCount: 38,
        avgRating: "4.5",
        imageCount: 98,
        trending: true,
        thumbnails: ["🌿", "🌱", "🪴", "🌸", "💐", "🌼"],
      },
      {
        name: "Gelato #41",
        slug: "gelato-41",
        aka: [],
        cloneOnly: true,
        reportCount: 35,
        avgRating: "4.8",
        imageCount: 112,
        trending: true,
        thumbnails: ["🪴", "🌱", "🌿", "🌺", "🌷", "🌹"],
      },
      {
        name: "Zkittlez",
        slug: "zkittlez",
        aka: ["Skittles"],
        cloneOnly: false,
        reportCount: 29,
        avgRating: "4.3",
        imageCount: 87,
        trending: false,
        thumbnails: ["🌱", "🌿", "🍃", "🌺", "🌸", "💐"],
      },
      {
        name: "Amnesia Core Cut von Flowery Field",
        slug: "gmo-cookies",
        aka: ["GMO Cookies"],
        cloneOnly: true,
        reportCount: 52,
        avgRating: "4.9",
        imageCount: 156,
        trending: true,
        thumbnails: ["🌿", "🪴", "🌱", "🍃", "💚", "🌺"],
      },
  ];

  const cultivars = await Promise.all(
    cultivarData.map((data) =>
      prisma.cultivar.upsert({
        where: { slug: data.slug },
        update: data,
        create: data,
      }),
    ),
  );

  const cultivarLookup = Object.fromEntries(
    cultivars.map((cultivar) => [cultivar.slug, cultivar.id]),
  );

  const additionalCultivars: Array<{
    name: string;
    cloneOnly: boolean;
    cutInfo?: string | null;
  }> = [
    { name: "Cyberskunk2077", cloneOnly: true, cutInfo: "Clone Only" },
    { name: "Papaya Punch", cloneOnly: true, cutInfo: "US Clone" },
    { name: "Forbidden Fruit", cloneOnly: false },
    { name: "Zombie Kush", cloneOnly: true, cutInfo: "Purple Pheno" },
    { name: "Super Lemon Haze", cloneOnly: true, cutInfo: "Franco's Cut" },
    { name: "Blockberry", cloneOnly: false },
    { name: "Glitterbomb", cloneOnly: false },
    { name: "Oreoz", cloneOnly: false },
    { name: "RS11", cloneOnly: false },
    { name: "Apple Jax", cloneOnly: false },
    { name: "Super Boof Cherry #26", cloneOnly: false },
    { name: "Dantes Inferno #8", cloneOnly: true, cutInfo: "Mile High Dave Cut" },
  ];

  for (const entry of additionalCultivars) {
    const slug = slugify(entry.name);
    const cultivar = await prisma.cultivar.upsert({
      where: { slug },
      update: {
        name: entry.name,
        cloneOnly: entry.cloneOnly,
        cutInfo: entry.cutInfo ?? null,
      },
      create: {
        name: entry.name,
        slug,
        aka: [],
        cloneOnly: entry.cloneOnly,
        cutInfo: entry.cutInfo ?? null,
        reportCount: 0,
        avgRating: "0",
        imageCount: 0,
        trending: false,
        thumbnails: [],
      },
    });

    cultivarLookup[slug] = cultivar.id;
  }

  const providerData = [
      {
        name: "Flowery Field",
        slug: "flower-refills",
        country: "NL",
        countryFlag: "🇳🇱",
        avgScore: "4.7",
        reportCount: 89,
        shippingScore: "4.8",
        vitalityScore: "4.6",
      },
      {
        name: "Rootsfarms",
        slug: "rootsfarms",
        country: "DE",
        countryFlag: "🇩🇪",
        avgScore: "4.6",
        reportCount: 64,
        shippingScore: "4.5",
        vitalityScore: "4.7",
      },
      {
        name: "HerbalGrow",
        slug: "herbalgrow",
        country: "AT",
        countryFlag: "🇦🇹",
        avgScore: "4.4",
        reportCount: 41,
        shippingScore: "4.2",
        vitalityScore: "4.6",
      },
      {
        name: "GrowCannabis24",
        slug: "growcannabis24",
        country: "ES",
        countryFlag: "🇪🇸",
        avgScore: "4.5",
        reportCount: 52,
        shippingScore: "4.4",
        vitalityScore: "4.5",
      },
      {
        name: "Hanflieferant",
        slug: "hanflieferant",
        country: "DE",
        countryFlag: "🇩🇪",
        avgScore: "4.2",
        reportCount: 39,
        shippingScore: "4.1",
        vitalityScore: "4.3",
      },
      {
        name: "Krumme Gurke",
        slug: "krumme-gurke",
        country: "CH",
        countryFlag: "🇨🇭",
        avgScore: "4.1",
        reportCount: 28,
        shippingScore: "4.0",
        vitalityScore: "4.2",
      },
      {
        name: "Clone Central",
        slug: "clone-central",
        country: "DE",
        countryFlag: "🇩🇪",
        avgScore: "4.3",
        reportCount: 44,
        shippingScore: "4.2",
        vitalityScore: "4.4",
      },
      {
        name: "Elite Cuts",
        slug: "elite-cuts",
        country: "NL",
        countryFlag: "🇳🇱",
        avgScore: "4.8",
        reportCount: 71,
        shippingScore: "4.7",
        vitalityScore: "4.8",
      },
      {
        name: "Green Genetics",
        slug: "green-genetics",
        country: "AT",
        countryFlag: "🇦🇹",
        avgScore: "4.0",
        reportCount: 36,
        shippingScore: "3.8",
        vitalityScore: "4.1",
      },
  ];

  const providers = await Promise.all(
    providerData.map((data) =>
      prisma.provider.upsert({
        where: { slug: data.slug },
        update: data,
        create: data,
      }),
    ),
  );

  const providerLookup = Object.fromEntries(
    providers.map((provider) => [provider.slug, provider.id]),
  );

  const floweryFieldSlug = "flower-refills";
  const floweryFieldId = providerLookup[floweryFieldSlug];

  if (!floweryFieldId) {
    throw new Error("Flowery Field provider missing in seed setup");
  }

  const krummeGurkeId = providerLookup["krumme-gurke"];
  if (!krummeGurkeId) {
    throw new Error("Krumme Gurke provider missing in seed setup");
  }

  const floweryFieldCultivars: Array<{
    cultivar: string;
    breeder?: string | null;
    price: string;
    category?: string | null;
    terpenesJson?: string | null;
    notes?: string | null;
  }> = [
    { cultivar: "LSD", breeder: "Barneys Farm", price: "9.50", category: "THC" },
    { cultivar: "Blue Cheese", breeder: "Barneys Farm", price: "9.50", category: "THC" },
    { cultivar: "Bubba Kush", breeder: "Humboldt Seed Organisation", price: "9.50", category: "THC" },
    { cultivar: "Chronic", breeder: "Serious Seeds", price: "9.50", category: "THC" },
    { cultivar: "Cookies & Cream", breeder: "Exotic Genetix", price: "9.50", category: "THC" },
    { cultivar: "Vienna Red Light", breeder: "Vienna Seeds", price: "9.50", category: "THC" },
    { cultivar: "Vienna White Light", breeder: "Vienna Seeds", price: "9.50", category: "THC" },
    { cultivar: "Speed Queen", breeder: "Mandala Seeds", price: "9.50", category: "THC" },
    { cultivar: "Somango", breeder: "Soma Seeds", price: "9.50", category: "THC" },
    { cultivar: "Sensi Star", breeder: "Paradise Seeds", price: "9.50", category: "THC" },
    { cultivar: "OG Kush #18", breeder: "Reserva Privada", price: "12.50", category: "THC" },
    { cultivar: "Grüne Hessin", breeder: "Clone Only", price: "9.50", category: "THC" },
    { cultivar: "White Satin", breeder: "Mandala Seeds", price: "9.50", category: "THC" },
    { cultivar: "Wappa", breeder: "Paradise Seeds", price: "9.50", category: "THC" },
    { cultivar: "Trainwreck", breeder: "Greenhouse", price: "9.50", category: "THC" },
    { cultivar: "Sleestack Skunk", breeder: "DNA Genetics", price: "9.50", category: "THC" },
    { cultivar: "Real Killer Skunk", breeder: "Reserva Privada", price: "9.50", category: "THC" },
    { cultivar: "Nebula", breeder: "Paradise Seeds", price: "9.50", category: "THC" },
    { cultivar: "Cannalope", price: "9.50", category: "THC" },
    { cultivar: "French Macaron", breeder: "THSeeds", price: "9.50", category: "THC" },
    {
      cultivar: "Wedding Cake aka Triangle Mints #23 (Original Portland Cut)",
      price: "9.50",
      category: "THC",
    },
    { cultivar: "Lemon Zkittles", breeder: "Dutch Passion", price: "10.50", category: "THC" },
    { cultivar: "Vienna Bubble Gum", breeder: "Vienna Seeds", price: "9.50", category: "THC" },
    { cultivar: "Erdbeerli", breeder: "Clone Only / Schweiz", price: "10.50", category: "THC" },
    { cultivar: "Alpine Rocket", breeder: "Clone Only / Schweiz", price: "9.50", category: "THC" },
    { cultivar: "Super Lemon Haze", breeder: "Greenhouse", price: "9.50", category: "THC" },
    { cultivar: "Moonshine Haze", breeder: "Rare Dankness", price: "9.50", category: "THC" },
    { cultivar: "Critical 2.0", price: "9.50", category: "THC" },
    { cultivar: "Lemon Cookie Haze", breeder: "Ethos Genetics", price: "9.50", category: "THC" },
    { cultivar: "Gorilla Glue", price: "9.50", category: "THC" },
    { cultivar: "Strawberry Lemonade", breeder: "Barney’s Farm", price: "9.50", category: "THC" },
    { cultivar: "Blue Monkey", price: "9.50", category: "THC" },
    { cultivar: "Franco’s Lemon Cheese", breeder: "Greenhouse", price: "9.50", category: "THC" },
    { cultivar: "Kimbo Kush", breeder: "Exotic Genetics", price: "9.50", category: "THC" },
    { cultivar: "Gorilla Zkittlez", breeder: "Barney’s Farm", price: "9.50", category: "THC" },
    { cultivar: "Apple Fritter", breeder: "Original Lumpy’s Cut", price: "9.50", category: "THC" },
    { cultivar: "3 Chems", breeder: "Goldcut", price: "9.50", category: "THC" },
    { cultivar: "Point of Blue Dream", price: "9.50", category: "THC" },
    { cultivar: "Wedding Ghost", price: "9.50", category: "THC" },
    { cultivar: "Banana Glue", price: "9.50", category: "THC" },
    { cultivar: "Banana Runtz", breeder: "Black Runtz Cut", price: "9.50", category: "THC" },
    { cultivar: "Papaya Punch", price: "9.50", category: "THC" },
    { cultivar: "Black Cherry Punch", price: "9.50", category: "THC" },
    { cultivar: "Zozay", price: "12.50", category: "THC" },
    { cultivar: "Ztrawberry", price: "12.50", category: "THC" },
    { cultivar: "Blueberry Muffin", price: "12.50", category: "THC" },
    { cultivar: "Bananaconda #4", price: "12.50", category: "THC" },
    { cultivar: "Hollywood Cookies Cut", price: "12.50", category: "THC" },
    { cultivar: "Ice Cream Cake", breeder: "Seed Junky Breeder Cut", price: "12.50", category: "THC" },
    { cultivar: "Cap Junky", breeder: "Capulator x Seed Junky Genetics Original Breeder Cut", price: "12.50", category: "THC" },
    { cultivar: "Dr Greenthumb’s Em-Dog By B-Real", price: "12.50", category: "THC" },
    { cultivar: "Gary Payton", breeder: "Cookies Cut", price: "12.50", category: "THC" },
    { cultivar: "Amnesia Core Cut", price: "9.50", category: "THC" },
    { cultivar: "S1", breeder: "Clone Only CBD", price: "9.50", category: "CBD" },
    { cultivar: "White Widow", breeder: "Clone Only CBD", price: "9.50", category: "CBD" },
    { cultivar: "Harlequin", breeder: "Clone Only CBD", price: "9.50", category: "CBD" },
    { cultivar: "Charlotte’s Angel", breeder: "Dutch Passion CBD", price: "9.50", category: "CBD" },
    { cultivar: "Victory", breeder: "Dutch Passion", price: "9.50", category: "CBD" },
    { cultivar: "Rainbow Belts", price: "10.50", category: "THC" },
    { cultivar: "OreoZ", price: "10.50", category: "THC" },
    { cultivar: "Gelato 33", price: "9.50", category: "THC" },
    { cultivar: "Baby Jokerz", price: "9.50", category: "THC" },
    { cultivar: "Austrian Juice", price: "9.50", category: "THC" },
    { cultivar: "Studio 54", breeder: "Deep East Farms x Doja Exclusive Cut", price: "10.50", category: "THC" },
    { cultivar: "Sangria", price: "9.50", category: "THC" },
    {
      cultivar: "Permanent Marker",
      breeder: "Original Doja Exclusive x Seed Junky Breeder Cut",
      price: "9.50",
      category: "THC",
    },
  ];

  for (const offering of floweryFieldCultivars) {
    const slug = slugify(offering.cultivar);

    const cultivar = await prisma.cultivar.upsert({
      where: { slug },
      update: {
        breeder: offering.breeder ?? null,
      },
      create: {
        name: offering.cultivar,
        slug,
        aka: [],
        cloneOnly: true,
        reportCount: 0,
        avgRating: "0",
        imageCount: 0,
        trending: false,
        thumbnails: [],
        breeder: offering.breeder ?? null,
      },
    });

    const parsedTerpenes = offering.terpenesJson
      ? (() => {
          try {
            return JSON.parse(offering.terpenesJson!);
          } catch (_error) {
            console.warn("[SEED] Invalid terpene JSON for", offering.cultivar);
            return null;
          }
        })()
      : null;

    await prisma.cultivarOffering.upsert({
      where: {
        providerId_cultivarId: {
          providerId: floweryFieldId,
          cultivarId: cultivar.id,
        },
      },
      update: {
        priceEur: offering.price,
        category: offering.category ?? null,
        terpenes: parsedTerpenes,
        notes: offering.notes ?? null,
      },
      create: {
        providerId: floweryFieldId,
        cultivarId: cultivar.id,
        priceEur: offering.price,
        category: offering.category ?? null,
        terpenes: parsedTerpenes,
        notes: offering.notes ?? null,
      },
    });
  }

  const krummeGurkeCultivars: Array<{
    name: string;
    price?: string | null;
    category?: string | null;
  }> = [
    { name: "Cyberskunk2077", price: "10.50" },
    { name: "Papaya Punch", price: "9.50" },
    { name: "Forbidden Fruit", price: "9.50" },
    { name: "Zombie Kush", price: "9.50" },
    { name: "Super Lemon Haze", price: "9.50" },
    { name: "Blockberry", price: "9.50" },
    { name: "Glitterbomb", price: "9.50" },
    { name: "Oreoz", price: "9.50" },
    { name: "RS11", price: "9.50" },
    { name: "Apple Jax", price: "9.50" },
    { name: "Super Boof Cherry #26", price: "10.50" },
    { name: "Dantes Inferno #8", price: "10.50" },
  ];

  for (const entry of krummeGurkeCultivars) {
    const slug = slugify(entry.name);
    const cultivarId = cultivarLookup[slug];
    if (!cultivarId) {
      console.warn(`[SEED] Cultivar ${entry.name} missing for Krumme Gurke offerings`);
      continue;
    }

    await prisma.cultivarOffering.upsert({
      where: {
        providerId_cultivarId: {
          providerId: krummeGurkeId,
          cultivarId,
        },
      },
      update: {
        priceEur: entry.price ?? "9.50",
        category: entry.category ?? "THC",
        terpenes: null,
        notes: null,
      },
      create: {
        providerId: krummeGurkeId,
        cultivarId,
        priceEur: entry.price ?? "9.50",
        category: entry.category ?? "THC",
        terpenes: null,
        notes: null,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "highlight-seeds" },
    update: {
      value: {
        showSeeds: true,
        showSupportCTA: true,
        plannedNotes: "",
        seeds: [],
      },
    },
    create: {
      key: "highlight-seeds",
      value: {
        showSeeds: true,
        showSupportCTA: true,
        plannedNotes: "",
        seeds: [],
      },
    },
  });

  const reportsData = [
      {
        title: "Amnesia Core Cut – Flowery Field liefert Top-Qualität",
        slug: "amnesia-core-cut-flowery-field-top-versand",
        excerpt:
          "Perfekt verpackt, kam frisch und vital an. Wuchs stabil, typischer GMO-Geruch.",
        authorHandle: "@mike_grows",
        shipping: 5,
        vitality: 4,
        stability: 5,
        overall: 4.7,
        likes: 28,
        comments: 12,
        views: 342,
        images: ["🌱", "🌿", "🪴", "💚"],
        cultivarId:
          cultivarLookup["gmo-cookies"],
        providerId: providerLookup["flower-refills"],
        publishedAt: new Date("2025-10-05"),
      },
      {
        title: "Papaya Punch Review – Starke Genetik!",
        slug: "papaya-punch-review",
        excerpt:
          "Wurzelte schnell, sehr kräftige Pflanzen. Kleiner Versandstress, aber top erholt.",
        authorHandle: "@grower420",
        shipping: 4,
        vitality: 5,
        stability: 4,
        overall: 4.5,
        likes: 19,
        comments: 8,
        views: 256,
        images: ["🌿", "🌱", "🪴", "🌺"],
        cultivarId: cultivarLookup["papaya-punch"],
        providerId: providerLookup["clone-central"],
        publishedAt: new Date("2025-10-04"),
      },
      {
        title: "Wedding Cake Grow – Elite Cuts liefert ab",
        slug: "wedding-cake-elite-cuts",
        excerpt:
          "Beeindruckende Qualität! Stecklinge sahen professionell aus, keine Probleme beim Anwachsen.",
        authorHandle: "@plantlover",
        shipping: 5,
        vitality: 5,
        stability: 5,
        overall: 5.0,
        likes: 45,
        comments: 21,
        views: 512,
        images: ["🪴", "🌱", "🌿", "🌸"],
        cultivarId: cultivarLookup["wedding-cake"],
        providerId: providerLookup["elite-cuts"],
        publishedAt: new Date("2025-10-03"),
      },
      {
        title: "Gelato #41 Test – Green Genetics Erfahrung",
        slug: "gelato-41-green-genetics",
        excerpt:
          "Versand dauerte etwas, aber Pflanzen waren okay. Wachstum war stabil.",
        authorHandle: "@indoor_expert",
        shipping: 3,
        vitality: 4,
        stability: 4,
        overall: 3.7,
        likes: 12,
        comments: 5,
        views: 189,
        images: ["🌱", "🌿", "🪴"],
        cultivarId: cultivarLookup["gelato-41"],
        providerId: providerLookup["green-genetics"],
        publishedAt: new Date("2025-10-02"),
      },
      {
        title: "Amnesia Core Cut – Zweiter Test mit Flowery Field",
        slug: "amnesia-core-cut-flowery-field-zweiter-test",
        excerpt:
          "Konsistent top! Schon meine dritte Bestellung. Immer frisch, immer vital.",
        authorHandle: "@cannabist_pro",
        shipping: 5,
        vitality: 5,
        stability: 5,
        overall: 5.0,
        likes: 34,
        comments: 15,
        views: 421,
        images: ["🌿", "🌱", "💚", "🍃"],
        cultivarId:
          cultivarLookup["gmo-cookies"],
        providerId: providerLookup["flower-refills"],
        publishedAt: new Date("2025-10-01"),
      },
  ];

  const preparedReports = reportsData.map((data) => ({
    ...data,
    status: "PUBLISHED" as const,
    reviewNote: null,
    moderatedAt: data.publishedAt ?? new Date(),
  }));

  await Promise.all(
    preparedReports.map((data) =>
      prisma.report.upsert({
        where: { slug: data.slug },
        update: data,
        create: data,
      }),
    ),
  );

  console.log("Seed abgeschlossen ✅");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
