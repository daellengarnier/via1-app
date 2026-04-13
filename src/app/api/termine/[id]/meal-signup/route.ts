import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDiet } from "@/lib/termine-serialize";

interface GuestInput {
  diet?: unknown;
  allergies?: unknown;
}

// POST /api/termine/[id]/meal-signup
// Body: { diet: "Fleisch"|"Vegi"|"Vegan", allergies: string, guests: [{diet, allergies}] }
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
  };
  const dietStr = typeof body.diet === "string" ? body.diet : "";
  const diet = toDiet(dietStr);
  if (!diet) {
    return NextResponse.json(
      { error: "diet muss Fleisch/Vegi/Vegan sein" },
      { status: 400 }
    );
  }
  const allergies =
    typeof body.allergies === "string" ? body.allergies : "";
  const guestsInput = Array.isArray(body.guests)
    ? (body.guests as GuestInput[])
    : [];
  const guestsData = guestsInput
    .map((g) => {
      const d = typeof g.diet === "string" ? toDiet(g.diet) : null;
      if (!d) return null;
      return {
        diet: d,
        allergies: typeof g.allergies === "string" ? g.allergies : "",
      };
    })
    .filter((g): g is { diet: "FLEISCH" | "VEGI" | "VEGAN"; allergies: string } => g !== null);

  // Bestehenden Signup loeschen (inkl. Gaeste via Cascade), dann neu anlegen
  await prisma.mealSignup.deleteMany({
    where: { terminId: params.id, userId: session.user.id },
  });
  const signup = await prisma.mealSignup.create({
    data: {
      terminId: params.id,
      userId: session.user.id,
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
    diet: dietStr,
    allergies: signup.allergies,
    guestDetails: signup.guests.map((g) => ({
      diet:
        g.diet === "FLEISCH" ? "Fleisch" : g.diet === "VEGI" ? "Vegi" : "Vegan",
      allergies: g.allergies,
    })),
  });
}

// DELETE /api/termine/[id]/meal-signup — eigenen Signup entfernen
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
