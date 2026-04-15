import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/pinnwand/[id] — eigenen Eintrag bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.pinnwandNote.findUnique({
    where: { id: params.id },
  });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (note.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "Nur eigene Eintraege koennen bearbeitet werden" },
      { status: 403 }
    );
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json(
      { error: "text too long (max 500)" },
      { status: 400 }
    );
  }

  const updated = await prisma.pinnwandNote.update({
    where: { id: params.id },
    data: { text },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    text: updated.text,
    author: updated.author.name,
    authorId: updated.author.id,
    date: updated.createdAt.toISOString(),
    commentCount: updated._count.comments,
  });
}

// DELETE /api/pinnwand/[id] — eigenen Eintrag loeschen (oder Admin)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.pinnwandNote.findUnique({
    where: { id: params.id },
  });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = note.authorId === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Nur eigene Eintraege koennen geloescht werden" },
      { status: 403 }
    );
  }

  await prisma.pinnwandNote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
