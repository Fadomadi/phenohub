import prisma from "@/lib/prisma";

async function run() {
  await prisma.siteSetting.upsert({
    where: { key: "highlight-seeds" },
    update: {
      value: {
        showSeeds: true,
        showSupportCTA: true,
        showCommunityFeedback: true,
        showCommunityNav: true,
        plannedNotes: "",
        seeds: [],
      },
    },
    create: {
      key: "highlight-seeds",
      value: {
        showSeeds: true,
        showSupportCTA: true,
        showCommunityFeedback: true,
        showCommunityNav: true,
        plannedNotes: "",
        seeds: [],
      },
    },
  });
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
