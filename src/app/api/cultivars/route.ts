import { NextResponse } from "next/server";
import { mockCultivars } from "@/data/mockData";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[CULTIVARS_API] Prisma unavailable – fallback to mock data", error);
    return null;
  }
};

export async function GET() {
  const prisma = await importPrisma();

  if (!prisma) {
    return NextResponse.json({ cultivars: mockCultivars });
  }

  try {
    const cultivars = await prisma.cultivar.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        aka: true,
        breeder: true,
        cutInfo: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ cultivars });
  } catch (error) {
    console.error("[CULTIVARS_API]", error);
    return NextResponse.json({ error: "Cultivars could not be loaded." }, { status: 500 });
  }
}
