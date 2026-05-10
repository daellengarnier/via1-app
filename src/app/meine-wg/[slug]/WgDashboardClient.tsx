"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SLOT_ICON,
  SLOT_LABEL,
  type Slot,
} from "@/lib/wg-koch-slots";

// Minimale Datenshapes — wiederverwendete Public-API der Feature-Routen.
interface KochSignup {
  user: { id: string };
  status: "going" | "declined";
  childrenIds: string[];
  guests: number;
}
interface KochEintrag {
  id: string;
  date: string;
  slot: Slot;
  time: string | null;
  menu: string | null;
  cook: { id: string; name: string } | null;
  signups: KochSignup[];
}
interface KochKind {
  id: string;
  name: string;
  parentIds: string[];
}
interface KochData {
  today: string;
  eintraege: KochEintrag[];
  kinder: KochKind[];
  members: { id: string; name: string }[];
}

interface ShoppingItem {
  id: string;
  text: string;
  done: boolean;
  createdBy: { id: string; name: string };
  comments: { id: string }[];
}

interface AemtliData {
  members: { id: string; name: string }[];
  rotationOrder: string[];
  currentIndex: number;
  currentUser: { id: string; name: string } | null;
  lastDoneBy: { id: string; name: string } | null;
  lastDoneAt: string | null;
  checkedPflicht: string[];
}

interface TerminItem {
  id: string;
  title: string;
  date: string;
  location: string | null;
  traktandenCount: number;
  commentCount: number;
}
interface TermineData {
  termine: TerminItem[];
  birthdays: {
    user: { id: string; name: string };
    date: string;
    age: number | null;
    daysUntil: number;
  }[];
}

interface DoodleItem {
  id: string;
  title: string;
  finalized: boolean;
  finalizedDate: string | null;
  optionCount: number;
  totalVotes: number;
}

interface PinnwandNote {
  id: string;
  text: string;
  color: string;
  author: { id: string; name: string };
  createdAt: string;
  comments: { id: string }[];
}

interface Props {
  slug: string;
  meId: string;
}

export function WgDashboardClient({ slug, meId }: Props) {
  const [koch, setKoch] = useState<KochData | null>(null);
  const [shopping, setShopping] = useState<ShoppingItem[] | null>(null);
  const [aemtli, setAemtli] = useState<AemtliData | null>(null);
  const [termine, setTermine] = useState<TermineData | null>(null);
  const [doodles, setDoodles] = useState<DoodleItem[] | null>(null);
  const [pinnwand, setPinnwand] = useState<PinnwandNote[] | null>(null);

  const loadAll = useCallback(async () => {
    const [k, s, a, t, d, p] = await Promise.all([
      fetch(`/api/meine-wg/${slug}/kochplan`).then((r) =>
        r.ok ? (r.json() as Promise<KochData>) : null
      ),
      fetch(`/api/meine-wg/${slug}/einkauf`).then((r) =>
        r.ok ? (r.json() as Promise<ShoppingItem[]>) : null
      ),
      fetch(`/api/meine-wg/${slug}/aemtli`).then((r) =>
        r.ok ? (r.json() as Promise<AemtliData>) : null
      ),
      fetch(`/api/meine-wg/${slug}/termine`).then((r) =>
        r.ok ? (r.json() as Promise<TermineData>) : null
      ),
      fetch(`/api/meine-wg/${slug}/doodle`).then((r) =>
        r.ok ? (r.json() as Promise<DoodleItem[]>) : null
      ),
      fetch(`/api/meine-wg/${slug}/pinnwand`).then((r) =>
        r.ok ? (r.json() as Promise<PinnwandNote[]>) : null
      ),
    ]);
    setKoch(k);
    setShopping(s);
    setAemtli(a);
    setTermine(t);
    setDoodles(d);
    setPinnwand(p);
  }, [slug]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="space-y-3">
      <KochTile slug={slug} meId={meId} data={koch} onChanged={loadAll} />

      <ShoppingTile slug={slug} items={shopping} onChanged={loadAll} />

      <div className="grid grid-cols-2 gap-3">
        <AemtliTile slug={slug} data={aemtli} meId={meId} onChanged={loadAll} />
        <TermineTile slug={slug} data={termine} doodles={doodles} />
      </div>

      <PinnwandInline slug={slug} notes={pinnwand} onChanged={loadAll} />
    </div>
  );
}

// ===== KOCHPLAN-TILE =====

function KochTile({
  slug,
  meId,
  data,
  onChanged,
}: {
  slug: string;
  meId: string;
  data: KochData | null;
  onChanged: () => void;
}) {
  const [signupOpen, setSignupOpen] = useState<KochEintrag | null>(null);

  if (!data) {
    return (
      <Tile href={`/meine-wg/${slug}/kochplan`} icon="🍳" title="Kochplan">
        <p className="text-xs text-gray-500">Lade...</p>
      </Tile>
    );
  }

  const today = data.today;
  const lunch = data.eintraege.find(
    (e) => e.date === today && e.slot === "lunch"
  );
  const dinner = data.eintraege.find(
    (e) => e.date === today && e.slot === "dinner"
  );

  return (
    <>
      <div className="wg-tile-heavy p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <a
            href={`/meine-wg/${slug}/kochplan`}
            className="font-display text-xs font-bold uppercase tracking-widest text-white hover:text-white"
          >
            🍳 Kochplan · heute
          </a>
          <a
            href={`/meine-wg/${slug}/kochplan`}
            className="font-mono text-[10px] uppercase tracking-wider text-white hover:underline"
          >
            ganze Woche →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <KochSlotMini
            slot="lunch"
            eintrag={lunch}
            today={today}
            slug={slug}
            meId={meId}
            onSignup={(e) => setSignupOpen(e)}
            onChanged={onChanged}
          />
          <KochSlotMini
            slot="dinner"
            eintrag={dinner}
            today={today}
            slug={slug}
            meId={meId}
            onSignup={(e) => setSignupOpen(e)}
            onChanged={onChanged}
          />
        </div>
      </div>
      {signupOpen && (
        <KochSignupQuickModal
          slug={slug}
          eintrag={signupOpen}
          meId={meId}
          kinder={data.kinder}
          onClose={() => setSignupOpen(null)}
          onSaved={() => {
            setSignupOpen(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}

function KochSlotMini({
  slot,
  eintrag,
  today,
  slug,
  meId,
  onSignup,
  onChanged,
}: {
  slot: Slot;
  eintrag: KochEintrag | undefined;
  today: string;
  slug: string;
  meId: string;
  onSignup: (e: KochEintrag) => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function ichKoche() {
    setBusy(true);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/kochplan/eintraege`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today, // effective Bern-Tag aus API (nach 21h = morgen)
          slot,
          selfCook: true,
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        alert(b.error ?? `Konnte Eintrag nicht erstellen (${res.status})`);
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!eintrag) {
    return (
      <div className="rounded-lg border border-dashed border-gray-700 bg-black/30 p-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
          {SLOT_ICON[slot]} {SLOT_LABEL[slot]}
        </p>
        <p className="mt-1 text-[11px] italic text-gray-600">niemand kocht</p>
        <button
          onClick={ichKoche}
          disabled={busy}
          className="mt-2 w-full rounded-md bg-white px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
        >
          🍳 Ich koche!
        </button>
      </div>
    );
  }

  const going = eintrag.signups.filter((s) => s.status === "going").length;
  const totalKids = eintrag.signups
    .filter((s) => s.status === "going")
    .reduce((sum, s) => sum + s.childrenIds.length, 0);
  const totalGuests = eintrag.signups
    .filter((s) => s.status === "going")
    .reduce((sum, s) => sum + s.guests, 0);
  const total = going + (eintrag.cook ? 1 : 0) + totalKids + totalGuests;

  const mySignup = eintrag.signups.find((s) => s.user.id === meId);
  const myStatus = mySignup?.status ?? null;
  const meIsCook = eintrag.cook?.id === meId;

  return (
    <div className="rounded-lg bg-black/30 p-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-secondary">
        {SLOT_ICON[slot]} {SLOT_LABEL[slot]}
        {eintrag.time && (
          <span className="ml-1 text-gray-400">{eintrag.time}</span>
        )}
      </p>
      {eintrag.menu ? (
        <p className="mt-0.5 truncate text-sm font-medium text-white">
          {eintrag.menu}
        </p>
      ) : (
        <p className="mt-0.5 text-xs italic text-gray-500">(Menu offen)</p>
      )}
      {eintrag.cook && (
        <p className="text-[10px] text-gray-500">🍳 {eintrag.cook.name}</p>
      )}
      <p className="mt-1 text-[10px] text-gray-400">
        <span className="font-bold text-white">{total}</span> dabei
      </p>
      {!meIsCook && (
        <button
          onClick={() => onSignup(eintrag)}
          className={`mt-1 w-full rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
            myStatus === "going"
              ? "border border-white/50 bg-white/10 text-white"
              : myStatus === "declined"
                ? "border border-red-500/40 bg-red-500/10 text-red-300"
                : "bg-white text-black hover:brightness-90"
          }`}
        >
          {myStatus === "going"
            ? "✓ dabei"
            : myStatus === "declined"
              ? "✗ kann nicht"
              : "antworten"}
        </button>
      )}
    </div>
  );
}

function KochSignupQuickModal({
  slug,
  eintrag,
  meId,
  kinder,
  onClose,
  onSaved,
}: {
  slug: string;
  eintrag: KochEintrag;
  meId: string;
  kinder: KochKind[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = eintrag.signups.find((s) => s.user.id === meId);
  const myKinder = kinder.filter((k) => k.parentIds.includes(meId));
  const [status, setStatus] = useState<"going" | "declined">(
    existing?.status ?? "going"
  );
  const [childrenIds, setChildrenIds] = useState<string[]>(
    existing?.childrenIds ?? myKinder.map((k) => k.id)
  );
  const [busy, setBusy] = useState(false);

  function toggleChild(id: string) {
    setChildrenIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  async function save() {
    setBusy(true);
    try {
      await fetch(
        `/api/meine-wg/${slug}/kochplan/eintraege/${eintrag.id}/signup`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            childrenIds: status === "going" ? childrenIds : [],
            guests: 0,
          }),
        }
      );
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title={`${SLOT_ICON[eintrag.slot]} ${SLOT_LABEL[eintrag.slot]}${eintrag.menu ? ` · ${eintrag.menu}` : ""}`} onClose={onClose}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setStatus("going")}
          className={`rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider ${
            status === "going"
              ? "bg-white text-black"
              : "border border-gray-700 bg-gray-900 text-gray-400"
          }`}
        >
          ✓ Bin dabei
        </button>
        <button
          onClick={() => setStatus("declined")}
          className={`rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider ${
            status === "declined"
              ? "bg-red-500/30 text-red-200"
              : "border border-gray-700 bg-gray-900 text-gray-400"
          }`}
        >
          ✗ Kann nicht
        </button>
      </div>

      {status === "going" && myKinder.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {myKinder.map((k) => {
            const checked = childrenIds.includes(k.id);
            return (
              <button
                key={k.id}
                onClick={() => toggleChild(k.id)}
                className={`w-full rounded-lg px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-wider ${
                  checked
                    ? "bg-white/20 text-white ring-1 ring-accent"
                    : "border border-gray-700 bg-gray-900 text-gray-400"
                }`}
              >
                {checked ? "✓ " : ""}
                {k.name} isst mit
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
        >
          {existing ? "Aktualisieren" : "Speichern"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
        >
          Zu
        </button>
      </div>
    </ModalShell>
  );
}

// ===== EINKAUF-TILE =====

function ShoppingTile({
  slug,
  items,
  onChanged,
}: {
  slug: string;
  items: ShoppingItem[] | null;
  onChanged: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!items) {
    return (
      <Tile href={`/meine-wg/${slug}/einkauf`} icon="🛒" title="Einkauf">
        <p className="text-xs text-gray-500">Lade...</p>
      </Tile>
    );
  }

  const open = items.filter((i) => !i.done);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/einkauf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      setText("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string) {
    await fetch(`/api/meine-wg/${slug}/einkauf/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    onChanged();
  }

  return (
    <div className="wg-tile-light p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <a
          href={`/meine-wg/${slug}/einkauf`}
          className="font-display text-[11px] font-bold uppercase tracking-widest text-white hover:text-white"
        >
          🛒 Einkauf
        </a>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white">
          {open.length} offen
        </span>
      </div>

      {open.length > 0 && (
        // ~4 Items sichtbar, danach scrollbar
        <div className="mb-2 max-h-[140px] space-y-1 overflow-y-auto pr-1">
          {open.map((i) => (
            <button
              key={i.id}
              onClick={() => toggle(i.id)}
              className="flex w-full items-center gap-2 rounded border border-gray-800 bg-black/30 px-2 py-1 text-left text-xs text-white hover:border-white/50"
              title={`von ${i.createdBy.name}`}
            >
              <span className="text-gray-500">○</span>
              <span className="flex-1 truncate">{i.text}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={add} className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="+ hinzufuegen"
          maxLength={200}
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-white/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded bg-white px-2 py-1 text-[10px] font-bold uppercase text-black hover:brightness-90 disabled:opacity-50"
        >
          +
        </button>
      </form>
    </div>
  );
}

// ===== AEMTLI-TILE =====

function AemtliTile({
  slug,
  data,
}: {
  slug: string;
  data: AemtliData | null;
  meId: string;
  onChanged: () => void;
}) {
  if (!data) {
    return (
      <Tile href={`/meine-wg/${slug}/aemtli`} icon="🧹" title="Aemtli">
        <p className="text-xs text-gray-500">Lade...</p>
      </Tile>
    );
  }

  const overdueDays = data.lastDoneAt
    ? Math.floor(
        (Date.now() - new Date(data.lastDoneAt).getTime()) / 86400000
      )
    : 999;
  const isOverdue = overdueDays >= 11;

  return (
    <a
      href={`/meine-wg/${slug}/aemtli`}
      className={`block p-3 ${
        isOverdue
          ? "rounded-xl border border-red-500/40 bg-red-500/10"
          : "wg-tile-heavy"
      }`}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-white">
          🧹 Aemtli
        </span>
        {isOverdue && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-red-300">
            +{overdueDays}d
          </span>
        )}
      </div>
      {data.currentUser ? (
        <p className="truncate font-display text-sm font-bold uppercase tracking-wider text-white">
          {data.currentUser.name}
        </p>
      ) : (
        <p className="text-xs italic text-gray-500">keine Rotation</p>
      )}
      <p className="text-[10px] text-gray-400">ist dran</p>
      {data.lastDoneBy && data.lastDoneAt && (
        <div className="mt-2 rounded bg-black/30 px-2 py-1">
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
            zuletzt geputzt
          </p>
          <p className="text-[11px] text-white">
            {data.lastDoneBy.name}
            <span className="text-gray-400">
              {" "}
              ·{" "}
              {new Date(data.lastDoneAt).toLocaleDateString("de-CH", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
          </p>
        </div>
      )}
    </a>
  );
}

// ===== TERMINE-TILE =====

function TermineTile({
  slug,
  data,
  doodles,
}: {
  slug: string;
  data: TermineData | null;
  doodles: DoodleItem[] | null;
}) {
  if (!data) {
    return (
      <Tile href={`/meine-wg/${slug}/termine`} icon="📅" title="Termine">
        <p className="text-xs text-gray-500">Lade...</p>
      </Tile>
    );
  }

  const now = Date.now();
  const upcoming = data.termine
    .filter((t) => new Date(t.date).getTime() >= now)
    .slice(0, 1);
  const next = upcoming[0];
  const upcomingBdays = data.birthdays.slice(0, 1);
  const openDoodles = (doodles ?? []).filter((d) => !d.finalized);

  return (
    <div className="wg-tile-heavy p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <a
          href={`/meine-wg/${slug}/termine`}
          className="font-display text-[11px] font-bold uppercase tracking-widest text-white"
        >
          📅 Termine
        </a>
        {openDoodles.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-white">
            🗓 {openDoodles.length}
          </span>
        )}
      </div>

      {next ? (
        <div className="rounded bg-black/30 p-2">
          <p className="truncate font-display text-sm font-bold uppercase tracking-wider text-white">
            {next.title}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-gray-300">
            {new Date(next.date).toLocaleString("de-CH", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <a
            href={`/api/meine-wg/${slug}/termine/${next.id}/ics`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-block font-mono text-[9px] uppercase tracking-wider text-white/80 hover:text-white"
            title="In Kalender importieren"
          >
            📥 .ics
          </a>
        </div>
      ) : (
        <p className="text-xs italic text-gray-500">keine geplant</p>
      )}

      {upcomingBdays.length > 0 && (
        <p className="mt-1.5 truncate text-[10px] text-gray-300">
          🎂 {upcomingBdays[0]!.user.name}
          {upcomingBdays[0]!.daysUntil === 0
            ? " heute!"
            : upcomingBdays[0]!.daysUntil === 1
              ? " morgen"
              : ` in ${upcomingBdays[0]!.daysUntil}d`}
        </p>
      )}
    </div>
  );
}

// ===== PINNWAND (inline, kein Tile, wie auf Home) =====
// Direkt im Dashboard Sticky-Notes anzeigen + neue Notiz erstellen.

function PinnwandInline({
  slug,
  notes,
  onChanged,
}: {
  slug: string;
  notes: PinnwandNote[] | null;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/pinnwand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, color: "yellow" }),
      });
      setText("");
      setShowForm(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex-1" />
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-white">
          PINNWAND
        </p>
        <div className="flex flex-1 justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="font-display text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white"
          >
            + NEU
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nachricht an die WG..."
            className="flex-1 rounded border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-white/50 focus:outline-none"
            autoFocus
            maxLength={500}
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="rounded bg-white px-3 py-2 font-display text-[10px] font-bold uppercase text-black hover:brightness-90 disabled:opacity-50"
          >
            OK
          </button>
        </form>
      )}

      {notes === null ? (
        <p className="text-xs text-gray-500">Lade...</p>
      ) : notes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 px-3 py-6 text-center text-xs italic text-gray-500">
          Pinnwand ist leer.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.map((n, i) => {
            const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];
            const rot = rotations[i % rotations.length];
            return (
              <a
                key={n.id}
                href={`/meine-wg/${slug}/pinnwand`}
                className={`relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-white/15 to-white/5 p-3 pb-7 text-left text-white shadow-lg backdrop-blur-md transition-transform hover:rotate-0 hover:scale-105 ${rot}`}
                style={{
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />
                <p className="relative line-clamp-4 pt-1 text-sm font-medium leading-relaxed">
                  {n.text}
                </p>
                <div className="absolute bottom-1.5 left-3 right-3 flex items-end justify-between font-mono text-[10px] text-gray-300">
                  <span>— {n.author.name}</span>
                  {n.comments.length > 0 && (
                    <span>💬 {n.comments.length}</span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== HELFER =====

function Tile({
  href,
  icon,
  title,
  children,
}: {
  href: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="block wg-tile p-3 hover:wg-tile-strong">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
        {icon} {title}
      </p>
      <div className="mt-1">{children}</div>
    </a>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-lg text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
