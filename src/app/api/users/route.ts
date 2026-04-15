import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — Liste aller Bewohner:innen mit Zimmer + WG
// fuer Attendance-Modal, Meal-Signups-Zuordnung, Bewohnende-Seite.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { passwordSet: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      fullName: true,
      favoriteAnimal: true,
      avatar: true,
      birthday: true,
      diet: true,
      allergies: true,
      room: {
        select: {
          id: true,
          keyNumber: true,
          number: true,
          wg: { select: { name: true } },
        },
      },
    },
  });

  const dietMap = {
    FLEISCH: "Fleisch",
    VEGI: "Vegetarisch",
    VEGAN: "Vegan",
  } as const;

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      fullName: u.fullName ?? "",
      favoriteAnimal: u.favoriteAnimal ?? "",
      avatar: u.avatar ?? null,
      birthday: u.birthday ? u.birthday.toISOString().split("T")[0] : null,
      diet: u.diet ? dietMap[u.diet] : null,
      allergies: u.allergies ?? "",
      roomKey: u.room?.keyNumber ?? null,
      roomNumber: u.room?.number ?? null,
      wgName: u.room?.wg.name ?? null,
    }))
  );
}
