import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { PFLICHT_TASKS } from "@/lib/wg-aemtli";

interface DoneBody {
  date?: string; // YYYY-MM-DD optional, default heute
}

// POST /api/meine-wg/[slug]/aemtli/done
// Aktueller User markiert die Runde als erledigt (nur wenn alle
// Pflicht-Tasks abgehakt sind). Index rueckt um 1 weiter, History +
// Pflicht-Checkmarks werden geresetet.
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
  });
  if (!state || state.rotationOrder.length === 0) {
    return NextResponse.json({ error: "Aemtli noch nicht initialisiert" }, { status: 400 });
  }

  // Pruefe ob alle Pflicht-Tasks abgehakt sind
  const allChecked = PFLICHT_TASKS.every((t) => state.checkedPflicht.includes(t));
  if (!allChecked) {
    return NextResponse.json(
      { error: "Erst alle Pflichtaufgaben abhaken." },
      { status: 400 }
    );
  }

  // Aktueller User aus Rotation
  const currentUserId =
    state.rotationOrder[state.currentIndex % state.rotationOrder.length];
  if (!currentUserId) {
    return NextResponse.json({ error: "Rotation ungueltig" }, { status: 400 });
  }

  // Datum (optional rueckwirkend, max 60 Tage zurueck, max heute)
  const body = (await req.json().catch(() => null)) as DoneBody | null;
  let when = new Date();
  if (body?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    const parsed = new Date(`${body.date}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      const today = new Date();
      const earliest = new Date();
      earliest.setDate(earliest.getDate() - 60);
      if (parsed.getTime() <= today.getTime() && parsed.getTime() >= earliest.getTime()) {
        when = parsed;
      }
    }
  }

  // History eintragen + State updaten
  await prisma.$transaction([
    prisma.wgAemtliRound.create({
      data: {
        stateId: state.id,
        byUserId: currentUserId,
        doneAt: when,
      },
    }),
    prisma.wgAemtliState.update({
      where: { id: state.id },
      data: {
        lastDoneById: currentUserId,
        lastDoneAt: when,
        currentIndex: (state.currentIndex + 1) % state.rotationOrder.length,
        checkedPflicht: [],
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
