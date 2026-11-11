import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const token = process.env.SAUNA_INGEST_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "ingest disabled" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Ein Fuehler, eine Temperatur. Sender schicken `tempC` (Home-Assistant-Bote, alter ESP32);
  // `tempTopC` wird aus Gewohnheit weiter angenommen. Einen zweiten Fuehler "unten" gibt es
  // nicht mehr (Entscheid Yves 11.11.2026) – dafuer die Luftfeuchte.
  const tempTopC = asNum(body.tempTopC) ?? asNum(body.tempC);

  if (tempTopC === null || tempTopC < -55 || tempTopC > 150) {
    return NextResponse.json({ error: "tempTopC out of range" }, { status: 400 });
  }

  // Feuchte ist Beigabe, nicht Pflicht: Ein unsinniger Feuchtewert (Fuehler spinnt, Feld fehlt)
  // darf die gueltige Temperatur NICHT mitreissen. Darum wird er verworfen statt mit 400
  // abgelehnt – sonst stuende die Sauna in der App als "offline" da, obwohl sie misst.
  const humidityRaw = asNum(body.humidityPct) ?? asNum(body.humidity);
  const humidityPct =
    humidityRaw !== null && humidityRaw >= 0 && humidityRaw <= 100
      ? humidityRaw
      : null;

  const rssi = asNum(body.rssi);

  const reading = await prisma.saunaReading.create({
    data: {
      tempTopC,
      humidityPct: humidityPct ?? undefined,
      rssi: rssi !== null ? Math.round(rssi) : undefined,
    },
  });

  if (reading.id % 100 === 0) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.saunaReading.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
  }

  return NextResponse.json({ ok: true, id: reading.id });
}
