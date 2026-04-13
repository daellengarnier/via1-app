import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAufgabe } from "@/lib/aufgaben-serialize";

// PATCH /api/aufgaben/[id]
// Body kann enthalten: title, description, location, pin (oder null),
// done, assignee
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.aufgabe.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim() !== "") {
    data.title = body.title.trim();
  }
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.location === "string") data.location = body.location;
  if (typeof body.assignee === "string" || body.assignee === null) {
    data.assignee =
      typeof body.assignee === "string" && body.assignee.trim() !== ""
        ? body.assignee.trim()
        : null;
  }

  // Pin setzen/loeschen
  if ("pin" in body) {
    if (body.pin === null) {
      data.pinLat = null;
      data.pinLng = null;
    } else if (
      body.pin &&
      typeof body.pin === "object" &&
      "lat" in body.pin &&
      "lng" in body.pin
    ) {
      const p = body.pin as { lat: unknown; lng: unknown };
      if (typeof p.lat === "number" && typeof p.lng === "number") {
        data.pinLat = p.lat;
        data.pinLng = p.lng;
      }
    }
  }

  // Done-Toggle aktualisiert completedAt und raeumt activeWorkers auf
  if (typeof body.done === "boolean") {
    data.done = body.done;
    if (body.done) {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.aufgabe.update({
      where: { id: params.id },
      data,
    });
    // Wenn done-Toggle auf true, alle Active-Workers entfernen
    if (typeof body.done === "boolean" && body.done) {
      await tx.aufgabeActiveWorker.deleteMany({
        where: { aufgabeId: params.id },
      });
    }
    return tx.aufgabe.findUnique({
      where: { id: u.id },
      include: {
        createdBy: true,
        activeWorkers: { include: { user: true } },
      },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeAufgabe(updated));
}

// DELETE /api/aufgaben/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aufgabe = await prisma.aufgabe.findUnique({ where: { id: params.id } });
  if (!aufgabe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = aufgabe.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Nur eigene Aufgabe oder Admin" },
      { status: 403 }
    );
  }

  await prisma.aufgabe.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
