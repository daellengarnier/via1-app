import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// GET /api/pinnwand/[id]/comments
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const comments = await prisma.pinnwandComment.findMany({
    where: { noteId: params.id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: c.author.name,
      authorId: c.authorId,
      date: c.createdAt.toISOString(),
    }))
  );
}

// POST /api/pinnwand/[id]/comments — Body: { text }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  const note = await prisma.pinnwandNote.findUnique({
    where: { id: params.id },
  });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const created = await prisma.pinnwandComment.create({
    data: {
      noteId: params.id,
      authorId: session.user.id,
      text,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  // Autor:in der Notiz benachrichtigen (nicht bei sich selbst)
  if (note.authorId !== session.user.id) {
    notify({
      kind: "PINNWAND_COMMENT",
      title: `${created.author.name} kommentiert deine Notiz`,
      body: text.length > 120 ? `${text.slice(0, 120)}…` : text,
      link: "/",
      audience: [note.authorId],
    }).catch((e) => console.error("notify", e));
  }

  return NextResponse.json({
    id: created.id,
    text: created.text,
    author: created.author.name,
    authorId: created.authorId,
    date: created.createdAt.toISOString(),
  });
}
