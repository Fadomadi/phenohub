import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";

const ADMIN_ROLES = new Set(["OWNER", "ADMIN", "MODERATOR"]);

export async function getSession() {
  return getServerSession(authConfig);
}

export async function requireAuth(options?: { roles?: string[] }) {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false as const, status: 401, session: null };
  }

  if (options?.roles) {
    const allowed = new Set(options.roles);
    if (!session.user.role || !allowed.has(session.user.role)) {
      return { ok: false as const, status: 403, session };
    }
  }

  return { ok: true as const, status: 200, session };
}

export async function requireAdmin() {
  return requireAuth({ roles: Array.from(ADMIN_ROLES) });
}

export function canModerate(role?: string) {
  return role ? ADMIN_ROLES.has(role) : false;
}
