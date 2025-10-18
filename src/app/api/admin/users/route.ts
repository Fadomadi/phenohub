import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[ADMIN_USERS_LIST] Prisma unavailable", error);
    return null;
  }
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Datenbank nicht verfügbar. Bitte später erneut versuchen." },
      { status: 503 },
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      status: true,
      plan: true,
      verifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
