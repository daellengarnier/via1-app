import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// GET /api/einkauf/[id]/comments
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const comments = await prisma.shoppingItemComment.findMany({
    where: { itemId: params.id },
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

// POST /api/einkauf/[id]/comments — Body: { text }
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

  const item = await prisma.shoppingItem.findUnique({
    where: { id: params.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const created = await prisma.shoppingItemComment.create({
    data: {
      itemId: params.id,
      authorId: session.user.id,
      text,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  // Ersteller:in des Einkaufseintrags benachrichtigen (nicht bei sich selbst)
  if (item.createdById !== session.user.id) {
    notify({
      kind: "SHOPPING_COMMENT",
      title: `${created.author.name} kommentiert: ${item.title}`,
      body: text.length > 120 ? `${text.slice(0, 120)}…` : text,
      link: "/einkauf",
      audience: [item.createdById],
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
