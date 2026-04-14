import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

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

  return NextResponse.json(
    activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startAt: a.startAt.toISOString(),
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
// Body: { title, description?, location?, startAt (ISO) }
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

  const created = await prisma.activity.create({
    data: {
      title,
      description,
      location,
      startAt,
      createdById: session.user.id,
      // Der Ersteller ist automatisch dabei
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

  const timeStr = created.startAt.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  notify({
    kind: "ACTIVITY_NEW",
    title: `🌊 ${created.createdBy.name}: ${title}`,
    body: `${timeStr}${location ? " · " + location : ""}${
      description ? " · " + description : ""
    }`,
    link: "/aktivitaeten",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json({
    id: created.id,
    title: created.title,
    description: created.description,
    location: created.location,
    startAt: created.startAt.toISOString(),
    createdBy: created.createdBy.name,
    createdById: created.createdBy.id,
    participants: created.participants.map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      going: p.going,
    })),
    myParticipation: "going" as const,
    comments: [],
  });
}
