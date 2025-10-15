import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cultivars = await prisma.cultivar.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        aka: true,
        breeder: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ cultivars });
  } catch (error) {
    console.error("[CULTIVARS_API]", error);
    return NextResponse.json({ error: "Cultivars could not be loaded." }, { status: 500 });
  }
}

