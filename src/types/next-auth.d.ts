import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: number | string;
      role?: string;
      status?: string;
      plan?: string;
      username?: string | null;
    };
  }

  interface User {
    role: string;
    status: string;
    plan: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number | string;
    role?: string;
    status?: string;
    plan?: string;
    email?: string;
    username?: string | null;
  }
}
