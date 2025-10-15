import { PrismaClient } from "../src/generated/prisma";
import { recalcAllMetrics } from "./lib/metrics";

const parseIds = (): number[] => {
  const args = process.argv.slice(2);
  const collected: number[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--id" || arg === "-i") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Bitte eine ID nach --id angeben.");
      }
      collected.push(Number(value));
      index += 1;
      continue;
    }

    if (arg.startsWith("--id=")) {
      collected.push(Number(arg.split("=")[1]));
      continue;
    }

    if (arg === "--ids") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Bitte ID-Liste nach --ids angeben.");
      }
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => collected.push(Number(item)));
      index += 1;
      continue;
    }

    if (arg.startsWith("--ids=")) {
      arg
        .split("=")[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => collected.push(Number(item)));
    }
  }

  const invalid = collected.filter((value) => !Number.isInteger(value) || value <= 0);
  if (invalid.length > 0) {
    throw new Error(`Ungültige Report-ID(s): ${invalid.join(", ")}`);
  }

  const unique = Array.from(new Set(collected));
  if (unique.length === 0) {
    throw new Error("Bitte mindestens eine Report-ID angeben (--id 18 oder --ids 18,19).");
  }

  return unique;
};

const prisma = new PrismaClient();

async function main() {
  const ids = parseIds();
  console.log(`🗑️  Lösche Reports mit ID(s): ${ids.join(", ")}`);

  const result = await prisma.report.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`✅ Entfernte Einträge: ${result.count}`);

  if (result.count > 0) {
    console.log("🔄 Aktualisiere Anbieter- und Sorten-Metriken …");
    await recalcAllMetrics(prisma);
    console.log("✅ Aggregierte Werte aktualisiert.");
  } else {
    console.log("ℹ️  Keine passenden Reports gefunden – keine Aggregation nötig.");
  }
}

main()
  .catch((error) => {
    console.error("[DELETE_REPORT]", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

