import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWgMemberUserIds } from "@/lib/wg-access";

// Publikum ("wer sieht's?") fuer Aktivitaeten und Termine.
//   ALL   → alle Bewohner:innen (Standard)
//   WGS   → nur Mitglieder der verknuepften WGs (Zimmer oder WG-Gast)
//   USERS → nur die verknuepften Personen
// Der Ersteller sieht seinen Eintrag immer, egal welches Publikum.
//
// Beide Modelle haben dieselben Felder (audienceType, audienceUsers,
// audienceWgs); nur die Prisma-Where-Typen unterscheiden sich.

export type AudienceType = "ALL" | "WGS" | "USERS";

export const AUDIENCE_INCLUDE = {
  audienceUsers: { select: { id: true, name: true } },
  audienceWgs: { select: { id: true, name: true } },
} as const;

export interface AudienceDto {
  type: AudienceType;
  users: { id: string; name: string }[];
  wgs: { id: string; name: string }[];
}

export interface WithAudience {
  audienceType: string;
  audienceUsers: { id: string; name: string }[];
  audienceWgs: { id: string; name: string }[];
}

export const AUDIENCE_ALL: AudienceDto = { type: "ALL", users: [], wgs: [] };

export function serializeAudience(a: Partial<WithAudience>): AudienceDto {
  const type: AudienceType =
    a.audienceType === "WGS" || a.audienceType === "USERS"
      ? a.audienceType
      : "ALL";
  return {
    type,
    users: a.audienceUsers ?? [],
    wgs: a.audienceWgs ?? [],
  };
}

// WGs, in denen der User Mitglied ist: eigenes Zimmer + WG-Gast.
export async function getMyWgIds(userId: string): Promise<string[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      room: { select: { wgId: true } },
      wgGuestMemberships: { select: { wgId: true } },
    },
  });
  const ids = new Set<string>();
  if (me?.room?.wgId) ids.add(me.room.wgId);
  for (const g of me?.wgGuestMemberships ?? []) ids.add(g.wgId);
  return Array.from(ids);
}

// Gemeinsame OR-Klausel; Activity und Termin haben identische Felder,
// deshalb reicht ein Builder, der als beide Where-Typen lesbar ist.
function visibleWhere(userId: string, wgIds: string[]) {
  return {
    OR: [
      { audienceType: "ALL" },
      { createdById: userId },
      { audienceUsers: { some: { id: userId } } },
      ...(wgIds.length > 0
        ? [{ audienceWgs: { some: { id: { in: wgIds } } } }]
        : []),
    ],
  };
}

export function visibleActivityWhere(
  userId: string,
  wgIds: string[]
): Prisma.ActivityWhereInput {
  return visibleWhere(userId, wgIds);
}

export function visibleTerminWhere(
  userId: string,
  wgIds: string[]
): Prisma.TerminWhereInput {
  return visibleWhere(userId, wgIds);
}

export async function canSeeActivity(
  activityId: string,
  userId: string
): Promise<boolean> {
  const wgIds = await getMyWgIds(userId);
  const found = await prisma.activity.findFirst({
    where: { id: activityId, ...visibleActivityWhere(userId, wgIds) },
    select: { id: true },
  });
  return !!found;
}

export async function canSeeTermin(
  terminId: string,
  userId: string
): Promise<boolean> {
  const wgIds = await getMyWgIds(userId);
  const found = await prisma.termin.findFirst({
    where: { id: terminId, ...visibleTerminWhere(userId, wgIds) },
    select: { id: true },
  });
  return !!found;
}

export interface AudienceInput {
  type: AudienceType;
  userIds: string[];
  wgIds: string[];
}

// Body-Format: { type: "ALL" | "WGS" | "USERS", userIds?: [], wgIds?: [] }
// Unbekannte IDs werden verworfen; ein leeres Publikum bei WGS/USERS
// ist ein Fehler (sonst wuerde der Eintrag still fuer alle sichtbar).
export async function normalizeAudience(
  raw: unknown
): Promise<{ ok: true; value: AudienceInput } | { ok: false; error: string }> {
  if (raw === undefined || raw === null) {
    return { ok: true, value: { type: "ALL", userIds: [], wgIds: [] } };
  }
  if (typeof raw !== "object") {
    return { ok: false, error: "audience muss ein Objekt sein" };
  }
  const o = raw as { type?: unknown; userIds?: unknown; wgIds?: unknown };
  const type: AudienceType =
    o.type === "WGS" || o.type === "USERS" ? o.type : "ALL";
  if (type === "ALL") {
    return { ok: true, value: { type: "ALL", userIds: [], wgIds: [] } };
  }
  const strs = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  if (type === "USERS") {
    const users = await prisma.user.findMany({
      where: { id: { in: strs(o.userIds) } },
      select: { id: true },
    });
    if (users.length === 0) {
      return { ok: false, error: "Bitte mindestens eine Person auswaehlen" };
    }
    return {
      ok: true,
      value: { type, userIds: users.map((u) => u.id), wgIds: [] },
    };
  }

  const wgs = await prisma.wg.findMany({
    where: { id: { in: strs(o.wgIds) } },
    select: { id: true },
  });
  if (wgs.length === 0) {
    return { ok: false, error: "Bitte mindestens eine WG auswaehlen" };
  }
  return {
    ok: true,
    value: { type, userIds: [], wgIds: wgs.map((w) => w.id) },
  };
}

// Prisma-Fragmente fuer create/update.
export function audienceCreateData(a: AudienceInput) {
  return {
    audienceType: a.type,
    audienceUsers: { connect: a.userIds.map((id) => ({ id })) },
    audienceWgs: { connect: a.wgIds.map((id) => ({ id })) },
  };
}

export function audienceUpdateData(a: AudienceInput) {
  return {
    audienceType: a.type,
    audienceUsers: { set: a.userIds.map((id) => ({ id })) },
    audienceWgs: { set: a.wgIds.map((id) => ({ id })) },
  };
}

// Empfaenger fuer Push-Notifications: "all" oder konkrete User-IDs
// (WG-Publikum wird auf Mitglieder aufgeloest).
export async function resolveAudienceUserIds(
  a: WithAudience
): Promise<"all" | string[]> {
  if (a.audienceType === "USERS") return a.audienceUsers.map((u) => u.id);
  if (a.audienceType === "WGS") {
    const lists = await Promise.all(
      a.audienceWgs.map((w) => getWgMemberUserIds(w.id))
    );
    return Array.from(new Set(lists.flat()));
  }
  return "all";
}
