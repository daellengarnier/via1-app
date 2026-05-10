import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { notify } from "@/lib/notify";

interface SwapBody {
  toUserId?: string;
}

// POST — Swap-Request an einen anderen User stellen
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
  });
  if (!state || !state.rotationOrder.includes(access.user.id)) {
    return NextResponse.json(
      { error: "Du bist nicht in der Rotation" },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as SwapBody | null;
  const toUserId = body?.toUserId;
  if (!toUserId || toUserId === access.user.id) {
    return NextResponse.json({ error: "Empfaenger ungueltig" }, { status: 400 });
  }
  if (!state.rotationOrder.includes(toUserId)) {
    return NextResponse.json(
      { error: "Empfaenger ist nicht in der Rotation" },
      { status: 400 }
    );
  }

  // Gibts schon einen pending request between same users?
  const existing = await prisma.wgAemtliSwap.findFirst({
    where: {
      stateId: state.id,
      status: "pending",
      OR: [
        { fromUserId: access.user.id, toUserId },
        { fromUserId: toUserId, toUserId: access.user.id },
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Es gibt schon eine offene Anfrage" },
      { status: 400 }
    );
  }

  const swap = await prisma.wgAemtliSwap.create({
    data: {
      stateId: state.id,
      fromUserId: access.user.id,
      toUserId,
    },
  });

  await notify({
    kind: "WG_AEMTLI_SWAP_REQUEST",
    title: `🔁 ${access.wg.name}: Aemtli-Tausch?`,
    body: `${access.user.name} moechte mit dir tauschen.`,
    link: `/meine-wg/${params.slug}/aemtli`,
    audience: [toUserId],
  });

  return NextResponse.json({ id: swap.id });
}
