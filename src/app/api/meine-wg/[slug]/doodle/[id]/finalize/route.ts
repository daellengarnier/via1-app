import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";

interface FinalizeBody {
  optionId?: string;
}

// POST /api/meine-wg/[slug]/doodle/[id]/finalize
// Markiert eine Option als finalen Termin und legt einen WgTermin an.
export async function POST(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const d = await prisma.wgDoodle.findUnique({
    where: { id: params.id },
    include: { options: true },
  });
  if (!d || d.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  if (d.finalizedAt) {
    return NextResponse.json(
      { error: "Bereits finalisiert" },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as FinalizeBody | null;
  const optionId = body?.optionId;
  if (!optionId) {
    return NextResponse.json({ error: "optionId fehlt" }, { status: 400 });
  }
  const opt = d.options.find((o) => o.id === optionId);
  if (!opt) {
    return NextResponse.json({ error: "Option nicht gefunden" }, { status: 404 });
  }

  // Erstelle einen WgTermin aus dem Doodle
  const endDate = d.duration
    ? new Date(opt.date.getTime() + d.duration * 60 * 1000)
    : null;

  const termin = await prisma.wgTermin.create({
    data: {
      wgId: access.wg.id,
      title: d.title,
      date: opt.date,
      endDate,
      location: d.location,
      description: d.description,
      createdById: access.user.id,
    },
  });

  await prisma.wgDoodle.update({
    where: { id: d.id },
    data: { finalizedAt: new Date(), finalizedDate: opt.date },
  });

  // Push an alle WG-Member
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    const dateStr = new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(opt.date);
    await notify({
      kind: "WG_TERMIN_NEW",
      title: `📅 ${access.wg.name}: ${d.title}`,
      body: `Termin steht: ${dateStr}`,
      link: `/meine-wg/${params.slug}/termine/${termin.id}`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ terminId: termin.id });
}
