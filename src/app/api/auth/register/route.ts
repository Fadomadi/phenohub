import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const importPrisma = async () => {
  try {
    const prismaModule = await import("@/lib/prisma");
    return prismaModule.default;
  } catch (error) {
    console.warn("[REGISTER] Prisma unavailable", error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw: unknown = body?.email;
    const password: unknown = body?.password;
    const name: unknown = body?.name;
    const usernameRaw: unknown = body?.username;

    if (typeof emailRaw !== "string" || !emailRaw.includes("@")) {
      return NextResponse.json({ error: "Bitte eine gültige E-Mail angeben." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 },
      );
    }

    const email = emailRaw.toLowerCase();
    const username =
      typeof usernameRaw === "string" && usernameRaw.trim().length > 0
        ? usernameRaw.trim().toLowerCase()
        : undefined;

    const prisma = await importPrisma();
    if (!prisma) {
      return NextResponse.json(
        { error: "Registrierung derzeit nicht möglich (Datenbank nicht erreichbar)." },
        { status: 503 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-Mail ist bereits registriert." }, { status: 409 });
    }

    if (username) {
      const usernameTaken = await prisma.user.findUnique({ where: { username } });
      if (usernameTaken) {
        return NextResponse.json({ error: "Nutzername bereits vergeben." }, { status: 409 });
      }
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "OWNER" : "USER";
    const verifiedAt = userCount === 0 ? new Date() : null;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: typeof name === "string" ? name.trim() : null,
        username: username ?? null,
        passwordHash,
        role,
        status: "ACTIVE",
        verifiedAt,
      },
    });

    return NextResponse.json({ ok: true, id: user.id, role: user.role });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Registrierung derzeit nicht möglich." },
      { status: 500 },
    );
  }
}
