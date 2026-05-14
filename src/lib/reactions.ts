// Standardisierte Emoji-Reactions fuer Pinnwand-Posts (Hauschat + WG).
// Erlaubte Emojis sind hartgecoded — sonst gibt's wahllose Reactions.
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isValidEmoji(s: unknown): s is ReactionEmoji {
  return typeof s === "string" && (REACTION_EMOJIS as readonly string[]).includes(s);
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  // Hat der aktuelle User diese Reaction gesetzt?
  mine: boolean;
}

// Aggregiert ein Reactions-Array (von Prisma) in die UI-DTO.
export function summarizeReactions(
  reactions: { emoji: string; userId: string }[],
  meId: string
): ReactionSummary[] {
  const counts = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const entry = counts.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.userId === meId) entry.mine = true;
    counts.set(r.emoji, entry);
  }
  // Reihenfolge nach REACTION_EMOJIS (stabile UI)
  return REACTION_EMOJIS.filter((e) => counts.has(e)).map((emoji) => ({
    emoji,
    count: counts.get(emoji)!.count,
    mine: counts.get(emoji)!.mine,
  }));
}
