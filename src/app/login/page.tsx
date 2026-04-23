"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-Mail oder Passwort falsch.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
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
            className="h-40 w-40 object-contain"
            style={{
              filter:
                "drop-shadow(0 0 20px rgba(184,240,104,0.65)) drop-shadow(0 0 40px rgba(184,240,104,0.35))",
              animation: "icon-glow 4s ease-in-out infinite alternate",
            }}
          />
        </div>

        <h1 className="mb-1 text-center font-cinzel text-4xl text-accent">
          Via 1
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">Anmelden</p>

        {justRegistered && (
          <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-center text-xs text-accent">
            ✓ Registrierung erfolgreich. Du kannst dich jetzt anmelden.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-gray-400">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs text-gray-400"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-dark shadow-[0_0_20px_rgba(184,240,104,0.35)] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="font-mono text-[10px] uppercase text-gray-600">
              oder
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <button
            type="button"
            onClick={() => router.push("/registrieren")}
            className="w-full rounded-lg border border-accent/50 bg-accent/5 py-2.5 font-display text-[11px] font-bold uppercase tracking-wider text-accent transition hover:bg-accent/10"
          >
            Registrieren
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-500">
          Noch kein Konto? Nutze oben &quot;Registrieren&quot;.
          Passwort vergessen? Melde dich bei{" "}
          <span className="text-accent">Dällen</span>.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
          <p className="text-sm text-gray-500">Lade …</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
