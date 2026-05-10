"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Diet = "fleisch" | "vegi" | "vegan";

const wgOptions = [
  { name: "Nordwind", rooms: ["N01", "N02", "N03", "N04", "N05"] },
  { name: "Ostblock", rooms: ["O01", "O02", "O03", "O04", "O05"] },
  { name: "Dreiecksbar", rooms: ["N11", "N12", "N13", "N14", "N15"] },
  { name: "Kleenex", rooms: ["O11", "O12", "O13", "O14", "O15"] },
  { name: "Family-WG", rooms: ["N21", "N22", "N23", "N24", "N25"] },
  { name: "Bonzennest", rooms: ["O21", "O22", "O23", "O24"] },
];

const dietLabels: Record<Diet, string> = {
  fleisch: "Fleisch",
  vegi: "Vegetarisch",
  vegan: "Vegan",
};

export default function RegistrierenPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [wg, setWg] = useState("");
  const [room, setRoom] = useState("");
  const [diet, setDiet] = useState<Diet>("fleisch");
  const [allergies, setAllergies] = useState("");
  const [hasKaffeeAbo, setHasKaffeeAbo] = useState(false);
  const [favoriteAnimal, setFavoriteAnimal] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const selectedWg = wgOptions.find((w) => w.name === wg);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Vollständiger Name ist erforderlich.");
    if (!displayName.trim()) return setError("Anzeigename ist erforderlich.");
    if (!email.trim() || !email.includes("@"))
      return setError("Gültige E-Mail-Adresse erforderlich.");
    if (!wg) return setError("Bitte wähle eine WG.");
    if (!room) return setError("Bitte wähle dein Zimmer.");
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
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          fullName,
          displayName,
          email,
          birthday,
          wg,
          room,
          diet,
          allergies,
          hasKaffeeAbo,
          favoriteAnimal,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }
      // Nach erfolgreicher Registrierung direkt einloggen
      router.push("/login?registered=1");
    } catch (err) {
      console.error("register", err);
      setError("Netzwerkfehler. Bitte erneut versuchen.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={
          {
            "--glow-rgb": "184, 240, 104",
          } as React.CSSProperties
        }
      >
        <div className="via-glow via-glow-1" />
        <div className="via-glow via-glow-2" />
        <div className="via-glow via-glow-3" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pyramid.webp"
            alt="Via 1"
            className="h-32 w-32 object-contain"
            style={{
              filter:
                "drop-shadow(0 0 20px rgba(184,240,104,0.65)) drop-shadow(0 0 40px rgba(184,240,104,0.35))",
              animation: "icon-glow 4s ease-in-out infinite alternate",
            }}
          />
        </div>

        <h1 className="mb-1 text-center font-display font-bold uppercase tracking-wider text-3xl text-accent">
          Registrieren
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {step === 1 ? "Dein Profil" : "Passwort einrichten"}
        </p>

        <div className="mb-6 flex gap-2">
          <div
            className={`h-1 flex-1 rounded-full ${
              step >= 1 ? "bg-accent" : "bg-gray-800"
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${
              step >= 2 ? "bg-accent" : "bg-gray-800"
            }`}
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
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">E-Mail</label>
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
                <label className="mb-1 block text-xs text-gray-400">Zimmer</label>
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
                Geburtstag{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="box-border block h-10 w-full min-w-0 appearance-none rounded-lg border border-gray-700 bg-gray-900 px-3 text-sm text-white focus:border-accent focus:outline-none"
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

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Lieblingstier{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={favoriteAnimal}
                onChange={(e) => setFavoriteAnimal(e.target.value)}
                placeholder="z.B. Fuchs, Pinguin, Wolf..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <div className="pr-3">
                <p className="text-sm text-white">Kaffee-Abo</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Ich habe oder möchte das Kaffee-Abo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasKaffeeAbo(!hasKaffeeAbo)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  hasKaffeeAbo ? "bg-accent" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    hasKaffeeAbo ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-xs text-gray-400 hover:text-white"
              >
                ← Login
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-accent py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-dark shadow-[0_0_20px_rgba(184,240,104,0.35)] transition hover:brightness-110"
              >
                Weiter →
              </button>
            </div>
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
              <p className="mt-1 text-[10px] text-gray-600">Mindestens 8 Zeichen</p>
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
                className="flex-1 rounded-lg bg-accent py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-dark shadow-[0_0_20px_rgba(184,240,104,0.35)] transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Wird eingerichtet..." : "Registrieren"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
