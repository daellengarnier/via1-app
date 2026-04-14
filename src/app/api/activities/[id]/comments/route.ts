import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// POST /api/activities/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: {
      participants: true,
    },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text erforderlich" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "text zu lang" }, { status: 400 });
  }

  const c = await prisma.activityComment.create({
    data: {
      activityId: params.id,
      authorId: session.user.id,
      text,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // Benachrichtigen: alle Teilnehmer + Creator (ohne den Kommentierer)
  const audience = Array.from(
    new Set([
      activity.createdById,
      ...activity.participants.map((p) => p.userId),
    ])
  );
  notify({
    kind: "ACTIVITY_COMMENT",
    title: `💬 Kommentar zu "${activity.title}"`,
    body: `${c.author.name}: ${text}`,
    link: "/aktivitaeten",
    audience,
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json({
    id: c.id,
    author: c.author.name,
    authorId: c.author.id,
    text: c.text,
    date: c.createdAt.toISOString(),
  });
}
