import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ status });
}
