import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { DEFAULT_BONUS_TASKS, PFLICHT_TASKS } from "@/lib/wg-aemtli";

interface AddBody {
  name?: string;
}
interface DeleteBody {
  name?: string;
}

// POST — neues Custom-Bonus-Task anlegen
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

  const body = (await req.json().catch(() => null)) as AddBody | null;
  const name = (body?.name ?? "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  }

  // Duplikate vermeiden (Default + Pflicht + bereits Custom)
  const existing = new Set([
    ...PFLICHT_TASKS,
    ...DEFAULT_BONUS_TASKS,
    ...state.customBonus,
  ]);
  if (existing.has(name)) {
    return NextResponse.json({ error: "Schon vorhanden" }, { status: 400 });
  }

  await prisma.wgAemtliState.update({
    where: { id: state.id },
    data: { customBonus: [...state.customBonus, name] },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — Custom-Bonus-Task entfernen
export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as DeleteBody | null;
  const name = (body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  }

  const state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
  });
  if (!state) {
    return NextResponse.json({ error: "Aemtli nicht initialisiert" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.wgAemtliState.update({
      where: { id: state.id },
      data: { customBonus: state.customBonus.filter((t) => t !== name) },
    }),
    prisma.wgAemtliBonusLog.deleteMany({
      where: { stateId: state.id, taskName: name },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
