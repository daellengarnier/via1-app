import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface VoteBody {
  optionId?: string;
}

// POST /api/meine-wg/[slug]/doodle/[id]/vote — Toggle eigene Stimme
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const d = await prisma.wgDoodle.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true, finalizedAt: true },
  });
  if (!d || d.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (d.finalizedAt) {
    return NextResponse.json(
      { error: "Doodle ist bereits finalisiert." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as VoteBody | null;
  const optionId = body?.optionId;
  if (!optionId) {
    return NextResponse.json({ error: "optionId fehlt" }, { status: 400 });
  }
  const opt = await prisma.wgDoodleOption.findUnique({
    where: { id: optionId },
    select: { id: true, doodleId: true },
  });
  if (!opt || opt.doodleId !== d.id) {
    return NextResponse.json({ error: "Option nicht gefunden" }, { status: 404 });
  }

  const existing = await prisma.wgDoodleVote.findUnique({
    where: {
      optionId_userId: { optionId, userId: access.user.id },
    },
  });

  if (existing) {
    await prisma.wgDoodleVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  } else {
    await prisma.wgDoodleVote.create({
      data: { optionId, userId: access.user.id },
    });
    return NextResponse.json({ voted: true });
  }
}
