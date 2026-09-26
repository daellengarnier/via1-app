import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WG_UNLOCK_COOKIE_NAME,
  decodeWgUnlock,
  wgSlug,
} from "@/lib/wg-unlock";
import { addDaysUTC, effectiveKochDay, isoDate } from "@/lib/wg-koch-day";

export const dynamic = "force-dynamic";

// GET /api/home/wg-kochen?days=1|2|3 — Kochplan-Kurzfassung fuer die
// Home-Kachel (heute, optional morgen und uebermorgen).
//
// Leitet die WG aus dem eigenen Zimmer ab (Fallback: zuletzt besuchte
// WG, z.B. fuer Partner:innen ohne eigenes Zimmer hier). Respektiert
// den WG-Unlock-Cookie genau wie /api/meine-wg/*: ohne Unlock kommen
// keine Daten, nur der Hinweis zum Entsperren. Schreiben laeuft ueber
// die bestehenden Kochplan-Endpoints — hier gibt es keinen zweiten
// Datenpfad.

interface EntryDto {
  id: string;
  slot: "lunch" | "dinner";
  time: string | null;
  menu: string | null;
  cook: { id: string; name: string } | null;
  total: number;
  myStatus: "going" | "declined" | null;
  meIsCook: boolean;
  myChildrenIds: string[];
  myGuests: number;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const meId = session.user.id;

  const daysParam = Number(new URL(req.url).searchParams.get("days") ?? "1");
  const days = daysParam === 2 || daysParam === 3 ? daysParam : 1;

  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: {
      room: { select: { wg: { select: { id: true, name: true } } } },
      lastVisitedWg: { select: { id: true, name: true } },
    },
  });
  const wg = me?.room?.wg ?? me?.lastVisitedWg ?? null;
  if (!wg) {
    return NextResponse.json({ wg: null });
  }

  const wgDto = { id: wg.id, name: wg.name, slug: wgSlug(wg.name) };
  const today = effectiveKochDay();
  const dates = Array.from({ length: days }, (_, i) => addDaysUTC(today, i));

  const payload = decodeWgUnlock(cookies().get(WG_UNLOCK_COOKIE_NAME)?.value);
  const unlocked =
    !!payload && payload.uid === meId && payload.wgs.includes(wg.id);
  if (!unlocked) {
    return NextResponse.json({
      wg: wgDto,
      unlocked: false,
      today: isoDate(today),
      days: [],
    });
  }

  const eintraege = await prisma.wgKochEintrag.findMany({
    where: {
      wgId: wg.id,
      date: { gte: dates[0], lte: dates[dates.length - 1] },
    },
    include: {
      cook: { select: { id: true, name: true } },
      signups: {
        select: {
          userId: true,
          status: true,
          childrenIds: true,
          guests: true,
        },
      },
    },
  });

  const toDto = (dateIso: string, slot: "lunch" | "dinner"): EntryDto | null => {
    const e = eintraege.find(
      (x) => isoDate(x.date) === dateIso && x.slot === slot
    );
    if (!e) return null;
    const going = e.signups.filter((s) => s.status === "going");
    const kids = going.reduce((sum, s) => sum + s.childrenIds.length, 0);
    const guests = going.reduce((sum, s) => sum + s.guests, 0);
    const mine = e.signups.find((s) => s.userId === meId);
    return {
      id: e.id,
      slot,
      time: e.time,
      menu: e.menu,
      cook: e.cook,
      total: going.length + (e.cook ? 1 : 0) + kids + guests,
      myStatus:
        mine?.status === "going" || mine?.status === "declined"
          ? mine.status
          : null,
      meIsCook: e.cook?.id === meId,
      myChildrenIds: mine?.childrenIds ?? [],
      myGuests: mine?.guests ?? 0,
    };
  };

  return NextResponse.json({
    wg: wgDto,
    unlocked: true,
    today: isoDate(today),
    days: dates.map((d) => {
      const iso = isoDate(d);
      return { date: iso, lunch: toDto(iso, "lunch"), dinner: toDto(iso, "dinner") };
    }),
  });
}
