import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/einkauf — alle Eintraege
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.shoppingItem.findMany({
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      title: i.title,
      notes: i.notes,
      done: i.done,
      createdBy: i.createdBy.name,
      createdById: i.createdById,
      completedBy: i.completedBy?.name ?? null,
      completedById: i.completedById,
      completedAt: i.completedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      commentCount: i._count.comments,
    }))
  );
}

// POST /api/einkauf — neues Item
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { title?: unknown; notes?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes : "";
  if (!title) {
    return NextResponse.json({ error: "title fehlt" }, { status: 400 });
  }

  const created = await prisma.shoppingItem.create({
    data: {
      title,
      notes,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    title: created.title,
    notes: created.notes,
    done: false,
    createdBy: created.createdBy.name,
    createdById: created.createdById,
    completedBy: null,
    completedById: null,
    completedAt: null,
    createdAt: created.createdAt.toISOString(),
    commentCount: 0,
  });
}
