import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/einkauf/[id] — Body: { title?, notes?, done? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.shoppingItem.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await req.json()) as {
    title?: unknown;
    notes?: unknown;
    done?: unknown;
  };
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }
  if (typeof body.done === "boolean") {
    data.done = body.done;
    if (body.done) {
      data.completedAt = new Date();
      data.completedById = session.user.id;
    } else {
      data.completedAt = null;
      data.completedById = null;
    }
  }

  const updated = await prisma.shoppingItem.update({
    where: { id: params.id },
    data,
    include: {
      createdBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    notes: updated.notes,
    done: updated.done,
    createdBy: updated.createdBy.name,
    createdById: updated.createdById,
    completedBy: updated.completedBy?.name ?? null,
    completedById: updated.completedById,
    completedAt: updated.completedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    commentCount: updated._count.comments,
  });
}

// DELETE /api/einkauf/[id] — eigener Eintrag oder Admin
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const item = await prisma.shoppingItem.findUnique({
    where: { id: params.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (item.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.shoppingItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
