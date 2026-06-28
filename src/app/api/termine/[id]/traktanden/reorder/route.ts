import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTermin } from "@/lib/termin-permissions";

// POST /api/termine/[id]/traktanden/reorder
// Body: { order: string[] }  — Liste der Traktandum-IDs in neuer Reihenfolge.
// Updated jedes Traktandum mit dem Index. Nur Traktanden die zum gegebenen
// Termin gehoeren werden beruecksichtigt; alles andere ignorieren wir
// stillschweigend (keine Fehler nach aussen — der Aufruf kommt vom Client
// nach drag-and-drop und soll nicht abstuerzen wenn der State leicht
// veraltet ist).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reorder = Bearbeitung des Termins (alle Traktanden auf einmal),
  // also gilt die Termin-Permission.
  const termin = await prisma.termin.findUnique({
    where: { id: params.id },
    select: {
      createdById: true,
      sitzungsleitung: true,
      protokollfuehrung: true,
      editors: { select: { id: true } },
    },
  });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditTermin(session, termin)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const body = (await req.json()) as { order?: unknown };
  const ids = Array.isArray(body.order)
    ? body.order.filter((x): x is string => typeof x === "string")
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  // Sicherstellen dass alle IDs zum Termin gehoeren
  const owned = await prisma.traktandum.findMany({
    where: { terminId: params.id, id: { in: ids } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((t) => t.id));

  const updates = ids
    .filter((id) => ownedSet.has(id))
    .map((id, index) =>
      prisma.traktandum.update({
        where: { id },
        data: { order: index },
      })
    );
  await prisma.$transaction(updates);

  return NextResponse.json({ ok: true, updated: updates.length });
}
