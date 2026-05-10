import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WG_UNLOCK_COOKIE_NAME,
  decodeWgUnlock,
  wgSlug,
} from "@/lib/wg-unlock";

// Cached WG-Lookup — die 6 WGs aendern sich praktisch nie, also halten
// wir sie 5 Minuten im Server-Cache. Jede /meine-wg/*-Seite und API-Route
// macht sonst einen prisma.wg.findMany() pro Request — auf gut besuchten
// Subseiten summiert sich das. Cache wird bei WG-Mutationen (Admin)
// per revalidateTag("wgs") invalidiert (Hook in /api/admin/wgs).
export const getAllWgsCached = unstable_cache(
  async () => {
    return prisma.wg.findMany({
      select: {
        id: true,
        name: true,
        floor: true,
        side: true,
        passwordHash: true,
      },
      orderBy: [{ floor: "asc" }, { side: "asc" }],
    });
  },
  ["wgs-all"],
  { revalidate: 300, tags: ["wgs"] }
);

export async function getWgBySlugCached(slug: string) {
  const wgs = await getAllWgsCached();
  return wgs.find((w) => wgSlug(w.name) === slug) ?? null;
}

interface WgPageGate {
  ok: true;
  userId: string;
  userName: string;
  wg: {
    id: string;
    name: string;
    floor: number;
    side: "NORD" | "OST";
  };
}

interface WgPageGateReject {
  ok: false;
  // Pfad zum Redirect — Caller ruft redirect() damit auf.
  redirectTo: string;
}

// Einheitlicher Server-Component-Gate fuer Meine-WG-Subseiten.
// Cached WG-Lookup, prueft Session + WG existiert + Unlock-Cookie.
// Bei Fehlern liefert er den Redirect-Pfad statt selber zu redirecten,
// damit der Caller das machen kann (redirect() darf nur direkt aus
// dem Server-Component-Body gerufen werden, nicht aus einem Helper).
export async function gateWgSubpage(slug: string): Promise<WgPageGate | WgPageGateReject> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, redirectTo: "/login" };

  const wg = await getWgBySlugCached(slug);
  if (!wg) return { ok: false, redirectTo: "/meine-wg" };

  const cookieStore = cookies();
  const payload = decodeWgUnlock(cookieStore.get(WG_UNLOCK_COOKIE_NAME)?.value);
  const unlocked =
    !!payload &&
    payload.uid === session.user.id &&
    payload.wgs.includes(wg.id);
  if (!unlocked) return { ok: false, redirectTo: `/meine-wg/${slug}` };

  return {
    ok: true,
    userId: session.user.id,
    userName: session.user.name ?? "",
    wg: { id: wg.id, name: wg.name, floor: wg.floor, side: wg.side },
  };
}
