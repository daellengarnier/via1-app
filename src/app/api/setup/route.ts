import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Diet = "fleisch" | "vegi" | "vegan";

interface SetupBody {
  token?: string;
  password?: string;
  profile?: {
    fullName?: string;
    displayName?: string;
    email?: string;
    birthday?: string;
    wg?: string;
    room?: string;
    diet?: Diet;
    allergies?: string;
    hasKaffeeAbo?: boolean;
    favoriteAnimal?: string;
  };
}

function dietFromApi(s: string | undefined): "FLEISCH" | "VEGI" | "VEGAN" | null {
  if (s === "fleisch") return "FLEISCH";
  if (s === "vegi") return "VEGI";
  if (s === "vegan") return "VEGAN";
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SetupBody;
  const { token, password, profile } = body;

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token und Passwort erforderlich." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { setupToken: token },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Ungueltiger oder bereits verwendeter Token." },
      { status: 404 }
    );
  }

  if (user.passwordSet) {
    return NextResponse.json(
      { error: "Passwort wurde bereits eingerichtet." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Profil-Felder uebernehmen (wenn gesetzt)
  const data: Record<string, unknown> = {
    password: hashedPassword,
    passwordSet: true,
    setupToken: null,
  };

  if (profile) {
    if (typeof profile.fullName === "string" && profile.fullName.trim()) {
      data.fullName = profile.fullName.trim();
    }
    if (typeof profile.displayName === "string" && profile.displayName.trim()) {
      data.name = profile.displayName.trim();
    }
    if (typeof profile.email === "string" && profile.email.trim()) {
      const email = profile.email.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        data.email = email;
      }
    }
    if (typeof profile.birthday === "string" && profile.birthday) {
      data.birthday = new Date(profile.birthday);
    }
    if (typeof profile.diet === "string") {
      const d = dietFromApi(profile.diet);
      if (d) data.diet = d;
    }
    if (typeof profile.allergies === "string") {
      data.allergies = profile.allergies;
    }
    if (typeof profile.hasKaffeeAbo === "boolean") {
      data.hasKaffeeAbo = profile.hasKaffeeAbo;
    }
    if (typeof profile.favoriteAnimal === "string") {
      const v = profile.favoriteAnimal.trim();
      data.favoriteAnimal = v === "" ? null : v;
    }

    // Zimmer via keyNumber aufloesen
    if (typeof profile.room === "string" && profile.room) {
      const room = await prisma.room.findUnique({
        where: { keyNumber: profile.room },
      });
      if (room) {
        data.roomId = room.id;
      }
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data,
    });
  } catch (err) {
    // Unique-Conflict bei E-Mail z.B.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "E-Mail bereits vergeben." },
        { status: 400 }
      );
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
