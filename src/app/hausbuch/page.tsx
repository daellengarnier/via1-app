"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { compressImage } from "@/lib/image-compress";

type ArticleType = "INFO" | "GUIDE" | "CHECKLIST" | "PLACE" | "CONTACT";

type GuideStep = {
  id: string;
  title: string;
  body: string;
  warning?: string;
};

type StructuredContent = {
  intro?: string;
  materials?: string[];
  steps?: GuideStep[];
  checklist?: string[];
  tips?: string[];
  location?: string;
  rules?: string;
  contact?: string;
};

interface HausbuchImage {
  id?: string;
  data: string;
  caption?: string | null;
  stepId?: string | null;
  order?: number;
}

interface HausbuchLink {
  id?: string;
  toId: string;
  label?: string | null;
  title: string;
  category?: string;
  type?: string;
}

interface Artikel {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  structured: StructuredContent | null;
  type: ArticleType;
  category: string;
  section: string | null;
  tags: string[];
  pinned: boolean;
  status: string;
  owner: string;
  images: HausbuchImage[];
  links: HausbuchLink[];
  backlinks: { fromId: string; title: string; category?: string; type?: string }[];
  createdBy: string | null;
  createdById: string | null;
  updatedBy: string;
  updatedAt: string;
}

const initialCategories = [
  "Allgemein",
  "Alltag",
  "Anleitung",
  "Technik",
  "Räume",
  "Garten",
  "Organisation",
  "Kontakte",
  "Regeln",
];

const articleTypes: { value: ArticleType; label: string; icon: string; hint: string }[] = [
  { value: "INFO", label: "Info", icon: "📄", hint: "Wissen, Kontext, Regeln" },
  { value: "GUIDE", label: "Anleitung", icon: "🧭", hint: "Schritt für Schritt" },
  { value: "CHECKLIST", label: "Checkliste", icon: "✅", hint: "Wiederkehrende Aufgaben" },
  { value: "PLACE", label: "Ort/Raum", icon: "🏠", hint: "Nutzung, Regeln, Fotos" },
  { value: "CONTACT", label: "Kontakt", icon: "👤", hint: "Zuständigkeit, Kontaktweg" },
];

const typeLabels = Object.fromEntries(articleTypes.map((t) => [t.value, `${t.icon} ${t.label}`]));

function emptyStructured(type: ArticleType): StructuredContent {
  if (type === "GUIDE") {
    return { intro: "", materials: [], steps: [{ id: crypto.randomUUID(), title: "", body: "" }], tips: [] };
  }
  if (type === "CHECKLIST") return { intro: "", checklist: [""] };
  if (type === "PLACE") return { intro: "", location: "", rules: "" };
  if (type === "CONTACT") return { intro: "", contact: "" };
  return { intro: "" };
}

function structuredToText(type: ArticleType, s: StructuredContent, fallback: string) {
  if (type === "INFO") return fallback || s.intro || "";
  const lines: string[] = [];
  if (s.intro) lines.push(s.intro);
  if (s.location) lines.push(`\nOrt\n${s.location}`);
  if (s.contact) lines.push(`\nKontakt / Zuständigkeit\n${s.contact}`);
  if (s.materials?.filter(Boolean).length) lines.push(`\nMaterial\n${s.materials.filter(Boolean).map((m) => `- ${m}`).join("\n")}`);
  if (s.steps?.length) {
    lines.push("\nSchritte");
    s.steps.forEach((step, i) => {
      if (!step.title && !step.body && !step.warning) return;
      lines.push(`${i + 1}. ${step.title}`.trim());
      if (step.body) lines.push(step.body);
      if (step.warning) lines.push(`Achtung: ${step.warning}`);
    });
  }
  if (s.checklist?.filter(Boolean).length) lines.push(`\nCheckliste\n${s.checklist.filter(Boolean).map((m) => `☐ ${m}`).join("\n")}`);
  if (s.rules) lines.push(`\nRegeln / Wichtig\n${s.rules}`);
  if (s.tips?.filter(Boolean).length) lines.push(`\nTipps\n${s.tips.filter(Boolean).map((m) => `- ${m}`).join("\n")}`);
  return lines.join("\n").trim() || fallback;
}

function shortText(value: string, max = 120) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export default function HausbuchPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [selectedType, setSelectedType] = useState<ArticleType | "Alle">("Alle");
  const [onlyMine, setOnlyMine] = useState(false);
  const [articles, setArticles] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = Array.from(new Set([...initialCategories, ...articles.map((a) => a.category)])).sort((a, b) =>
    a.localeCompare(b, "de-CH", { sensitivity: "base" })
  );

  const loadArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/hausbuch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setArticles((await res.json()) as Artikel[]);
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
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      (a.summary ?? "").toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.join(" ").toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "Alle" || a.category === selectedCategory;
    const matchesType = selectedType === "Alle" || a.type === selectedType;
    const matchesMine = !onlyMine || (currentUserId && a.createdById === currentUserId);
    return matchesSearch && matchesCategory && matchesType && matchesMine;
  });

  async function deleteArticle(id: string) {
    if (!confirm("Diesen Artikel wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/hausbuch/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setEditingId(null);
    } catch (err) {
      console.error("Hausbuch loeschen", err);
      alert("Konnte nicht löschen.");
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground icon="/pic-hausbuch.webp" glowClass="glow-violet" showIcon={false} />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pic-hausbuch.webp" alt="" className="tab-btn-icon glow-violet" loading="eager" fetchPriority="high" />
      </div>
      <h1 className="mb-1 text-center font-display font-bold uppercase tracking-wider text-3xl text-violet-300">Hausbuch</h1>
      <p className="mb-4 text-center text-sm text-violet-300/70">Anleitungen, Orte und Wissen rund ums Via 1</p>

      <button
        onClick={() => {
          setShowCreate((v) => !v);
          setEditingId(null);
        }}
        className="mb-4 w-full rounded-2xl bg-violet-500 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-dark shadow-lg shadow-violet-500/20"
      >
        {showCreate ? "Erstellen schliessen" : "+ Neuer Eintrag / Anleitung"}
      </button>

      {showCreate && (
        <ArticleEditor
          mode="create"
          articles={articles}
          categories={categories}
          isAdmin={isAdmin}
          onCancel={() => setShowCreate(false)}
          onSaved={(article) => {
            setArticles((prev) => [article, ...prev]);
            setShowCreate(false);
            setExpanded(article.id);
          }}
        />
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen: Müll, WLAN, Hauptwasserhahn, Sauna…"
        className="mb-3 w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-violet-400 focus:outline-none"
      />

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {["Alle", ...articleTypes.map((t) => t.value)].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as ArticleType | "Alle")}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              selectedType === type ? "bg-violet-500 text-dark" : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {type === "Alle" ? "Alle Arten" : typeLabels[type]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {["Alle", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              selectedCategory === cat ? "bg-violet-500 text-dark" : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setOnlyMine((v) => !v)}
          className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
            onlyMine ? "bg-violet-500 text-dark" : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          {onlyMine ? "✓ Meine Einträge" : "Nur meine Einträge"}
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/90 to-gray-900/50">
            <button
              onClick={() => {
                setExpanded(expanded === a.id ? null : a.id);
                setEditingId(null);
              }}
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {a.pinned && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-dark">WICHTIG</span>}
                  <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-200">{typeLabels[a.type] ?? a.type}</span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">{a.category}</span>
                </div>
                <h3 className="font-medium text-white">{a.title}</h3>
                <p className="mt-1 text-xs text-gray-400">{shortText(a.summary || a.content, 110)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-gray-500">
                  <span>👤 {a.owner}</span>
                  {a.images.length > 0 && <span>📷 {a.images.length}</span>}
                  {a.links.length > 0 && <span>🔗 {a.links.length}</span>}
                  {a.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <span className="mt-1 shrink-0 text-gray-500">{expanded === a.id ? "▲" : "▼"}</span>
            </button>

            {expanded === a.id && editingId !== a.id && (
              <ArticleView article={a} onEdit={() => setEditingId(a.id)} onDelete={() => deleteArticle(a.id)} canEdit={a.createdById === currentUserId || isAdmin} />
            )}

            {expanded === a.id && editingId === a.id && (
              <ArticleEditor
                mode="edit"
                article={a}
                articles={articles}
                categories={categories}
                isAdmin={isAdmin}
                onCancel={() => setEditingId(null)}
                onSaved={(article) => {
                  setArticles((prev) => prev.map((x) => (x.id === article.id ? article : x)));
                  setEditingId(null);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {loading && filtered.length === 0 && <p className="mt-8 text-center text-gray-600">Lade Artikel …</p>}
      {!loading && loadError && <p className="mt-8 text-center text-sm text-red-400">{loadError}</p>}
      {!loading && !loadError && filtered.length === 0 && <p className="mt-8 text-center text-gray-600">Kein Eintrag gefunden.</p>}
    </div>
  );
}

function ArticleView({ article, canEdit, onEdit, onDelete }: { article: Artikel; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const s = article.structured || {};
  const stepImages = (stepId: string) => article.images.filter((img) => img.stepId === stepId);
  const articleImages = article.images.filter((img) => !img.stepId);
  const hasStructuredDetails = Boolean(
    s.location ||
    s.contact ||
    s.rules ||
    s.materials?.filter(Boolean).length ||
    s.steps?.length ||
    s.checklist?.filter(Boolean).length ||
    s.tips?.filter(Boolean).length
  );
  const shouldShowFullContent = article.type === "INFO" || !hasStructuredDetails;
  return (
    <div className="border-t border-gray-800 px-4 pb-4 pt-3">
      {article.summary && <p className="mb-3 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-sm text-violet-100">{article.summary}</p>}

      {shouldShowFullContent && <ContentBlock content={article.content} />}
      {s.intro && article.type !== "INFO" && hasStructuredDetails && <p className="mb-3 whitespace-pre-line text-sm text-gray-300">{s.intro}</p>}
      {s.location && <InfoBlock title="Ort" text={s.location} />}
      {s.contact && <InfoBlock title="Kontakt / Zuständigkeit" text={s.contact} />}
      {s.materials?.filter(Boolean).length ? <ListBlock title="Material" items={s.materials} /> : null}
      {s.steps?.length ? (
        <div className="mb-4 space-y-3">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-violet-300">Schritte</h4>
          {s.steps.map((step, idx) => (
            <div key={step.id} className="rounded-lg border border-gray-800 bg-black/20 p-3">
              <p className="mb-1 text-sm font-semibold text-white">{idx + 1}. {step.title || "Schritt"}</p>
              {step.body && <p className="whitespace-pre-line text-sm text-gray-300">{step.body}</p>}
              {step.warning && <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">⚠️ {step.warning}</p>}
              {stepImages(step.id).map((img) => <ArticleImage key={img.id ?? img.data} image={img} />)}
            </div>
          ))}
        </div>
      ) : null}
      {s.checklist?.filter(Boolean).length ? <ListBlock title="Checkliste" items={s.checklist} checkbox /> : null}
      {s.rules && <InfoBlock title="Regeln / Wichtig" text={s.rules} />}
      {s.tips?.filter(Boolean).length ? <ListBlock title="Tipps" items={s.tips} /> : null}
      {articleImages.map((img) => <ArticleImage key={img.id ?? img.data} image={img} />)}

      {article.links.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-violet-300">Siehe auch</h4>
          <div className="flex flex-wrap gap-2">
            {article.links.map((link) => (
              <button
                key={link.toId}
                onClick={() => document.getElementById(`hausbuch-${link.toId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="rounded-full border border-violet-500/40 px-3 py-1 text-xs text-violet-100"
              >
                🔗 {link.label ? `${link.label}: ` : ""}{link.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-0.5 text-xs text-gray-500">
        <p><span className="text-gray-600">Owner:</span> <span className="text-violet-300">{article.owner}</span> <span className="text-gray-600">(hält aktuell)</span></p>
        <p>Aktualisiert von {article.updatedBy} · {new Date(article.updatedAt).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      {canEdit && (
        <div className="mt-3 flex gap-2">
          <button onClick={onEdit} className="rounded border border-violet-500/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200 hover:bg-violet-500/10">✎ Bearbeiten</button>
          <button onClick={onDelete} className="rounded border border-red-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10">Löschen</button>
        </div>
      )}
    </div>
  );
}

function ContentBlock({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="space-y-2 text-sm text-gray-300">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;
        const heading = trimmed.match(/^(#{3,6})\s+(.+)$/);
        if (heading) {
          return <h4 key={index} className="pt-2 font-display text-xs font-bold uppercase tracking-wider text-violet-300">{heading[2]}</h4>;
        }
        if (trimmed.startsWith("- ")) {
          return <p key={index} className="pl-3 text-gray-300">• {trimmed.slice(2)}</p>;
        }
        if (trimmed.startsWith("[Bild")) {
          return <p key={index} className="rounded border border-gray-800 bg-black/20 px-3 py-2 text-xs text-gray-500">{trimmed}</p>;
        }
        return <p key={index} className="leading-relaxed text-gray-300">{trimmed}</p>;
      })}
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return <div className="mb-4"><h4 className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-violet-300">{title}</h4><p className="whitespace-pre-line text-sm text-gray-300">{text}</p></div>;
}

function ListBlock({ title, items, checkbox = false }: { title: string; items: string[]; checkbox?: boolean }) {
  return <div className="mb-4"><h4 className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-violet-300">{title}</h4><ul className="space-y-1 text-sm text-gray-300">{items.filter(Boolean).map((item, i) => <li key={`${item}-${i}`}>{checkbox ? "☐" : "•"} {item}</li>)}</ul></div>;
}

function ArticleImage({ image }: { image: HausbuchImage }) {
  return (
    <figure className="mt-3 overflow-hidden rounded-lg border border-gray-800 bg-black/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.data} alt={image.caption ?? "Hausbuch Bild"} className="max-h-96 w-full object-contain" loading="lazy" />
      {image.caption && <figcaption className="px-3 py-2 text-xs text-gray-400">{image.caption}</figcaption>}
    </figure>
  );
}

function ArticleEditor({
  mode,
  article,
  articles,
  categories,
  isAdmin,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  article?: Artikel;
  articles: Artikel[];
  categories: string[];
  isAdmin: boolean;
  onCancel: () => void;
  onSaved: (article: Artikel) => void;
}) {
  const [type, setType] = useState<ArticleType>(article?.type ?? "GUIDE");
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [category, setCategory] = useState(article?.category ?? (type === "GUIDE" ? "Anleitung" : "Allgemein"));
  const [owner, setOwner] = useState(article?.owner ?? "");
  const [tagsText, setTagsText] = useState(article?.tags.join(", ") ?? "");
  const [content, setContent] = useState(article?.type === "INFO" ? article.content : "");
  const [structured, setStructured] = useState<StructuredContent>(article?.structured ?? emptyStructured(type));
  const [images, setImages] = useState<HausbuchImage[]>(article?.images ?? []);
  const [links, setLinks] = useState<HausbuchLink[]>(article?.links ?? []);
  const [saving, setSaving] = useState(false);

  function changeType(next: ArticleType) {
    setType(next);
    setStructured(emptyStructured(next));
    if (next === "GUIDE") setCategory("Anleitung");
  }

  function patchStructured(patch: Partial<StructuredContent>) {
    setStructured((prev) => ({ ...prev, ...patch }));
  }

  async function addImages(files: FileList | null, stepId?: string) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    if (images.length + list.length > 12) {
      alert("Maximal 12 Bilder pro Eintrag.");
      return;
    }
    const compressed = await Promise.all(list.map((file) => compressImage(file, { maxSize: 1200, quality: 0.82 })));
    setImages((prev) => [...prev, ...compressed.map((data, i) => ({ data, stepId: stepId ?? null, caption: "", order: prev.length + i }))]);
  }

  function addLink(id: string) {
    const target = articles.find((a) => a.id === id);
    if (!target || links.some((l) => l.toId === id) || article?.id === id) return;
    setLinks((prev) => [...prev, { toId: id, title: target.title, category: target.category, type: target.type, label: "siehe auch" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalContent = structuredToText(type, structured, content);
    if (!title.trim() || !category.trim() || !finalContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/hausbuch" : `/api/hausbuch/${article!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          content: finalContent,
          structured: type === "INFO" ? null : structured,
          type,
          category,
          tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
          ...(isAdmin && owner.trim() ? { owner } : {}),
          images,
          links: links.map((l) => ({ toId: l.toId, label: l.label })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      onSaved((await res.json()) as Artikel);
    } catch (err) {
      console.error("Hausbuch speichern", err);
      alert("Konnte Eintrag nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-gray-800 px-4 pb-4 pt-3">
      <div className="mb-4 grid grid-cols-2 gap-2">
        {articleTypes.map((t) => (
          <button key={t.value} type="button" onClick={() => changeType(t.value)} className={`rounded-xl border p-3 text-left ${type === t.value ? "border-violet-400 bg-violet-500/15" : "border-gray-800 bg-black/20"}`}>
            <div className="text-sm font-semibold text-white">{t.icon} {t.label}</div>
            <div className="text-[10px] text-gray-500">{t.hint}</div>
          </button>
        ))}
      </div>

      <Field label="Titel"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="z.B. Waschbadge aufladen" required /></Field>
      <Field label="Kurzfassung"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className="input" placeholder="1–2 Sätze für die Übersicht" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Kategorie"><select value={category} onChange={(e) => setCategory(e.target.value)} className="input">{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Tags"><input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="input" placeholder="Müll, Technik…" /></Field>
      </div>
      {isAdmin && <Field label="Owner"><input value={owner} onChange={(e) => setOwner(e.target.value)} className="input" placeholder="leer = Ersteller:in" /></Field>}

      {type === "INFO" && <Field label="Inhalt"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="input" required /></Field>}
      {type !== "INFO" && <StructuredEditor type={type} value={structured} onChange={patchStructured} addImages={addImages} images={images} />}

      <Field label="Fotos zum Eintrag">
        <input type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files)} className="text-xs text-gray-400" />
        <ImageManager images={images.filter((img) => !img.stepId)} setImages={setImages} />
      </Field>

      <Field label="Verlinkte Einträge">
        <select defaultValue="" onChange={(e) => { addLink(e.target.value); e.currentTarget.value = ""; }} className="input">
          <option value="">Eintrag auswählen…</option>
          {articles.filter((a) => a.id !== article?.id).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <div className="mt-2 flex flex-wrap gap-2">
          {links.map((l) => <button key={l.toId} type="button" onClick={() => setLinks((prev) => prev.filter((x) => x.toId !== l.toId))} className="rounded-full border border-violet-500/40 px-3 py-1 text-xs text-violet-100">🔗 {l.title} ×</button>)}
        </div>
      </Field>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-violet-500 px-4 py-2 font-mono text-xs font-bold text-dark disabled:opacity-50">{saving ? "Speichern…" : "Speichern"}</button>
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white">Abbrechen</button>
      </div>
    </form>
  );
}

function StructuredEditor({ type, value, onChange, addImages, images }: { type: ArticleType; value: StructuredContent; onChange: (patch: Partial<StructuredContent>) => void; addImages: (files: FileList | null, stepId?: string) => Promise<void>; images: HausbuchImage[] }) {
  const steps = value.steps ?? [];
  return (
    <div>
      <Field label="Einleitung / Worum geht es?"><textarea value={value.intro ?? ""} onChange={(e) => onChange({ intro: e.target.value })} rows={3} className="input" /></Field>
      {type === "PLACE" && <Field label="Ort"><textarea value={value.location ?? ""} onChange={(e) => onChange({ location: e.target.value })} rows={2} className="input" /></Field>}
      {type === "CONTACT" && <Field label="Kontakt / Zuständigkeit"><textarea value={value.contact ?? ""} onChange={(e) => onChange({ contact: e.target.value })} rows={3} className="input" /></Field>}
      {type === "GUIDE" && (
        <>
          <ArrayField label="Material" values={value.materials ?? []} onChange={(materials) => onChange({ materials })} placeholder="z.B. kleines Schlüsseli" />
          <div className="mb-4">
            <label className="mb-2 block text-xs text-gray-400">Schritte</label>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.id} className="rounded-lg border border-gray-800 bg-black/20 p-3">
                  <input value={step.title} onChange={(e) => onChange({ steps: steps.map((s) => s.id === step.id ? { ...s, title: e.target.value } : s) })} className="input mb-2" placeholder={`Schritt ${i + 1}: Titel`} />
                  <textarea value={step.body} onChange={(e) => onChange({ steps: steps.map((s) => s.id === step.id ? { ...s, body: e.target.value } : s) })} rows={3} className="input mb-2" placeholder="Beschreibung" />
                  <input value={step.warning ?? ""} onChange={(e) => onChange({ steps: steps.map((s) => s.id === step.id ? { ...s, warning: e.target.value } : s) })} className="input mb-2" placeholder="Warnhinweis optional" />
                  <input type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files, step.id)} className="text-xs text-gray-400" />
                  <ImageManager images={images.filter((img) => img.stepId === step.id)} setImages={() => {}} />
                  <button type="button" onClick={() => onChange({ steps: steps.filter((s) => s.id !== step.id) })} className="mt-2 text-xs text-red-400">Schritt entfernen</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ steps: [...steps, { id: crypto.randomUUID(), title: "", body: "" }] })} className="mt-2 rounded border border-violet-500/40 px-3 py-1 text-xs text-violet-200">+ Schritt</button>
          </div>
          <ArrayField label="Tipps" values={value.tips ?? []} onChange={(tips) => onChange({ tips })} placeholder="Tipp hinzufügen" />
        </>
      )}
      {type === "CHECKLIST" && <ArrayField label="Checkliste" values={value.checklist ?? []} onChange={(checklist) => onChange({ checklist })} placeholder="Punkt hinzufügen" />}
      {(type === "PLACE" || type === "CHECKLIST") && <Field label="Regeln / Wichtig"><textarea value={value.rules ?? ""} onChange={(e) => onChange({ rules: e.target.value })} rows={3} className="input" /></Field>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><label className="mb-1 block text-xs text-gray-400">{label}</label>{children}</div>;
}

function ArrayField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const list = values.length ? values : [""];
  return <Field label={label}><div className="space-y-2">{list.map((v, i) => <div key={i} className="flex gap-2"><input value={v} onChange={(e) => onChange(list.map((x, idx) => idx === i ? e.target.value : x))} className="input flex-1" placeholder={placeholder} /><button type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))} className="rounded px-2 text-xs text-gray-400">×</button></div>)}</div><button type="button" onClick={() => onChange([...list, ""])} className="mt-2 rounded border border-violet-500/40 px-3 py-1 text-xs text-violet-200">+ hinzufügen</button></Field>;
}

function ImageManager({ images, setImages }: { images: HausbuchImage[]; setImages: React.Dispatch<React.SetStateAction<HausbuchImage[]>> | (() => void) }) {
  if (!images.length) return null;
  return <div className="mt-2 grid grid-cols-3 gap-2">{images.map((img) => <div key={img.data} className="relative overflow-hidden rounded border border-gray-800">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={img.data} alt="" className="h-20 w-full object-cover" /><button type="button" onClick={() => typeof setImages === "function" && setImages((prev: HausbuchImage[]) => prev.filter((x) => x.data !== img.data))} className="absolute right-1 top-1 rounded bg-black/70 px-1 text-xs text-white">×</button></div>)}</div>;
}
