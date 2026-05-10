"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";

interface Traktandum {
  id: string;
  title: string;
  notes: string;
  createdBy: string;
  order: number;
}

interface Guest {
  name: string;
  diet: string;
  allergies: string;
}

interface FamilyKid {
  id: string;
  name: string;
  diet: "FLEISCH" | "VEGI" | "VEGAN";
  allergies: string;
  parents: { id: string; name: string }[];
}

function dietEnumToLabel(d: "FLEISCH" | "VEGI" | "VEGAN"): string {
  return d === "FLEISCH" ? "Fleisch" : d === "VEGI" ? "Vegi" : "Vegan";
}

interface MealSignup {
  id: string;
  userId: string;
  name: string;
  goingSelf: boolean;
  diet: string;
  allergies: string;
  guestDetails: Guest[];
}

interface PersonRef {
  id: string;
  name: string;
}

interface TerminComment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
}

interface TerminDetail {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "sitzung" | "essen" | "sonstige";
  organizer: string | null;
  withDinner: boolean;
  dinnerTime: string | null;
  dinnerLocation: string | null;
  dinnerOrganizer: string | null;
  dinnerMenu: string | null;
  withAttendance: boolean;
  createdBy: string;
  sitzungsleitung: string;
  protokollfuehrung: string;
  anwesend: PersonRef[];
  abgemeldet: PersonRef[];
  traktanden: Traktandum[];
  mealSignups: MealSignup[];
  comments: TerminComment[];
}


function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TerminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const id = params.id as string;

  const [termin, setTermin] = useState<TerminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allUsers, setAllUsers] = useState<PersonRef[]>([]);
  const [newTraktandum, setNewTraktandum] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupGuestDetails, setSignupGuestDetails] = useState<Guest[]>([]);
  const [attendanceMode, setAttendanceMode] = useState<
    "anwesend" | "abgemeldet" | null
  >(null);
  const [deleteTraktandumId, setDeleteTraktandumId] = useState<string | null>(
    null
  );
  const [locationMode, setLocationMode] = useState<"wg" | "custom">("wg");
  const [newComment, setNewComment] = useState("");

  const [myDiet, setMyDiet] = useState("Fleisch");
  const [myKids, setMyKids] = useState<FamilyKid[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { diet?: string } | null) => {
        if (data?.diet) setMyDiet(data.diet);
      })
      .catch(() => {});
    fetch("/api/family-kids")
      .then((r) => (r.ok ? r.json() : []))
      .then((kids: FamilyKid[]) => setMyKids(kids))
      .catch(() => {});
  }, []);

  // True wenn das Kind aktuell in den Gaesten ist (Identifikation per Name —
  // ein Kind pro Elternteil ist eindeutig benannt).
  function isKidSelected(kid: FamilyKid): boolean {
    return signupGuestDetails.some((g) => g.name === kid.name);
  }

  function toggleKid(kid: FamilyKid) {
    setSignupGuestDetails((prev) => {
      const idx = prev.findIndex((g) => g.name === kid.name);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [
        ...prev,
        {
          name: kid.name,
          diet: dietEnumToLabel(kid.diet),
          allergies: kid.allergies,
        },
      ];
    });
  }

  const WG_OPTIONS = [
    "Nordwind",
    "Ostblock",
    "Dreiecksbar",
    "Kleenex",
    "Family-WG",
    "Bonzennest",
  ];

  const loadTermin = useCallback(async () => {
    try {
      const res = await fetch(`/api/termine/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        setTermin(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as TerminDetail;
      setTermin(data);
    } catch (err) {
      console.error("Termin laden", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTermin();
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((u: PersonRef[]) => setAllUsers(u))
      .catch(() => {});
  }, [loadTermin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-400">Lade Termin …</p>
      </div>
    );
  }

  if (notFound || !termin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-400">Termin nicht gefunden.</p>
      </div>
    );
  }

  const isSitzung = termin.type === "sitzung";
  const hasEssen = termin.type === "essen" || termin.withDinner;
  const mySignup = termin.mealSignups.find((s) => s.userId === currentUserId);
  const isSignedUp = !!mySignup && (mySignup.goingSelf || mySignup.guestDetails.length > 0);
  const totalGuests = termin.mealSignups.reduce(
    (sum, s) => sum + 1 + s.guestDetails.length,
    0
  );

  // Diät-Zusammenfassung
  const dietCounts = { Fleisch: 0, Vegi: 0, Vegan: 0, Andere: 0 };
  termin.mealSignups.forEach((s) => {
    const add = (d: string) => {
      if (d === "Fleisch") dietCounts.Fleisch++;
      else if (d === "Vegi") dietCounts.Vegi++;
      else if (d === "Vegan") dietCounts.Vegan++;
      else dietCounts.Andere++;
    };
    add(s.diet);
    s.guestDetails.forEach((g) => add(g.diet));
  });

  async function addTraktandum(e: React.FormEvent) {
    e.preventDefault();
    if (!newTraktandum.trim() || !termin) return;
    try {
      const res = await fetch(`/api/termine/${id}/traktanden`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTraktandum }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Traktandum;
      setTermin({ ...termin, traktanden: [...termin.traktanden, created] });
      setNewTraktandum("");
    } catch (err) {
      console.error("Traktandum erstellen", err);
      alert("Konnte Traktandum nicht erstellen.");
    }
  }

  // Debounced save der Notizen: lokales State-Update sofort, PATCH
  // verzoegert (on blur) damit wir nicht bei jedem Tastendruck schreiben
  function updateTraktandumNotes(tId: string, notes: string) {
    if (!termin) return;
    setTermin({
      ...termin,
      traktanden: termin.traktanden.map((t) =>
        t.id === tId ? { ...t, notes } : t
      ),
    });
  }

  async function saveTraktandumNotes(tId: string, notes: string) {
    try {
      await fetch(`/api/termine/${id}/traktanden/${tId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error("Traktandum-Notizen speichern", err);
    }
  }

  async function handleMealSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!termin) return;
    try {
      const res = await fetch(`/api/termine/${id}/meal-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guests: signupGuestDetails,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadTermin();
      setShowSignup(false);
      setSignupGuestDetails([]);
    } catch (err) {
      console.error("Essens-Anmeldung", err);
      alert("Anmeldung fehlgeschlagen.");
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !termin) return;
    try {
      const res = await fetch(`/api/termine/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as TerminComment;
      setTermin({ ...termin, comments: [...termin.comments, created] });
      setNewComment("");
    } catch (err) {
      console.error("Kommentar", err);
      alert("Kommentar konnte nicht gespeichert werden.");
    }
  }

  async function deleteComment(cid: string) {
    if (!termin) return;
    try {
      const res = await fetch(`/api/termine/${id}/comments/${cid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTermin({
        ...termin,
        comments: termin.comments.filter((c) => c.id !== cid),
      });
    } catch (err) {
      console.error("Kommentar loeschen", err);
    }
  }

  function toggleSignupForm() {
    if (!showSignup) {
      // Beim Oeffnen vorhandene Gaeste vorausfuellen, damit man sie
      // bearbeiten oder weitere hinzufuegen kann (POST ist ein Upsert,
      // der bestehende Gaeste sonst ueberschreiben wuerde).
      setSignupGuestDetails(
        mySignup?.guestDetails.map((g) => ({ ...g })) ?? []
      );
    }
    setShowSignup(!showSignup);
  }

  async function cancelMealSignup() {
    if (!termin) return;
    const guestCount = mySignup?.guestDetails.length ?? 0;

    let alsoRemoveGuests = true;
    if (guestCount > 0) {
      const label = guestCount === 1 ? "deinen Gast" : `deine ${guestCount} Gäste`;
      alsoRemoveGuests = confirm(
        `Du hast ${label} angemeldet.\n\n` +
          `OK = dich UND ${label} abmelden\n` +
          `Abbrechen = nur dich abmelden, ${label} bleiben angemeldet`
      );
    } else {
      if (!confirm("Dich wirklich vom Essen abmelden?")) return;
    }

    try {
      const res = alsoRemoveGuests
        ? await fetch(`/api/termine/${id}/meal-signup`, { method: "DELETE" })
        : await fetch(`/api/termine/${id}/meal-signup`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goingSelf: false }),
          });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadTermin();
    } catch (err) {
      console.error("Abmeldung", err);
      alert("Abmelden fehlgeschlagen.");
    }
  }

  function addGuest() {
    setSignupGuestDetails((prev) => [
      ...prev,
      { name: "", diet: "Fleisch", allergies: "" },
    ]);
  }

  function removeGuest(index: number) {
    setSignupGuestDetails((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGuest(index: number, field: keyof Guest, value: string) {
    setSignupGuestDetails((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  async function toggleAttendance(
    user: PersonRef,
    mode: "anwesend" | "abgemeldet"
  ) {
    if (!termin) return;
    const key = mode;
    const current = termin[key];
    const isIn = current.some((p) => p.id === user.id);
    const newStatus: "going" | "not-going" | null = isIn
      ? null
      : mode === "anwesend"
        ? "going"
        : "not-going";

    try {
      await fetch(`/api/termine/${id}/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      });
      await loadTermin();
    } catch (err) {
      console.error("Attendance", err);
      alert("Konnte Anwesenheit nicht aktualisieren.");
    }
  }

  async function deleteTraktandum(tId: string) {
    if (!termin) return;
    try {
      const res = await fetch(`/api/termine/${id}/traktanden/${tId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTermin({
        ...termin,
        traktanden: termin.traktanden.filter((t) => t.id !== tId),
      });
    } catch (err) {
      console.error("Traktandum loeschen", err);
      alert("Konnte nicht loeschen.");
    } finally {
      setDeleteTraktandumId(null);
    }
  }

  // Generische PATCH-Funktion fuer Termin-Felder (Titel, Ort, Sitzungsleitung,
  // Protokollfuehrung, withAttendance …). Lokaler State wird sofort
  // aktualisiert; PATCH wird mit kurzer Verzoegerung abgeschickt.
  async function patchTermin(data: Partial<TerminDetail>) {
    try {
      await fetch(`/api/termine/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Termin patch", err);
    }
  }

  function exportPdf() {
    if (!termin) return;

    // A4 = 210 x 297 mm, margin 20mm
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 20;
    const contentWidth = pageWidth - marginX * 2;
    let y = 22;

    const addPageIfNeeded = (need: number) => {
      if (y + need > pageHeight - 20) {
        doc.addPage();
        y = 22;
      }
    };

    // Titel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(26, 26, 26);
    doc.text(termin.title, marginX, y);
    y += 7;

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(102, 102, 102);
    doc.text("Sitzungsprotokoll", marginX, y);
    y += 8;

    // Trennlinie
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;

    // Meta-Block als Label:Value-Zeilen
    const metaRows: [string, string][] = [
      ["Datum", `${formatDate(termin.date)}, ${termin.time}`],
      ["Ort", termin.location || "—"],
    ];
    if (termin.organizer)
      metaRows.push(["Organisiert von", termin.organizer]);
    if (termin.sitzungsleitung)
      metaRows.push(["Sitzungsleitung", termin.sitzungsleitung]);
    if (termin.protokollfuehrung)
      metaRows.push(["Protokollführung", termin.protokollfuehrung]);
    metaRows.push([
      `Anwesend (${termin.anwesend.length})`,
      termin.anwesend.map((p) => p.name).join(", ") || "–",
    ]);
    metaRows.push([
      `Abgemeldet (${termin.abgemeldet.length})`,
      termin.abgemeldet.map((p) => p.name).join(", ") || "–",
    ]);

    doc.setFontSize(10);
    for (const [label, value] of metaRows) {
      addPageIfNeeded(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(102, 102, 102);
      doc.text(label, marginX, y);
      doc.setTextColor(17, 17, 17);
      const valueLines = doc.splitTextToSize(value, contentWidth - 45);
      doc.text(valueLines, marginX + 45, y);
      y += Math.max(6, valueLines.length * 5);
    }
    y += 4;

    // Traktanden-Header
    addPageIfNeeded(12);
    doc.setDrawColor(221, 221, 221);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 26);
    doc.text("Traktanden", marginX, y);
    y += 8;

    if (termin.traktanden.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(170, 170, 170);
      doc.text("Keine Traktanden.", marginX, y);
      y += 8;
    } else {
      termin.traktanden.forEach((t, i) => {
        // Titel fett
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const titleLines = doc.splitTextToSize(
          `${i + 1}. ${t.title}`,
          contentWidth
        );
        addPageIfNeeded(titleLines.length * 6 + 10);
        doc.text(titleLines, marginX, y);
        y += titleLines.length * 5 + 1;

        // Notizen
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (t.notes.trim()) {
          doc.setTextColor(68, 68, 68);
          const noteLines = doc.splitTextToSize(t.notes, contentWidth - 4);
          for (const line of noteLines) {
            addPageIfNeeded(6);
            doc.text(line, marginX + 4, y);
            y += 5;
          }
        } else {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(170, 170, 170);
          doc.text("— keine Notizen —", marginX + 4, y);
          y += 5;
        }
        y += 4;
      });
    }

    // Footer mit Datum
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    const footerY = pageHeight - 12;
    doc.text(
      `Via 1 — Spinnereiweg 17, 3004 Bern · Erstellt am ${new Date().toLocaleDateString(
        "de-CH",
        { day: "numeric", month: "long", year: "numeric" }
      )}`,
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    doc.save(`${termin.title.replace(/\s+/g, "_")}_Protokoll.pdf`);
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <button
        onClick={() => router.push("/termine")}
        className="mb-4 ml-28 text-sm text-gray-500 hover:text-white"
      >
        ← Termine
      </button>

      <div className="mb-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300">
          {formatDate(termin.date).toUpperCase()}
        </p>
        <h1 className="mt-0.5 font-display text-xl font-bold uppercase tracking-wider text-white">
          {termin.title}
          {termin.type === "sitzung" && termin.withDinner && (
            <span className="ml-1 text-[11px] font-normal text-gray-500">
              inkl. Nachtessen
            </span>
          )}
        </h1>
        {termin.organizer && (
          <p className="mt-0.5 text-[10px] text-gray-600">
            organisiert von {termin.organizer}
          </p>
        )}

        {/* Zeiten — kompakt */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
          {termin.type === "sitzung" && termin.withDinner && termin.dinnerTime && (
            <p className="text-xs text-gray-400">
              🍽 {termin.dinnerTime}
              {termin.dinnerLocation && ` · ${termin.dinnerLocation}`}
            </p>
          )}
          {termin.type === "sitzung" && (
            <p className="text-xs text-gray-400">
              📋 {termin.time}
              {termin.location && ` · ${termin.location}`}
            </p>
          )}
          {termin.type === "essen" && (
            <p className="text-xs text-gray-400">
              🍽 {termin.time}
              {termin.location && ` · ${termin.location}`}
            </p>
          )}
          {termin.type === "sonstige" && (
            <p className="text-xs text-gray-400">
              {termin.time}
              {termin.location && ` · ${termin.location}`}
            </p>
          )}
        </div>
        {termin.dinnerMenu && (
          <p className="mt-1 text-xs italic text-gray-500">
            {termin.dinnerMenu}
          </p>
        )}
        {termin.type === "sonstige" && termin.createdBy && (
          <p className="mt-0.5 text-[10px] text-gray-600">
            erstellt von {termin.createdBy}
          </p>
        )}
      </div>

      {/* Sitzungs-Template (nur bei Sitzung) */}
      {isSitzung && (
        <>
          {/* Sitzungsleitung & Protokollführung */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] text-gray-600">
                Sitzungsleitung
              </label>
              <input
                type="text"
                value={termin.sitzungsleitung}
                onChange={(e) =>
                  setTermin({ ...termin, sitzungsleitung: e.target.value })
                }
                onBlur={(e) =>
                  patchTermin({ sitzungsleitung: e.target.value })
                }
                placeholder="Name…"
                className="w-full rounded border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-gray-600">
                Protokollführung
              </label>
              <input
                type="text"
                value={termin.protokollfuehrung}
                onChange={(e) =>
                  setTermin({ ...termin, protokollfuehrung: e.target.value })
                }
                onBlur={(e) =>
                  patchTermin({ protokollfuehrung: e.target.value })
                }
                placeholder="Name…"
                className="w-full rounded border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Sitzungsort */}
          <div className="mb-3">
            <div className="mb-0.5 flex items-center justify-between">
              <label className="text-[10px] text-gray-600">Sitzungsort</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLocationMode("wg")}
                  className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase ${
                    locationMode === "wg"
                      ? "bg-accent text-dark"
                      : "border border-gray-800 text-gray-600"
                  }`}
                >
                  WG
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode("custom")}
                  className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase ${
                    locationMode === "custom"
                      ? "bg-accent text-dark"
                      : "border border-gray-800 text-gray-600"
                  }`}
                >
                  Anderer Ort
                </button>
              </div>
            </div>
            {locationMode === "wg" ? (
              <div className="grid grid-cols-3 gap-1.5">
                {WG_OPTIONS.map((wg) => (
                  <button
                    key={wg}
                    type="button"
                    onClick={() => {
                      setTermin({ ...termin, location: wg });
                      patchTermin({ location: wg });
                    }}
                    className={`rounded border px-2 py-1.5 text-[11px] transition-colors ${
                      termin.location === wg
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-gray-800 bg-gray-900/60 text-gray-500 hover:border-gray-700"
                    }`}
                  >
                    {wg}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={termin.location}
                onChange={(e) =>
                  setTermin({ ...termin, location: e.target.value })
                }
                onBlur={(e) => patchTermin({ location: e.target.value })}
                placeholder="z.B. Innenhof, Pyramide, …"
                className="w-full rounded border border-gray-800 bg-gray-900/60 px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:border-accent focus:outline-none"
              />
            )}
          </div>

          {/* Anwesend / Abgemeldet */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAttendanceMode("anwesend")}
              className="rounded-lg border border-gray-800 bg-white/5 p-2.5 text-left transition-colors hover:border-accent/40"
            >
              <p className="mb-0.5 font-mono text-[10px] text-accent">
                Anwesend ({termin.anwesend.length})
              </p>
              <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-500">
                {termin.anwesend.map((p) => p.name).join(", ") ||
                  "Tippe zum Auswählen…"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAttendanceMode("abgemeldet")}
              className="rounded-lg border border-gray-800 bg-white/5 p-2.5 text-left transition-colors hover:border-secondary/40"
            >
              <p className="mb-0.5 font-mono text-[10px] text-secondary">
                Abgemeldet ({termin.abgemeldet.length})
              </p>
              <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-500">
                {termin.abgemeldet.map((p) => p.name).join(", ") ||
                  "Tippe zum Auswählen…"}
              </p>
            </button>
          </div>

          {/* Traktanden */}
          <section className="mb-6">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
              Traktanden
            </h2>
            <div className="space-y-3">
              {termin.traktanden.map((t, i) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-800 bg-white/5 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono text-xs font-bold text-accent">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        von {t.createdBy}
                      </p>
                      <textarea
                        value={t.notes}
                        onChange={(e) =>
                          updateTraktandumNotes(t.id, e.target.value)
                        }
                        onBlur={(e) =>
                          saveTraktandumNotes(t.id, e.target.value)
                        }
                        placeholder="Notizen / Was wurde besprochen..."
                        rows={Math.max(2, t.notes.split("\n").length)}
                        className="mt-2 min-h-[3.5rem] w-full resize-y rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTraktandumId(t.id)}
                      className="text-lg leading-none text-gray-600 hover:text-red-400"
                      aria-label="Traktandum löschen"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Neues Traktandum */}
            <form onSubmit={addTraktandum} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTraktandum}
                onChange={(e) => setNewTraktandum(e.target.value)}
                placeholder="Neues Traktandum..."
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-accent px-3 py-2 font-mono text-xs font-bold text-dark"
              >
                +
              </button>
            </form>
          </section>

          {/* PDF Export */}
          <button
            onClick={exportPdf}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 py-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="12" y2="18" />
              <line x1="15" y1="15" x2="12" y2="18" />
            </svg>
            Protokoll als PDF exportieren
          </button>
        </>
      )}

      {/* Essens-Anmeldung (bei Essen oder Sitzung mit Dinner) */}
      {hasEssen && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-secondary">
              Essens-Anmeldung ({totalGuests} Personen)
            </h2>
            <button
              onClick={toggleSignupForm}
              className="rounded-full bg-secondary px-3 py-1 font-mono text-xs font-bold text-white"
            >
              {isSignedUp ? "Bearbeiten" : "Anmelden"}
            </button>
          </div>

          {/* Diät-Zusammenfassung */}
          {totalGuests > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {dietCounts.Fleisch > 0 && (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
                  🍖 {dietCounts.Fleisch} Fleisch
                </span>
              )}
              {dietCounts.Vegi > 0 && (
                <span className="rounded-full bg-lime-500/15 px-3 py-1 text-xs text-lime-300">
                  🥗 {dietCounts.Vegi} Vegi
                </span>
              )}
              {dietCounts.Vegan > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  🌱 {dietCounts.Vegan} Vegan
                </span>
              )}
              {dietCounts.Andere > 0 && (
                <span className="rounded-full bg-gray-500/15 px-3 py-1 text-xs text-gray-300">
                  {dietCounts.Andere} Andere
                </span>
              )}
            </div>
          )}

          {showSignup && (
            <form
              onSubmit={handleMealSignup}
              className="mb-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3"
            >
              <p className="mb-3 text-xs text-gray-400">
                Deine Ernährung ({myDiet}) wird automatisch aus deinem Profil
                übernommen.
              </p>

              {/* Eigene Kinder: 1-Klick-Anmelden mit vorbelegter Diet */}
              {myKids.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Meine Kinder
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {myKids.map((k) => {
                      const sel = isKidSelected(k);
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => toggleKid(k)}
                          className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                            sel
                              ? "border-secondary bg-secondary text-white"
                              : "border-gray-700 text-gray-300 hover:border-secondary"
                          }`}
                        >
                          {sel ? "✓" : "+"} {k.name}
                          <span className="ml-1 opacity-60">
                            ({dietEnumToLabel(k.diet)})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gäste */}
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Gäste mitbringen ({signupGuestDetails.length})
                </p>
                <button
                  type="button"
                  onClick={addGuest}
                  className="rounded bg-secondary/20 px-2 py-1 text-xs text-secondary hover:bg-secondary/30"
                >
                  + Gast
                </button>
              </div>

              {signupGuestDetails.map((g, i) => (
                <div
                  key={i}
                  className="mb-2 rounded border border-secondary/20 bg-white/5 p-2"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <input
                      type="text"
                      value={g.name}
                      onChange={(e) =>
                        updateGuest(i, "name", e.target.value)
                      }
                      placeholder={`Gast ${i + 1}`}
                      className="w-24 rounded border border-gray-700 bg-transparent px-1.5 py-0.5 text-[10px] text-white placeholder-gray-600 focus:border-secondary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeGuest(i)}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      entfernen
                    </button>
                  </div>
                  <div className="mb-1.5 flex gap-1.5">
                    {["Fleisch", "Vegi", "Vegan"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateGuest(i, "diet", d)}
                        className={`flex-1 rounded py-1 font-mono text-[10px] transition-colors ${
                          g.diet === d
                            ? "bg-secondary text-white"
                            : "border border-gray-700 text-gray-400"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={g.allergies}
                    onChange={(e) =>
                      updateGuest(i, "allergies", e.target.value)
                    }
                    placeholder="Allergien (optional)"
                    className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-secondary focus:outline-none"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="mt-2 rounded bg-secondary px-4 py-2 font-mono text-xs font-bold text-white"
              >
                {isSignedUp ? "Speichern" : "Anmelden"}
              </button>
            </form>
          )}

          {/* Anmeldungsliste */}
          <div className="space-y-1">
            {termin.mealSignups.map((s, i) => {
              const isOwn = s.userId === currentUserId;
              // Signups ohne goingSelf und ohne Gaeste (reine Absage)
              // trotzdem anzeigen, aber ausgegraut
              const isAbsent = !s.goingSelf;
              return (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 ${
                    isOwn
                      ? "border-secondary/40 bg-secondary/10"
                      : "border-gray-800 bg-white/5"
                  } ${isAbsent && s.guestDetails.length === 0 ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm ${isAbsent ? "text-gray-500 line-through" : "text-white"}`}
                    >
                      {s.name}
                      {isOwn && (
                        <span className="ml-1 text-[10px] text-secondary">
                          (du)
                        </span>
                      )}
                      {isAbsent && (
                        <span className="ml-1 text-[10px] text-gray-600">
                          abgemeldet
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {s.goingSelf && (
                        <span className="font-mono text-xs text-gray-500">
                          {s.diet}
                          {s.allergies && ` · ${s.allergies}`}
                        </span>
                      )}
                      {isOwn && (
                        <button
                          onClick={cancelMealSignup}
                          className="rounded border border-red-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                          aria-label="Abmelden"
                        >
                          Abmelden
                        </button>
                      )}
                    </div>
                  </div>
                  {s.guestDetails.length > 0 && (
                    <div className="mt-1 space-y-0.5 border-t border-gray-800 pt-1">
                      {s.guestDetails.map((g, gi) => (
                        <div
                          key={gi}
                          className="flex items-center justify-between text-xs text-gray-400"
                        >
                          <span>+ {g.name || `Gast ${gi + 1}`}</span>
                          <span className="font-mono text-gray-600">
                            {g.diet}
                            {g.allergies && ` · ${g.allergies}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Kommentare (fuer alle Termine) */}
      <section className="mb-6">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Kommentare ({termin.comments.length})
        </h2>
        <div className="space-y-1.5">
          {termin.comments.map((c) => {
            const isOwn = c.authorId === currentUserId;
            return (
              <div
                key={c.id}
                className="rounded border-l-2 border-accent/40 bg-white/5 py-1.5 pl-2 pr-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-300">{c.text}</p>
                  {isOwn && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-[10px] text-gray-600 hover:text-red-400"
                      aria-label="Kommentar loeschen"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-[9px] text-gray-600">
                  — {c.author} ·{" "}
                  {new Date(c.date).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            );
          })}
          {termin.comments.length === 0 && (
            <p className="text-xs text-gray-600">Noch keine Kommentare</p>
          )}
        </div>
        <form onSubmit={addComment} className="mt-2 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar oder Frage..."
            className="flex-1 rounded border border-gray-800 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1.5 text-[10px] font-bold text-dark"
          >
            OK
          </button>
        </form>
      </section>

      {/* Anwesenheits-Modal */}
      {attendanceMode && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setAttendanceMode(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-800 bg-black p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                {attendanceMode === "anwesend" ? "Anwesend" : "Abgemeldet"}
              </h3>
              <button
                onClick={() => setAttendanceMode(null)}
                className="text-gray-500 hover:text-white"
                aria-label="Schliessen"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Tippe auf einen Namen zum Umschalten.
            </p>
            <div className="flex flex-wrap gap-2">
              {allUsers.length === 0 && (
                <p className="text-xs text-gray-600">Lade Bewohnende …</p>
              )}
              {allUsers.map((u) => {
                const list =
                  attendanceMode === "anwesend"
                    ? termin.anwesend
                    : termin.abgemeldet;
                const selected = list.some((p) => p.id === u.id);
                const activeColor =
                  attendanceMode === "anwesend"
                    ? "bg-accent text-dark border-accent"
                    : "bg-secondary text-white border-secondary";
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAttendance(u, attendanceMode)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      selected
                        ? activeColor
                        : "border-gray-700 bg-white/5 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Traktandum löschen — Bestätigung */}
      {deleteTraktandumId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTraktandumId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-800 bg-black p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-semibold text-white">
              Traktandum löschen?
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Willst du dieses Traktandum wirklich löschen? Das kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTraktandumId(null)}
                className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-300 hover:border-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={() => deleteTraktandum(deleteTraktandumId)}
                className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
