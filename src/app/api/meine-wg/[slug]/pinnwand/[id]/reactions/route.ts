import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { isValidEmoji } from "@/lib/reactions";

// POST /api/meine-wg/[slug]/pinnwand/[id]/reactions  Body: { emoji }
// Toggle. Nur User mit WG-Unlock-Cookie kommen rein (requireWgAccess).
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as { emoji?: unknown } | null;
  if (!isValidEmoji(body?.emoji)) {
    return NextResponse.json({ error: "Ungueltiges Emoji" }, { status: 400 });
  }

  const note = await prisma.wgPinnwandNote.findUnique({
    where: { id: params.id },
    select: { id: true, wgId: true },
  });
  if (!note || note.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const existing = await prisma.wgPinnwandReaction.findUnique({
    where: {
      noteId_userId_emoji: {
        noteId: note.id,
        userId: access.user.id,
        emoji: body.emoji,
      },
    },
  });

  if (existing) {
    await prisma.wgPinnwandReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji: body.emoji });
  }
  await prisma.wgPinnwandReaction.create({
    data: { noteId: note.id, userId: access.user.id, emoji: body.emoji },
  });
  return NextResponse.json({ action: "added", emoji: body.emoji });
}
