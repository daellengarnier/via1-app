"use client";

import { useState } from "react";

type FeedbackType = "idea" | "bug";

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      issueNumber?: number;
      error?: string;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Fehler beim Senden.");
      return;
    }

    setSuccess(
      `${type === "bug" ? "Bug" : "Idee"} #${data.issueNumber} wurde erfasst!`
    );
    setTitle("");
    setDescription("");
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-2 text-2xl font-bold text-white">
        Feedback
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Ideen und Bugs melden - landet direkt im Projekt.
      </p>

      {/* Type Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setType("idea")}
          className={`flex-1 rounded-lg py-2 font-mono text-sm transition-colors ${
            type === "idea"
              ? "bg-accent text-dark"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          💡 Idee
        </button>
        <button
          onClick={() => setType("bug")}
          className={`flex-1 rounded-lg py-2 font-mono text-sm transition-colors ${
            type === "bug"
              ? "bg-secondary text-white"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          🐛 Bug
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm text-gray-400">
            {type === "bug" ? "Was ist kaputt?" : "Deine Idee"}
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "bug"
                ? "z.B. Login-Seite lädt nicht"
                : "z.B. Waschmaschinen-Reservation"
            }
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm text-gray-400"
          >
            Beschreibung (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Mehr Details..."
            className="w-full resize-none rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {success && (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg py-2 font-mono font-bold transition disabled:opacity-50 ${
            type === "bug"
              ? "bg-secondary text-white hover:brightness-110"
              : "bg-accent text-dark hover:brightness-110"
          }`}
        >
          {loading ? "Wird gesendet..." : "Absenden"}
        </button>
      </form>
    </div>
  );
}
