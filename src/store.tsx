import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// ============== Types ==============
export type Role = 'admin' | 'member';

export type WG = {
  id: string;
  name: string;
  floor?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // mock only
  wgId: string;
  role: Role;
  color: string;
};

export type AgendaItem = {
  id: string;
  text: string;
  done?: boolean;
};

export type ProtocolNote = { agendaId: string; note: string };
export type TerminType = 'haussitzung' | 'hausessen' | 'andere';

export type MealSignup = {
  userId: string;
  adults: number;
  kids: number;
  guestName?: string;
};

export type Sitzung = {
  id: string;
  title: string;
  date: string; // ISO
  location: string;
  type: TerminType;
  withMeal: boolean;
  mealTime?: string;
  mealMenu?: string;
  mealSignups: MealSignup[];
  organizedByWg?: string;
  agenda: AgendaItem[];
  protocol: string;
  attendees: string[];
  protocolNotes: ProtocolNote[];
  decisions: string[];
  nextSteps: string[];
  createdBy: string;
};

export type Pin = { x: number; z: number; label?: string };

export type Aufgabe = {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  done: boolean;
  pin?: Pin;
  createdBy: string;
  createdAt: string;
};

export type PutzAssignment = {
  month: string; // YYYY-MM
  wgId: string;
};

export type SaunaState = {
  heating: boolean;
  temperature: number; // °C
  startedBy: string | null;
  startedAt: string | null; // ISO
};

export type WohnwagenBooking = {
  id: string;
  guestName: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  invitedBy: string; // userId
  createdAt: string; // ISO
};

// ============== Seed ==============
const WGS: WG[] = [
  { id: 'wg1', name: 'Nordwind', floor: 'EG Nord' },
  { id: 'wg2', name: 'Ostblock', floor: 'EG Ost' },
  { id: 'wg3', name: 'Dreiecksbar', floor: '1. OG Nord' },
  { id: 'wg4', name: 'Kleenex', floor: '1. OG Ost' },
  { id: 'wg5', name: 'Family-WG', floor: '2. OG Nord' },
  { id: 'wg6', name: 'Bonzen', floor: '2. OG Ost' },
];

const COLORS = ['#b8f068', '#4a9aaa', '#cc5040', '#e8b04a', '#a070c8', '#68c8a0'];

const SEED_USERS: User[] = [
  { id: 'u1', name: 'Alain Garnier', email: 'alain@via1.ch', password: 'via1', wgId: 'wg1', role: 'admin', color: COLORS[0] },
  { id: 'u2', name: 'Mira Keller', email: 'mira@via1.ch', password: 'via1', wgId: 'wg1', role: 'member', color: COLORS[0] },
  { id: 'u3', name: 'Jonas Frei', email: 'jonas@via1.ch', password: 'via1', wgId: 'wg1', role: 'member', color: COLORS[0] },
  { id: 'u4', name: 'Lena Wirz', email: 'lena@via1.ch', password: 'via1', wgId: 'wg1', role: 'member', color: COLORS[0] },

  { id: 'u5', name: 'Noah Studer', email: 'noah@via1.ch', password: 'via1', wgId: 'wg2', role: 'admin', color: COLORS[1] },
  { id: 'u6', name: 'Sara Iten', email: 'sara@via1.ch', password: 'via1', wgId: 'wg2', role: 'member', color: COLORS[1] },
  { id: 'u7', name: 'Tim Roth', email: 'tim@via1.ch', password: 'via1', wgId: 'wg2', role: 'member', color: COLORS[1] },
  { id: 'u8', name: 'Eva Maurer', email: 'eva@via1.ch', password: 'via1', wgId: 'wg2', role: 'member', color: COLORS[1] },

  { id: 'u9', name: 'Luca Peer', email: 'luca@via1.ch', password: 'via1', wgId: 'wg3', role: 'admin', color: COLORS[2] },
  { id: 'u10', name: 'Nina Bosshard', email: 'nina@via1.ch', password: 'via1', wgId: 'wg3', role: 'member', color: COLORS[2] },
  { id: 'u11', name: 'Ben Aebi', email: 'ben@via1.ch', password: 'via1', wgId: 'wg3', role: 'member', color: COLORS[2] },

  { id: 'u12', name: 'Maya Burri', email: 'maya@via1.ch', password: 'via1', wgId: 'wg4', role: 'admin', color: COLORS[3] },
  { id: 'u13', name: 'Finn Keller', email: 'finn@via1.ch', password: 'via1', wgId: 'wg4', role: 'member', color: COLORS[3] },
  { id: 'u14', name: 'Lia Graf', email: 'lia@via1.ch', password: 'via1', wgId: 'wg4', role: 'member', color: COLORS[3] },
  { id: 'u15', name: 'Oskar Meier', email: 'oskar@via1.ch', password: 'via1', wgId: 'wg4', role: 'member', color: COLORS[3] },

  { id: 'u16', name: 'Anouk Fischer', email: 'anouk@via1.ch', password: 'via1', wgId: 'wg5', role: 'admin', color: COLORS[4] },
  { id: 'u17', name: 'Marc Leuthold', email: 'marc@via1.ch', password: 'via1', wgId: 'wg5', role: 'member', color: COLORS[4] },
  { id: 'u18', name: 'Rahel Büchi', email: 'rahel@via1.ch', password: 'via1', wgId: 'wg5', role: 'member', color: COLORS[4] },
  { id: 'u19', name: 'Theo Kern', email: 'theo@via1.ch', password: 'via1', wgId: 'wg5', role: 'member', color: COLORS[4] },

  { id: 'u20', name: 'Pia Schmid', email: 'pia@via1.ch', password: 'via1', wgId: 'wg6', role: 'admin', color: COLORS[5] },
  { id: 'u21', name: 'Yann Rey', email: 'yann@via1.ch', password: 'via1', wgId: 'wg6', role: 'member', color: COLORS[5] },
  { id: 'u22', name: 'Selin Koch', email: 'selin@via1.ch', password: 'via1', wgId: 'wg6', role: 'member', color: COLORS[5] },
  { id: 'u23', name: 'Dario Lanz', email: 'dario@via1.ch', password: 'via1', wgId: 'wg6', role: 'member', color: COLORS[5] },
];

function nextMonthStr(from: Date, offset: number) {
  const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function seedPutzplan(): PutzAssignment[] {
  const order = ['wg1', 'wg2', 'wg3', 'wg4', 'wg5', 'wg6'];
  const now = new Date();
  const list: PutzAssignment[] = [];
  for (let i = -2; i < 10; i++) {
    list.push({ month: nextMonthStr(now, i), wgId: order[((i % 6) + 6) % 6] });
  }
  return list;
}

const SEED_SITZUNGEN: Sitzung[] = [
  {
    id: 's1',
    title: 'Haussitzung April',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    location: 'Kulturspinnerei-Saal',
    type: 'haussitzung',
    withMeal: true,
    mealTime: '18:30',
    mealSignups: [
      { userId: 'u1', adults: 1, kids: 0 },
      { userId: 'u5', adults: 1, kids: 2 },
      { userId: 'u16', adults: 2, kids: 1, guestName: 'Claudia' },
    ],
    organizedByWg: 'wg1',
    agenda: [
      { id: 'a1', text: 'Begrüssung und Anwesenheit' },
      { id: 'a2', text: 'Garten-Einsatz planen' },
      { id: 'a3', text: 'Budget Sauna-Reparatur' },
      { id: 'a4', text: 'Varia' },
    ],
    protocol: '',
    attendees: [],
    protocolNotes: [],
    decisions: [],
    nextSteps: [],
    createdBy: 'u1',
  },
  {
    id: 's2',
    title: 'Hausessen Mai',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    location: 'Glaspyramide',
    type: 'hausessen',
    withMeal: true,
    mealTime: '19:00',
    mealMenu: 'Apéro mit Käse & Trockenfleisch, danach Gemüse-Curry mit Reis (vegan möglich)',
    mealSignups: [],
    organizedByWg: 'wg3',
    agenda: [],
    protocol: '',
    attendees: [],
    protocolNotes: [],
    decisions: [],
    nextSteps: [],
    createdBy: 'u9',
  },
];

const SEED_SAUNA: SaunaState = {
  heating: false,
  temperature: 22,
  startedBy: null,
  startedAt: null,
};

const SEED_BOOKINGS: WohnwagenBooking[] = [
  {
    id: 'b1',
    guestName: 'Maria Schneider',
    from: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    to: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    invitedBy: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    guestName: 'Peter Müller',
    from: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    to: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    invitedBy: 'u5',
    createdAt: new Date().toISOString(),
  },
];

const SEED_AUFGABEN: Aufgabe[] = [
  {
    id: 't1',
    title: 'Hecke beim Sauna-Weg schneiden',
    description: 'Die Hecke entlang des Wegs zur Sauna ist zu hoch.',
    assigneeId: 'u9',
    done: false,
    pin: { x: -8, z: 4, label: 'Sauna-Weg' },
    createdBy: 'u1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Glasscherben im Innenhof aufsammeln',
    assigneeId: undefined,
    done: false,
    pin: { x: 2, z: -2, label: 'Innenhof' },
    createdBy: 'u5',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Fahrräder im Keller sortieren',
    done: true,
    createdBy: 'u16',
    createdAt: new Date().toISOString(),
  },
];

// ============== Persistence ==============
const KEY = 'via1-store-v6';

type PersistState = {
  users: User[];
  wgs: WG[];
  sitzungen: Sitzung[];
  aufgaben: Aufgabe[];
  putzplan: PutzAssignment[];
  sauna: SaunaState;
  bookings: WohnwagenBooking[];
  currentUserId: string | null;
};

function load(): PersistState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    users: SEED_USERS,
    wgs: WGS,
    sitzungen: SEED_SITZUNGEN,
    aufgaben: SEED_AUFGABEN,
    putzplan: seedPutzplan(),
    sauna: SEED_SAUNA,
    bookings: SEED_BOOKINGS,
    currentUserId: null,
  };
}

function persist(state: PersistState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// ============== Context ==============
type StoreCtx = {
  state: PersistState;
  setState: (updater: (s: PersistState) => PersistState) => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  resetAll: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<PersistState>(() => load());

  useEffect(() => {
    persist(state);
  }, [state]);

  const setState = (updater: (s: PersistState) => PersistState) => setStateRaw(updater);

  const login: StoreCtx['login'] = (email, password) => {
    const u = state.users.find(
      (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password
    );
    if (!u) return { ok: false, error: 'E-Mail oder Passwort falsch.' };
    setState((s) => ({ ...s, currentUserId: u.id }));
    return { ok: true };
  };

  const logout = () => setState((s) => ({ ...s, currentUserId: null }));

  const resetAll = () => {
    localStorage.removeItem(KEY);
    setStateRaw({
      users: SEED_USERS,
      wgs: WGS,
      sitzungen: SEED_SITZUNGEN,
      aufgaben: SEED_AUFGABEN,
      putzplan: seedPutzplan(),
      sauna: SEED_SAUNA,
      bookings: SEED_BOOKINGS,
      currentUserId: null,
    });
  };

  return <Ctx.Provider value={{ state, setState, login, logout, resetAll }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export function useAuth() {
  const { state, login, logout } = useStore();
  const user = state.currentUserId ? state.users.find((u) => u.id === state.currentUserId) ?? null : null;
  return { user, login, logout };
}

export function useCurrentWG() {
  const { state } = useStore();
  const { user } = useAuth();
  return user ? state.wgs.find((w) => w.id === user.wgId) ?? null : null;
}

export function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(m: string) {
  const [y, mm] = m.split('-').map(Number);
  const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${names[mm - 1]} ${y}`;
}
