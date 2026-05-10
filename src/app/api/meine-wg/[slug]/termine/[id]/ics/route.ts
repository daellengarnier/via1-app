import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { buildIcs } from "@/lib/ics";

// GET /api/meine-wg/[slug]/termine/[id]/ics
// Liefert eine ICS-Datei zum Download / In-Kalender-Importieren.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const ics = buildIcs({
    uid: t.id,
    summary: `[${access.wg.name}] ${t.title}`,
    description: t.description,
    location: t.location,
    start: t.date,
    end: t.endDate,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termin-${t.id}.ics"`,
    },
  });
}
