import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";
import { isValidColor } from "@/lib/wg-pinnwand-colors";
import { summarizeReactions } from "@/lib/reactions";

interface CreateBody {
  text?: string;
  color?: string;
}

// GET /api/meine-wg/[slug]/pinnwand — alle Notes mit Comments
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const notes = await prisma.wgPinnwandNote.findMany({
    where: { wgId: access.wg.id },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      text: n.text,
      color: n.color,
      author: n.author,
      createdAt: n.createdAt.toISOString(),
      comments: n.comments.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
      reactions: summarizeReactions(n.reactions, access.user.id),
    }))
  );
}

// POST /api/meine-wg/[slug]/pinnwand
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const text = (body?.text ?? "").trim().slice(0, 500);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }
  const color = isValidColor(body?.color) ? body.color : "yellow";

  const n = await prisma.wgPinnwandNote.create({
    data: {
      wgId: access.wg.id,
      text,
      color,
      authorId: access.user.id,
    },
  });

  // Push an alle WG-Member ausser Autor
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    await notify({
      kind: "WG_PINNWAND_NEW",
      title: `📌 ${access.wg.name}: neuer Post-It`,
      body: `${access.user.name}: ${text.slice(0, 80)}`,
      link: `/meine-wg/${params.slug}/pinnwand`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ id: n.id });
}
