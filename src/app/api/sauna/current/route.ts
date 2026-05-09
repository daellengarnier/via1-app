import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const latest = await prisma.saunaReading.findFirst({
    orderBy: { recordedAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({ tempC: null, ageSeconds: null, recordedAt: null });
  }

  const ageSeconds = Math.round(
    (Date.now() - latest.recordedAt.getTime()) / 1000
  );

  return NextResponse.json({
    tempC: Number(latest.tempC),
    rssi: latest.rssi,
    ageSeconds,
    recordedAt: latest.recordedAt.toISOString(),
  });
}
