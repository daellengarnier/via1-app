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
    tempBottomC: latest.tempBottomC !== null ? Number(latest.tempBottomC) : null,
    rssi: latest.rssi,
    ageSeconds,
    recordedAt: latest.recordedAt.toISOString(),
  });
}
