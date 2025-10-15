import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "E-Mail Login",
      credentials: {
        email: { label: "E-Mail", type: "email", placeholder: "mail@phenohub.app" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isMatch) {
          return null;
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Account gesperrt. Bitte Support kontaktieren.");
        }

        const fallbackDisplay =
          user.username?.trim() ||
          user.name?.trim() ||
          user.email?.split("@")[0] ||
          "Community";

        return {
          id: String(user.id),
          email: user.email,
          name: fallbackDisplay,
          username: user.username ?? fallbackDisplay,
          role: user.role,
          status: user.status,
          plan: user.plan,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role ?? token.role;
        token.status = (user as any).status ?? token.status;
        token.plan = (user as any).plan ?? token.plan;
        token.email = (user as any).email?.toLowerCase() ?? token.email;
        token.username = (user as any).username ?? (user as any).name ?? token.username;
        token.name = token.username ?? token.name;
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, role: true, status: true, plan: true, username: true, name: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.plan = dbUser.plan;
          token.username = dbUser.username ?? dbUser.name ?? token.username;
          token.name = token.username ?? token.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).plan = token.plan;
        (session.user as any).username = token.username ?? (session.user as any).username ?? null;
        if (token.username) {
          session.user.name = token.username;
        } else if (session.user.name && session.user.name.includes("@")) {
          session.user.name = session.user.name.split("@")[0];
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.email) return;
      await prisma.user.updateMany({
        where: { email: user.email.toLowerCase() },
        data: { lastLoginAt: new Date() },
      });
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authConfig;
