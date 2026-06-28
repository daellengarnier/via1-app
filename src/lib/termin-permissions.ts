// Permission-Helper fuer Termin- und Traktanden-Bearbeitung.
//
// Wer darf den Termin / Traktanden bearbeiten?
//   - Admin (immer)
//   - Termin-Ersteller
//   - Termin-Editoren (Co-Bearbeiter aus M2M)
//   - Person die als sitzungsleitung im Termin steht (Name-Match)
//   - Person die als protokollfuehrung im Termin steht (Name-Match)
//   - Beim Traktandum zusaetzlich: Ersteller des Traktandums
//
// Sitzungsleitung und Protokollfuehrung sind freie Strings (kein FK).
// Wir matchen case-insensitive auf den Display-Namen des Users.
// Bei Tippfehlern im Feld kann es zu False-Negatives kommen — das
// nehmen wir hin, ein Admin kann immer eingreifen.

interface SessionUser {
  id?: string;
  name?: string | null;
  roles?: string[];
}
interface SessionLike {
  user?: SessionUser;
}

interface TerminLike {
  createdById: string;
  sitzungsleitung?: string | null;
  protokollfuehrung?: string | null;
  editors?: { id: string }[];
}

interface TraktandumLike {
  createdById: string;
}

function normalizeName(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function canEditTermin(
  session: SessionLike | null,
  termin: TerminLike
): boolean {
  const userId = session?.user?.id;
  if (!userId) return false;
  if ((session?.user?.roles ?? []).includes("ADMIN")) return true;
  if (termin.createdById === userId) return true;
  if ((termin.editors ?? []).some((e) => e.id === userId)) return true;
  const me = normalizeName(session?.user?.name);
  if (!me) return false;
  if (me === normalizeName(termin.sitzungsleitung)) return true;
  if (me === normalizeName(termin.protokollfuehrung)) return true;
  return false;
}

export function canEditTraktandum(
  session: SessionLike | null,
  termin: TerminLike,
  traktandum: TraktandumLike
): boolean {
  if (canEditTermin(session, termin)) return true;
  return traktandum.createdById === session?.user?.id;
}
