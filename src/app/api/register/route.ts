import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Diet = "fleisch" | "vegi" | "vegan";

interface RegisterBody {
  password?: string;
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
}

function dietFromApi(s: string | undefined): "FLEISCH" | "VEGI" | "VEGAN" | null {
  if (s === "fleisch") return "FLEISCH";
  if (s === "vegi") return "VEGI";
  if (s === "vegan") return "VEGAN";
  return null;
}

// POST /api/register — neuen User anlegen (oeffentlich)
export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Pflichtfelder
  if (!fullName) {
    return NextResponse.json(
      { error: "Vollständiger Name ist erforderlich." },
      { status: 400 }
    );
  }
  if (!displayName) {
    return NextResponse.json(
      { error: "Anzeigename ist erforderlich." },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Gültige E-Mail-Adresse erforderlich." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 }
    );
  }

  // Pruefen ob E-Mail schon existiert
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Mehr Info fuer Debugging/UX:
    if (!existing.passwordSet) {
      return NextResponse.json(
        {
          error:
            "Diese E-Mail ist bereits hinterlegt, aber noch kein Passwort gesetzt. Bitte bei einem Admin melden — der kann dir einen Setup-Link schicken.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Diese E-Mail ist bereits registriert. Wenn du dein Passwort vergessen hast, kontaktiere bitte einen Admin.",
      },
      { status: 409 }
    );
  }

  // Zimmer ueber keyNumber aufloesen (optional)
  let roomId: string | null = null;
  if (typeof body.room === "string" && body.room) {
    const room = await prisma.room.findUnique({
      where: { keyNumber: body.room },
    });
    if (room) {
      roomId = room.id;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        name: displayName,
        fullName,
        email,
        password: hashedPassword,
        passwordSet: true,
        setupToken: null,
        roles: [Role.USER],
        birthday:
          typeof body.birthday === "string" && body.birthday
            ? new Date(body.birthday)
            : null,
        diet: dietFromApi(body.diet) ?? null,
        allergies: typeof body.allergies === "string" ? body.allergies : "",
        hasKaffeeAbo: body.hasKaffeeAbo === true,
        favoriteAnimal:
          typeof body.favoriteAnimal === "string" &&
          body.favoriteAnimal.trim() !== ""
            ? body.favoriteAnimal.trim()
            : null,
        ...(roomId ? { roomId } : {}),
      },
    });
  } catch (err) {
    // Race-Condition oder andere Unique-Conflicts
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Diese E-Mail ist bereits registriert." },
        { status: 409 }
      );
    }
    console.error("register", err);
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
