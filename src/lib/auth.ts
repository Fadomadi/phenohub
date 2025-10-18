import type { NextAuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

type ExtendedUser = User & {
  role: string;
  status: string;
  plan: string;
  username?: string | null;
};

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: false,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name ?? profile.email?.split("@")[0] ?? "Community",
                email: profile.email,
                image: profile.picture,
                role: "USER",
                status: "ACTIVE",
                plan: "FREE",
              };
            },
          }),
        ]
      : []),
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

        const nextUser: ExtendedUser = {
          id: String(user.id),
          email: user.email,
          name: fallbackDisplay,
          username: user.username ?? fallbackDisplay,
          role: user.role,
          status: user.status,
          plan: user.plan,
        };

        return nextUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.userId = extendedUser.id ?? token.userId;
        token.role = extendedUser.role ?? token.role;
        token.status = extendedUser.status ?? token.status;
        token.plan = extendedUser.plan ?? token.plan;
        token.email = extendedUser.email?.toLowerCase() ?? token.email;
        token.username = extendedUser.username ?? extendedUser.name ?? token.username;
        token.name = token.username ?? token.name;
      }

      const needsEnrichment =
        !token.userId ||
        !token.role ||
        !token.status ||
        !token.plan ||
        !token.username;

      if (needsEnrichment && token.email) {
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
        } else {
          token.role = token.role ?? "USER";
          token.status = token.status ?? "ACTIVE";
          token.plan = token.plan ?? "FREE";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.plan = token.plan;
        session.user.username = token.username ?? session.user.username ?? null;
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
