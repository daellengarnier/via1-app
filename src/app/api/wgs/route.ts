import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllWgsCached } from "@/lib/wg-lookup";

// GET /api/wgs — die 6 WGs (id, name, Stockwerk, Seite), fuer Picker
// wie das Aktivitaeten-Publikum. Ohne Passwort-Hash.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wgs = await getAllWgsCached();
  return NextResponse.json(
    wgs.map((w) => ({ id: w.id, name: w.name, floor: w.floor, side: w.side }))
  );
}
