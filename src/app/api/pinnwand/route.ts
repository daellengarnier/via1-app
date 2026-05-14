import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { summarizeReactions } from "@/lib/reactions";

// GET /api/pinnwand — alle Eintraege, neueste zuerst
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await prisma.pinnwandNote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  const meId = session.user.id;
  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      text: n.text,
      author: n.author.name,
      authorId: n.author.id,
      date: n.createdAt.toISOString(),
      commentCount: n._count.comments,
      reactions: summarizeReactions(n.reactions, meId),
    }))
  );
}

// POST /api/pinnwand — neuer Eintrag
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }
  if (text.length > 500) {
    return NextResponse.json(
      { error: "text too long (max 500)" },
      { status: 400 }
    );
  }

  const note = await prisma.pinnwandNote.create({
    data: {
      text,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  // Alle anderen User benachrichtigen
  notify({
    kind: "PINNWAND_NEW",
    title: `Neuer Pinnwand-Eintrag von ${note.author.name}`,
    body: text.length > 80 ? text.slice(0, 80) + "…" : text,
    link: "/",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json({
    id: note.id,
    text: note.text,
    author: note.author.name,
    authorId: note.author.id,
    date: note.createdAt.toISOString(),
    commentCount: 0,
  });
}
