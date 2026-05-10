import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

const SINGLETON_ID = "singleton";

// Auto-Reset: wenn der Heiz-Eintrag von einem anderen Tag stammt UND
// es bereits 6:00 Bern-Zeit oder spaeter ist, gilt er als abgelaufen.
function shouldExpire(startedAt: Date, now: Date = new Date()): boolean {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);

  const partsStart = fmt(startedAt);
  const partsNow = fmt(now);
  const startDate = `${partsStart.find((p) => p.type === "year")?.value}-${partsStart.find((p) => p.type === "month")?.value}-${partsStart.find((p) => p.type === "day")?.value}`;
  const nowDate = `${partsNow.find((p) => p.type === "year")?.value}-${partsNow.find((p) => p.type === "month")?.value}-${partsNow.find((p) => p.type === "day")?.value}`;
  const nowHour = parseInt(
    partsNow.find((p) => p.type === "hour")?.value ?? "0",
    10
  );
  return startDate !== nowDate && nowHour >= 6;
}

// GET /api/sauna/heating
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.saunaHeating.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (!row) return NextResponse.json(null);

  if (shouldExpire(row.startedAt)) {
    await prisma.saunaHeating
      .delete({ where: { id: SINGLETON_ID } })
      .catch(() => {});
    return NextResponse.json(null);
  }

  const minutesAgo = Math.round(
    (Date.now() - row.startedAt.getTime()) / 60000
  );
  return NextResponse.json({
    startedByName: row.startedByName,
    startedAt: row.startedAt.toISOString(),
    minutesAgo,
  });
}

// POST /api/sauna/heating — startet/aktualisiert das Singleton
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = session.user.name?.trim() || "Jemand";
  const now = new Date();

  // Pruefe Vorzustand: wenn schon jemand anders heizt seit < 12h,
  // nicht ueberschreiben (waere sonst verwirrend).
  const existing = await prisma.saunaHeating.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (existing && !shouldExpire(existing.startedAt)) {
    return NextResponse.json({
      startedByName: existing.startedByName,
      startedAt: existing.startedAt.toISOString(),
      minutesAgo: Math.round((Date.now() - existing.startedAt.getTime()) / 60000),
    });
  }

  const row = await prisma.saunaHeating.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      startedAt: now,
      startedByName: name,
    },
    update: {
      startedAt: now,
      startedByName: name,
    },
  });

  // Push-Notification an alle (ausser Starter)
  await notify({
    kind: "SAUNA",
    title: "Die Sauna wird eingeheizt 🔥",
    body: `${name} heizt ein — in ~30 Min. bereit`,
    link: "/sauna",
    audience: "all",
    excludeUserId: session.user.id,
  });

  return NextResponse.json({
    startedByName: row.startedByName,
    startedAt: row.startedAt.toISOString(),
    minutesAgo: 0,
  });
}

// DELETE /api/sauna/heating — Heizung stoppen
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.saunaHeating
    .delete({ where: { id: SINGLETON_ID } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
