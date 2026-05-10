import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface CheckBody {
  task?: string;
  checked?: boolean;
}

// POST /api/meine-wg/[slug]/aemtli/check — Pflicht-Task abhaken/aufheben
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
    return NextResponse.json({ error: "Aemtli noch nicht initialisiert" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as CheckBody | null;
  const task = (body?.task ?? "").trim();
  if (!task) {
    return NextResponse.json({ error: "Task fehlt" }, { status: 400 });
  }
  const checked = body?.checked === true;

  let next: string[];
  if (checked) {
    next = state.checkedPflicht.includes(task)
      ? state.checkedPflicht
      : [...state.checkedPflicht, task];
  } else {
    next = state.checkedPflicht.filter((t) => t !== task);
  }

  await prisma.wgAemtliState.update({
    where: { id: state.id },
    data: { checkedPflicht: next },
  });

  return NextResponse.json({ ok: true, checkedPflicht: next });
}
