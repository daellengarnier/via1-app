import { NextResponse } from "next/server";
import { fetchRastSortiment } from "@/lib/rast-sortiment";

// 7 Tage Cache fuer den ganzen Route — Rast aendert das Sortiment
// selten und wir wollen die Drittseite nicht hammern.
export const revalidate = 60 * 60 * 24 * 7;

// GET /api/kaffee/rast-sortiment — liefert das aktuelle Rast-Sortiment.
// Bei Scrape-Fehler liefert das Fallback (hardkodiert in lib/rast-sortiment.ts).
export async function GET() {
  const sortiment = await fetchRastSortiment();
  return NextResponse.json(
    { sortiment },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
