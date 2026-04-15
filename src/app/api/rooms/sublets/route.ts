import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/sublets — alle aktiven Untermieten (heute zwischen
// fromDate und toDate), gruppiert nach roomKey
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const sublets = await prisma.sublet.findMany({
    where: {
      fromDate: { lte: now },
      toDate: { gte: now },
    },
    orderBy: { fromDate: "asc" },
  });
  // Eine Map roomKey -> erster aktiver Sublet (wenn mehrere, der frueheste)
  const byRoom: Record<
    string,
    { subtenantName: string; fromDate: string; toDate: string }
  > = {};
  for (const s of sublets) {
    if (!byRoom[s.roomKey]) {
      byRoom[s.roomKey] = {
        subtenantName: s.subtenantName,
        fromDate: s.fromDate.toISOString().split("T")[0]!,
        toDate: s.toDate.toISOString().split("T")[0]!,
      };
    }
  }
  return NextResponse.json({ activeByRoom: byRoom });
}
