import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[PROFILE_API] Prisma unavailable", error);
    return null;
  }
};

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Profil kann gerade nicht geladen werden." },
      { status: 503 },
    );
  }

  const userId = Number(auth.session.user.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Ungültige Session." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
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

  if (!user) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  const computeHandle = () => {
    const handle =
      user.username?.trim() ||
      user.name?.trim() ||
      auth.session?.user?.name?.toString() ||
      auth.session?.user?.email?.split("@")[0] ||
      `grower${user.id}`;
    return handle.trim();
  };

  const formatUsernameSuggestion = () => {
    const base = computeHandle().toLowerCase();
    const normalized = base
      .replace(/[^a-z0-9_.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 20);
    if (normalized.length >= 3) {
      return normalized;
    }
    return `grower${user.id}`;
  };

  const reports = await prisma.report.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      likes: true,
      comments: true,
      images: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: computeHandle(),
      role: user.role,
      status: user.status,
      plan: user.plan,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      suggestedUsername: formatUsernameSuggestion(),
      reports,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const prisma = await importPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Profil-Update aktuell nicht möglich." }, { status: 503 });
  }

  const userId = Number(auth.session.user.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Ungültige Session." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, username } = body ?? {};

  const updates: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string") {
      return NextResponse.json({ error: "Name muss ein String sein." }, { status: 400 });
    }
    updates.name = name.trim() || null;
  }

  if (username !== undefined) {
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Nutzername muss ein String sein." }, { status: 400 });
    }
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: "Nutzername muss mindestens 3 Zeichen enthalten." },
        { status: 400 },
      );
    }
    if (!/^[a-z0-9_.-]{3,20}$/.test(trimmed)) {
      return NextResponse.json({ error: "Nutzername muss 3-20 Zeichen (a-z, 0-9, _.-) enthalten." }, { status: 400 });
    }
    if (trimmed) {
      const existing = await prisma.user.findUnique({ where: { username: trimmed } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "Nutzername bereits vergeben." }, { status: 409 });
      }
      updates.username = trimmed;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen übermittelt." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
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
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
