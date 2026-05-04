import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/damages-serialize";

function parsePin(pin: unknown) {
  if (pin === null) return { pinLat: null, pinLng: null };
  if (pin && typeof pin === "object" && "lat" in pin && "lng" in pin) {
    const p = pin as { lat: unknown; lng: unknown };
    if (typeof p.lat === "number" && typeof p.lng === "number") return { pinLat: p.lat, pinLng: p.lng };
  }
  return null;
}

function parseCost(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === "string") {
    const n = Number(value.replace("'", "").replace(",", "."));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return undefined;
}

// PATCH /api/damages/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.resolved === "boolean") {
    data.resolvedAt = body.resolved ? new Date() : null;
    data.status = body.resolved ? "erledigt" : "gemeldet";
  }
  for (const field of ["title", "description", "severity", "category", "status", "location", "roomKey", "imageData", "invoiceData", "invoiceName"] as const) {
    if (typeof body[field] === "string") data[field] = body[field];
    if (body[field] === null && ["imageData", "invoiceData", "invoiceName"].includes(field)) data[field] = null;
  }
  if (typeof body.appointmentAt === "string") data.appointmentAt = body.appointmentAt ? new Date(body.appointmentAt) : null;
  if (body.appointmentAt === null) data.appointmentAt = null;
  const costCents = parseCost(body.cost);
  if (costCents !== undefined) data.costCents = costCents;
  const pin = parsePin(body.pin);
  if (pin) Object.assign(data, pin);
  if (data.status === "erledigt") data.resolvedAt = new Date();
  if (data.status && data.status !== "erledigt") data.resolvedAt = null;

  const updated = await prisma.roomDamage.update({
    where: { id: params.id },
    data,
    include: { reportedBy: true, feedbacks: { orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  return NextResponse.json(serializeDamage(updated));
}

// DELETE /api/damages/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const damage = await prisma.roomDamage.findUnique({ where: { id: params.id } });
  if (!damage) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (damage.reportedById !== session.user.id && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.roomDamage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
