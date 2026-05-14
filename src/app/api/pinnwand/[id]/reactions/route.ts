import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmoji } from "@/lib/reactions";

// POST /api/pinnwand/[id]/reactions  Body: { emoji }
// Toggle: wenn die Reaction existiert, wird sie geloescht; sonst angelegt.
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

  const note = await prisma.pinnwandNote.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!note) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const existing = await prisma.pinnwandReaction.findUnique({
    where: {
      noteId_userId_emoji: {
        noteId: note.id,
        userId: session.user.id,
        emoji: body.emoji,
      },
    },
  });

  if (existing) {
    await prisma.pinnwandReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji: body.emoji });
  }
  await prisma.pinnwandReaction.create({
    data: { noteId: note.id, userId: session.user.id, emoji: body.emoji },
  });
  return NextResponse.json({ action: "added", emoji: body.emoji });
}
