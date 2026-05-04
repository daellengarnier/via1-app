"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { TabHeader } from "@/components/TabHeader";
import { compressImage } from "@/lib/image-compress";

type Status = "gemeldet" | "in_bearbeitung" | "rueckmeldung" | "termin_gesetzt" | "erledigt";
type Severity = "klein" | "mittel" | "gross";
type Pin = { lat: number; lng: number };

type Damage = {
  id: string;
  title: string;
  description: string;
  roomKey: string;
  location: string;
  category: string;
  status: Status;
  severity: Severity;
  pin: Pin | null;
  imageData: string | null;
  invoiceData: string | null;
  invoiceName: string | null;
  costCents: number | null;
  appointmentAt: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  reportedBy: string | null;
  reportedById: string | null;
  feedbacks: { id: string; text: string; author: string; createdAt: string }[];
};

const statusLabels: Record<Status, string> = {
  gemeldet: "Gemeldet",
  in_bearbeitung: "In Bearbeitung",
  rueckmeldung: "Rückmeldung",
  termin_gesetzt: "Termin gesetzt",
  erledigt: "Erledigt",
};
const categories = ["allgemein", "sanierung", "wasser", "elektro", "heizung", "sicherheit", "aussenraum"];
const statusOptions = Object.keys(statusLabels) as Status[];

function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function formatMoney(cents: number | null) {
  if (cents == null) return "–";
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function DamageMap({ damages, placingPin, pendingPin, selectedId, onPlacePin, onMovePin }: { damages: Damage[]; placingPin: boolean; pendingPin: Pin | null; selectedId: string | null; onPlacePin: (pin: Pin) => void; onMovePin: (pin: Pin) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const openPins = damages.filter((d) => d.status !== "erledigt" && d.pin);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "mapReady") setMapReady(true);
      else if (e.data?.type === "mapClick" && placingPin) onPlacePin({ lat: e.data.lat, lng: e.data.lng });
      else if (e.data?.type === "pinMoved") onMovePin({ lat: e.data.lat, lng: e.data.lng });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [placingPin, onPlacePin, onMovePin]);

  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type: "setPins", pins: openPins.map((d) => ({ id: d.id, lat: d.pin!.lat, lng: d.pin!.lng, title: d.title })) }, "*");
  }, [mapReady, openPins]);
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type: "setSelectedPin", id: selectedId }, "*");
  }, [mapReady, selectedId]);
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type: "setPendingPin", pin: pendingPin }, "*");
  }, [mapReady, pendingPin]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-black/30">
      <iframe ref={iframeRef} src="/satellite-map.html" className="h-56 w-full border-0" title="Schäden Karte" />
      <div className={`px-3 py-2 text-center text-xs ${placingPin ? "bg-yellow-400/10 text-yellow-300" : "bg-gray-900/60 text-gray-500"}`}>
        {placingPin ? "Tippe auf die Karte, um den Schaden zu verorten" : pendingPin ? "📍 Pin gesetzt — auf Karte verschiebbar" : "Offene Schäden mit Pin werden hier angezeigt"}
      </div>
    </div>
  );
}

export default function SchaedenPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [damages, setDamages] = useState<Damage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "alle" | "offen">("offen");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [placingPin, setPlacingPin] = useState(false);
  const [pendingPin, setPendingPin] = useState<Pin | null>(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", category: "allgemein", severity: "mittel" as Severity, status: "gemeldet" as Status, appointmentAt: "", cost: "", feedback: "" });
  const [imageData, setImageData] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{ data: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/damages");
    if (res.ok) setDamages(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => damages.filter((d) => {
    const statusOk = statusFilter === "alle" || (statusFilter === "offen" ? d.status !== "erledigt" : d.status === statusFilter);
    const categoryOk = categoryFilter === "alle" || d.category === categoryFilter;
    return statusOk && categoryOk;
  }), [damages, statusFilter, categoryFilter]);
  const totalCost = useMemo(() => filtered.reduce((sum, d) => sum + (d.costCents ?? 0), 0), [filtered]);

  async function fileToData(file: File, compress = true) {
    if (compress && file.type.startsWith("image/")) return compressImage(file, { maxSize: 1400, quality: 0.78 });
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/damages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, pin: pendingPin, imageData, invoiceData: invoice?.data ?? null, invoiceName: invoice?.name ?? null }) });
    if (res.ok) {
      const created = await res.json();
      setDamages((prev) => [created, ...prev]);
      setShowCreate(false); setPendingPin(null); setImageData(null); setInvoice(null); setForm({ title: "", description: "", location: "", category: "allgemein", severity: "mittel", status: "gemeldet", appointmentAt: "", cost: "", feedback: "" });
    }
    setSaving(false);
  }

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/damages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      const updated = await res.json();
      setDamages((prev) => prev.map((d) => d.id === id ? updated : d));
    }
  }

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 text-white">
      <TabHeader title="Schäden" icon="🛠️" color="orange" showIcon={false} />

      <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-sm text-orange-100">
        Schäden allgemein melden, auf der Karte verorten und Sanierungs-/Kostenfolgen sichtbar machen.
      </div>

      <DamageMap damages={damages} placingPin={placingPin} pendingPin={pendingPin} selectedId={selectedId} onPlacePin={(pin) => { setPendingPin(pin); setPlacingPin(false); }} onMovePin={setPendingPin} />

      <div className="my-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2"><p className="text-gray-500">Offen</p><p className="text-lg font-bold text-white">{damages.filter(d => d.status !== "erledigt").length}</p></div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2"><p className="text-gray-500">Sanierung</p><p className="text-lg font-bold text-orange-300">{damages.filter(d => d.category === "sanierung").length}</p></div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-2"><p className="text-gray-500">Kosten</p><p className="text-sm font-bold text-emerald-300">{formatMoney(totalCost)}</p></div>
      </div>

      <button onClick={() => setShowCreate((v) => !v)} className="mb-3 w-full rounded-lg bg-orange-400 px-4 py-3 font-display text-xs font-bold uppercase tracking-widest text-black">{showCreate ? "Abbrechen" : "+ Schaden melden"}</button>

      {showCreate && (
        <form onSubmit={submit} className="mb-5 space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titel, z.B. Wasserfleck Saaldecke" className="input" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Was ist passiert?" rows={4} className="input" required />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ort / Bereich" className="input" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })} className="input"><option value="klein">klein</option><option value="mittel">mittel</option><option value="gross">gross</option></select>
          </div>
          <button type="button" onClick={() => setPlacingPin(true)} className="w-full rounded border border-yellow-500/40 py-2 text-xs text-yellow-200">📍 Auf Karte verorten</button>
          <label className="block rounded border border-gray-800 p-3 text-xs text-gray-400">Foto aufnehmen/hochladen<input type="file" accept="image/*" capture="environment" className="mt-2 block w-full text-xs" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImageData(await fileToData(f)); }} /></label>
          {imageData && <img src={imageData} alt="Vorschau" className="max-h-48 rounded-lg object-contain" />}
          <div className="grid grid-cols-2 gap-2"><input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="Kosten CHF" className="input" /><input type="datetime-local" value={form.appointmentAt} onChange={(e) => setForm({ ...form, appointmentAt: e.target.value })} className="input" /></div>
          <label className="block rounded border border-gray-800 p-3 text-xs text-gray-400">Rechnung/Beleg hochladen<input type="file" accept="image/*,application/pdf" className="mt-2 block w-full text-xs" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setInvoice({ data: await fileToData(f, false), name: f.name }); }} /></label>
          <button disabled={saving} className="w-full rounded bg-emerald-400 py-3 font-display text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50">Speichern</button>
        </form>
      )}

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 text-xs">
        {(["offen", "alle", ...statusOptions] as const).map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1 ${statusFilter === s ? "border-orange-400 bg-orange-400/10 text-orange-200" : "border-gray-800 text-gray-400"}`}>{s === "offen" ? "offen" : s === "alle" ? "alle" : statusLabels[s]}</button>)}
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 text-xs">
        {["alle", ...categories].map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-full border px-3 py-1 ${categoryFilter === c ? "border-violet-400 bg-violet-400/10 text-violet-200" : "border-gray-800 text-gray-400"}`}>{c}</button>)}
      </div>

      {loading ? <p className="text-center text-gray-500">Lade Schäden …</p> : filtered.length === 0 ? <p className="rounded-lg border border-gray-800 p-4 text-center text-sm text-gray-500">Keine Schäden in dieser Ansicht.</p> : (
        <div className="space-y-3">
          {filtered.map(d => <DamageCard key={d.id} damage={d} selected={selectedId === d.id} canEdit={isAdmin || d.reportedById === currentUserId} onSelect={() => setSelectedId(d.id)} onPatch={(data) => patch(d.id, data)} onFeedback={async (text) => {
            const res = await fetch(`/api/damages/${d.id}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
            if (res.ok) {
              const updated = await res.json();
              setDamages(prev => prev.map(x => x.id === d.id ? updated : x));
            }
          }} />)}
        </div>
      )}
    </main>
  );
}

function DamageCard({ damage, selected, canEdit, onSelect, onPatch, onFeedback }: { damage: Damage; selected: boolean; canEdit: boolean; onSelect: () => void; onPatch: (data: Record<string, unknown>) => void; onFeedback: (text: string) => void }) {
  const [feedback, setFeedback] = useState("");
  return (
    <article onClick={onSelect} className={`rounded-xl border bg-gray-900/70 p-4 ${selected ? "border-orange-400" : "border-gray-800"}`}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg text-white">{damage.title}</h2><p className="text-xs text-gray-500">gemeldet {formatDate(damage.reportedAt)} · {damage.reportedBy ?? "unbekannt"}</p></div><span className="rounded-full border border-orange-500/30 px-2 py-1 text-[10px] text-orange-200">{statusLabels[damage.status]}</span></div>
      <p className="mt-2 whitespace-pre-line text-sm text-gray-300">{damage.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-400"><span>🏷 {damage.category}</span><span>⚠️ {damage.severity}</span>{damage.location && <span>📍 {damage.location}</span>}{damage.appointmentAt && <span>📅 {formatDate(damage.appointmentAt)}</span>}{damage.costCents != null && <span>💸 {formatMoney(damage.costCents)}</span>}</div>
      {damage.imageData && <img src={damage.imageData} alt="Schaden" className="mt-3 max-h-64 w-full rounded-lg object-contain" />}
      {damage.invoiceData && <a href={damage.invoiceData} download={damage.invoiceName ?? "rechnung"} className="mt-3 inline-block rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200">📎 Rechnung/Beleg öffnen</a>}
      {damage.feedbacks.length > 0 && <div className="mt-3 space-y-2">{damage.feedbacks.map(f => <div key={f.id} className="rounded border border-gray-800 bg-black/20 p-2 text-xs"><p className="text-gray-300">{f.text}</p><p className="mt-1 text-[10px] text-gray-600">{f.author} · {formatDate(f.createdAt)}</p></div>)}</div>}
      {canEdit && <div className="mt-3 space-y-2"><select value={damage.status} onChange={(e) => onPatch({ status: e.target.value })} className="input text-xs">{statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select><div className="flex gap-2"><input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Rückmeldung hinzufügen" className="input text-xs" /><button onClick={() => { onFeedback(feedback); setFeedback(""); }} className="rounded bg-violet-400 px-3 text-xs font-bold text-black">Senden</button></div></div>}
    </article>
  );
}
