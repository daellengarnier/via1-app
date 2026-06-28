"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import { RichNotes } from "@/components/RichNotes";
import { renderMarkdown } from "@/lib/markdown-light";

interface Traktandum {
  id: string;
  title: string;
  notes: string;
  createdBy: string;
  createdById: string;
  order: number;
  canEdit: boolean;
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

interface OpenPendenz {
  id: string;
  title: string;
  assignees: { id: string; name: string }[];
  sourceTermin: { id: string; title: string; date: string | null } | null;
}
interface CompletedPendenz extends OpenPendenz {
  completedBy: { id: string; name: string } | null;
  completedAt: string | null;
  completionNote: string | null;
}
interface PendenzenResponse {
  open: OpenPendenz[];
  completed: CompletedPendenz[];
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
  editors: PersonRef[];
  canEdit: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  traktanden: Traktandum[];
  mealSignups: MealSignup[];
  comments: TerminComment[];
  isHaussitzung: boolean;
  responsibleWg: { id: string; name: string } | null;
}


function formatDate(iso: string): string {
  if (!iso) return "Datum offen";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Datum offen";
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
  const [pendenzen, setPendenzen] = useState<PendenzenResponse | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);
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

  const loadPendenzen = useCallback(async () => {
    try {
      const res = await fetch(`/api/termine/${id}/pendenzen`);
      if (!res.ok) return;
      const data = (await res.json()) as PendenzenResponse;
      setPendenzen(data);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadTermin();
    loadPendenzen();
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((u: PersonRef[]) => setAllUsers(u))
      .catch(() => {});
  }, [loadTermin, loadPendenzen]);

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

  async function saveTraktandumTitle(tId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed || !termin) return;
    // Optimistisch lokal aktualisieren
    setTermin({
      ...termin,
      traktanden: termin.traktanden.map((t) =>
        t.id === tId ? { ...t, title: trimmed } : t
      ),
    });
    try {
      const res = await fetch(`/api/termine/${id}/traktanden/${tId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        // Bei Fehler (z.B. 403) reload um echten State zu holen
        loadTermin();
      }
    } catch (err) {
      console.error("Traktandum-Titel speichern", err);
      loadTermin();
    }
  }

  // Reorder: neue Reihenfolge sofort lokal anwenden, dann an Server
  // schicken. Auf Fehler nichts rollbacken — der naechste Reload
  // bekommt den server-state.
  async function persistOrder(newList: Traktandum[]) {
    if (!termin) return;
    setTermin({ ...termin, traktanden: newList });
    try {
      await fetch(`/api/termine/${id}/traktanden/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newList.map((t) => t.id) }),
      });
    } catch (err) {
      console.error("Reorder", err);
    }
  }
  function moveTraktandum(tId: string, delta: -1 | 1) {
    if (!termin) return;
    const idx = termin.traktanden.findIndex((t) => t.id === tId);
    const next = idx + delta;
    if (idx < 0 || next < 0 || next >= termin.traktanden.length) return;
    const list = [...termin.traktanden];
    const tmp = list[idx]!;
    list[idx] = list[next]!;
    list[next] = tmp;
    persistOrder(list);
  }
  function reorderTo(fromId: string, toId: string) {
    if (!termin || fromId === toId) return;
    const list = [...termin.traktanden];
    const fromIdx = list.findIndex((t) => t.id === fromId);
    const toIdx = list.findIndex((t) => t.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    if (!moved) return;
    list.splice(toIdx, 0, moved);
    persistOrder(list);
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

  // Baut das PDF-Dokument im Speisekarten-Look (Mesa-Redonda-Style).
  // Cremfarbener Hintergrund, dunkles Teal als Hauptlinie, bunte
  // Akzent-Kreise als Trenner. Ruft KEINE Side-Effects auf — der
  // Caller entscheidet ob er download/preview/archive macht.
  function buildPdfDoc(): jsPDF | null {
    if (!termin) return null;

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    let y = 22;

    // === Speisekarten-Farbpalette (vom Beispiel Mesa Redonda) ===
    const C = {
      cream: [244, 232, 197] as const,        // #F4E8C5 — Papier-Beige
      teal: [13, 58, 62] as const,            // #0D3A3E — Dunkles Petrol
      burnt: [216, 90, 31] as const,          // #D85A1F — Burnt Orange
      mustard: [214, 168, 50] as const,       // #D6A832 — Senfgelb
      olive: [122, 136, 66] as const,         // #7A8842 — Olive
      lightTeal: [58, 142, 139] as const,     // #3A8E8B — Helles Teal
      rust: [194, 74, 69] as const,           // #C24A45 — Rust-Pink
      softBlue: [90, 143, 176] as const,      // #5A8FB0 — Weiches Blau
      muted: [120, 100, 78] as const,         // gedeckter Braun-Ton
    };
    // Reihenfolge fuer Punkt-Trenner (klassisch bunte Kreis-Reihe)
    const dotColors: readonly (readonly [number, number, number])[] = [
      C.burnt, C.mustard, C.olive, C.teal, C.lightTeal, C.softBlue, C.rust,
    ];

    // Fuellt den Hintergrund jeder Seite mit Cream.
    const paintBackground = () => {
      doc.setFillColor(...C.cream);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    };
    paintBackground();

    // Bunte Punkt-Reihe zentriert — klassisches 70s-Speisekarten-Element
    const drawDots = (yPos: number) => {
      const count = 7;
      const spacing = 5;
      const totalW = (count - 1) * spacing;
      const startX = pageWidth / 2 - totalW / 2;
      for (let i = 0; i < count; i++) {
        doc.setFillColor(...dotColors[i % dotColors.length]!);
        doc.circle(startX + i * spacing, yPos, 1.8, "F");
      }
    };

    // Box mit teal-Border + cream-Hintergrund (Restaurant-Karten-Look)
    const drawBox = (xPos: number, yPos: number, w: number, h: number) => {
      doc.setFillColor(...C.cream);
      doc.setDrawColor(...C.teal);
      doc.setLineWidth(1.0);
      doc.roundedRect(xPos, yPos, w, h, 3, 3, "FD");
    };

    const addPageIfNeeded = (need: number) => {
      if (y + need > pageHeight - 22) {
        doc.addPage();
        paintBackground();
        y = 22;
      }
    };

    // === Tagline ganz oben ===
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...C.teal);
    doc.text(
      "✤ VIA 1 · SITZUNGSPROTOKOLL · seit 2026 ✤",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 9;

    // === Gross-Titel des Termins mit Schatten-Effekt ===
    // Schatten (burnt orange leicht versetzt)
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    const title = termin.title.toUpperCase();
    const titleLines = doc.splitTextToSize(title, contentWidth - 10);
    doc.setTextColor(...C.mustard);
    for (let i = 0; i < titleLines.length; i++) {
      doc.text(titleLines[i]!, pageWidth / 2 + 0.7, y + 0.7 + i * 11, {
        align: "center",
      });
    }
    // Haupttitel in burnt orange
    doc.setTextColor(...C.burnt);
    for (let i = 0; i < titleLines.length; i++) {
      doc.text(titleLines[i]!, pageWidth / 2, y + i * 11, { align: "center" });
    }
    y += titleLines.length * 11 + 2;

    // Untertitel italic
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...C.teal);
    doc.text(
      `der runde Tisch — ${formatDate(termin.date)}, ${termin.time}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 6;

    // Bunte Punkt-Reihe als Trenner
    drawDots(y);
    y += 8;

    // === Meta-Block als Karten-Box ===
    const metaRows: [string, string][] = [];
    if (termin.location) metaRows.push(["Ort", termin.location]);
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

    // Vorab-Hoehe schaetzen
    const metaPad = 6;
    let metaHeight = metaPad + 7; // Section-Header
    for (const [, value] of metaRows) {
      const valueLines = doc.splitTextToSize(value, contentWidth - 65);
      metaHeight += Math.max(6, valueLines.length * 5);
    }
    metaHeight += metaPad;

    addPageIfNeeded(metaHeight + 4);
    drawBox(marginX, y, contentWidth, metaHeight);
    const metaTop = y + metaPad;
    // Section-Header "● Aus dem Sitzungsraum" mit Avocado-Kreis
    doc.setFillColor(...C.olive);
    doc.circle(marginX + 7, metaTop + 1, 1.8, "F");
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.burnt);
    doc.text("Aus dem Sitzungsraum", marginX + 12, metaTop + 2.5);
    let metaY = metaTop + 9;
    doc.setFontSize(10);
    for (const [label, value] of metaRows) {
      doc.setFont("times", "italic");
      doc.setTextColor(...C.olive);
      doc.text(label, marginX + 5, metaY + 4);
      doc.setFont("times", "bold");
      doc.setTextColor(...C.teal);
      const valueLines = doc.splitTextToSize(value, contentWidth - 65);
      doc.text(valueLines, marginX + 60, metaY + 4);
      metaY += Math.max(6, valueLines.length * 5);
    }
    y += metaHeight + 6;

    // === Traktanden-Header ===
    addPageIfNeeded(16);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...C.burnt);
    doc.text("✦ TRAKTANDEN ✦", pageWidth / 2, y + 2, { align: "center" });
    y += 6;
    drawDots(y);
    y += 8;

    if (termin.traktanden.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(...C.muted);
      doc.text("Keine Traktanden.", pageWidth / 2, y, { align: "center" });
      y += 8;
    } else {
      termin.traktanden.forEach((t, i) => {
        // Hoehe der Box vorab schaetzen
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        const titleLines = doc.splitTextToSize(t.title, contentWidth - 22);
        const cleaned = (t.notes ?? "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1")
          .replace(/__([^_]+)__/g, "$1")
          .replace(/_([^_]+)_/g, "$1")
          .replace(/^[-*]\s+/gm, "• ");
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        const noteLines = cleaned.trim()
          ? doc.splitTextToSize(cleaned, contentWidth - 16)
          : ["— keine Notizen —"];
        const boxHeight =
          8 + // Padding oben
          titleLines.length * 6 +
          (t.createdBy ? 5 : 0) +
          3 + // Trenner
          noteLines.length * 5 +
          6; // Padding unten

        addPageIfNeeded(boxHeight + 6);

        // Box zeichnen
        drawBox(marginX, y, contentWidth, boxHeight);
        const boxTop = y;

        // Nummer als bunter Kreis (rotiert durch dotColors)
        const numColor = dotColors[i % dotColors.length]!;
        doc.setFillColor(...numColor);
        doc.circle(marginX + 7, boxTop + 8, 3.5, "F");
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...C.cream);
        doc.text(String(i + 1), marginX + 7, boxTop + 9.5, {
          align: "center",
        });

        // Titel
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...C.burnt);
        doc.text(titleLines, marginX + 14, boxTop + 9);
        let cursor = boxTop + 8 + titleLines.length * 6;

        // "eingebracht von X" italic olive
        if (t.createdBy) {
          doc.setFont("times", "italic");
          doc.setFontSize(9);
          doc.setTextColor(...C.olive);
          doc.text(`eingebracht von ${t.createdBy}`, marginX + 14, cursor);
          cursor += 4;
        }

        // Duenne Trennlinie (gepunktet)
        doc.setDrawColor(...C.teal);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([0.5, 1], 0);
        doc.line(
          marginX + 6,
          cursor + 1,
          marginX + contentWidth - 6,
          cursor + 1
        );
        doc.setLineDashPattern([], 0);
        cursor += 4;

        // Notizen
        doc.setFontSize(11);
        if (cleaned.trim()) {
          doc.setFont("times", "normal");
          doc.setTextColor(...C.teal);
          doc.text(noteLines, marginX + 8, cursor);
        } else {
          doc.setFont("times", "italic");
          doc.setTextColor(...C.muted);
          doc.text(noteLines, marginX + 8, cursor);
        }

        y += boxHeight + 5;
      });
    }

    // === Footer auf jeder Seite ===
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      // Bunte Punkt-Reihe als oberer Footer-Abschluss
      drawDots(pageHeight - 16);
      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...C.teal);
      doc.text(
        "✤  VIA 1  ✤  SPINNEREIWEG 17  ✤  3004 BERN  ✤",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.setFont("times", "italic");
      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      doc.text(
        `Erstellt am ${new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })} · Seite ${p} von ${pages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    }
    doc.setPage(pages);

    return doc;
  }

  function downloadPdf() {
    const doc = buildPdfDoc();
    if (!doc || !termin) return;
    doc.save(`${termin.title.replace(/\s+/g, "_")}_Protokoll.pdf`);
  }

  function previewPdf() {
    const doc = buildPdfDoc();
    if (!doc) return;
    // Blob-URL erzeugen und in neuem Tab oeffnen — Browser zeigt
    // das PDF inline an, kein Download.
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    // Falls Pop-up geblockt: fallback in current tab
    if (!win) window.location.href = url;
    // URL nach kurzer Zeit wieder freigeben
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function archiveProtokoll() {
    if (!termin || archiving) return;
    if (
      !confirm(
        "Protokoll abschliessen?\n\n" +
          "• Das PDF wird im Hausbuch unter „Sitzungsprotokolle“ abgelegt\n" +
          "• Die Sitzung wandert ins Archiv (Tab „Termine → 📦 Archiv“)\n\n" +
          "Du kannst die Sitzung später wieder eröffnen, falls eine Korrektur nötig ist."
      )
    ) {
      return;
    }
    const doc = buildPdfDoc();
    if (!doc) return;
    setArchiving(true);
    try {
      const pdfData = doc.output("datauristring");
      const title = termin.isHaussitzung
        ? `Haussitzung ${termin.responsibleWg?.name ?? ""}`.trim()
        : termin.title;
      const res = await fetch("/api/sitzungsprotokolle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminId: termin.id,
          title,
          date: termin.date || new Date().toISOString(),
          wgName: termin.responsibleWg?.name ?? null,
          pdfData,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setArchivedAt(new Date().toISOString());
      // Termin im selben Schritt archivieren
      await fetch(`/api/termine/${termin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      }).catch(() => {});
      loadTermin();
    } catch (err) {
      console.error("Protokoll abschliessen", err);
      alert(
        "Konnte das Protokoll nicht ablegen. Bitte erneut versuchen."
      );
    } finally {
      setArchiving(false);
    }
  }

  async function toggleArchive() {
    if (!termin) return;
    const willArchive = !termin.isArchived;
    if (willArchive) {
      if (
        !confirm(
          "Termin archivieren? Er wird aus der Hauptliste entfernt und ist nur noch im Archiv-Tab sichtbar. Du kannst ihn jederzeit wieder eröffnen."
        )
      ) {
        return;
      }
    }
    try {
      const res = await fetch(`/api/termine/${termin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: willArchive }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      loadTermin();
    } catch (err) {
      console.error("Archivieren", err);
      alert(err instanceof Error ? err.message : "Aktion fehlgeschlagen.");
    }
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

      {/* Archiv-Banner */}
      {termin.isArchived && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-600 bg-gray-800/60 p-3">
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
              📦 Termin archiviert
            </p>
            <p className="text-xs text-gray-300">
              Diese Sitzung wurde archiviert
              {termin.archivedAt && (
                <>
                  {" "}
                  am{" "}
                  {new Date(termin.archivedAt).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
              . Für Korrekturen kannst du sie wieder eröffnen.
            </p>
          </div>
          {termin.canEdit && (
            <button
              type="button"
              onClick={toggleArchive}
              className="rounded border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
            >
              ↻ Wieder eröffnen
            </button>
          )}
        </div>
      )}

      <div className="mb-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300">
          {termin.date
            ? formatDate(termin.date).toUpperCase()
            : `📌 DATUM FOLGT${termin.responsibleWg ? ` · ${termin.responsibleWg.name.toUpperCase()}` : ""}`}
        </p>
        <h1 className="mt-0.5 font-display text-xl font-bold uppercase tracking-wider text-white">
          {termin.title}
          {termin.type === "sitzung" && termin.withDinner && (
            <span className="ml-1 text-[11px] font-normal text-gray-500">
              inkl. Nachtessen
            </span>
          )}
        </h1>
        {termin.isHaussitzung && !termin.date && (
          <div className="mt-2 rounded-md border border-orange-500/40 bg-orange-500/10 p-2">
            <p className="mb-2 text-[11px] text-orange-200">
              Datum noch offen — {termin.responsibleWg?.name ?? "verantwortliche WG"} legt fest. Traktanden koennen schon erfasst werden.
            </p>
            <SetDateForm
              terminId={termin.id}
              onSaved={() => loadTermin()}
            />
          </div>
        )}
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

          {/* Co-Bearbeiter:innen */}
          {termin.editors.length > 0 && (
            <div className="mb-3 rounded border border-gray-800 bg-gray-900/30 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                Co-Bearbeiter:innen
              </p>
              <p className="mt-0.5 text-xs text-gray-300">
                {termin.editors.map((e) => e.name).join(", ")}
              </p>
            </div>
          )}

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

          {/* Pendenzen aus frueheren Sitzungen */}
          <PendenzenBlock data={pendenzen} onReload={loadPendenzen} />

          {/* Traktanden */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                Traktanden
              </h2>
              <span className="font-mono text-[10px] text-gray-600">
                Reihenfolge: Pfeile oder ziehen
              </span>
            </div>
            <div className="space-y-3">
              {termin.traktanden.map((t, i) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/traktandum-id", t.id);
                  }}
                  onDragOver={(e) => {
                    if (
                      e.dataTransfer.types.includes("text/traktandum-id")
                    ) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(e) => {
                    const fromId = e.dataTransfer.getData(
                      "text/traktandum-id"
                    );
                    if (fromId) {
                      e.preventDefault();
                      reorderTo(fromId, t.id);
                    }
                  }}
                  className="rounded-lg border border-gray-800 bg-white/5 p-3 transition-colors hover:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center gap-0.5">
                      {termin.canEdit && (
                        <span
                          className="cursor-grab select-none text-gray-600 hover:text-accent"
                          title="Zum Verschieben ziehen"
                          aria-hidden
                        >
                          ⋮⋮
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-accent">
                        {i + 1}.
                      </span>
                      {termin.canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => moveTraktandum(t.id, -1)}
                            disabled={i === 0}
                            aria-label="Nach oben"
                            className="leading-none text-gray-500 hover:text-accent disabled:opacity-20"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTraktandum(t.id, 1)}
                            disabled={i === termin.traktanden.length - 1}
                            aria-label="Nach unten"
                            className="leading-none text-gray-500 hover:text-accent disabled:opacity-20"
                          >
                            ▼
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <TraktandumTitle
                        traktandum={t}
                        canEdit={t.canEdit}
                        onSave={(newTitle) => saveTraktandumTitle(t.id, newTitle)}
                      />
                      <p className="mt-0.5 mb-2 text-xs text-gray-600">
                        von {t.createdBy}
                      </p>
                      {t.canEdit ? (
                        <RichNotes
                          value={t.notes}
                          onChange={(v) => updateTraktandumNotes(t.id, v)}
                          onBlur={(v) => saveTraktandumNotes(t.id, v)}
                          placeholder="Notizen / Was wurde besprochen..."
                          minHeight={80}
                          pendenzUsers={allUsers}
                          onCreatePendenz={async (title, assignedToIds) => {
                            try {
                              const res = await fetch("/api/aufgaben", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  title,
                                  assignedToIds,
                                  sourceTerminId: id,
                                  sourceTraktandumId: t.id,
                                }),
                              });
                              if (res.ok) loadPendenzen();
                              return { ok: res.ok };
                            } catch {
                              return { ok: false };
                            }
                          }}
                        />
                      ) : (
                        <ReadOnlyNotes notes={t.notes} />
                      )}
                    </div>
                    {t.canEdit && (
                      <button
                        type="button"
                        onClick={() => setDeleteTraktandumId(t.id)}
                        className="text-lg leading-none text-gray-600 hover:text-red-400"
                        aria-label="Traktandum löschen"
                      >
                        ×
                      </button>
                    )}
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

          {/* PDF: Vorschau + Download nebeneinander */}
          <div className="mb-2 flex gap-2">
            <button
              onClick={previewPdf}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-white/5 py-2.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/10"
            >
              👁 Vorschau
            </button>
            <button
              onClick={downloadPdf}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 py-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="18" />
                <line x1="15" y1="15" x2="12" y2="18" />
              </svg>
              PDF herunterladen
            </button>
          </div>

          {/* Protokoll abschliessen — legt das PDF im Hausbuch ab. */}
          <button
            onClick={archiveProtokoll}
            disabled={archiving}
            className="mb-1 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {archiving ? "⋯ Wird abgelegt…" : archivedAt ? "✓ Abgelegt — erneut ablegen" : "✓ Protokoll abschliessen"}
          </button>
          <p className="mb-5 px-1 text-center text-[10px] text-gray-500">
            Beim Abschliessen wird das PDF unter{" "}
            <span className="text-emerald-300/80">Hausbuch → Sitzungsprotokolle</span>{" "}
            für alle Bewohner:innen sichtbar abgelegt.
            {archivedAt && (
              <>
                {" "}
                <span className="text-emerald-300/80">
                  Zuletzt abgelegt:{" "}
                  {new Date(archivedAt).toLocaleTimeString("de-CH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </p>
        </>
      )}

      {/* Termin archivieren — nur Nicht-Sitzungen (Sitzungen haben das
          ueber "Protokoll abschliessen"), nur wenn noch nicht archiviert,
          nur wer bearbeiten darf. */}
      {!isSitzung && termin.canEdit && !termin.isArchived && (
        <button
          onClick={toggleArchive}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-800/40 py-2.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-800/70"
        >
          📦 Termin archivieren
        </button>
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

// Inline-Formular zum Setzen des Datums fuer eine Platzhalter-
// Haussitzung — analog zur normalen Sitzungserstellung: Datum, Zeit,
// Ort, optional inkl. Nachtessen mit Zeit/Ort/Menue.
function SetDateForm({ terminId, onSaved }: { terminId: string; onSaved: () => void }) {
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("19:30");
  const [location, setLocation] = useState<string>("Saal");
  const [withDinner, setWithDinner] = useState(false);
  const [dinnerTime, setDinnerTime] = useState<string>("18:30");
  const [dinnerLocation, setDinnerLocation] = useState<string>("Saal");
  const [dinnerMenu, setDinnerMenu] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!date) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/termine/${terminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          location: location.trim(),
          withDinner,
          dinnerTime: withDinner ? dinnerTime : null,
          dinnerLocation: withDinner ? dinnerLocation.trim() : null,
          dinnerMenu: withDinner ? dinnerMenu.trim() || null : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Datum setzen fehlgeschlagen.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Datum + Zeit */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Ort */}
      <div>
        <label className="mb-0.5 block text-[10px] uppercase tracking-wider text-orange-300">
          Ort
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="z.B. Saal"
          className="w-full rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Mit Nachtessen */}
      <label className="flex cursor-pointer items-center gap-2 text-xs text-orange-200">
        <input
          type="checkbox"
          checked={withDinner}
          onChange={(e) => setWithDinner(e.target.checked)}
          className="h-4 w-4 rounded border-orange-500/40 bg-gray-900"
        />
        🍽 Inkl. Nachtessen
      </label>

      {withDinner && (
        <div className="space-y-2 rounded border border-orange-500/20 bg-orange-500/5 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] uppercase tracking-wider text-orange-300">
              Essen-Zeit
            </label>
            <input
              type="time"
              value={dinnerTime}
              onChange={(e) => setDinnerTime(e.target.value)}
              className="rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] uppercase tracking-wider text-orange-300">
              Essen-Ort
            </label>
            <input
              type="text"
              value={dinnerLocation}
              onChange={(e) => setDinnerLocation(e.target.value)}
              placeholder="z.B. Saal"
              className="w-full rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] uppercase tracking-wider text-orange-300">
              Menu (optional)
            </label>
            <input
              type="text"
              value={dinnerMenu}
              onChange={(e) => setDinnerMenu(e.target.value)}
              placeholder="z.B. Lasagne + Salat"
              className="w-full rounded border border-orange-500/40 bg-gray-900 px-2 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy || !date}
        className="w-full rounded bg-orange-500 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "..." : "Datum festlegen"}
      </button>
    </div>
  );
}

// ============================================================
// Pendenzen-Block — wird oberhalb der Traktanden gerendert.
// Zeigt zwei Sub-Bloecke:
//   ⏳ Offen      — Pendenzen die aus frueheren Sitzungen offen sind
//   ✅ Erledigt    — Pendenzen die seit der letzten Sitzung abgehakt wurden
// ============================================================

function PendenzenBlock({
  data,
  onReload,
}: {
  data: PendenzenResponse | null;
  onReload: () => void;
}) {
  if (!data) return null;
  if (data.open.length === 0 && data.completed.length === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      {data.open.length > 0 && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-900/10 p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
            ⏳ Offene Pendenzen aus früheren Sitzungen
          </h3>
          <ul className="space-y-2">
            {data.open.map((p) => (
              <OpenPendenzRow key={p.id} pendenz={p} onDone={onReload} />
            ))}
          </ul>
        </div>
      )}

      {data.completed.length > 0 && (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/10 p-3">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
            ✅ Erledigt seit letzter Sitzung
          </h3>
          <ul className="space-y-2">
            {data.completed.map((p) => (
              <li
                key={p.id}
                className="rounded border border-emerald-700/30 bg-black/30 p-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-white">{p.title}</p>
                  <p className="font-mono text-[10px] text-gray-500">
                    {p.completedAt
                      ? new Date(p.completedAt).toLocaleDateString("de-CH", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  erledigt von{" "}
                  <span className="text-emerald-300">
                    {p.completedBy?.name ?? "?"}
                  </span>
                  {p.assignees.length > 0 &&
                    p.completedBy &&
                    !p.assignees.some((a) => a.id === p.completedBy?.id) && (
                      <span className="text-gray-500">
                        {" "}
                        (zugewiesen an{" "}
                        {p.assignees.map((a) => a.name).join(", ")})
                      </span>
                    )}
                  {p.sourceTermin && (
                    <span className="text-gray-600">
                      {" "}
                      · aus {p.sourceTermin.title}
                    </span>
                  )}
                </p>
                {p.completionNote && (
                  <p className="mt-1.5 rounded bg-black/40 px-2 py-1 text-xs italic text-emerald-100">
                    💬 {p.completionNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function OpenPendenzRow({
  pendenz,
  onDone,
}: {
  pendenz: OpenPendenz;
  onDone: () => void;
}) {
  const [completing, setCompleting] = useState(false);

  async function complete(note: string) {
    try {
      const res = await fetch(`/api/aufgaben/${pendenz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          done: true,
          completionNote: note,
        }),
      });
      if (res.ok) {
        setCompleting(false);
        onDone();
      }
    } catch {
      // ignore
    }
  }

  return (
    <li className="rounded border border-amber-700/30 bg-black/30 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{pendenz.title}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {pendenz.assignees.length > 0 ? (
              <>
                zugewiesen an{" "}
                <span className="text-amber-300">
                  {pendenz.assignees.map((a) => a.name).join(", ")}
                </span>
              </>
            ) : (
              <span className="text-gray-500">niemand zugewiesen</span>
            )}
            {pendenz.sourceTermin && (
              <span className="text-gray-600">
                {" "}
                · aus {pendenz.sourceTermin.title}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCompleting(true)}
          className="shrink-0 rounded border border-emerald-600/40 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/10"
          title="Erledigt markieren"
        >
          ✓
        </button>
      </div>
      {completing && (
        <CompletePopup
          title={pendenz.title}
          onCancel={() => setCompleting(false)}
          onSubmit={complete}
        />
      )}
    </li>
  );
}

function CompletePopup({
  title,
  onCancel,
  onSubmit,
}: {
  title: string;
  onCancel: () => void;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-emerald-700/40 bg-gray-950 p-4"
      >
        <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-emerald-300">
          ✓ Pendenz erledigt
        </h3>
        <p className="mb-3 text-xs text-gray-400">{title}</p>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-gray-500">
          Was wurde gemacht? (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Wird in der nächsten Sitzung angezeigt — der Protokollant muss es dann nicht extra eintragen."
          className="mb-3 h-20 w-full resize-y rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-emerald-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(note);
              } finally {
                setBusy(false);
              }
            }}
            className="flex-1 rounded bg-emerald-500 px-3 py-2 text-xs font-bold text-dark hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Speichert…" : "Erledigt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline-Editierbarer Traktandum-Titel. Klick auf den Text macht
// ein Input draus; on blur oder Enter speichert. Wenn !canEdit nur
// statischer Text.
function TraktandumTitle({
  traktandum,
  canEdit,
  onSave,
}: {
  traktandum: { title: string };
  canEdit: boolean;
  onSave: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(traktandum.title);

  useEffect(() => {
    if (!editing) setDraft(traktandum.title);
  }, [traktandum.title, editing]);

  if (!canEdit) {
    return (
      <p className="text-sm font-medium text-white">{traktandum.title}</p>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block w-full rounded text-left text-sm font-medium text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none"
        title="Klicken zum Bearbeiten"
      >
        {traktandum.title}
      </button>
    );
  }

  function commit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== traktandum.title) onSave(draft);
  }

  return (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setDraft(traktandum.title);
          setEditing(false);
        }
      }}
      className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm font-medium text-white focus:border-accent focus:outline-none"
    />
  );
}

// Read-Only Anzeige der Notizen — gerendert als Markdown. Wird
// gezeigt wenn der User das Traktandum nicht bearbeiten darf.
function ReadOnlyNotes({ notes }: { notes: string }) {
  if (!notes.trim()) {
    return (
      <p className="text-xs italic text-gray-600">— keine Notizen —</p>
    );
  }
  return (
    <div
      className="markdown-body rounded border border-gray-800 bg-black/30 p-2 text-xs text-gray-300"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: renderMarkdown(notes),
      }}
    />
  );
}
