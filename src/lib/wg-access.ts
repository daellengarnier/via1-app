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

interface WgAccessOk {
  ok: true;
  user: { id: string; name: string; roles: string[] };
  wg: {
    id: string;
    name: string;
    slug: string;
    floor: number;
    side: "NORD" | "OST";
  };
}

interface WgAccessErr {
  ok: false;
  response: NextResponse;
}

// Server-side gate fuer alle "Meine WG"-API-Routen.
// Prueft: eingeloggt + Admin (Phase 0) + WG existiert + WG entsperrt.
export async function requireWgAccess(
  slug: string
): Promise<WgAccessOk | WgAccessErr> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const roles = session.user.roles ?? [];
  if (!roles.includes("ADMIN")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const wgs = await prisma.wg.findMany({
    select: {
      id: true,
      name: true,
      floor: true,
      side: true,
      passwordHash: true,
    },
  });
  const wg = wgs.find((w) => wgSlug(w.name) === slug);
  if (!wg) {
    return {
      ok: false,
      response: NextResponse.json({ error: "WG nicht gefunden" }, { status: 404 }),
    };
  }
  if (!wg.passwordHash) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "WG hat noch kein Passwort" },
        { status: 400 }
      ),
    };
  }

  const cookieStore = cookies();
  const payload = decodeWgUnlock(
    cookieStore.get(WG_UNLOCK_COOKIE_NAME)?.value
  );
  if (
    !payload ||
    payload.uid !== session.user.id ||
    !payload.wgs.includes(wg.id)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "WG nicht entsperrt" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: session.user.id,
      name: session.user.name ?? "",
      roles: roles as string[],
    },
    wg: {
      id: wg.id,
      name: wg.name,
      slug,
      floor: wg.floor,
      side: wg.side,
    },
  };
}

// Liefert die User-IDs aller Bewohner einer WG (ueber Room.wgId).
// Wird fuer WG-interne Push-Notifications verwendet.
export async function getWgMemberUserIds(wgId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { room: { wgId } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
