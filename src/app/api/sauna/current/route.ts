import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const latest = await prisma.saunaReading.findFirst({
    orderBy: { recordedAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({
      tempTopC: null,
      humidityPct: null,
      tempBottomC: null,
      rssi: null,
      ageSeconds: null,
      recordedAt: null,
    });
  }

  const ageSeconds = Math.round(
    (Date.now() - latest.recordedAt.getTime()) / 1000
  );

  return NextResponse.json({
    tempTopC: Number(latest.tempTopC),
    humidityPct: latest.humidityPct !== null ? Number(latest.humidityPct) : null,
    // Immer null, nur noch fuer offene alte Browser-Tabs: Deren Code ruft
    // `tempBottomC.toFixed()` auf, sobald das Feld FEHLT (undefined !== null) und stuerzt ab.
    // Kann raus, sobald niemand mehr die Fassung vor 11.2026 offen hat.
    tempBottomC: null,
    rssi: latest.rssi,
    ageSeconds,
    recordedAt: latest.recordedAt.toISOString(),
  });
}
