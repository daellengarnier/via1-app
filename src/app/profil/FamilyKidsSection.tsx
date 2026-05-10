"use client";

import { useEffect, useState } from "react";

type DietEnum = "FLEISCH" | "VEGI" | "VEGAN";

interface FamilyKid {
  id: string;
  name: string;
  diet: DietEnum;
  allergies: string;
  parents: { id: string; name: string }[];
}

interface OtherParent {
  id: string;
  name: string;
}

const DIET_LABEL: Record<DietEnum, string> = {
  FLEISCH: "Fleisch",
  VEGI: "Vegi",
  VEGAN: "Vegan",
};

// "Meine Kinder"-Verwaltung im Profil. Eltern koennen Kinder anlegen,
// editieren, loeschen und weitere Eltern (z.B. Partner:in) hinzufuegen.
// Die Kinder erscheinen dann auf der Termin-Detailseite als Quick-Add-
// Chips fuer die Essens-Anmeldung.
export function FamilyKidsSection({ myUserId }: { myUserId: string }) {
  const [kids, setKids] = useState<FamilyKid[]>([]);
  const [otherUsers, setOtherUsers] = useState<OtherParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    try {
      const [kidsRes, usersRes] = await Promise.all([
        fetch("/api/family-kids"),
        fetch("/api/users"),
      ]);
      if (kidsRes.ok) setKids((await kidsRes.json()) as FamilyKid[]);
      if (usersRes.ok) {
        const users = (await usersRes.json()) as OtherParent[];
        setOtherUsers(users.filter((u) => u.id !== myUserId));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Meine Kinder
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded bg-accent/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent hover:bg-accent/30"
        >
          + Kind
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500">Lade...</p>
      ) : kids.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-800 px-3 py-4 text-center text-xs italic text-gray-500">
          Noch keine Kinder hinterlegt. Bei einer Termin-Anmeldung kannst du sie
          dann mit einem Klick mit-anmelden.
        </p>
      ) : (
        <div className="space-y-2">
          {kids.map((k) => (
            <KidCard
              key={k.id}
              kid={k}
              otherUsers={otherUsers}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddKidModal
          otherUsers={otherUsers}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </section>
  );
}

function KidCard({
  kid,
  otherUsers,
  onChanged,
}: {
  kid: FamilyKid;
  otherUsers: OtherParent[];
  onChanged: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(kid.name);
  const [diet, setDiet] = useState<DietEnum>(kid.diet);
  const [allergies, setAllergies] = useState(kid.allergies);
  const [parentIds, setParentIds] = useState<string[]>(
    kid.parents.map((p) => p.id)
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/family-kids/${kid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, diet, allergies, parentIds }),
      });
      setEdit(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`${kid.name} loeschen?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/family-kids/${kid.id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  function toggleParent(id: string) {
    setParentIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  if (!edit) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">{kid.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
              {DIET_LABEL[kid.diet]}
              {kid.allergies && ` · ${kid.allergies}`}
            </p>
            {kid.parents.length > 1 && (
              <p className="mt-1 text-[10px] text-gray-500">
                mit {kid.parents.filter((p) => p.name).map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={() => setEdit(true)}
            className="font-mono text-[10px] uppercase tracking-wider text-gray-400 hover:text-white"
          >
            bearbeiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/40 bg-gray-900/60 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:border-accent focus:outline-none"
        placeholder="Name"
      />
      <div className="mb-2 flex gap-1.5">
        {(["FLEISCH", "VEGI", "VEGAN"] as DietEnum[]).map((d) => (
          <button
            key={d}
            onClick={() => setDiet(d)}
            className={`flex-1 rounded py-1 font-mono text-[10px] uppercase tracking-wider ${
              diet === d
                ? "bg-accent text-dark"
                : "border border-gray-700 text-gray-400"
            }`}
          >
            {DIET_LABEL[d]}
          </button>
        ))}
      </div>
      <input
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        maxLength={200}
        placeholder="Allergien (optional)"
        className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
      />
      {otherUsers.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-gray-500">
            Weitere Eltern (du bist automatisch dabei)
          </p>
          <div className="flex flex-wrap gap-1">
            {otherUsers.map((u) => {
              const on = parentIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleParent(u.id)}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    on
                      ? "border-accent bg-accent text-dark"
                      : "border-gray-700 text-gray-400"
                  }`}
                >
                  {on ? "✓ " : "+ "}
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy || !name.trim()}
          className="flex-1 rounded bg-accent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-dark hover:brightness-90 disabled:opacity-50"
        >
          Speichern
        </button>
        <button
          onClick={() => setEdit(false)}
          disabled={busy}
          className="rounded border border-gray-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-400"
        >
          Abbrechen
        </button>
        <button
          onClick={del}
          disabled={busy}
          className="rounded border border-red-500/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500/10"
        >
          Loeschen
        </button>
      </div>
    </div>
  );
}

function AddKidModal({
  otherUsers,
  onClose,
  onSaved,
}: {
  otherUsers: OtherParent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [diet, setDiet] = useState<DietEnum>("FLEISCH");
  const [allergies, setAllergies] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/family-kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, diet, allergies, parentIds }),
      });
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  function toggleParent(id: string) {
    setParentIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wider text-white">
          Neues Kind
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={50}
          className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
        <div className="mb-2 flex gap-1.5">
          {(["FLEISCH", "VEGI", "VEGAN"] as DietEnum[]).map((d) => (
            <button
              key={d}
              onClick={() => setDiet(d)}
              className={`flex-1 rounded py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                diet === d
                  ? "bg-accent text-dark"
                  : "border border-gray-700 text-gray-400"
              }`}
            >
              {DIET_LABEL[d]}
            </button>
          ))}
        </div>
        <input
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          maxLength={200}
          placeholder="Allergien (optional)"
          className="mb-3 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
        />
        {otherUsers.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">
              Weitere Eltern (du bist automatisch dabei)
            </p>
            <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
              {otherUsers.map((u) => {
                const on = parentIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleParent(u.id)}
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      on
                        ? "border-accent bg-accent text-dark"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {on ? "✓ " : "+ "}
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !name.trim()}
            className="flex-1 rounded bg-accent px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-dark hover:brightness-90 disabled:opacity-50"
          >
            Anlegen
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded border border-gray-700 px-3 py-2 font-mono text-xs uppercase tracking-wider text-gray-400"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
