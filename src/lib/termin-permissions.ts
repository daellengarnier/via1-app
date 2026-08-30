// Permission-Helper fuer Termin- und Traktanden-Bearbeitung.
//
// Aktuell: jede eingeloggte Person darf alles bearbeiten
// (User-Entscheid: "Alles fuer alle bearbeitbar"). Archivieren
// (archived=true) bleibt separat geschuetzt, weil es Pendenz-Publish
// + Push-Notifications triggert (siehe api/termine/[id]/route.ts).
//
// Historischer Kontext (falls wir das spaeter wieder verschaerfen wollen):
//   - Admin
//   - Termin-Ersteller
//   - Termin-Editoren (Co-Bearbeiter aus M2M)
//   - Person die als sitzungsleitung im Termin steht (Name-Match)
//   - Person die als protokollfuehrung im Termin steht (Name-Match)
//   - Beim Traktandum zusaetzlich: Ersteller des Traktandums

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

export function canEditTermin(
  session: SessionLike | null,
  _termin: TerminLike
): boolean {
  return !!session?.user?.id;
}

export function canEditTraktandum(
  session: SessionLike | null,
  _termin: TerminLike,
  _traktandum: TraktandumLike
): boolean {
  return !!session?.user?.id;
}
