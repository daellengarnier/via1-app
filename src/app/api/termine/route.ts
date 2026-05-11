import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  combineDateTime,
  serializeTerminList,
  toTerminType,
  computeDietCount,
  collectAllergies,
} from "@/lib/termine-serialize";
import { notify } from "@/lib/notify";
import { ensureNextHaussitzungPlaceholder } from "@/lib/haussitzung-rotation";

// GET /api/termine — alle Termine
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sicherstellen dass es immer einen Platzhalter fuer die naechste
  // Haussitzung gibt — der naechste in der Rotation bekommt einen
  // "Datum folgt"-Termin in den schon Traktanden eingetragen werden
  // koennen, bevor die verantwortliche WG ein Datum festlegt.
  await ensureNextHaussitzungPlaceholder(session.user.id).catch((err) => {
    console.error("ensureNextHaussitzungPlaceholder", err);
  });

  const termine = await prisma.termin.findMany({
    // Platzhalter (date IS NULL) zuerst, dann nach Datum absteigend
    orderBy: [{ date: { sort: "desc", nulls: "first" } }],
    include: {
      _count: { select: { traktanden: true, comments: true } },
      createdBy: { select: { name: true } },
      attendances: true,
      mealSignups: {
        include: { guests: true },
      },
      responsibleWg: { select: { id: true, name: true } },
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
      const mealDietCount = computeDietCount(t.mealSignups);
      const mealAllergies = collectAllergies(t.mealSignups);
      const attendanceCount = t.attendances.filter(
        (a) => a.status === "GOING"
      ).length;
      // Fuer myAttendance brauchen wir nur die eigenen
      const myAttendances = t.attendances.filter(
        (a) => a.userId === session.user.id
      );
      return serializeTerminList(t, session.user.id, myAttendances, {
        mealSignupCount,
        myMealSignup,
        myMealGuestsCount,
        commentCount: t._count.comments,
        mealDietCount,
        mealAllergies,
        attendanceCount,
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

  // Alle benachrichtigen
  const labelByType: Record<typeof type, string> = {
    SITZUNG: "Neue Sitzung",
    ESSEN: "Neues Essen",
    SONSTIGE: "Neuer Termin",
  };
  const dateHuman = new Date(`${date}T${time}:00`).toLocaleDateString(
    "de-CH",
    { weekday: "short", day: "numeric", month: "short" }
  );
  notify({
    kind: "TERMIN_NEW",
    title: `${labelByType[type]}: ${title}`,
    body: `${dateHuman} · ${time}${location ? ` · ${location}` : ""}`,
    link: `/termine/${termin.id}`,
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json(
    serializeTerminList(termin, session.user.id, termin.attendances, {
      mealSignupCount: 0,
      myMealSignup: null,
      myMealGuestsCount: 0,
      commentCount: 0,
      mealDietCount: { fleisch: 0, vegi: 0, vegan: 0 },
      mealAllergies: [],
      attendanceCount: 0,
    })
  );
}
