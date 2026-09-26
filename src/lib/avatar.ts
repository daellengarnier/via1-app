// Profilbilder liegen als Base64-Data-URL in users.avatar (bis ~700 KB).
// Listen-Endpoints duerfen diese Spalte NIE mitliefern — /api/users mit
// 25 Personen waren mehrere MB JSON pro Aufruf. Stattdessen: nur den
// Stempel avatarUpdatedAt selektieren und eine URL auf den Bild-Endpoint
// ausgeben, den der Browser cachen kann.

export const USER_AVATAR_SELECT = {
  id: true,
  name: true,
  avatarUpdatedAt: true,
} as const;

export interface AvatarStamped {
  id: string;
  name: string;
  avatarUpdatedAt: Date | null;
}

export interface PublicUser {
  id: string;
  name: string;
  avatar: string | null;
}

export function avatarUrl(u: {
  id: string;
  avatarUpdatedAt: Date | null;
}): string | null {
  if (!u.avatarUpdatedAt) return null;
  return `/api/users/${u.id}/avatar?v=${u.avatarUpdatedAt.getTime()}`;
}

export function withAvatarUrl(u: AvatarStamped): PublicUser;
export function withAvatarUrl(u: AvatarStamped | null): PublicUser | null;
export function withAvatarUrl(u: AvatarStamped | null): PublicUser | null {
  if (!u) return null;
  return { id: u.id, name: u.name, avatar: avatarUrl(u) };
}
