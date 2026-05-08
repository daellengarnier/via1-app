import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import {
  LAUNDRY_MACHINES,
  LAUNDRY_PROGRAMS,
  clampLaundryDuration,
  getLaundryMachine,
} from "@/lib/laundry";

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.user.id },
        ...(session.user.email ? [{ email: session.user.email }] : []),
      ],
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function sendDueLaundryNotifications(now = new Date()) {
  const due = await prisma.laundryTimer.findMany({
    where: {
      stoppedAt: null,
      notificationSentAt: null,
      endsAt: { lte: now },
    },
    select: {
      id: true,
      machineName: true,
      programName: true,
      starterId: true,
      watches: { select: { userId: true } },
    },
  });

  for (const timer of due) {
    const audience = Array.from(
      new Set([timer.starterId, ...timer.watches.map((watch) => watch.userId)])
    );
    await notify({
      kind: "LAUNDRY_DONE",
      title: `${timer.machineName} ist fertig`,
      body: timer.programName,
      link: "/",
      audience,
    });
    await prisma.laundryTimer.update({
      where: { id: timer.id },
      data: { notificationSentAt: now },
    });
  }
}

async function getLaundryState(currentUserId: string) {
  const now = new Date();
  await sendDueLaundryNotifications(now);

  const active = await prisma.laundryTimer.findMany({
    where: {
      stoppedAt: null,
      endsAt: { gt: now },
      machineKey: { in: LAUNDRY_MACHINES.map((m) => m.key) },
    },
    orderBy: { startedAt: "desc" },
    include: {
      starter: { select: { id: true, name: true } },
      watches: {
        where: { userId: currentUserId },
        select: { id: true },
      },
    },
  });

  return LAUNDRY_MACHINES.map((machine) => {
    const timer = active.find((t) => t.machineKey === machine.key);
    return {
      key: machine.key,
      name: machine.name,
      timer: timer
        ? {
            id: timer.id,
            programName: timer.programName,
            durationMinutes: timer.durationMinutes,
            startedAt: timer.startedAt.toISOString(),
            endsAt: timer.endsAt.toISOString(),
            starterId: timer.starterId,
            starterName: timer.starter.name,
            isStartedByCurrentUser: timer.starterId === currentUserId,
            watchingDone: timer.watches.length > 0,
          }
        : null,
    };
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    machines: await getLaundryState(userId),
    programs: LAUNDRY_PROGRAMS,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    machineKey?: unknown;
    programName?: unknown;
    durationMinutes?: unknown;
  };
  const machineKey = typeof body.machineKey === "string" ? body.machineKey : "";
  const machine = getLaundryMachine(machineKey);
  if (!machine) {
    return NextResponse.json({ error: "Ungueltige Maschine" }, { status: 400 });
  }

  const durationMinutes = clampLaundryDuration(Number(body.durationMinutes));
  const programName =
    typeof body.programName === "string" && body.programName.trim()
      ? body.programName.trim().slice(0, 80)
      : "Manuell";
  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMinutes * 60_000);

  await prisma.$transaction([
    prisma.laundryTimer.updateMany({
      where: {
        machineKey,
        stoppedAt: null,
        endsAt: { gt: now },
      },
      data: { stoppedAt: now },
    }),
    prisma.laundryTimer.create({
      data: {
        machineKey,
        machineName: machine.name,
        programName,
        durationMinutes,
        startedAt: now,
        endsAt,
        starterId: userId,
      },
    }),
  ]);

  return NextResponse.json({ machines: await getLaundryState(userId) });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    machineKey?: unknown;
    watchingDone?: unknown;
  };
  const machineKey = typeof body.machineKey === "string" ? body.machineKey : "";
  const machine = getLaundryMachine(machineKey);
  if (!machine) {
    return NextResponse.json({ error: "Ungueltige Maschine" }, { status: 400 });
  }
  if (typeof body.watchingDone !== "boolean") {
    return NextResponse.json({ error: "Ungueltige Einstellung" }, { status: 400 });
  }

  const timer = await prisma.laundryTimer.findFirst({
    where: {
      machineKey,
      stoppedAt: null,
      endsAt: { gt: new Date() },
    },
    select: { id: true, starterId: true },
  });
  if (!timer) {
    return NextResponse.json({ error: "Keine laufende Waesche" }, { status: 404 });
  }
  if (timer.starterId !== userId) {
    if (body.watchingDone) {
      await prisma.laundryTimerWatch.upsert({
        where: { timerId_userId: { timerId: timer.id, userId } },
        update: {},
        create: { timerId: timer.id, userId },
      });
    } else {
      await prisma.laundryTimerWatch.deleteMany({
        where: { timerId: timer.id, userId },
      });
    }
  }

  return NextResponse.json({ machines: await getLaundryState(userId) });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { machineKey?: unknown };
  const machineKey = typeof body.machineKey === "string" ? body.machineKey : "";
  const machine = getLaundryMachine(machineKey);
  if (!machine) {
    return NextResponse.json({ error: "Ungueltige Maschine" }, { status: 400 });
  }

  await prisma.laundryTimer.updateMany({
    where: {
      machineKey,
      stoppedAt: null,
      endsAt: { gt: new Date() },
    },
    data: { stoppedAt: new Date() },
  });

  return NextResponse.json({ machines: await getLaundryState(userId) });
}
