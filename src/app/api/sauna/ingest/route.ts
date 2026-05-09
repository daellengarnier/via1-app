import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = process.env.SAUNA_INGEST_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "ingest disabled" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { tempC?: unknown; rssi?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const tempC = typeof body.tempC === "number" ? body.tempC : Number(body.tempC);
  if (!Number.isFinite(tempC) || tempC < -55 || tempC > 150) {
    return NextResponse.json({ error: "tempC out of range" }, { status: 400 });
  }

  const rssi =
    typeof body.rssi === "number" && Number.isFinite(body.rssi)
      ? Math.round(body.rssi)
      : null;

  const reading = await prisma.saunaReading.create({
    data: { tempC, rssi: rssi ?? undefined },
  });

  // Retention: alles aelter als 30 Tage loeschen (best-effort, bei Bedarf)
  if (reading.id % 100 === 0) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.saunaReading.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
  }

  return NextResponse.json({ ok: true, id: reading.id });
}
