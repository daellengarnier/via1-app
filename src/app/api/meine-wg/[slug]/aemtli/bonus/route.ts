import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface BonusBody {
  task?: string;
  done?: boolean;
}

// POST /api/meine-wg/[slug]/aemtli/bonus — Bonus-Task als erledigt markieren / zuruecknehmen.
// Wenn done=true, wird ein BonusLog-Eintrag erstellt/upgedated; wenn done=false, geloescht.
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
  });
  if (!state) {
    return NextResponse.json({ error: "Aemtli nicht initialisiert" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as BonusBody | null;
  const task = (body?.task ?? "").trim();
  if (!task) {
    return NextResponse.json({ error: "Task fehlt" }, { status: 400 });
  }
  const done = body?.done === true;

  if (done) {
    await prisma.wgAemtliBonusLog.upsert({
      where: { stateId_taskName: { stateId: state.id, taskName: task } },
      create: {
        stateId: state.id,
        taskName: task,
        byUserId: access.user.id,
        date: new Date(),
      },
      update: {
        byUserId: access.user.id,
        date: new Date(),
      },
    });
  } else {
    await prisma.wgAemtliBonusLog.deleteMany({
      where: { stateId: state.id, taskName: task },
    });
  }

  return NextResponse.json({ ok: true });
}
