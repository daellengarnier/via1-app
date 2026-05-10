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

  // ESP sendet aktuell `tempC` (single sensor), spaeter `tempTopC` + `tempBottomC`.
  const tempTopC = asNum(body.tempTopC) ?? asNum(body.tempC);
  const tempBottomC = asNum(body.tempBottomC);

  if (tempTopC === null || tempTopC < -55 || tempTopC > 150) {
    return NextResponse.json({ error: "tempTopC out of range" }, { status: 400 });
  }
  if (tempBottomC !== null && (tempBottomC < -55 || tempBottomC > 150)) {
    return NextResponse.json(
      { error: "tempBottomC out of range" },
      { status: 400 }
    );
  }

  const rssi = asNum(body.rssi);

  const reading = await prisma.saunaReading.create({
    data: {
      tempTopC,
      tempBottomC: tempBottomC ?? undefined,
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
