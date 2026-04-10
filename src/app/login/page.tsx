"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 font-mono text-3xl font-bold text-accent">
          via1
        </h1>
        <p className="mb-8 text-sm text-gray-400">Anmelden</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-gray-400"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-gray-400"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-accent focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-accent py-2 font-mono font-bold text-dark transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
