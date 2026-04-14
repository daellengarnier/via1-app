import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/flohmi/[id] — Titel/Beschreibung/Bilder aktualisieren
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inserat = await prisma.flohmiInserat.findUnique({
    where: { id: params.id },
  });
  if (!inserat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = inserat.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    images?: unknown;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim() !== "") {
    data.title = body.title.trim();
  }
  if (typeof body.description === "string") {
    data.description = body.description;
  }

  // Bilder: wenn gesetzt, alte loeschen und neue anlegen
  if (Array.isArray(body.images)) {
    const images = body.images.filter((i): i is string => typeof i === "string");
    // Thumbnail
    data.image = images[0] ?? null;
    await prisma.flohmiImage.deleteMany({
      where: { inseratId: params.id },
    });
    await prisma.flohmiInserat.update({
      where: { id: params.id },
      data: {
        ...data,
        images: {
          create: images.map((d, idx) => ({ data: d, order: idx })),
        },
      },
    });
  } else if (Object.keys(data).length > 0) {
    await prisma.flohmiInserat.update({
      where: { id: params.id },
      data,
    });
  }

  // Updated fetchen und zuruecksenden
  const updated = await prisma.flohmiInserat.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      takenBy: { select: { name: true } },
      images: { orderBy: { order: "asc" } },
      comments: {
        include: { author: { select: { name: true, id: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    images: updated.images.map((i) => i.data),
    createdBy: updated.createdBy.name,
    createdById: updated.createdById,
    createdAt: updated.createdAt.toISOString(),
    takenBy: updated.takenBy?.name ?? null,
    takenById: updated.takenById,
    takenAt: updated.takenAt?.toISOString() ?? null,
    comments: updated.comments.map((c) => ({
      id: c.id,
      author: c.author.name,
      authorId: c.author.id,
      text: c.text,
      date: c.createdAt.toISOString().split("T")[0],
    })),
  });
}

// DELETE /api/flohmi/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inserat = await prisma.flohmiInserat.findUnique({
    where: { id: params.id },
  });
  if (!inserat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = inserat.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.flohmiInserat.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
