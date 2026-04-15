import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// PUT /api/activities/[id]/participation
// Body: { status: "going" | "not-going" | null }
export async function PUT(
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

  const body = (await req.json()) as { status?: unknown };
  const status = body.status;

  if (status === null) {
    await prisma.activityParticipant.deleteMany({
      where: { activityId: params.id, userId: session.user.id },
    });
    return NextResponse.json({ status: null });
  }
  if (status !== "going" && status !== "not-going") {
    return NextResponse.json(
      { error: "status muss going/not-going/null sein" },
      { status: 400 }
    );
  }

  // Vorherigen Status pruefen, um doppelte Push bei nochmaligem Klick
  // zu vermeiden
  const existing = await prisma.activityParticipant.findUnique({
    where: {
      activityId_userId: {
        activityId: params.id,
        userId: session.user.id,
      },
    },
  });
  const wasGoing = existing ? existing.going : false;
  const going = status === "going";

  await prisma.activityParticipant.upsert({
    where: {
      activityId_userId: {
        activityId: params.id,
        userId: session.user.id,
      },
    },
    create: {
      activityId: params.id,
      userId: session.user.id,
      going,
    },
    update: { going },
  });

  // Besitzer:in benachrichtigen wenn sich jemand neu anmeldet
  // (nicht bei Abmeldung, nicht wenn schon angemeldet, nicht bei sich selbst)
  if (
    going &&
    !wasGoing &&
    activity.createdById !== session.user.id
  ) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    notify({
      kind: "ACTIVITY_COMMENT",
      title: `${user?.name ?? "Jemand"} meldet sich an: ${activity.title}`,
      body: "Neue Anmeldung auf deiner Aktivität 🙋",
      link: "/aktivitaeten",
      audience: [activity.createdById],
    }).catch((e) => console.error("notify", e));
  }

  return NextResponse.json({ status });
}
