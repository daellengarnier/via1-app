"use client";

import { useEffect, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown-light";

interface Props {
  value: string;
  onChange: (next: string) => void;
  onBlur?: (final: string) => void;
  placeholder?: string;
  // Minimum-Hoehe in Pixel. Wird ausserdem an die textarea als
  // min-height gegeben (CSS resize: vertical bleibt erhalten).
  minHeight?: number;
  // Wenn true zeigen wir den Vollbild-Button — beim Protokollieren
  // auf dem Laptop praktisch.
  allowFullscreen?: boolean;
  label?: string;
  // Wenn beide gesetzt: zeigt "+ Pendenz"-Button in der Toolbar.
  pendenzUsers?: { id: string; name: string }[];
  onCreatePendenz?: (
    title: string,
    assignedToIds: string[]
  ) => Promise<{ ok: boolean }>;
}

// Wiederverwendbares Notes-Feld mit Markdown-Toolbar (Bold / Italic /
// Underline / Bullet List / Ordered List). Funktioniert auf Mobile
// und Desktop. Im "Edit"-Modus sieht der User das Markdown direkt
// (z.B. "**fett**"); im "Vorschau"-Modus und im Vollbild-Modus
// kann er den gerenderten Output pruefen.
//
// Speichern erfolgt vom Parent via onBlur (so wie bisher mit dem
// nackten textarea-Feld). Bei Klick auf einen Toolbar-Button wird
// die Markdown-Syntax um die aktuelle Selection eingefuegt; ist
// nichts selektiert, wird ein leerer Marker eingesetzt und der
// Cursor in die Mitte gesetzt.
export function RichNotes({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 80,
  allowFullscreen = true,
  label,
  pendenzUsers,
  onCreatePendenz,
}: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendenzOpen, setPendenzOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function appendPendenzLine(title: string, assigneeNames: string[]) {
    const tags = assigneeNames.map((n) => `@${n}`).join(" ");
    const line = `- [ ] ${title}${tags ? ` — ${tags}` : ""}`;
    const sep = value && !value.endsWith("\n") ? "\n" : "";
    onChange(value + sep + line);
    onBlur?.(value + sep + line);
  }

  function wrapSelection(before: string, after: string = before) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const next =
      ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    onChange(next);
    // Nach dem Re-Render Cursor neu setzen
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      const inner = start + before.length;
      t.focus();
      t.setSelectionRange(
        selected ? inner + selected.length : inner,
        selected ? inner + selected.length : inner
      );
    });
  }

  function prefixLines(prefix: string | ((i: number) => string)) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    // Auf ganze Zeilen ausweiten
    const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
    const block = ta.value.slice(lineStart, end);
    const lines = block.split("\n");
    const replaced = lines
      .map((ln, i) => {
        const pfx = typeof prefix === "function" ? prefix(i) : prefix;
        return ln.startsWith(pfx) ? ln : pfx + ln;
      })
      .join("\n");
    const next =
      ta.value.slice(0, lineStart) + replaced + ta.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(lineStart, lineStart + replaced.length);
    });
  }

  // Vollbild via portal-aehnlicher Modal-Komponente — die normale
  // textarea wird ausgetauscht durch eine grosse Fullscreen-Version.
  const canPendenz = !!(pendenzUsers && onCreatePendenz);
  return (
    <>
      <NotesBody
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        minHeight={minHeight}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        onFullscreen={allowFullscreen ? () => setFullscreen(true) : undefined}
        onPendenz={canPendenz ? () => setPendenzOpen(true) : undefined}
        textareaRef={textareaRef}
        wrapSelection={wrapSelection}
        prefixLines={prefixLines}
        label={label}
      />
      {fullscreen && (
        <FullscreenEditor
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          onClose={() => setFullscreen(false)}
          label={label}
          onPendenz={canPendenz ? () => setPendenzOpen(true) : undefined}
        />
      )}
      {pendenzOpen && pendenzUsers && onCreatePendenz && (
        <PendenzPopup
          users={pendenzUsers}
          onCancel={() => setPendenzOpen(false)}
          onSubmit={async (title, assignedToIds) => {
            const res = await onCreatePendenz(title, assignedToIds);
            if (res.ok) {
              const names = assignedToIds
                .map((id) => pendenzUsers.find((u) => u.id === id)?.name)
                .filter((n): n is string => !!n);
              appendPendenzLine(title, names);
              setPendenzOpen(false);
            }
          }}
        />
      )}
    </>
  );
}

function PendenzPopup({
  users,
  onCancel,
  onSubmit,
}: {
  users: { id: string; name: string }[];
  onCancel: () => void;
  onSubmit: (title: string, assignedToIds: string[]) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    users[0]?.id ? [users[0].id] : []
  );
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function toggleUser(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selectedIds.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), selectedIds);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950 p-4"
      >
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-white">
          + Pendenz erstellen
        </h3>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-gray-500">
          Was ist zu tun?
        </label>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Wandtafel kaufen"
          className="mb-3 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          required
        />
        <div className="mb-1 flex items-baseline justify-between">
          <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-500">
            Verantwortlich ({selectedIds.length} ausgewählt)
          </label>
        </div>
        <div className="mb-4 max-h-48 overflow-y-auto rounded border border-gray-700 bg-gray-900">
          {users.map((u) => {
            const sel = selectedIds.includes(u.id);
            return (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-2 border-b border-gray-800 px-3 py-2 text-sm text-white last:border-0 hover:bg-gray-800/50"
              >
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggleUser(u.id)}
                  className="h-4 w-4 accent-accent"
                />
                <span>{u.name}</span>
              </label>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={
              submitting || !title.trim() || selectedIds.length === 0
            }
            className="flex-1 rounded bg-accent px-3 py-2 text-xs font-bold text-dark hover:brightness-110 disabled:opacity-40"
          >
            {submitting ? "Speichert…" : "Pendenz erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface BodyProps {
  value: string;
  onChange: (next: string) => void;
  onBlur?: (final: string) => void;
  placeholder?: string;
  minHeight: number;
  showPreview: boolean;
  setShowPreview: (b: boolean) => void;
  onFullscreen?: () => void;
  onPendenz?: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  wrapSelection: (before: string, after?: string) => void;
  prefixLines: (prefix: string | ((i: number) => string)) => void;
  label?: string;
}

function NotesBody({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight,
  showPreview,
  setShowPreview,
  onFullscreen,
  onPendenz,
  textareaRef,
  wrapSelection,
  prefixLines,
  label,
}: BodyProps) {
  return (
    <div>
      <Toolbar
        wrapSelection={wrapSelection}
        prefixLines={prefixLines}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onFullscreen={onFullscreen}
        onPendenz={onPendenz}
        label={label}
      />
      {showPreview ? (
        <div
          className="markdown-body w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white"
          style={{ minHeight }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              renderMarkdown(value) ||
              `<p class="text-gray-600">${placeholder ?? ""}</p>`,
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur?.(e.target.value)}
          placeholder={placeholder}
          rows={Math.max(3, value.split("\n").length)}
          style={{ minHeight }}
          className="w-full resize-y rounded border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
        />
      )}
    </div>
  );
}

interface ToolbarProps {
  wrapSelection: (before: string, after?: string) => void;
  prefixLines: (prefix: string | ((i: number) => string)) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onFullscreen?: () => void;
  onPendenz?: () => void;
  label?: string;
}

function Toolbar({
  wrapSelection,
  prefixLines,
  showPreview,
  onTogglePreview,
  onFullscreen,
  onPendenz,
  label,
}: ToolbarProps) {
  const btn =
    "flex items-center justify-center rounded border border-gray-800 bg-gray-900/60 px-2 py-1 text-xs text-gray-300 hover:border-accent hover:text-white disabled:opacity-40";
  return (
    <div className="mb-1 flex flex-wrap items-center gap-1">
      {label && (
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-gray-600">
          {label}
        </span>
      )}
      <button
        type="button"
        title="Fett"
        onClick={() => wrapSelection("**")}
        className={`${btn} font-bold`}
        disabled={showPreview}
      >
        B
      </button>
      <button
        type="button"
        title="Kursiv"
        onClick={() => wrapSelection("*")}
        className={`${btn} italic`}
        disabled={showPreview}
      >
        I
      </button>
      <button
        type="button"
        title="Unterstrichen"
        onClick={() => wrapSelection("__")}
        className={`${btn} underline`}
        disabled={showPreview}
      >
        U
      </button>
      <button
        type="button"
        title="Liste"
        onClick={() => prefixLines("- ")}
        className={btn}
        disabled={showPreview}
      >
        • Liste
      </button>
      <button
        type="button"
        title="Nummerierte Liste"
        onClick={() => prefixLines((i) => `${i + 1}. `)}
        className={btn}
        disabled={showPreview}
      >
        1. Liste
      </button>
      {onPendenz && (
        <button
          type="button"
          onClick={onPendenz}
          className={`${btn} border-accent/40 text-accent`}
          title="Pendenz erstellen: jemandem zuweisen"
          disabled={showPreview}
        >
          + Pendenz
        </button>
      )}
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          onClick={onTogglePreview}
          className={btn}
          title={showPreview ? "Bearbeiten" : "Vorschau"}
        >
          {showPreview ? "✏️ Bearbeiten" : "👁 Vorschau"}
        </button>
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            className={btn}
            title="Vollbild"
          >
            ⛶
          </button>
        )}
      </div>
    </div>
  );
}

interface FullscreenProps {
  value: string;
  onChange: (next: string) => void;
  onBlur?: (final: string) => void;
  placeholder?: string;
  onClose: () => void;
  label?: string;
  onPendenz?: () => void;
}

function FullscreenEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  onClose,
  label,
  onPendenz,
}: FullscreenProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    taRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onBlur?.(value);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function wrapSelection(before: string, after: string = before) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    const next =
      ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const t = taRef.current;
      if (!t) return;
      const inner = start + before.length;
      t.focus();
      t.setSelectionRange(
        sel ? inner + sel.length : inner,
        sel ? inner + sel.length : inner
      );
    });
  }
  function prefixLines(prefix: string | ((i: number) => string)) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
    const block = ta.value.slice(lineStart, end);
    const lines = block.split("\n");
    const replaced = lines
      .map((ln, i) => {
        const p = typeof prefix === "function" ? prefix(i) : prefix;
        return ln.startsWith(p) ? ln : p + ln;
      })
      .join("\n");
    const next =
      ta.value.slice(0, lineStart) + replaced + ta.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const t = taRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(lineStart, lineStart + replaced.length);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
          {label ?? "Notizen"}
        </h2>
        <button
          type="button"
          onClick={() => {
            onBlur?.(value);
            onClose();
          }}
          className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:border-accent hover:text-white"
        >
          ✓ Schliessen
        </button>
      </div>
      <div className="border-b border-gray-800 px-4 py-2">
        <Toolbar
          wrapSelection={wrapSelection}
          prefixLines={prefixLines}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onPendenz={onPendenz}
        />
      </div>
      <div className="flex-1 overflow-hidden p-4 md:grid md:grid-cols-2 md:gap-4">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-full w-full resize-none rounded border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none ${
            showPreview ? "hidden md:block" : ""
          }`}
        />
        <div
          className={`markdown-body h-full overflow-y-auto rounded border border-gray-800 bg-black/40 p-3 text-sm text-white ${
            showPreview ? "" : "hidden md:block"
          }`}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              renderMarkdown(value) ||
              `<p class="text-gray-600">${placeholder ?? "Vorschau erscheint hier."}</p>`,
          }}
        />
      </div>
    </div>
  );
}
