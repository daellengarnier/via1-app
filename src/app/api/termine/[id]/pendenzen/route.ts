import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/termine/[id]/pendenzen
//
// Liefert zwei Listen fuer den Pendenzen-Block im Sitzungs-Detail:
//
// • open      : Aufgaben mit sourceTerminId, die nicht abgehakt sind
//               und aus einer Sitzung vor diesem Termin stammen.
// • completed : Pendenzen die seit der letzten Sitzung (vor diesem
//               Termin) erledigt wurden. Erscheinen einmalig in
//               diesem Termin und verschwinden danach.
//
// Logik fuer "seit der letzten Sitzung":
//   1. Finde die letzte Sitzung mit einem Datum vor diesem Termin.
//   2. Erledigte Pendenzen sind die, deren completedAt nach diesem
//      Vor-Termin-Datum liegt (oder ueberhaupt erledigt, falls es
//      keine Vor-Sitzung gibt — Erstauftritt).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({
    where: { id: params.id },
    select: { id: true, date: true },
  });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Vorherige Sitzung mit Datum (Platzhalter ohne Datum ueberspringen)
  const previousSitzung = termin.date
    ? await prisma.termin.findFirst({
        where: {
          type: "SITZUNG",
          id: { not: termin.id },
          date: { lt: termin.date },
        },
        orderBy: { date: "desc" },
        select: { date: true },
      })
    : null;

  const cutoff = previousSitzung?.date ?? null;

  // 1) Offene Pendenzen aus frueheren Sitzungen
  const openPromise = prisma.aufgabe.findMany({
    where: {
      done: false,
      sourceTerminId: { not: null },
      sourceTermin: termin.date
        ? { date: { lt: termin.date } }
        : { id: { not: termin.id } },
    },
    include: {
      assignees: { select: { id: true, name: true } },
      sourceTermin: { select: { id: true, title: true, date: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 2) Erledigte Pendenzen seit der letzten Sitzung
  const completedPromise = prisma.aufgabe.findMany({
    where: {
      done: true,
      sourceTerminId: { not: null },
      completedAt: cutoff ? { gt: cutoff } : { not: null },
      sourceTermin: termin.date
        ? { date: { lt: termin.date } }
        : { id: { not: termin.id } },
    },
    include: {
      assignees: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      sourceTermin: { select: { id: true, title: true, date: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const [open, completed] = await Promise.all([
    openPromise,
    completedPromise,
  ]);

  return NextResponse.json({
    open: open.map((a) => ({
      id: a.id,
      title: a.title,
      assignees: a.assignees,
      sourceTermin: a.sourceTermin
        ? {
            id: a.sourceTermin.id,
            title: a.sourceTermin.title,
            date: a.sourceTermin.date?.toISOString() ?? null,
          }
        : null,
    })),
    completed: completed.map((a) => ({
      id: a.id,
      title: a.title,
      assignees: a.assignees,
      completedBy: a.completedBy,
      completedAt: a.completedAt?.toISOString() ?? null,
      completionNote: a.completionNote,
      sourceTermin: a.sourceTermin
        ? {
            id: a.sourceTermin.id,
            title: a.sourceTermin.title,
            date: a.sourceTermin.date?.toISOString() ?? null,
          }
        : null,
    })),
  });
}
