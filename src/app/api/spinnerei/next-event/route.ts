import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

interface SpinnereiEvent {
  title: string;
  startAt: string;
  endAt: string | null;
  url: string | null;
}

// Mehrere URLs probieren, da der Events-Calendar-Plugin-Pfad
// nicht garantiert /events/ ist und JSON-LD oft auch auf der
// Startseite eingebettet wird.
const SOURCE_URLS = [
  "https://kulturspinnerei.ch/events/",
  "https://kulturspinnerei.ch/",
];
const FALLBACK_URL = "https://kulturspinnerei.ch/";

interface JsonLdEvent {
  "@type"?: string | string[];
  name?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
}

function isEventType(t: unknown): boolean {
  if (typeof t === "string") return t === "Event" || t.endsWith("Event");
  if (Array.isArray(t)) return t.some(isEventType);
  return false;
}

function collectEventsFromJsonLd(html: string): SpinnereiEvent[] {
  const events: SpinnereiEvent[] = [];
  const scriptRe =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const items: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && "@graph" in parsed
        ? ((parsed as { "@graph": unknown[] })["@graph"] ?? [])
        : [parsed];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const e = item as JsonLdEvent;
      if (!isEventType(e["@type"])) continue;
      if (!e.name || !e.startDate) continue;
      events.push({
        title: e.name,
        startAt: e.startDate,
        endAt: e.endDate ?? null,
        url: e.url ?? null,
      });
    }
  }
  return events;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; via1-app/1.0; +https://app.felsenau.org)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[spinnerei] fetch failed", url, res.status);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn("[spinnerei] fetch error", url, err);
    return null;
  }
}

async function fetchNextEvent(): Promise<SpinnereiEvent | null> {
  const allEvents: SpinnereiEvent[] = [];
  for (const url of SOURCE_URLS) {
    const html = await fetchHtml(url);
    if (!html) continue;
    allEvents.push(...collectEventsFromJsonLd(html));
    if (allEvents.length > 0) break;
  }
  if (allEvents.length === 0) return null;

  const now = Date.now();
  const upcoming = allEvents
    .filter((e) => {
      const t = Date.parse(e.startAt);
      return Number.isFinite(t) && t >= now - 6 * 60 * 60 * 1000;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

  return upcoming[0] ?? null;
}

const getCachedNextEvent = unstable_cache(
  fetchNextEvent,
  ["spinnerei-next-event"],
  { revalidate: 60 * 60 * 12 }
);

export async function GET() {
  const event = await getCachedNextEvent();
  if (!event) {
    return NextResponse.json(
      { event: null, sourceUrl: FALLBACK_URL },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  }
  return NextResponse.json(
    { event, sourceUrl: FALLBACK_URL },
    { headers: { "Cache-Control": "public, s-maxage=3600" } }
  );
}
