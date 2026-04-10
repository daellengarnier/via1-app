"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupSuccess = searchParams.get("setup") === "success";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      name,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Name oder Passwort falsch.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Anmelden</h1>
        <p className="text-gray-600 mb-8">via1-app</p>

        {setupSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-800 text-sm">
            Passwort erfolgreich gesetzt! Du kannst dich jetzt anmelden.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

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
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
