import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/hausbuch/[id]
// - Eigene Artikel: Titel, Content, Category veraenderbar
// - Admins: alles inkl. owner veraenderbar
// - Fremde Nicht-Admin-User: nicht veraenderbar (Wiki-Style nur
//   fuer eigene Beitraege)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.hausbuchArticle.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = (session.user.roles || []).includes("ADMIN");
  const isCreator = existing.createdById === session.user.id;
  if (!isAdmin && !isCreator) {
    return NextResponse.json(
      { error: "Nur eigene Eintraege koennen bearbeitet werden" },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim() !== "")
    data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.category === "string" && body.category.trim() !== "")
    data.category = body.category.trim();
  // Owner darf nur Admin aendern
  if (isAdmin && typeof body.owner === "string" && body.owner.trim() !== "")
    data.owner = body.owner.trim();
  data.updatedById = session.user.id;

  const updated = await prisma.hausbuchArticle.update({
    where: { id: params.id },
    data,
    include: {
      updatedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    content: updated.content,
    category: updated.category,
    owner: updated.owner,
    createdBy: updated.createdBy?.name ?? null,
    createdById: updated.createdBy?.id ?? null,
    updatedBy: updated.updatedBy.name,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

// DELETE /api/hausbuch/[id] — Eigene Artikel oder Admin
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.hausbuchArticle.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  const isCreator = existing.createdById === session.user.id;
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.hausbuchArticle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
