import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dietToApi = (d: "FLEISCH" | "VEGI" | "VEGAN" | null): string => {
  if (!d) return "fleisch";
  return d === "FLEISCH" ? "fleisch" : d === "VEGI" ? "vegi" : "vegan";
};

const dietFromApi = (
  s: string
): "FLEISCH" | "VEGI" | "VEGAN" | null => {
  if (s === "fleisch") return "FLEISCH";
  if (s === "vegi") return "VEGI";
  if (s === "vegan") return "VEGAN";
  return null;
};

// GET /api/profile — eigenes Profil
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      room: {
        include: { wg: { select: { name: true } } },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    fullName: user.fullName ?? "",
    displayName: user.name,
    email: user.email,
    birthday: user.birthday
      ? user.birthday.toISOString().split("T")[0]
      : "",
    wg: user.room?.wg.name ?? "",
    room: user.room?.keyNumber ?? "",
    diet: dietToApi(user.diet ?? null),
    allergies: user.allergies ?? "",
    profileImage: user.avatar,
    hasKaffeeAbo: user.hasKaffeeAbo,
    notifications: {
      sauna: user.notifySauna,
      aufgaben: user.notifyAufgaben,
      termine: user.notifyTermine,
      aufgabeStarted: user.notifyAufgabeStarted,
      putzplan: user.notifyPutzplan,
      kaffee: user.notifyKaffee,
      pinnwand: user.notifyPinnwand,
      flohmi: user.notifyFlohmi,
      bookingComment: user.notifyBookingComment,
      activity: user.notifyActivity,
      activityComment: user.notifyActivityComment,
    },
  });
}

// PATCH /api/profile — eigenes Profil speichern
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.fullName === "string") data.fullName = body.fullName.trim();
  if (typeof body.displayName === "string" && body.displayName.trim() !== "")
    data.name = body.displayName.trim();
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      data.email = email;
    } else if (email !== "") {
      return NextResponse.json(
        { error: "Ungültige E-Mail" },
        { status: 400 }
      );
    }
  }
  if (typeof body.hasKaffeeAbo === "boolean") {
    data.hasKaffeeAbo = body.hasKaffeeAbo;
  }
  if (typeof body.birthday === "string") {
    data.birthday = body.birthday ? new Date(body.birthday) : null;
  }
  if (typeof body.diet === "string") {
    data.diet = dietFromApi(body.diet);
  }
  if (typeof body.allergies === "string") data.allergies = body.allergies;
  if (typeof body.profileImage === "string" || body.profileImage === null) {
    const img = typeof body.profileImage === "string" ? body.profileImage : null;
    if (img && img.length > 700_000) {
      return NextResponse.json(
        { error: "Bild zu gross (max ~500KB)" },
        { status: 400 }
      );
    }
    data.avatar = img;
  }

  if (
    body.notifications &&
    typeof body.notifications === "object" &&
    body.notifications !== null
  ) {
    const n = body.notifications as Record<string, unknown>;
    if (typeof n.sauna === "boolean") data.notifySauna = n.sauna;
    if (typeof n.aufgaben === "boolean") data.notifyAufgaben = n.aufgaben;
    if (typeof n.termine === "boolean") data.notifyTermine = n.termine;
    if (typeof n.aufgabeStarted === "boolean")
      data.notifyAufgabeStarted = n.aufgabeStarted;
    if (typeof n.putzplan === "boolean") data.notifyPutzplan = n.putzplan;
    if (typeof n.kaffee === "boolean") data.notifyKaffee = n.kaffee;
    if (typeof n.pinnwand === "boolean") data.notifyPinnwand = n.pinnwand;
    if (typeof n.flohmi === "boolean") data.notifyFlohmi = n.flohmi;
    if (typeof n.bookingComment === "boolean")
      data.notifyBookingComment = n.bookingComment;
    if (typeof n.activity === "boolean") data.notifyActivity = n.activity;
    if (typeof n.activityComment === "boolean")
      data.notifyActivityComment = n.activityComment;
  }

  // Room-Update: Nur wenn 'room' (keyNumber) gesetzt ist — der Raum
  // wird ueber keyNumber aufgeloest
  if (typeof body.room === "string") {
    if (body.room === "") {
      data.roomId = null;
    } else {
      const room = await prisma.room.findUnique({
        where: { keyNumber: body.room },
      });
      if (!room) {
        return NextResponse.json(
          { error: `Zimmer ${body.room} nicht gefunden` },
          { status: 400 }
        );
      }
      data.roomId = room.id;
    }
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      include: {
        room: { include: { wg: { select: { name: true } } } },
      },
    });
  } catch (err) {
    // Unique-Constraint z.B. bei E-Mail
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "E-Mail bereits vergeben" },
        { status: 400 }
      );
    }
    throw err;
  }

  return NextResponse.json({
    fullName: user.fullName ?? "",
    displayName: user.name,
    email: user.email,
    birthday: user.birthday
      ? user.birthday.toISOString().split("T")[0]
      : "",
    wg: user.room?.wg.name ?? "",
    room: user.room?.keyNumber ?? "",
    diet: dietToApi(user.diet ?? null),
    allergies: user.allergies ?? "",
    profileImage: user.avatar,
    hasKaffeeAbo: user.hasKaffeeAbo,
    notifications: {
      sauna: user.notifySauna,
      aufgaben: user.notifyAufgaben,
      termine: user.notifyTermine,
      aufgabeStarted: user.notifyAufgabeStarted,
      putzplan: user.notifyPutzplan,
      kaffee: user.notifyKaffee,
      pinnwand: user.notifyPinnwand,
      flohmi: user.notifyFlohmi,
      bookingComment: user.notifyBookingComment,
      activity: user.notifyActivity,
      activityComment: user.notifyActivityComment,
    },
  });
}
