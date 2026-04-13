import type {
  Termin,
  Traktandum,
  Attendance,
  MealSignup,
  MealSignupGuest,
  User,
  TerminType,
  AttendanceStatus,
  Diet,
} from "@prisma/client";

// Serialisierte Typen fuer das Frontend
export interface TerminListDTO {
  id: string;
  title: string;
  date: string; // ISO "2026-04-16"
  time: string; // "HH:MM"
  location: string;
  type: "sitzung" | "essen" | "sonstige";
  organizer: string | null;
  withDinner: boolean;
  dinnerTime: string | null;
  withAttendance: boolean;
  myAttendance: "going" | "not-going" | null;
  agendaCount: number;
  mealSignupCount: number;
}

export interface TraktandumDTO {
  id: string;
  title: string;
  notes: string;
  createdBy: string;
  order: number;
}

export interface GuestDTO {
  diet: "Fleisch" | "Vegi" | "Vegan";
  allergies: string;
}

export interface MealSignupDTO {
  id: string;
  userId: string;
  name: string;
  diet: "Fleisch" | "Vegi" | "Vegan";
  allergies: string;
  guestDetails: GuestDTO[];
}

export interface TerminDetailDTO extends TerminListDTO {
  sitzungsleitung: string;
  protokollfuehrung: string;
  anwesend: { id: string; name: string }[];
  abgemeldet: { id: string; name: string }[];
  traktanden: TraktandumDTO[];
  mealSignups: MealSignupDTO[];
}

const typeMap: Record<TerminType, "sitzung" | "essen" | "sonstige"> = {
  SITZUNG: "sitzung",
  ESSEN: "essen",
  SONSTIGE: "sonstige",
};

const reverseTypeMap: Record<
  "sitzung" | "essen" | "sonstige",
  TerminType
> = {
  sitzung: "SITZUNG",
  essen: "ESSEN",
  sonstige: "SONSTIGE",
};

const dietMap: Record<Diet, "Fleisch" | "Vegi" | "Vegan"> = {
  FLEISCH: "Fleisch",
  VEGI: "Vegi",
  VEGAN: "Vegan",
};

const reverseDietMap: Record<"Fleisch" | "Vegi" | "Vegan", Diet> = {
  Fleisch: "FLEISCH",
  Vegi: "VEGI",
  Vegan: "VEGAN",
};

export function toTerminType(s: string): TerminType | null {
  if (s === "sitzung" || s === "essen" || s === "sonstige") {
    return reverseTypeMap[s];
  }
  return null;
}

export function toDiet(s: string): Diet | null {
  if (s === "Fleisch" || s === "Vegi" || s === "Vegan") {
    return reverseDietMap[s];
  }
  return null;
}

function splitDate(d: Date): { date: string; time: string } {
  // Stored as UTC — convert to local for display
  const local = new Date(d);
  const iso = local.toISOString();
  const datePart = iso.split("T")[0]!;
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return { date: datePart, time: `${hh}:${mm}` };
}

export function combineDateTime(date: string, time: string): Date {
  // Erwartet "YYYY-MM-DD" + "HH:MM" und speichert als UTC (naive)
  return new Date(`${date}T${time}:00.000Z`);
}

export function serializeTerminList(
  termin: Termin & {
    _count?: { traktanden?: number; mealSignups?: number };
    traktanden?: Traktandum[];
    mealSignups?: MealSignup[];
    attendances?: Attendance[];
  },
  currentUserId: string | null
): TerminListDTO {
  const { date, time } = splitDate(termin.date);
  const agendaCount =
    termin._count?.traktanden ?? termin.traktanden?.length ?? 0;
  const mealSignupCount =
    termin._count?.mealSignups ?? termin.mealSignups?.length ?? 0;
  const myAttendanceRec = currentUserId
    ? termin.attendances?.find((a) => a.userId === currentUserId)
    : null;
  const myAttendance: "going" | "not-going" | null = myAttendanceRec
    ? myAttendanceRec.status === "GOING"
      ? "going"
      : "not-going"
    : null;
  return {
    id: termin.id,
    title: termin.title,
    date,
    time,
    location: termin.location,
    type: typeMap[termin.type],
    organizer: termin.organizer,
    withDinner: termin.withDinner,
    dinnerTime: termin.dinnerTime,
    withAttendance: termin.withAttendance,
    myAttendance,
    agendaCount,
    mealSignupCount,
  };
}

export function serializeTerminDetail(
  termin: Termin & {
    traktanden: (Traktandum & { createdBy: User })[];
    attendances: (Attendance & { user: User })[];
    mealSignups: (MealSignup & {
      user: User;
      guests: MealSignupGuest[];
    })[];
  },
  currentUserId: string | null
): TerminDetailDTO {
  const base = serializeTerminList(
    {
      ...termin,
      _count: {
        traktanden: termin.traktanden.length,
        mealSignups: termin.mealSignups.length,
      },
    },
    currentUserId
  );

  const anwesend = termin.attendances
    .filter((a) => a.status === "GOING")
    .map((a) => ({ id: a.user.id, name: a.user.name }));
  const abgemeldet = termin.attendances
    .filter((a) => a.status === "NOT_GOING")
    .map((a) => ({ id: a.user.id, name: a.user.name }));

  const traktanden: TraktandumDTO[] = termin.traktanden
    .sort((a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime())
    .map((t) => ({
      id: t.id,
      title: t.title,
      notes: t.notes,
      createdBy: t.createdBy.name,
      order: t.order,
    }));

  const mealSignups: MealSignupDTO[] = termin.mealSignups.map((s) => ({
    id: s.id,
    userId: s.user.id,
    name: s.user.name,
    diet: dietMap[s.diet],
    allergies: s.allergies,
    guestDetails: s.guests.map((g) => ({
      diet: dietMap[g.diet],
      allergies: g.allergies,
    })),
  }));

  return {
    ...base,
    sitzungsleitung: termin.sitzungsleitung,
    protokollfuehrung: termin.protokollfuehrung,
    anwesend,
    abgemeldet,
    traktanden,
    mealSignups,
  };
}

export function mapAttendanceStatus(
  s: "going" | "not-going"
): AttendanceStatus {
  return s === "going" ? "GOING" : "NOT_GOING";
}
