"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COOKING_PRESETS } from "@/lib/wg-koch-presets";

interface Person {
  id: string;
  name: string;
  avatar: string | null;
}

interface Kind {
  id: string;
  name: string;
  parentIds: string[];
}

interface Signup {
  id: string;
  user: Person;
  status: "going" | "declined";
  childrenIds: string[];
  guests: number;
  notes: string | null;
}

interface Eintrag {
  id: string;
  date: string;
  time: string | null;
  title: string;
  description: string | null;
  cook: Person | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  signups: Signup[];
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  defaultTime: string | null;
}

interface ApiData {
  today: string;
  from: string;
  to: string;
  members: Person[];
  kinder: Kind[];
  eintraege: Eintrag[];
  templates: Template[];
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
  meName: string;
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatDateLabel(iso: string, todayIso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const t = new Date(todayIso + "T00:00:00Z");
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  const wd = WEEKDAYS[d.getUTCDay()] ?? "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (diff === 0) return `Heute · ${wd}, ${dd}.${mm}`;
  if (diff === 1) return `Morgen · ${wd}, ${dd}.${mm}`;
  if (diff === -1) return `Gestern · ${wd}, ${dd}.${mm}`;
  return `${wd}, ${dd}.${mm}`;
}

export function KochplanClient({ slug, wgName, meId, meName }: Props) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState<Eintrag | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showKinder, setShowKinder] = useState(false);
  const [editing, setEditing] = useState<Eintrag | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/kochplan`);
      if (!res.ok) {
        console.error("kochplan load", res.status);
        return;
      }
      setData((await res.json()) as ApiData);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    if (!data) return new Map<string, Eintrag[]>();
    const map = new Map<string, Eintrag[]>();
    for (const e of data.eintraege) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [data]);

  const days = useMemo(() => {
    if (!data) return [] as string[];
    const out: string[] = [];
    const start = new Date(data.from + "T00:00:00Z");
    const end = new Date(data.to + "T00:00:00Z");
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, [data]);

  if (loading || !data) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
        <p className="text-sm text-gray-500">Lade Kochplan...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/meine-wg/${slug}`}
            className="font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-accent"
          >
            ← {wgName}
          </Link>
          <h1 className="font-cinzel text-3xl text-accent">🍳 Kochplan</h1>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setShowTemplates(true)}
            className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:border-accent hover:text-accent"
          >
            Vorlagen
          </button>
          <button
            onClick={() => setShowKinder(true)}
            className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:border-accent hover:text-accent"
          >
            Kinder
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const items = byDay.get(day) ?? [];
          const isToday = day === data.today;
          return (
            <div
              key={day}
              className={`rounded-xl border p-3 ${
                isToday
                  ? "border-accent/50 bg-accent/5"
                  : "border-gray-800 bg-gray-900/30"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p
                  className={`font-mono text-xs font-bold uppercase tracking-wider ${
                    isToday ? "text-accent" : "text-gray-400"
                  }`}
                >
                  {formatDateLabel(day, data.today)}
                </p>
                <button
                  onClick={() => {
                    setEditing(null);
                    setShowAdd(day);
                  }}
                  className="rounded border border-secondary/40 bg-secondary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20"
                >
                  + Essen
                </button>
              </div>

              {items.length === 0 ? (
                <p className="py-2 text-center text-[11px] italic text-gray-600">
                  noch nichts geplant
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((e) => (
                    <EintragCard
                      key={e.id}
                      e={e}
                      meId={meId}
                      members={data.members}
                      kinder={data.kinder}
                      onSignup={() => setShowSignup(e)}
                      onEdit={() => {
                        setShowAdd(null);
                        setEditing(e);
                      }}
                      onDelete={async () => {
                        if (!confirm("Wirklich loeschen?")) return;
                        await fetch(
                          `/api/meine-wg/${slug}/kochplan/eintraege/${e.id}`,
                          { method: "DELETE" }
                        );
                        load();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(showAdd || editing) && (
        <EintragModal
          slug={slug}
          initialDate={editing?.date ?? showAdd ?? data.today}
          editing={editing}
          templates={data.templates}
          meName={meName}
          onClose={() => {
            setShowAdd(null);
            setEditing(null);
          }}
          onSaved={() => {
            setShowAdd(null);
            setEditing(null);
            load();
          }}
        />
      )}

      {showSignup && (
        <SignupModal
          slug={slug}
          eintrag={showSignup}
          meId={meId}
          kinder={data.kinder}
          onClose={() => setShowSignup(null)}
          onSaved={() => {
            setShowSignup(null);
            load();
          }}
        />
      )}

      {showTemplates && (
        <TemplatesModal
          slug={slug}
          templates={data.templates}
          onClose={() => setShowTemplates(false)}
          onChanged={load}
        />
      )}

      {showKinder && (
        <KinderModal
          slug={slug}
          kinder={data.kinder}
          members={data.members}
          onClose={() => setShowKinder(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function EintragCard({
  e,
  meId,
  members,
  kinder,
  onSignup,
  onEdit,
  onDelete,
}: {
  e: Eintrag;
  meId: string;
  members: Person[];
  kinder: Kind[];
  onSignup: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const going = e.signups.filter((s) => s.status === "going");
  const declined = e.signups.filter((s) => s.status === "declined");
  const respondedIds = new Set(e.signups.map((s) => s.user.id));
  // Cook gilt automatisch als dabei → von noResponse ausschliessen
  if (e.cook) respondedIds.add(e.cook.id);
  const noResponse = members.filter((m) => !respondedIds.has(m.id));

  const totalAdults = going.length + (e.cook ? 1 : 0);
  const totalKids = going.reduce((sum, s) => sum + s.childrenIds.length, 0);
  const totalGuests = going.reduce((sum, s) => sum + s.guests, 0);
  const total = totalAdults + totalKids + totalGuests;

  const mySignup = e.signups.find((s) => s.user.id === meId);
  const myStatus = mySignup?.status ?? null;

  return (
    <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {e.time && (
              <span className="font-mono text-xs text-secondary">{e.time}</span>
            )}
            <p className="truncate font-medium text-white">{e.title}</p>
          </div>
          {e.description && (
            <p className="mt-0.5 text-xs text-gray-400">{e.description}</p>
          )}
          {e.cook && (
            <p className="mt-1 text-[11px] text-gray-500">
              🍳 kocht: <span className="text-gray-300">{e.cook.name}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 hover:text-white"
            title="Bearbeiten"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-500 hover:text-red-400"
            title="Loeschen"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[11px] text-gray-400">
          {total > 0 ? (
            <>
              <span className="font-bold text-white">{total}</span> dabei
              <span className="ml-1 text-gray-600">
                ({totalAdults}E
                {totalKids > 0 ? ` + ${totalKids}K` : ""}
                {totalGuests > 0 ? ` + ${totalGuests}G` : ""})
              </span>
            </>
          ) : (
            <span className="italic text-gray-600">noch keine Anmeldungen</span>
          )}
        </div>
        <button
          onClick={onSignup}
          className={`rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
            myStatus === "going"
              ? "border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20"
              : myStatus === "declined"
                ? "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                : "bg-accent text-black hover:brightness-110"
          }`}
        >
          {myStatus === "going"
            ? "✓ dabei"
            : myStatus === "declined"
              ? "✗ kann nicht"
              : "antworten"}
        </button>
      </div>

      {(going.length > 0 || declined.length > 0 || noResponse.length > 0) && (
        <div className="mt-2 space-y-1.5">
          {going.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-accent">
                dabei ({going.length})
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {going.map((s) => (
                  <SignupBadge key={s.id} signup={s} kinder={kinder} />
                ))}
              </div>
            </div>
          )}
          {declined.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-red-400/70">
                kann nicht ({declined.length})
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {declined.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-red-500/30 bg-red-500/5 px-2 py-0.5 text-[10px] text-red-300/80"
                    title={s.notes ?? undefined}
                  >
                    {s.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {noResponse.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                noch keine Antwort ({noResponse.length})
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {noResponse.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full border border-gray-700 bg-transparent px-2 py-0.5 text-[10px] text-gray-500"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignupBadge({ signup, kinder }: { signup: Signup; kinder: Kind[] }) {
  const childNames = signup.childrenIds
    .map((cid) => kinder.find((k) => k.id === cid)?.name)
    .filter((n): n is string => !!n);
  const extras: string[] = [...childNames];
  if (signup.guests > 0) extras.push(`+${signup.guests} Gast${signup.guests > 1 ? "e" : ""}`);
  return (
    <span
      className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
      title={signup.notes ?? undefined}
    >
      {signup.user.name}
      {extras.length > 0 && (
        <span className="text-accent/70"> + {extras.join(", ")}</span>
      )}
    </span>
  );
}

function EintragModal({
  slug,
  initialDate,
  editing,
  templates,
  meName,
  onClose,
  onSaved,
}: {
  slug: string;
  initialDate: string;
  editing: Eintrag | null;
  templates: Template[];
  meName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(editing?.date ?? initialDate);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [time, setTime] = useState(editing?.time ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selfCook, setSelfCook] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(s: string) {
    setTitle(s);
  }

  function applyTemplate(t: Template) {
    setTitle(t.title);
    if (t.description) setDescription(t.description);
    if (t.defaultTime) setTime(t.defaultTime);
  }

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError("Titel fehlt.");
      return;
    }
    setBusy(true);
    try {
      const url = editing
        ? `/api/meine-wg/${slug}/kochplan/eintraege/${editing.id}`
        : `/api/meine-wg/${slug}/kochplan/eintraege`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title: title.trim(),
          time: time || null,
          description: description || null,
          selfCook: editing ? false : selfCook,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Fehler.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "Essen bearbeiten" : "Neues Essen"} onClose={onClose}>
      <Field label="Schnellauswahl">
        <div className="flex flex-wrap gap-1">
          {COOKING_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => applyPreset(s)}
              className="rounded-full border border-secondary/40 bg-secondary/10 px-2 py-1 text-xs text-secondary hover:bg-secondary/20"
            >
              {s}
            </button>
          ))}
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300 hover:border-accent hover:text-accent"
              title="Eigene Vorlage"
            >
              ⭐ {t.title}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Datum">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>

      <Field label="Titel">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Bolognese"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          autoFocus
        />
      </Field>

      <Field label="Zeit (optional)">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>

      <Field label="Beschreibung (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          placeholder="Was wird's geben?"
        />
      </Field>

      {!editing && (
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={selfCook}
            onChange={(e) => setSelfCook(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-accent"
          />
          Ich ({meName}) koche
        </label>
      )}

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "..." : editing ? "Speichern" : "Anlegen"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400 hover:border-gray-500"
        >
          Abbrechen
        </button>
      </div>
    </Modal>
  );
}

function SignupModal({
  slug,
  eintrag,
  meId,
  kinder,
  onClose,
  onSaved,
}: {
  slug: string;
  eintrag: Eintrag;
  meId: string;
  kinder: Kind[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = eintrag.signups.find((s) => s.user.id === meId);
  const myKinder = kinder.filter((k) => k.parentIds.includes(meId));

  const [status, setStatus] = useState<"going" | "declined">(
    existing?.status ?? "going"
  );
  const [childrenIds, setChildrenIds] = useState<string[]>(
    existing?.childrenIds ?? myKinder.map((k) => k.id) // default: alle eigenen Kinder dabei
  );
  const [guests, setGuests] = useState(existing?.guests ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
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
            guests: status === "going" ? guests : 0,
            notes: notes || null,
          }),
        }
      );
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await fetch(
        `/api/meine-wg/${slug}/kochplan/eintraege/${eintrag.id}/signup`,
        { method: "DELETE" }
      );
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Antwort: ${eintrag.title}`} onClose={onClose}>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setStatus("going")}
          className={`rounded-lg py-3 font-mono text-xs font-bold uppercase tracking-wider ${
            status === "going"
              ? "bg-accent text-black"
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
        <Field label="Kinder dabei?">
          <div className="space-y-1">
            {myKinder.map((k) => {
              const checked = childrenIds.includes(k.id);
              return (
                <label
                  key={k.id}
                  className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChild(k.id)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-accent"
                  />
                  {k.name}
                </label>
              );
            })}
          </div>
        </Field>
      )}

      {status === "going" && (
        <Counter label="Gaeste" value={guests} onChange={setGuests} />
      )}

      <Field label="Notiz (z.B. Allergien)">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          placeholder="optional"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>

      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
        >
          {existing ? "Aktualisieren" : "Speichern"}
        </button>
        {existing && (
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            title="Antwort zuruecksetzen"
          >
            ↺ Zurueck
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400 hover:border-gray-500"
        >
          Zu
        </button>
      </div>
    </Modal>
  );
}

function TemplatesModal({
  slug,
  templates,
  onClose,
  onChanged,
}: {
  slug: string;
  templates: Template[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [defaultTime, setDefaultTime] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/kochplan/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          defaultTime: defaultTime || null,
          description: description || null,
        }),
      });
      setTitle("");
      setDefaultTime("");
      setDescription("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Vorlage loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/kochplan/templates/${id}`, {
      method: "DELETE",
    });
    onChanged();
  }

  return (
    <Modal title="Vorlagen" onClose={onClose}>
      <p className="mb-3 text-xs text-gray-500">
        Wiederkehrende Essen als Vorlage speichern. Beim Anlegen eines Essens
        erscheint sie als Quick-Pick.
      </p>

      <div className="mb-3 space-y-2">
        {templates.length === 0 ? (
          <p className="py-3 text-center text-xs italic text-gray-600">
            noch keine Vorlagen
          </p>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-900/40 p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-white">
                  {t.title}
                  {t.defaultTime && (
                    <span className="ml-2 font-mono text-[10px] text-secondary">
                      {t.defaultTime}
                    </span>
                  )}
                </p>
                {t.description && (
                  <p className="truncate text-[11px] text-gray-500">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">
          Neue Vorlage
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel"
          className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
        />
        <div className="mb-2 flex gap-2">
          <input
            type="time"
            value={defaultTime}
            onChange={(e) => setDefaultTime(e.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
          />
        </div>
        <button
          onClick={add}
          disabled={busy || !title.trim()}
          className="w-full rounded bg-secondary px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:brightness-110 disabled:opacity-50"
        >
          + Vorlage anlegen
        </button>
      </div>
    </Modal>
  );
}

function KinderModal({
  slug,
  kinder,
  members,
  onClose,
  onChanged,
}: {
  slug: string;
  kinder: Kind[];
  members: Person[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleParent(id: string) {
    setParentIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/kochplan/kinder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentIds }),
      });
      setName("");
      setParentIds([]);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Kind loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/kochplan/kinder/${id}`, {
      method: "DELETE",
    });
    onChanged();
  }

  async function patchParents(id: string, ids: string[]) {
    await fetch(`/api/meine-wg/${slug}/kochplan/kinder/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentIds: ids }),
    });
    onChanged();
  }

  return (
    <Modal title="Kinder" onClose={onClose}>
      <p className="mb-3 text-xs text-gray-500">
        Kinder werden beim Sign-up der Eltern als Toggles angezeigt
        ("Nori dabei?"). Mehrere Eltern moeglich.
      </p>

      <div className="mb-3 space-y-2">
        {kinder.length === 0 ? (
          <p className="py-3 text-center text-xs italic text-gray-600">
            noch keine Kinder
          </p>
        ) : (
          kinder.map((k) => (
            <KindRow
              key={k.id}
              kind={k}
              members={members}
              onChangeParents={(ids) => patchParents(k.id, ids)}
              onDelete={() => remove(k.id)}
            />
          ))
        )}
      </div>

      <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">
          Neues Kind
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (z.B. Nori)"
          className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
        />
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
          Eltern
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {members.map((m) => {
            const checked = parentIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleParent(m.id)}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  checked
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-gray-700 bg-gray-900 text-gray-400"
                }`}
              >
                {checked ? "✓ " : ""}
                {m.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={add}
          disabled={busy || !name.trim()}
          className="w-full rounded bg-secondary px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:brightness-110 disabled:opacity-50"
        >
          + Kind anlegen
        </button>
      </div>
    </Modal>
  );
}

function KindRow({
  kind,
  members,
  onChangeParents,
  onDelete,
}: {
  kind: Kind;
  members: Person[];
  onChangeParents: (ids: string[]) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [ids, setIds] = useState<string[]>(kind.parentIds);

  function toggle(id: string) {
    setIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{kind.name}</p>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (editing) {
                onChangeParents(ids);
              }
              setEditing(!editing);
            }}
            className="text-xs text-gray-500 hover:text-white"
          >
            {editing ? "✓" : "✎"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Eltern:{" "}
        {kind.parentIds.length === 0
          ? "—"
          : kind.parentIds
              .map((pid) => members.find((m) => m.id === pid)?.name ?? "?")
              .join(", ")}
      </p>
      {editing && (
        <div className="mt-2 flex flex-wrap gap-1">
          {members.map((m) => {
            const checked = ids.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  checked
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-gray-700 bg-gray-900 text-gray-400"
                }`}
              >
                {checked ? "✓ " : ""}
                {m.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Modal({
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-cinzel text-lg text-accent">{title}</h2>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-full border border-gray-700 bg-gray-900 text-lg text-white hover:border-accent disabled:opacity-30"
          disabled={value === 0}
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-base text-white">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(20, value + 1))}
          className="h-8 w-8 rounded-full border border-gray-700 bg-gray-900 text-lg text-white hover:border-accent"
        >
          +
        </button>
      </div>
    </div>
  );
}
