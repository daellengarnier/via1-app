import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Diet } from "@prisma/client";

const VALID_DIETS: Diet[] = ["FLEISCH", "VEGI", "VEGAN"];

interface CreateBody {
  name?: unknown;
  diet?: unknown;
  allergies?: unknown;
  parentIds?: unknown;
}

// GET /api/family-kids
// Default: nur eigene Kinder (User ist als parent verlinkt).
// ?scope=all → alle Kinder im Haus (z.B. fuer Termin-Anmelder-UI).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");

  const where =
    scope === "all"
      ? {}
      : { parents: { some: { id: session.user.id } } };

  const kids = await prisma.familyKid.findMany({
    where,
    include: {
      parents: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    kids.map((k) => ({
      id: k.id,
      name: k.name,
      diet: k.diet,
      allergies: k.allergies,
      parents: k.parents,
    }))
  );
}

// POST /api/family-kids — neues Kind anlegen.
// Der aktuelle User wird automatisch als Eltern eingetragen, zusaetzlich
// koennen weitere parentIds mitgegeben werden.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 50) : "";
  if (!name) {
    return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  }

  const diet: Diet =
    typeof body?.diet === "string" && (VALID_DIETS as string[]).includes(body.diet)
      ? (body.diet as Diet)
      : "FLEISCH";
  const allergies =
    typeof body?.allergies === "string"
      ? body.allergies.trim().slice(0, 200)
      : "";

  const extraParentIds = Array.isArray(body?.parentIds)
    ? body.parentIds.filter((x): x is string => typeof x === "string")
    : [];
  const parentIdSet = new Set<string>([session.user.id, ...extraParentIds]);
  const parentIds = Array.from(parentIdSet);

  // Eltern existieren pruefen (extra-Parents)
  const valid = await prisma.user.findMany({
    where: { id: { in: parentIds } },
    select: { id: true },
  });

  const kid = await prisma.familyKid.create({
    data: {
      name,
      diet,
      allergies,
      parents: { connect: valid.map((p) => ({ id: p.id })) },
    },
  });
  return NextResponse.json({ id: kid.id });
}
