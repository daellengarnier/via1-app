import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface BucketRow {
  bucket: Date;
  top: number | null;
  bottom: number | null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hoursParam = Number(url.searchParams.get("hours") ?? "2");
  const hours = Number.isFinite(hoursParam)
    ? Math.min(48, Math.max(0.25, hoursParam))
    : 2;

  // Bucket-Granularitaet abhaengig vom Zeitraum waehlen, damit wir nie
  // mehr als ~180 Punkte zurueckgeben.
  let bucketSec = 60; // 1 Minute Default
  if (hours > 6) bucketSec = 300; // 5 Min
  if (hours > 24) bucketSec = 900; // 15 Min

  const rows = await prisma.$queryRawUnsafe<BucketRow[]>(
    `
    SELECT
      to_timestamp(floor(extract(epoch FROM "recordedAt") / $1) * $1) AS bucket,
      AVG("tempTopC")::float8 AS top,
      AVG("tempBottomC")::float8 AS bottom
    FROM sauna_readings
    WHERE "recordedAt" > NOW() - ($2 || ' hours')::interval
    GROUP BY bucket
    ORDER BY bucket ASC
    `,
    bucketSec,
    String(hours)
  );

  return NextResponse.json({
    bucketSec,
    points: rows.map((r) => ({
      t: r.bucket.toISOString(),
      top: r.top,
      bottom: r.bottom,
    })),
  });
}
