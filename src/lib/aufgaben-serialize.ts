import type { Aufgabe, AufgabeActiveWorker, User } from "@prisma/client";

export interface PinDTO {
  lat: number;
  lng: number;
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
}

export function serializeAufgabe(
  a: Aufgabe & {
    createdBy: User;
    activeWorkers: (AufgabeActiveWorker & { user: User })[];
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
  };
}
