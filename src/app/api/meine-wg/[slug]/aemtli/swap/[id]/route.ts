import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { notify } from "@/lib/notify";

interface PatchBody {
  accept?: boolean;
}

// PATCH /api/meine-wg/[slug]/aemtli/swap/[id]
// Empfaenger akzeptiert (accept=true) oder lehnt ab (accept=false).
// Bei Annahme: Reihenfolge in rotationOrder swappen, currentIndex anpassen falls einer der beiden grad dran war.
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const swap = await prisma.wgAemtliSwap.findUnique({
    where: { id: params.id },
    include: { state: true },
  });
  if (!swap || swap.state.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (swap.status !== "pending") {
    return NextResponse.json({ error: "Schon entschieden" }, { status: 400 });
  }
  if (swap.toUserId !== access.user.id) {
    return NextResponse.json(
      { error: "Nur der Empfaenger kann antworten" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  const accept = body?.accept === true;

  if (!accept) {
    await prisma.wgAemtliSwap.update({
      where: { id: swap.id },
      data: { status: "declined" },
    });
    await notify({
      kind: "WG_AEMTLI_SWAP_DECISION",
      title: `🔁 ${access.wg.name}: Tausch abgelehnt`,
      body: `${access.user.name} hat deinen Aemtli-Tausch abgelehnt.`,
      link: `/meine-wg/${params.slug}/aemtli`,
      audience: [swap.fromUserId],
    });
    return NextResponse.json({ ok: true });
  }

  // Annehmen: Plaetze in rotationOrder tauschen
  const order = [...swap.state.rotationOrder];
  const fromIdx = order.indexOf(swap.fromUserId);
  const toIdx = order.indexOf(swap.toUserId);
  if (fromIdx === -1 || toIdx === -1) {
    return NextResponse.json({ error: "User nicht in Rotation" }, { status: 400 });
  }
  const fromVal = order[fromIdx]!;
  const toVal = order[toIdx]!;
  order[fromIdx] = toVal;
  order[toIdx] = fromVal;

  // currentIndex bleibt gleich — die rotationOrder wird neu, also steht jetzt wer-anders an dieser Stelle.
  await prisma.$transaction([
    prisma.wgAemtliSwap.update({
      where: { id: swap.id },
      data: { status: "accepted" },
    }),
    prisma.wgAemtliState.update({
      where: { id: swap.state.id },
      data: { rotationOrder: order },
    }),
  ]);

  await notify({
    kind: "WG_AEMTLI_SWAP_DECISION",
    title: `🔁 ${access.wg.name}: Tausch angenommen`,
    body: `${access.user.name} hat den Aemtli-Tausch angenommen.`,
    link: `/meine-wg/${params.slug}/aemtli`,
    audience: [swap.fromUserId],
  });

  return NextResponse.json({ ok: true });
}
