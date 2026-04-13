import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import type { NotificationKind } from "@prisma/client";

// POST /api/notifications/trigger — Aktionen ohne eigene API-Route
// koennen hierueber eine Benachrichtigung aus dem Client ausloesen.
// Aktuell: Sauna, Kaffee-Wechsel, Putzplan-Fertig
//
// Body: { kind, title, body?, link?, wg? (fuer PUTZPLAN_MY_WG) }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    kind?: unknown;
    title?: unknown;
    body?: unknown;
    link?: unknown;
    wg?: unknown;
  };

  const allowed: NotificationKind[] = [
    "SAUNA",
    "KAFFEE_CHANGED",
    "PUTZPLAN_MY_WG",
  ];
  if (
    typeof body.kind !== "string" ||
    !allowed.includes(body.kind as NotificationKind)
  ) {
    return NextResponse.json(
      { error: "Ungueltiger kind" },
      { status: 400 }
    );
  }
  const kind = body.kind as NotificationKind;
  const title = typeof body.title === "string" ? body.title : "";
  const text = typeof body.body === "string" ? body.body : undefined;
  const link = typeof body.link === "string" ? body.link : undefined;
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }

  let audience: "all" | string[] = "all";
  if (kind === "PUTZPLAN_MY_WG") {
    // Nur Bewohner:innen der aktuellen Putz-WG benachrichtigen
    const wgName = typeof body.wg === "string" ? body.wg : "";
    if (!wgName) {
      return NextResponse.json({ error: "wg erforderlich" }, { status: 400 });
    }
    const users = await prisma.user.findMany({
      where: {
        passwordSet: true,
        room: { wg: { name: wgName } },
      },
      select: { id: true },
    });
    audience = users.map((u) => u.id);
    if (audience.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }
  }

  await notify({
    kind,
    title,
    body: text,
    link,
    audience,
    excludeUserId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
