import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, wgMemberFilter } from "@/lib/wg-access";
import { USER_AVATAR_SELECT, withAvatarUrl } from "@/lib/avatar";
import {
  addDaysUTC,
  effectiveKochDay,
  isoDate,
  parseIsoDate,
} from "@/lib/wg-koch-day";

// GET /api/meine-wg/[slug]/kochplan?from=YYYY-MM-DD&to=YYYY-MM-DD
// Default-Zeitraum: gestern bis +6 Tage ab effektivem Kochtag.
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const today = effectiveKochDay();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  // Default: ab heute (effektiver Tag, nach 21h = morgen) +7 Tage.
  // Vergangene Eintraege werden nicht mehr angezeigt.
  const from = (fromParam && parseIsoDate(fromParam)) || today;
  const to = (toParam && parseIsoDate(toParam)) || addDaysUTC(today, 7);

  const [eintraege, templates, kinder, members] = await Promise.all([
    prisma.wgKochEintrag.findMany({
      where: { wgId: access.wg.id, date: { gte: from, lte: to } },
      include: {
        cook: { select: USER_AVATAR_SELECT },
        createdBy: { select: { id: true, name: true } },
        signups: {
          include: {
            user: { select: USER_AVATAR_SELECT },
          },
        },
        comments: {
          include: {
            author: { select: USER_AVATAR_SELECT },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ date: "asc" }, { slot: "asc" }, { time: "asc" }],
    }),
    prisma.wgKochTemplate.findMany({
      where: { wgId: access.wg.id },
      orderBy: { title: "asc" },
    }),
    prisma.wgKochKind.findMany({
      where: { wgId: access.wg.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: wgMemberFilter(access.wg.id),
      select: USER_AVATAR_SELECT,
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    today: isoDate(today),
    from: isoDate(from),
    to: isoDate(to),
    members: members.map(withAvatarUrl),
    kinder: kinder.map((k) => ({
      id: k.id,
      name: k.name,
      parentIds: k.parentIds,
    })),
    eintraege: eintraege.map((e) => ({
      id: e.id,
      date: isoDate(e.date),
      slot: e.slot,
      time: e.time,
      menu: e.menu,
      description: e.description,
      cook: withAvatarUrl(e.cook),
      createdBy: e.createdBy,
      createdAt: e.createdAt.toISOString(),
      signups: e.signups.map((s) => ({
        id: s.id,
        user: withAvatarUrl(s.user),
        status: s.status, // "going" | "declined"
        childrenIds: s.childrenIds,
        guests: s.guests,
        notes: s.notes,
      })),
      comments: e.comments.map((c) => ({
        id: c.id,
        author: withAvatarUrl(c.author),
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
    })),
    templates: templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      defaultTime: t.defaultTime,
    })),
  });
}
