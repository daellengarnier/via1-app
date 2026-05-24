import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notify } from "@/lib/notify";

// POST /api/drohne — wird vom 3-Tap auf die Pyramide getriggert.
// Schickt eine Push-Notification an alle anderen User: "Drohne fliegt
// gerade" — Livio (Stussi) oder Johann (Nachbar) gehoeren typischer-
// weise dazu.
//
// Rate-Limit: pro User max 1 Trigger / 5 Minuten, damit niemand spammt.
// Wird simpel ueber In-Memory-Map gemacht (per Server-Instanz).
const lastTriggerByUser = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000;

// Grobe Sonnenauf-/Untergangs-Stunden fuer Bern (47°N), lokale Zeit
// inkl. DST. Bei Nacht versenden wir keine Notif — Livio fliegt eh
// nicht. Doppelt gemoppelt: Client gated auch schon.
const SUNRISE_BY_MONTH = [8.0, 7.5, 6.5, 6.5, 5.5, 5.5, 5.5, 6.0, 7.0, 7.5, 7.5, 8.0];
const SUNSET_BY_MONTH  = [17.0, 17.8, 19.0, 20.3, 21.0, 21.5, 21.5, 20.8, 19.8, 18.5, 16.8, 16.5];

function isDaylightInBern(): boolean {
  // Aktuelle Zeit in Europe/Zurich. Der Server koennte UTC laufen —
  // wir bauen die lokale Stunde via Intl explizit zusammen.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;
  const decimal = hour + minute / 60;
  const sunrise = SUNRISE_BY_MONTH[month] ?? 6;
  const sunset = SUNSET_BY_MONTH[month] ?? 20;
  return decimal >= sunrise && decimal < sunset;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDaylightInBern()) {
    return NextResponse.json({ ok: true, skipped: "nighttime" });
  }

  const now = Date.now();
  const last = lastTriggerByUser.get(session.user.id) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ ok: true, skipped: "rate-limit" });
  }
  lastTriggerByUser.set(session.user.id, now);

  notify({
    kind: "DROHNE_AKTIV",
    title: "🚁 Drohne unterwegs",
    body: "Livio oder Johann fliegt gerade ums Haus.",
    link: "/",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((err) => console.error("notify Drohne", err));

  return NextResponse.json({ ok: true });
}
