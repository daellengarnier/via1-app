"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TabHeader } from "@/components/TabHeader";

interface Pin {
  lat: number;
  lng: number;
}

interface SubTodo {
  id: string;
  title: string;
  done: boolean;
  position: number;
}

interface Aufgabe {
  id: string;
  title: string;
  description: string;
  location: string;
  done: boolean;
  assignee: string | null;
  pin: Pin | null;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  activeWorkers: string[];
  subTodos: SubTodo[];
  images: string[];
}

export default function AufgabeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [task, setTask] = useState<Aufgabe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/aufgaben/${id}`);
      if (res.status === 404) {
        setError("Aufgabe nicht gefunden");
        setTask(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Aufgabe;
      setTask(data);
      setError(null);
    } catch (err) {
      console.error("loadAufgabe", err);
      setError("Aufgabe konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleDone() {
    if (!task) return;
    try {
      const res = await fetch(`/api/aufgaben/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      setTask(updated);
    } catch (err) {
      console.error("toggleDone", err);
      alert("Konnte Status nicht aendern.");
    }
  }

  async function toggleSubTodo(sub: SubTodo) {
    if (!task) return;
    setTask({
      ...task,
      subTodos: task.subTodos.map((s) =>
        s.id === sub.id ? { ...s, done: !s.done } : s
      ),
    });
    try {
      await fetch(`/api/aufgaben/${task.id}/subtodos/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !sub.done }),
      });
    } catch (err) {
      console.error("toggleSubTodo", err);
    }
  }

  if (loading) {
    return (
      <div className="relative p-4 pb-20">
        <TabHeader icon="/icon-aufgaben.webp" color="yellow" showIcon={false} />
        <p className="mt-20 text-center text-sm text-gray-500">Lade…</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="relative p-4 pb-20">
        <TabHeader icon="/icon-aufgaben.webp" color="yellow" showIcon={false} />
        <p className="mt-20 text-center text-sm text-gray-500">
          {error ?? "Aufgabe nicht gefunden"}
        </p>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/aufgaben")}
            className="rounded-full border border-yellow-400/50 bg-yellow-400/15 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-yellow-200"
          >
            ← Zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const subDone = task.subTodos.filter((s) => s.done).length;
  const subTotal = task.subTodos.length;

  return (
    <div className="relative p-4 pb-20">
      <TabHeader icon="/icon-aufgaben.webp" color="yellow" showIcon={false} />

      <div className="mx-auto mt-20 max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-black/40 p-4">
          <h1
            className={`mb-3 font-display text-lg font-bold ${
              task.done ? "text-gray-500 line-through" : "text-white"
            }`}
          >
            {task.title}
          </h1>

          {task.description && (
            <p className="mb-3 whitespace-pre-wrap text-sm text-gray-300">
              {task.description}
            </p>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
            {task.location && <span>📍 {task.location}</span>}
            <span>👤 {task.createdBy}</span>
            <span>
              {new Date(task.createdAt).toLocaleDateString("de-CH", {
                day: "numeric",
                month: "short",
              })}
            </span>
            {task.assignee && (
              <span className="text-yellow-400">→ {task.assignee}</span>
            )}
          </div>

          {task.images.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-1.5">
                {task.images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Foto ${i + 1}`}
                    className="h-20 w-full cursor-pointer rounded border border-gray-800 object-cover"
                    onClick={() => setLightboxSrc(src)}
                  />
                ))}
              </div>
            </div>
          )}

          {task.subTodos.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                  📋 Subtasks
                </p>
                <span className="font-mono text-[10px] text-gray-400">
                  {subDone}/{subTotal}
                </span>
              </div>
              <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full bg-yellow-400/70 transition-all"
                  style={{
                    width: `${subTotal === 0 ? 0 : (subDone / subTotal) * 100}%`,
                  }}
                />
              </div>
              <ul className="space-y-1.5">
                {task.subTodos.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => toggleSubTodo(s)}
                    className="flex cursor-pointer items-center gap-2 rounded border border-gray-800/60 bg-black/20 px-2 py-2 hover:border-yellow-400/40"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[12px] ${
                        s.done
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-gray-600"
                      }`}
                    >
                      {s.done && "✓"}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        s.done ? "text-gray-500 line-through" : "text-white"
                      }`}
                    >
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!task.done && task.activeWorkers.length > 0 && (
            <div className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2 text-xs text-yellow-200">
              🏃 {task.activeWorkers.join(", ")}{" "}
              {task.activeWorkers.length === 1 ? "ist dabei" : "sind dabei"}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleDone}
              className={`flex-1 rounded-lg py-2 font-display text-[10px] font-bold uppercase tracking-wider ${
                task.done
                  ? "border border-gray-600 text-gray-300 hover:bg-gray-800"
                  : "bg-yellow-400 text-black hover:brightness-110"
              }`}
            >
              {task.done ? "✓ erledigt – wieder öffnen" : "✓ Aufgabe erledigt"}
            </button>
            {task.pin && (
              <button
                type="button"
                onClick={() => router.push(`/aufgaben?focus=${task.id}`)}
                className="rounded-lg border border-yellow-400/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-yellow-300"
              >
                📍 Karte
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/aufgaben?edit=${task.id}`)}
              className="rounded-lg border border-gray-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:border-yellow-400 hover:text-yellow-300"
            >
              ✎ Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Vergrössert"
            className="max-h-full max-w-full rounded"
          />
        </div>
      )}
    </div>
  );
}
