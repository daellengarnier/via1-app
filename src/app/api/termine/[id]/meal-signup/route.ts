import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDiet } from "@/lib/termine-serialize";

interface GuestInput {
  name?: unknown;
  diet?: unknown;
  allergies?: unknown;
}

function dietToLabel(d: "FLEISCH" | "VEGI" | "VEGAN"): "Fleisch" | "Vegi" | "Vegan" {
  return d === "FLEISCH" ? "Fleisch" : d === "VEGI" ? "Vegi" : "Vegan";
}

// POST /api/termine/[id]/meal-signup
// Body: {
//   diet: "Fleisch"|"Vegi"|"Vegan",
//   allergies: string,
//   guests: [{diet, allergies}],
//   goingSelf?: boolean (default true)
// }
// Upsert pro User.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({ where: { id: params.id } });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    diet?: unknown;
    allergies?: unknown;
    guests?: unknown;
    goingSelf?: unknown;
  };
  const goingSelf = body.goingSelf !== false; // default true

  // Diet und Allergien aus dem User-Profil laden (nicht vom Client)
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { diet: true, allergies: true },
  });
  const diet = profile?.diet ?? "FLEISCH";
  const allergies = profile?.allergies ?? "";
  const guestsInput = Array.isArray(body.guests)
    ? (body.guests as GuestInput[])
    : [];
  const guestsData = guestsInput
    .map((g) => {
      const d = typeof g.diet === "string" ? toDiet(g.diet) : null;
      if (!d) return null;
      return {
        name: typeof g.name === "string" ? g.name.trim() : "",
        diet: d,
        allergies: typeof g.allergies === "string" ? g.allergies : "",
      };
    })
    .filter((g): g is { name: string; diet: "FLEISCH" | "VEGI" | "VEGAN"; allergies: string } => g !== null);

  // Wenn goingSelf=false und keine Gaeste -> einfach DELETE fuer
  // "explizit abgemeldet" Zustand. Signup existiert trotzdem, aber
  // effektiv leer.
  // Bestehenden Signup ersetzen (Cascade auf Gaeste)
  await prisma.mealSignup.deleteMany({
    where: { terminId: params.id, userId: session.user.id },
  });
  const signup = await prisma.mealSignup.create({
    data: {
      terminId: params.id,
      userId: session.user.id,
      goingSelf,
      diet,
      allergies,
      guests: { create: guestsData },
    },
    include: { user: true, guests: true },
  });

  return NextResponse.json({
    id: signup.id,
    userId: signup.user.id,
    name: signup.user.name,
    goingSelf: signup.goingSelf,
    diet: dietToLabel(signup.diet),
    allergies: signup.allergies,
    guestDetails: signup.guests.map((g) => ({
      name: g.name,
      diet: dietToLabel(g.diet),
      allergies: g.allergies,
    })),
  });
}

// PATCH /api/termine/[id]/meal-signup — goingSelf toggeln
// (ohne die Gaeste zu loeschen)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { goingSelf?: unknown };
  if (typeof body.goingSelf !== "boolean") {
    return NextResponse.json(
      { error: "goingSelf erforderlich" },
      { status: 400 }
    );
  }

  const existing = await prisma.mealSignup.findUnique({
    where: {
      terminId_userId: {
        terminId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!existing) {
    // Nicht existent -> anlegen mit Profil-Diet und goingSelf
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { diet: true, allergies: true },
    });
    const created = await prisma.mealSignup.create({
      data: {
        terminId: params.id,
        userId: session.user.id,
        goingSelf: body.goingSelf,
        diet: profile?.diet ?? "FLEISCH",
        allergies: profile?.allergies ?? "",
      },
      include: { user: true, guests: true },
    });
    return NextResponse.json({
      id: created.id,
      userId: created.user.id,
      name: created.user.name,
      goingSelf: created.goingSelf,
      diet: dietToLabel(created.diet),
      allergies: created.allergies,
      guestDetails: [],
    });
  }

  const updated = await prisma.mealSignup.update({
    where: { id: existing.id },
    data: { goingSelf: body.goingSelf },
    include: { user: true, guests: true },
  });

  return NextResponse.json({
    id: updated.id,
    userId: updated.user.id,
    name: updated.user.name,
    goingSelf: updated.goingSelf,
    diet: dietToLabel(updated.diet),
    allergies: updated.allergies,
    guestDetails: updated.guests.map((g) => ({
      name: g.name,
      diet: dietToLabel(g.diet),
      allergies: g.allergies,
    })),
  });
}

// DELETE /api/termine/[id]/meal-signup — eigenen Signup entfernen
// (inkl. aller Gaeste). Fuer "nur mich abmelden aber Gaeste bleiben"
// bitte PATCH mit { goingSelf: false } verwenden.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.mealSignup.deleteMany({
    where: { terminId: params.id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
