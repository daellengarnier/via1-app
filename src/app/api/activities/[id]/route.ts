import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/activities/[id] — eigene Aktivitaet bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (activity.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    location?: unknown;
    startAt?: unknown;
  };
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.description === "string") {
    data.description = body.description;
  }
  if (typeof body.location === "string") {
    data.location = body.location;
  }
  if (typeof body.startAt === "string") {
    const d = new Date(body.startAt);
    if (!Number.isNaN(d.getTime())) data.startAt = d;
  }

  const updated = await prisma.activity.update({
    where: { id: params.id },
    data,
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

  const me = updated.participants.find((p) => p.userId === session.user.id);

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    location: updated.location,
    startAt: updated.startAt.toISOString(),
    recurrenceGroupId: updated.recurrenceGroupId,
    createdBy: updated.createdBy.name,
    createdById: updated.createdBy.id,
    participants: updated.participants.map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      going: p.going,
    })),
    myParticipation: me ? (me.going ? "going" : "not-going") : null,
    comments: updated.comments.map((c) => ({
      id: c.id,
      author: c.author.name,
      authorId: c.author.id,
      text: c.text,
      date: c.createdAt.toISOString(),
    })),
  });
}

// DELETE /api/activities/[id]?scope=one|all — eigene oder Admin
// scope=all: wenn die Aktivitaet zu einer Serie gehoert, alle kuenftigen
// Instanzen der Serie loeschen. Default = "one" (nur diese Instanz).
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (activity.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") === "all" ? "all" : "one";

  if (scope === "all" && activity.recurrenceGroupId) {
    // Alle Instanzen der Serie ab diesem Zeitpunkt loeschen
    const result = await prisma.activity.deleteMany({
      where: {
        recurrenceGroupId: activity.recurrenceGroupId,
        startAt: { gte: activity.startAt },
      },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  }

  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deleted: 1 });
}
