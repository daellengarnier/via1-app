import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// API fuer die Drohne (3-Tap-Easter-Egg).
//
// GET  /api/drohne  → liefert den aktuell aktiven Flight (oder null)
//                     inkl. Starter-Info + Beschwerden. Wird von allen
//                     Clients gepollt.
// POST /api/drohne  → startet einen Flight (current user = starter).
//                     Schickt Push an alle anderen.
//
// Stop und Complaint laufen ueber separate Sub-Routen.

// Grobe Sonnenauf-/Untergangs-Stunden fuer Bern (47°N), lokale Zeit
// inkl. DST. Bei Nacht versenden wir keine Notif und starten keinen
// Flight — Livio fliegt eh nicht.
const SUNRISE_BY_MONTH = [8.0, 7.5, 6.5, 6.5, 5.5, 5.5, 5.5, 6.0, 7.0, 7.5, 7.5, 8.0];
const SUNSET_BY_MONTH  = [17.0, 17.8, 19.0, 20.3, 21.0, 21.5, 21.5, 20.8, 19.8, 18.5, 16.8, 16.5];

function isDaylightInBern(): boolean {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;
  const decimal = hour + minute / 60;
  const sunrise = SUNRISE_BY_MONTH[month] ?? 6;
  const sunset = SUNSET_BY_MONTH[month] ?? 20;
  return decimal >= sunrise && decimal < sunset;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bei Nacht alle noch offenen Flights silent beenden.
  if (!isDaylightInBern()) {
    await prisma.droneFlight.updateMany({
      where: { endedAt: null },
      data: { endedAt: new Date() },
    });
    return NextResponse.json({ flight: null });
  }

  const flight = await prisma.droneFlight.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
    include: {
      startedBy: { select: { id: true, name: true, avatar: true } },
      complaints: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: { select: { id: true, name: true } },
          likes: { select: { userId: true } },
        },
      },
    },
  });

  if (!flight) {
    return NextResponse.json({ flight: null });
  }

  const me = session.user.id;
  return NextResponse.json({
    flight: {
      id: flight.id,
      startedAt: flight.startedAt.toISOString(),
      startedBy: flight.startedBy,
      isMine: flight.startedById === me,
      complaints: flight.complaints.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
        likeCount: c.likes.length,
        likedByMe: c.likes.some((l) => l.userId === me),
        isMine: c.authorId === me,
      })),
    },
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDaylightInBern()) {
    return NextResponse.json({ error: "Nachts fliegt keiner." }, { status: 400 });
  }

  // Schon ein Flight aktiv? Dann nicht doppelt starten.
  const existing = await prisma.droneFlight.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (existing) {
    return NextResponse.json({ ok: true, flightId: existing.id, skipped: "already-active" });
  }

  const flight = await prisma.droneFlight.create({
    data: { startedById: session.user.id },
  });

  notify({
    kind: "DROHNE_AKTIV",
    title: "🚁 Drohne unterwegs",
    body: "Livio oder Johann fliegt gerade ums Haus.",
    link: "/",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((err) => console.error("notify Drohne", err));

  return NextResponse.json({ ok: true, flightId: flight.id });
}
