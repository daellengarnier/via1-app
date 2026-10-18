import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, getWgMemberUserIds } from "@/lib/wg-access";
import { USER_AVATAR_SELECT, withAvatarUrl } from "@/lib/avatar";
import { notify } from "@/lib/notify";

// Dauer, wie lange ein frisch gepinntes Protokoll auf der WG-Pinnwand
// sichtbar bleibt (Standard-Wunsch: 7 Tage).
const PROTOKOLL_PIN_DAYS = 7;

function formatPinDate(d: Date): string {
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface PatchBody {
  title?: string;
  date?: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  protokoll?: string | null;
}

// GET /api/meine-wg/[slug]/termine/[id]
export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      traktanden: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      comments: {
        include: {
          author: { select: USER_AVATAR_SELECT },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    id: t.id,
    title: t.title,
    date: t.date.toISOString(),
    endDate: t.endDate?.toISOString() ?? null,
    location: t.location,
    description: t.description,
    protokoll: t.protokoll,
    createdBy: t.createdBy,
    traktanden: t.traktanden.map((tr) => ({
      id: tr.id,
      title: tr.title,
      notes: tr.notes,
      order: tr.order,
    })),
    comments: t.comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: withAvatarUrl(c.author),
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// PATCH /api/meine-wg/[slug]/termine/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.date) {
    const d = new Date(body.date);
    if (!Number.isNaN(d.getTime())) data.date = d;
  }
  if (body.endDate !== undefined) {
    if (body.endDate === null) {
      data.endDate = null;
    } else {
      const d = new Date(body.endDate);
      if (!Number.isNaN(d.getTime())) data.endDate = d;
    }
  }
  if (body.location !== undefined) {
    data.location = body.location?.trim() || null;
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  const newProtokoll =
    body.protokoll !== undefined ? body.protokoll?.trim() || null : undefined;
  if (newProtokoll !== undefined) {
    data.protokoll = newProtokoll;
  }

  await prisma.wgTermin.update({ where: { id: t.id }, data });

  // Standardmaessig: wenn das Protokoll erstmals eingegeben (oder nach dem
  // Loeschen neu befuellt) wird, als Pinnwand-Note der WG anheften — 7 Tage
  // sichtbar. Idempotent via unique(wgTerminId): mehrfaches Speichern des
  // Protokolls erzeugt KEINE zusaetzlichen Notes, aber beim ersten
  // Nicht-Leer-Werden entsteht genau ein Post.
  const wasEmpty = !t.protokoll || t.protokoll.trim() === "";
  const nowHasContent = typeof newProtokoll === "string" && newProtokoll.length > 0;
  if (newProtokoll !== undefined && wasEmpty && nowHasContent) {
    const expiresAt = new Date(
      Date.now() + PROTOKOLL_PIN_DAYS * 24 * 60 * 60 * 1000
    );
    const linkUrl = `/meine-wg/${params.slug}/termine/${t.id}`;
    const dateStr = formatPinDate(t.date);
    const snippet = newProtokoll.slice(0, 180);
    const text = `📋 Protokoll „${t.title}" vom ${dateStr}\n\n${snippet}${
      newProtokoll.length > snippet.length ? " …" : ""
    }`.slice(0, 500);

    try {
      await prisma.wgPinnwandNote.upsert({
        where: { wgTerminId: t.id },
        create: {
          wgId: t.wgId,
          text,
          color: "yellow",
          authorId: access.user.id,
          linkUrl,
          expiresAt,
          wgTerminId: t.id,
        },
        update: {
          text,
          linkUrl,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      const memberIds = await getWgMemberUserIds(t.wgId);
      if (memberIds.length > 0) {
        await notify({
          kind: "WG_PINNWAND_NEW",
          title: `📋 ${access.wg.name}: Sitzungsprotokoll ist da`,
          body: `${t.title} vom ${dateStr}`,
          link: `/meine-wg/${params.slug}/pinnwand`,
          audience: memberIds,
          excludeUserId: access.user.id,
        });
      }
    } catch (err) {
      console.error("auto-pin protokoll failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/termine/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.wgTermin.delete({ where: { id: t.id } });
  return NextResponse.json({ ok: true });
}
