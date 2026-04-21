// Generiert eine DiceBear-Avatar-URL basierend auf dem Lieblingstier.
// Verwendet den "fun-emoji" Stil — deterministische Avatare die immer
// gleich aussehen fuer den gleichen Input-String.
// Kein API-Key noetig, gratis, SVG.
//
// Wenn kein Lieblingstier gesetzt ist, wird null zurueckgegeben.
export function animalAvatarUrl(
  favoriteAnimal: string | null | undefined,
  size = 128
): string | null {
  if (!favoriteAnimal || favoriteAnimal.trim() === "") return null;
  const seed = encodeURIComponent(favoriteAnimal.trim().toLowerCase());
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
