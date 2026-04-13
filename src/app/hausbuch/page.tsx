"use client";

import { useState, useEffect, useCallback } from "react";

interface Artikel {
  id: string;
  title: string;
  content: string;
  category: string;
  owner: string;
  updatedBy: string;
  updatedAt: string;
}

const initialCategories = [
  "Allgemein",
  "Technik",
  "Garten",
  "Räume",
  "Kontakte",
  "Regeln",
];


export default function HausbuchPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [articles, setArticles] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Allgemein");
  const [newOwner, setNewOwner] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Kategorien werden aus den Artikeln abgeleitet + Basis-Kategorien
  const categories = Array.from(
    new Set([...initialCategories, ...articles.map((a) => a.category)])
  );

  const loadArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/hausbuch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Artikel[];
      setArticles(data);
      setLoadError(null);
    } catch (err) {
      console.error("Hausbuch laden", err);
      setLoadError("Hausbuch konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Alle" || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newOwner.trim()) return;
    try {
      const res = await fetch("/api/hausbuch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          owner: newOwner,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Artikel;
      setArticles((prev) => [...prev, created]);
      setNewTitle("");
      setNewContent("");
      setNewOwner("");
      setShowCreate(false);
    } catch (err) {
      console.error("Hausbuch erstellen", err);
      alert("Konnte Artikel nicht speichern.");
    }
  }

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    // Kategorien werden aus Artikeln abgeleitet — einfach uebernehmen
    setNewCategory(name);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-hausbuch.webp"
          alt=""
          className="tab-btn-icon"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">Hausbuch</h1>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
        >
          + Neuer Eintrag
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Alles Wissenswerte rund ums Haus
      </p>

      {/* Suche */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen..."
        className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
      />

      {/* Kategorien */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["Alle", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              selectedCategory === cat
                ? "bg-accent text-dark"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Erstellen */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Titel</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Waschmaschine bedienen"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs text-gray-400">Kategorie</label>
              {!addingCategory && (
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="font-mono text-[10px] text-accent hover:underline"
                >
                  + Neue Kategorie
                </button>
              )}
            </div>
            {addingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="Name der neuen Kategorie"
                  autoFocus
                  className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="rounded bg-accent px-3 text-xs font-bold text-dark"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="rounded px-2 text-xs text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            ) : (
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Owner{" "}
              <span className="text-gray-600">
                (verantwortlich für Aktualität)
              </span>
            </label>
            <input
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="z.B. Alain"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Inhalt</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Beschreibung, Anleitung, Infos..."
              rows={4}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Artikel-Liste */}
      <div className="space-y-2">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40"
          >
            <button
              onClick={() =>
                setExpanded(expanded === a.id ? null : a.id)
              }
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white">{a.title}</h3>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-xs">
                  <span className="text-accent">{a.category}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-gray-500">👤 {a.owner}</span>
                </div>
              </div>
              <span className="ml-2 shrink-0 text-gray-500">
                {expanded === a.id ? "▲" : "▼"}
              </span>
            </button>
            {expanded === a.id && (
              <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                <p className="whitespace-pre-line text-sm text-gray-300">
                  {a.content}
                </p>
                <div className="mt-3 space-y-0.5">
                  <p className="text-xs text-gray-500">
                    <span className="text-gray-600">Owner:</span>{" "}
                    <span className="text-accent">{a.owner}</span>{" "}
                    <span className="text-gray-600">
                      (hält den Eintrag aktuell)
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Aktualisiert von {a.updatedBy} ·{" "}
                    {new Date(a.updatedAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">Lade Artikel …</p>
      )}
      {!loading && loadError && (
        <p className="mt-8 text-center text-sm text-red-400">{loadError}</p>
      )}
      {!loading && !loadError && filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Kein Eintrag gefunden.
        </p>
      )}
    </div>
  );
}
