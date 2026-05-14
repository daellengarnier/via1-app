import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmoji } from "@/lib/reactions";

// POST /api/kaffee/wunsch/[id]/reactions  Body: { emoji }
// Toggle.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { emoji?: unknown } | null;
  if (!isValidEmoji(body?.emoji)) {
    return NextResponse.json({ error: "Ungueltiges Emoji" }, { status: 400 });
  }

  const wunsch = await prisma.kaffeeWunsch.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!wunsch) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const existing = await prisma.kaffeeWunschReaction.findUnique({
    where: {
      wunschId_userId_emoji: {
        wunschId: wunsch.id,
        userId: session.user.id,
        emoji: body.emoji,
      },
    },
  });

  if (existing) {
    await prisma.kaffeeWunschReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji: body.emoji });
  }
  await prisma.kaffeeWunschReaction.create({
    data: { wunschId: wunsch.id, userId: session.user.id, emoji: body.emoji },
  });
  return NextResponse.json({ action: "added", emoji: body.emoji });
}
