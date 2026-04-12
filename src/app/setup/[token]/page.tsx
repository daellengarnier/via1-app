"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Diet = "fleisch" | "vegi" | "vegan";

const wgOptions = [
  { name: "Nordwind", rooms: ["N01", "N02", "N03", "N04", "N05"] },
  { name: "Ostblock", rooms: ["O01", "O02", "O03", "O04", "O05"] },
  { name: "Dreiecksbar", rooms: ["N11", "N12", "N13", "N14", "N15"] },
  { name: "Kleenex", rooms: ["O11", "O12", "O13", "O14", "O15"] },
  { name: "Family-WG", rooms: ["N21", "N22", "N23", "N24", "N25"] },
  { name: "Bonzen", rooms: ["O21", "O22", "O23", "O24"] },
];

const dietLabels: Record<Diet, string> = {
  fleisch: "Fleisch",
  vegi: "Vegetarisch",
  vegan: "Vegan",
};

export default function SetupPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  // Schritt 1: Profil
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [wg, setWg] = useState("");
  const [room, setRoom] = useState("");
  const [diet, setDiet] = useState<Diet>("fleisch");
  const [allergies, setAllergies] = useState("");

  // Schritt 2: Passwort
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const selectedWg = wgOptions.find((w) => w.name === wg);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("Vollständiger Name ist erforderlich.");
      return;
    }
    if (!displayName.trim()) {
      setError("Anzeigename ist erforderlich.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Gültige E-Mail-Adresse erforderlich.");
      return;
    }
    if (!wg) {
      setError("Bitte wähle eine WG.");
      return;
    }
    if (!room) {
      setError("Bitte wähle dein Zimmer.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        password,
        profile: {
          fullName,
          displayName,
          email,
          birthday,
          wg,
          room,
          diet,
          allergies,
        },
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error: string };
      setError(data.error || "Fehler beim Einrichten.");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Animated background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={
          {
            "--glow-rgb": "0, 255, 100",
          } as React.CSSProperties
        }
      >
        <div className="via-glow via-glow-1" />
        <div className="via-glow via-glow-2" />
        <div className="via-glow via-glow-3" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Pyramide Logo */}
        <div className="mb-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pyramid.webp"
            alt="Via 1"
            className="h-32 w-32 object-contain"
            style={{
              filter:
                "drop-shadow(0 0 15px rgba(0,255,100,0.5)) drop-shadow(0 0 30px rgba(0,200,80,0.3))",
              animation: "icon-glow 4s ease-in-out infinite alternate",
            }}
          />
        </div>

        <h1 className="mb-1 text-center font-cinzel text-3xl text-emerald-300">
          Willkommen bei Via 1
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {step === 1 ? "Dein Profil" : "Passwort einrichten"}
        </p>

        {/* Fortschritt */}
        <div className="mb-6 flex gap-2">
          <div
            className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-accent" : "bg-gray-800"}`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-accent" : "bg-gray-800"}`}
          />
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Vollständiger Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Max Muster"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Anzeigename
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Max"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
              <p className="mt-1 text-[10px] text-gray-600">
                So sehen dich die anderen Bewohner:innen
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@via1.ch"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Wohngemeinschaft
              </label>
              <select
                value={wg}
                onChange={(e) => {
                  setWg(e.target.value);
                  setRoom("");
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              >
                <option value="">WG wählen...</option>
                {wgOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedWg && (
              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  Zimmer
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedWg.rooms.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoom(r)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                        room === r
                          ? "bg-accent text-dark"
                          : "border border-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Geburtstag
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Essensgewohnheiten
              </label>
              <div className="flex gap-2">
                {(Object.keys(dietLabels) as Diet[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiet(d)}
                    className={`flex-1 rounded-lg py-1.5 font-mono text-xs font-bold transition-colors ${
                      diet === d
                        ? "bg-accent text-dark"
                        : "border border-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    {dietLabels[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Allergien / Unverträglichkeiten{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="z.B. Laktose, Nüsse..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-accent py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-dark transition hover:brightness-110"
            >
              Weiter →
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Neues Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
                minLength={8}
              />
              <p className="mt-1 text-[10px] text-gray-600">
                Mindestens 8 Zeichen
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
                minLength={8}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-xs text-gray-400 hover:text-white"
              >
                ← Zurück
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-accent py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-dark transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Wird eingerichtet..." : "Registrierung abschliessen"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
