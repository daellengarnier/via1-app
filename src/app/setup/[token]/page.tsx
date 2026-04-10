"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwoerter stimmen nicht ueberein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Einrichten.");
        return;
      }

      router.push("/login?setup=success");
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Willkommen!</h1>
        <p className="text-gray-600 mb-8">
          Richte dein Passwort ein, um loszulegen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Passwort bestaetigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Wird eingerichtet..." : "Passwort setzen"}
          </button>
        </form>
      </div>
    </main>
  );
}
