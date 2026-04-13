"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Diet = "fleisch" | "vegi" | "vegan";

const wgOptions = [
  { name: "Nordwind", rooms: ["N01", "N02", "N03", "N04", "N05"] },
  { name: "Ostblock", rooms: ["O01", "O02", "O03", "O04", "O05"] },
  { name: "Dreiecksbar", rooms: ["N11", "N12", "N13", "N14", "N15"] },
  { name: "Kleenex", rooms: ["O11", "O12", "O13", "O14", "O15"] },
  { name: "Family-WG", rooms: ["N21", "N22", "N23", "N24", "N25"] },
  { name: "Bonzen", rooms: ["O21", "O22", "O23", "O24"] },
];

interface ProfileData {
  fullName: string;
  displayName: string;
  email: string;
  birthday: string;
  wg: string;
  room: string;
  diet: Diet;
  allergies: string;
  profileImage: string | null;
  notifications: {
    sauna: boolean;
    aufgaben: boolean;
    termine: boolean;
  };
}

const dietLabels: Record<Diet, string> = {
  fleisch: "Fleisch",
  vegi: "Vegetarisch",
  vegan: "Vegan",
};

export default function ProfilPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    displayName: "",
    email: "",
    birthday: "",
    wg: "",
    room: "",
    diet: "fleisch",
    allergies: "",
    profileImage: null,
    notifications: {
      sauna: true,
      aufgaben: true,
      termine: true,
    },
  });

  const selectedWg = wgOptions.find((w) => w.name === profile.wg);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ProfileData;
      setProfile(data);
    } catch (err) {
      console.error("Profil laden", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as ProfileData;
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Profil speichern", err);
      alert(
        "Konnte Profil nicht speichern: " +
          (err instanceof Error ? err.message : "Fehler")
      );
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 600_000) {
      alert("Bild zu gross (max ~600 KB). Bitte komprimieren.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfile({ ...profile, profileImage: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => router.back()}
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
      >
        ← Zurück
      </button>

      <h1 className="mb-6 text-center font-cinzel text-3xl text-accent">
        Mein Profil
      </h1>

      {/* Profilbild & Name */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
        <div className="flex items-center gap-4">
          <label className="group relative cursor-pointer">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profil"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs text-white">Foto</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <div>
            <p className="text-lg font-medium text-white">
              {profile.displayName}
            </p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            {profile.wg && (
              <p className="font-mono text-xs text-accent">
                {profile.wg} · {profile.room}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vollständiger Name */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Vollständiger Name
        </h2>
        <input
          type="text"
          value={profile.fullName}
          onChange={(e) =>
            setProfile({ ...profile, fullName: e.target.value })
          }
          placeholder="Vor- und Nachname"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          required
        />
      </section>

      {/* Anzeigename */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Anzeigename
        </h2>
        <input
          type="text"
          value={profile.displayName}
          onChange={(e) =>
            setProfile({ ...profile, displayName: e.target.value })
          }
          placeholder="Wie möchtest du angezeigt werden?"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-600">
          So sehen dich die anderen Bewohner:innen
        </p>
      </section>

      {/* WG-Zuordnung */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Wohngemeinschaft
        </h2>
        <select
          value={profile.wg}
          onChange={(e) =>
            setProfile({ ...profile, wg: e.target.value, room: "" })
          }
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          <option value="">WG wählen...</option>
          {wgOptions.map((wg) => (
            <option key={wg.name} value={wg.name}>
              {wg.name}
            </option>
          ))}
        </select>
      </section>

      {/* Zimmer-Zuordnung */}
      {selectedWg && (
        <section className="mb-6">
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
            Zimmer
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedWg.rooms.map((room) => (
              <button
                key={room}
                onClick={() => setProfile({ ...profile, room })}
                className={`rounded-lg px-4 py-2 font-mono text-sm font-bold transition-colors ${
                  profile.room === room
                    ? "bg-accent text-dark"
                    : "border border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {room}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Mehrere Personen können sich dem gleichen Zimmer zuordnen
          </p>
        </section>
      )}

      {/* Geburtstag */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Geburtstag
        </h2>
        <input
          type="date"
          value={profile.birthday}
          onChange={(e) =>
            setProfile({ ...profile, birthday: e.target.value })
          }
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </section>

      {/* Essensgewohnheiten */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Essensgewohnheiten
        </h2>
        <div className="flex gap-2">
          {(Object.keys(dietLabels) as Diet[]).map((d) => (
            <button
              key={d}
              onClick={() => setProfile({ ...profile, diet: d })}
              className={`flex-1 rounded-lg py-2 font-mono text-xs font-bold transition-colors ${
                profile.diet === d
                  ? "bg-accent text-dark"
                  : "border border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {dietLabels[d]}
            </button>
          ))}
        </div>
      </section>

      {/* Allergien */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Allergien / Unverträglichkeiten
        </h2>
        <textarea
          value={profile.allergies}
          onChange={(e) =>
            setProfile({ ...profile, allergies: e.target.value })
          }
          placeholder="z.B. Laktose, Gluten, Nüsse..."
          rows={2}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
        />
      </section>

      {/* Benachrichtigungen */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Benachrichtigungen
        </h2>
        <div className="space-y-3">
          {([
            { key: "sauna" as const, label: "Sauna wird eingeheizt" },
            { key: "aufgaben" as const, label: "Neue Aufgaben" },
            { key: "termine" as const, label: "Neue Termine" },
          ]).map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3"
            >
              <span className="text-sm text-white">{label}</span>
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    notifications: {
                      ...profile.notifications,
                      [key]: !profile.notifications[key],
                    },
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  profile.notifications[key] ? "bg-accent" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    profile.notifications[key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Speichern */}
      <button
        onClick={handleSave}
        disabled={saving || loading}
        className={`w-full rounded-lg py-3 font-mono text-sm font-bold transition-colors disabled:opacity-60 ${
          saved
            ? "bg-accent/20 text-accent"
            : "bg-accent text-dark hover:brightness-110"
        }`}
      >
        {saving ? "Speichern …" : saved ? "Gespeichert!" : "Speichern"}
      </button>
    </div>
  );
}
