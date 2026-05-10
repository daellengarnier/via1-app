import type {
  Aufgabe,
  AufgabeActiveWorker,
  AufgabeImage,
  AufgabeSubTodo,
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

export interface AufgabeDTO {
  id: string;
  title: string;
  description: string;
  location: string;
  done: boolean;
  assignee: string | null;
  pin: PinDTO | null;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
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
    pin:
      a.pinLat != null && a.pinLng != null
        ? { lat: a.pinLat, lng: a.pinLng }
        : null,
    createdBy: a.createdBy.name,
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
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
