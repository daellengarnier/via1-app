import type {
  Aufgabe,
  AufgabeActiveWorker,
  AufgabeImage,
  AufgabeSubTodo,
  Termin,
  User,
} from "@prisma/client";

export interface PinDTO {
  lat: number;
  lng: number;
}

export interface SubTodoDTO {
  id: string;
  title: string;
  done: boolean;
  position: number;
}

export interface AssignedToDTO {
  id: string;
  name: string;
}

export interface SourceTerminDTO {
  id: string;
  title: string;
  date: string | null;
}

export interface AufgabeDTO {
  id: string;
  title: string;
  description: string;
  location: string;
  done: boolean;
  assignee: string | null;
  // Strukturierte Zuweisung (z.B. aus Sitzungs-Pendenz). Parallel
  // zum freien String-Feld 'assignee'. Eine Pendenz kann an mehrere
  // User gleichzeitig vergeben sein.
  assignees: AssignedToDTO[];
  pin: PinDTO | null;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  completedBy: string | null;
  // Optionaler "Was wurde gemacht"-Text vom Abhaken
  completionNote: string | null;
  // Wenn aus einer Sitzung entstanden: Bezug zurueck zum Termin
  sourceTermin: SourceTerminDTO | null;
  sourceTraktandumId: string | null;
  activeWorkers: string[];
  subTodos: SubTodoDTO[];
  images: string[];
}

export function serializeSubTodo(s: AufgabeSubTodo): SubTodoDTO {
  return {
    id: s.id,
    title: s.title,
    done: s.done,
    position: s.position,
  };
}

export function serializeAufgabe(
  a: Aufgabe & {
    createdBy: User;
    completedBy?: User | null;
    assignees?: User[];
    sourceTermin?: Termin | null;
    activeWorkers: (AufgabeActiveWorker & { user: User })[];
    subTodos?: AufgabeSubTodo[];
    images?: AufgabeImage[];
  }
): AufgabeDTO {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    location: a.location,
    done: a.done,
    assignee: a.assignee,
    assignees: (a.assignees ?? []).map((u) => ({ id: u.id, name: u.name })),
    pin:
      a.pinLat != null && a.pinLng != null
        ? { lat: a.pinLat, lng: a.pinLng }
        : null,
    createdBy: a.createdBy.name,
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    completedBy: a.completedBy?.name ?? null,
    completionNote: a.completionNote ?? null,
    sourceTermin: a.sourceTermin
      ? {
          id: a.sourceTermin.id,
          title: a.sourceTermin.title,
          date: a.sourceTermin.date
            ? a.sourceTermin.date.toISOString()
            : null,
        }
      : null,
    sourceTraktandumId: a.sourceTraktandumId ?? null,
    activeWorkers: a.activeWorkers.map((w) => w.user.name),
    subTodos: (a.subTodos ?? [])
      .slice()
      .sort(
        (x, y) =>
          x.position - y.position ||
          x.createdAt.getTime() - y.createdAt.getTime()
      )
      .map(serializeSubTodo),
    images: (a.images ?? [])
      .slice()
      .sort(
        (x, y) =>
          x.position - y.position ||
          x.createdAt.getTime() - y.createdAt.getTime()
      )
      .map((img) => img.data),
  };
}
