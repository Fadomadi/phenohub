import { PrismaClient } from "@prisma/client";
import { recalcAllMetrics } from "./lib/metrics";

const prisma = new PrismaClient();

async function main() {
  await recalcAllMetrics(prisma);
}

main()
  .catch((error) => {
    console.error("[RECALC_METRICS]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
