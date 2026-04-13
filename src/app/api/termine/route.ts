import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  combineDateTime,
  serializeTerminList,
  toTerminType,
} from "@/lib/termine-serialize";

// GET /api/termine — alle Termine
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termine = await prisma.termin.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { traktanden: true, comments: true } },
      createdBy: { select: { name: true } },
      attendances: {
        where: { userId: session.user.id },
        select: { status: true, userId: true },
      },
      mealSignups: {
        include: { guests: true },
      },
    },
  });

  return NextResponse.json(
    termine.map((t) => {
      const mealSignupCount = t.mealSignups.reduce(
        (sum, s) => sum + (s.goingSelf ? 1 : 0) + s.guests.length,
        0
      );
      const mySignup = t.mealSignups.find(
        (s) => s.userId === session.user.id
      );
      const myMealSignup: "going" | "not-going" | null = mySignup
        ? mySignup.goingSelf
          ? "going"
          : "not-going"
        : null;
      const myMealGuestsCount = mySignup ? mySignup.guests.length : 0;
      return serializeTerminList(t, session.user.id, t.attendances, {
        mealSignupCount,
        myMealSignup,
        myMealGuestsCount,
        commentCount: t._count.comments,
      });
    })
  );
}

// POST /api/termine — neuen Termin erstellen
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    date?: unknown;
    time?: unknown;
    location?: unknown;
    type?: unknown;
    organizer?: unknown;
    withDinner?: unknown;
    dinnerTime?: unknown;
    dinnerLocation?: unknown;
    dinnerOrganizer?: unknown;
    dinnerMenu?: unknown;
    withAttendance?: unknown;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "19:30";
  const location =
    typeof body.location === "string" ? body.location.trim() : "";
  const typeStr = typeof body.type === "string" ? body.type : "";
  const type = toTerminType(typeStr);
  if (!title || !date || !type) {
    return NextResponse.json(
      { error: "title, date und type sind erforderlich" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Ungueltiges Datum" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Ungueltige Uhrzeit" }, { status: 400 });
  }

  const organizer =
    typeof body.organizer === "string" && body.organizer.trim() !== ""
      ? body.organizer.trim()
      : null;
  const withDinner = body.withDinner === true;
  const dinnerTime =
    withDinner && typeof body.dinnerTime === "string" ? body.dinnerTime : null;
  const dinnerLocation =
    withDinner && typeof body.dinnerLocation === "string" && body.dinnerLocation.trim() !== ""
      ? body.dinnerLocation.trim()
      : null;
  const dinnerOrganizer =
    withDinner && typeof body.dinnerOrganizer === "string" && body.dinnerOrganizer.trim() !== ""
      ? body.dinnerOrganizer.trim()
      : null;
  const dinnerMenu =
    (withDinner || type === "ESSEN") && typeof body.dinnerMenu === "string" && body.dinnerMenu.trim() !== ""
      ? body.dinnerMenu.trim()
      : null;
  const withAttendance = body.withAttendance === true || type === "SITZUNG";

  const termin = await prisma.termin.create({
    data: {
      title,
      date: combineDateTime(date, time),
      location,
      type,
      organizer,
      withDinner,
      dinnerTime,
      dinnerLocation,
      dinnerOrganizer,
      dinnerMenu,
      withAttendance,
      createdById: session.user.id,
    },
    include: {
      _count: { select: { traktanden: true, comments: true } },
      createdBy: { select: { name: true } },
      attendances: {
        where: { userId: session.user.id },
        select: { status: true, userId: true },
      },
    },
  });

  return NextResponse.json(
    serializeTerminList(termin, session.user.id, termin.attendances, {
      mealSignupCount: 0,
      myMealSignup: null,
      myMealGuestsCount: 0,
      commentCount: 0,
    })
  );
}
