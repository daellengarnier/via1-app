import type {
  Termin,
  Traktandum,
  Attendance,
  MealSignup,
  MealSignupGuest,
  TerminComment as TerminCommentRow,
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
  dinnerLocation: string | null;
  dinnerOrganizer: string | null;
  dinnerMenu: string | null;
  withAttendance: boolean;
  createdBy: string;
  myAttendance: "going" | "not-going" | null;
  // "going" = ich komme selbst, "not-going" = explizit abgemeldet,
  // null = noch keine Entscheidung
  myMealSignup: "going" | "not-going" | null;
  myMealGuestsCount: number;
  agendaCount: number;
  mealSignupCount: number;
  commentCount: number;
}

export interface TerminCommentDTO {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
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
  goingSelf: boolean;
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
  comments: TerminCommentDTO[];
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

export interface TerminListExtras {
  mealSignupCount: number;
  myMealSignup: "going" | "not-going" | null;
  myMealGuestsCount: number;
  commentCount: number;
}

export function serializeTerminList(
  termin: Termin & {
    _count?: { traktanden?: number };
    traktanden?: Traktandum[];
  } & {
    dinnerLocation?: string | null;
    dinnerOrganizer?: string | null;
    dinnerMenu?: string | null;
    createdBy?: { name: string };
  },
  currentUserId: string | null,
  attendances: { status: AttendanceStatus; userId: string }[],
  extras: TerminListExtras
): TerminListDTO {
  const { date, time } = splitDate(termin.date);
  const agendaCount =
    termin._count?.traktanden ?? termin.traktanden?.length ?? 0;
  const myAttendanceRec = currentUserId
    ? attendances.find((a) => a.userId === currentUserId)
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
    dinnerLocation: termin.dinnerLocation ?? null,
    dinnerOrganizer: termin.dinnerOrganizer ?? null,
    dinnerMenu: termin.dinnerMenu ?? null,
    withAttendance: termin.withAttendance,
    createdBy: termin.createdBy?.name ?? "",
    myAttendance,
    myMealSignup: extras.myMealSignup,
    myMealGuestsCount: extras.myMealGuestsCount,
    agendaCount,
    mealSignupCount: extras.mealSignupCount,
    commentCount: extras.commentCount,
  };
}

export function serializeTerminDetail(
  termin: Termin & {
    createdBy: User;
    traktanden: (Traktandum & { createdBy: User })[];
    attendances: (Attendance & { user: User })[];
    mealSignups: (MealSignup & {
      user: User;
      guests: MealSignupGuest[];
    })[];
    comments: (TerminCommentRow & { author: User })[];
  },
  currentUserId: string | null
): TerminDetailDTO {
  // mealSignupCount = goingSelf (1 falls true) + guests.length, summiert ueber alle signups
  const mealSignupCount = termin.mealSignups.reduce(
    (sum, s) => sum + (s.goingSelf ? 1 : 0) + s.guests.length,
    0
  );
  const mySignup = currentUserId
    ? termin.mealSignups.find((s) => s.userId === currentUserId)
    : undefined;
  const myMealSignup: "going" | "not-going" | null = mySignup
    ? mySignup.goingSelf
      ? "going"
      : "not-going"
    : null;
  const myMealGuestsCount = mySignup ? mySignup.guests.length : 0;

  const base = serializeTerminList(
    {
      ...termin,
      _count: { traktanden: termin.traktanden.length },
    },
    currentUserId,
    termin.attendances,
    {
      mealSignupCount,
      myMealSignup,
      myMealGuestsCount,
      commentCount: termin.comments.length,
    }
  );

  const comments: TerminCommentDTO[] = termin.comments
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((c) => ({
      id: c.id,
      author: c.author.name,
      authorId: c.author.id,
      text: c.text,
      date: c.createdAt.toISOString().split("T")[0]!,
    }));

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
    goingSelf: s.goingSelf,
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
    comments,
  };
}

export function mapAttendanceStatus(
  s: "going" | "not-going"
): AttendanceStatus {
  return s === "going" ? "GOING" : "NOT_GOING";
}
