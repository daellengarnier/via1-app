import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

// Maximal-Anzahl Instanzen pro Serie — Sicherheitsnetz
const MAX_RECURRENCE_COUNT = 60;

function addInterval(date: Date, recurrence: Recurrence, step: number): Date {
  const d = new Date(date);
  if (recurrence === "DAILY") d.setDate(d.getDate() + step);
  else if (recurrence === "WEEKLY") d.setDate(d.getDate() + 7 * step);
  else if (recurrence === "MONTHLY") d.setMonth(d.getMonth() + step);
  return d;
}

// GET /api/activities — alle aktuellen/zukuenftigen Aktivitaeten
// (Activities die vor > 3 Stunden gestartet sind werden nicht mehr
// angezeigt — ist "spontan" und nicht Archiv)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Aktivitaeten verschwinden 1h nach Start (Aktivitaeten koennen noch laufen)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const activities = await prisma.activity.findMany({
    where: { startAt: { gte: oneHourAgo } },
    orderBy: { startAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  // Serien reduzieren: pro recurrenceGroupId nur die naechste (frueheste)
  // Instanz zeigen. Einmalige Aktivitaeten (groupId=null) bleiben alle.
  const seenGroups = new Set<string>();
  const filtered = activities.filter((a) => {
    if (!a.recurrenceGroupId) return true;
    if (seenGroups.has(a.recurrenceGroupId)) return false;
    seenGroups.add(a.recurrenceGroupId);
    return true;
  });

  return NextResponse.json(
    filtered.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startAt: a.startAt.toISOString(),
      recurrenceGroupId: a.recurrenceGroupId,
      createdBy: a.createdBy.name,
      createdById: a.createdBy.id,
      participants: a.participants.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        going: p.going,
      })),
      myParticipation: (() => {
        const me = a.participants.find((p) => p.userId === session.user.id);
        if (!me) return null;
        return me.going ? ("going" as const) : ("not-going" as const);
      })(),
      comments: a.comments.map((c) => ({
        id: c.id,
        author: c.author.name,
        authorId: c.author.id,
        text: c.text,
        date: c.createdAt.toISOString(),
      })),
    }))
  );
}

// POST /api/activities
// Body: { title, description?, location?, startAt (ISO), recurrence?, recurrenceCount? }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    location?: unknown;
    startAt?: unknown;
    recurrence?: unknown;
    recurrenceCount?: unknown;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description : "";
  const location = typeof body.location === "string" ? body.location : "";
  const startAtStr = typeof body.startAt === "string" ? body.startAt : "";
  const startAt = startAtStr ? new Date(startAtStr) : null;

  if (!title || !startAt || Number.isNaN(startAt.getTime())) {
    return NextResponse.json(
      { error: "title und startAt erforderlich" },
      { status: 400 }
    );
  }

  const recurrence: Recurrence =
    body.recurrence === "DAILY" ||
    body.recurrence === "WEEKLY" ||
    body.recurrence === "MONTHLY"
      ? body.recurrence
      : "NONE";

  let recurrenceCount =
    typeof body.recurrenceCount === "number" && body.recurrenceCount > 0
      ? Math.floor(body.recurrenceCount)
      : 1;
  if (recurrence === "NONE") recurrenceCount = 1;
  if (recurrenceCount > MAX_RECURRENCE_COUNT) {
    recurrenceCount = MAX_RECURRENCE_COUNT;
  }

  const recurrenceGroupId =
    recurrence !== "NONE" && recurrenceCount > 1
      ? randomBytes(12).toString("base64url")
      : null;

  // Erste Instanz anlegen (nur hier erstellen wir direkt participants)
  const first = await prisma.activity.create({
    data: {
      title,
      description,
      location,
      startAt,
      recurrenceGroupId,
      createdById: session.user.id,
      participants: {
        create: {
          userId: session.user.id,
          going: true,
        },
      },
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  // Weitere Instanzen (2. bis N.) anlegen
  if (recurrenceGroupId) {
    for (let i = 1; i < recurrenceCount; i++) {
      const nextDate = addInterval(startAt, recurrence, i);
      await prisma.activity.create({
        data: {
          title,
          description,
          location,
          startAt: nextDate,
          recurrenceGroupId,
          createdById: session.user.id,
          participants: {
            create: {
              userId: session.user.id,
              going: true,
            },
          },
        },
      });
    }
  }

  const timeStr = first.startAt.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });
  const recurrenceLabel =
    recurrence === "DAILY"
      ? " (täglich)"
      : recurrence === "WEEKLY"
        ? " (wöchentlich)"
        : recurrence === "MONTHLY"
          ? " (monatlich)"
          : "";
  notify({
    kind: "ACTIVITY_NEW",
    title: `🌊 ${first.createdBy.name}: ${title}${recurrenceLabel}`,
    body: `${timeStr}${location ? " · " + location : ""}${
      description ? " · " + description : ""
    }`,
    link: "/aktivitaeten",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json({
    id: first.id,
    title: first.title,
    description: first.description,
    location: first.location,
    startAt: first.startAt.toISOString(),
    recurrenceGroupId: first.recurrenceGroupId,
    createdBy: first.createdBy.name,
    createdById: first.createdBy.id,
    participants: first.participants.map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      going: p.going,
    })),
    myParticipation: "going" as const,
    comments: [],
  });
}
