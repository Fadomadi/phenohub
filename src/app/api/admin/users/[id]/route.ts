import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";

const ALLOWED_ROLES = new Set(["USER", "SUPPORTER", "VERIFIED", "MODERATOR", "ADMIN", "OWNER"]);
const ALLOWED_STATUS = new Set(["ACTIVE", "INVITED", "SUSPENDED"]);

type RouteParams = { id: string };

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actingRole = session.user.role ?? "USER";
  if (actingRole !== "OWNER") {
    return NextResponse.json({ error: "Nur Owner dürfen Rollen ändern." }, { status: 403 });
  }

  const params = await context.params;
  const userId = Number(params.id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Ungültige Nutzer-ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { role, status, plan, verified } = body ?? {};

  const updates: Record<string, unknown> = {};

  if (role !== undefined) {
    if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
    }
    updates.role = role;
  }

  if (status !== undefined) {
    if (typeof status !== "string" || !ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
    }
    updates.status = status;
  }

  if (plan !== undefined) {
    if (typeof plan !== "string") {
      return NextResponse.json({ error: "Ungültiger Plan." }, { status: 400 });
    }
    updates.plan = plan;
  }

  if (verified !== undefined) {
    updates.verifiedAt = verified ? new Date() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen übermittelt." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  if (targetUser.role === "OWNER" && session.user.id && Number(session.user.id) === targetUser.id && updates.role && updates.role !== "OWNER") {
    return NextResponse.json({ error: "Du kannst dich nicht selbst degradieren." }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
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

  return NextResponse.json({ ok: true, user: updatedUser });
}
