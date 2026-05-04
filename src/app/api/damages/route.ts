import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/damages-serialize";

function parsePin(pin: unknown) {
  if (pin && typeof pin === "object" && "lat" in pin && "lng" in pin) {
    const p = pin as { lat: unknown; lng: unknown };
    if (typeof p.lat === "number" && typeof p.lng === "number") return { pinLat: p.lat, pinLng: p.lng };
  }
  return { pinLat: null, pinLng: null };
}

function parseCost(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace("'", "").replace(",", "."));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const damages = await prisma.roomDamage.findMany({
    orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
    include: {
      reportedBy: true,
      feedbacks: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });
  return NextResponse.json(damages.map(serializeDamage));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description && !title) return NextResponse.json({ error: "Beschreibung fehlt" }, { status: 400 });

  const status = typeof body.status === "string" ? body.status : "gemeldet";
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "allgemein";
  const severity = ["klein", "mittel", "gross"].includes(String(body.severity)) ? String(body.severity) : "klein";
  const appointmentAt = typeof body.appointmentAt === "string" && body.appointmentAt ? new Date(body.appointmentAt) : null;
  const { pinLat, pinLng } = parsePin(body.pin);

  const created = await prisma.roomDamage.create({
    data: {
      title: title || description.slice(0, 60),
      description: description || title,
      category,
      status,
      severity,
      location: typeof body.location === "string" ? body.location.trim() : "",
      roomKey: typeof body.roomKey === "string" ? body.roomKey.trim() : "",
      pinLat,
      pinLng,
      imageData: typeof body.imageData === "string" ? body.imageData : null,
      invoiceData: typeof body.invoiceData === "string" ? body.invoiceData : null,
      invoiceName: typeof body.invoiceName === "string" ? body.invoiceName : null,
      costCents: parseCost(body.cost),
      appointmentAt,
      resolvedAt: status === "erledigt" ? new Date() : null,
      reportedById: session.user.id,
    },
    include: { reportedBy: true, feedbacks: { include: { author: true } } },
  });

  return NextResponse.json(serializeDamage(created));
}
