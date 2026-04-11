"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Diet = "fleisch" | "vegi" | "vegan";

interface ProfileData {
  name: string;
  email: string;
  birthday: string;
  diet: Diet;
  allergies: string;
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
  const [profile, setProfile] = useState<ProfileData>({
    name: "Alain",
    email: "alain@via1.ch",
    birthday: "1990-06-15",
    diet: "fleisch",
    allergies: "",
    notifications: {
      sauna: true,
      aufgaben: true,
      termine: true,
    },
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-500 hover:text-white"
      >
        ← Zurueck
      </button>

      <h1 className="mb-6 font-mono text-2xl font-bold text-accent">
        Mein Profil
      </h1>

      {/* Avatar & Name */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 font-mono text-xl font-bold text-accent">
            {profile.name.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-medium text-white">{profile.name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
          </div>
        </div>
      </div>

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
          Allergien / Unvertraeglichkeiten
        </h2>
        <textarea
          value={profile.allergies}
          onChange={(e) =>
            setProfile({ ...profile, allergies: e.target.value })
          }
          placeholder="z.B. Laktose, Gluten, Nuesse..."
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
        className={`w-full rounded-lg py-3 font-mono text-sm font-bold transition-colors ${
          saved
            ? "bg-accent/20 text-accent"
            : "bg-accent text-dark hover:brightness-110"
        }`}
      >
        {saved ? "Gespeichert!" : "Speichern"}
      </button>
    </div>
  );
}
