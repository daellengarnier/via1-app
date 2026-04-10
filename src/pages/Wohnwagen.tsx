import { useState } from 'react';
import { useStore, useAuth, WohnwagenBooking } from '../store';

function pad(n: number) { return String(n).padStart(2, '0'); }

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateDE(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function rangesOverlap(a1: string, a2: string, b1: string, b2: string) {
  return a1 <= b2 && b1 <= a2;
}

export default function Wohnwagen() {
  const { state, setState } = useStore();
  const { user } = useAuth();

  // Calendar nav
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Selection state: pick start, then end, then enter guest name
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const total = daysInMonth(calYear, calMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const dayStr = (day: number) => `${calYear}-${pad(calMonth + 1)}-${pad(day)}`;

  const isBooked = (day: number) => {
    const ds = dayStr(day);
    return state.bookings.some((b) => ds >= b.from && ds <= b.to);
  };

  const getBooking = (day: number) => {
    const ds = dayStr(day);
    return state.bookings.find((b) => ds >= b.from && ds <= b.to);
  };

  const isToday = (day: number) => {
    return day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
  };

  const isInSelection = (day: number) => {
    if (!selStart) return false;
    const ds = dayStr(day);
    if (!selEnd) return ds === selStart;
    const [a, b] = selStart <= selEnd ? [selStart, selEnd] : [selEnd, selStart];
    return ds >= a && ds <= b;
  };

  const isSelStart = (day: number) => selStart === dayStr(day);
  const isSelEnd = (day: number) => selEnd === dayStr(day);

  // Click on a calendar day
  const onDayClick = (day: number) => {
    const ds = dayStr(day);
    if (isBooked(day)) return; // can't select booked days
    setError('');

    if (!selStart || (selStart && selEnd)) {
      // Start new selection
      setSelStart(ds);
      setSelEnd(null);
      setGuestName('');
    } else {
      // Set end date
      const [from, to] = ds >= selStart ? [selStart, ds] : [ds, selStart];
      // Check for conflicts in the range
      const conflict = state.bookings.some((b) => rangesOverlap(b.from, b.to, from, to));
      if (conflict) {
        setError('In diesem Zeitraum ist der Wohnwagen bereits belegt.');
        return;
      }
      setSelStart(from);
      setSelEnd(to);
    }
  };

  const cancelSelection = () => {
    setSelStart(null);
    setSelEnd(null);
    setGuestName('');
    setError('');
  };

  const confirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selStart || !selEnd || !guestName.trim()) return;

    const booking: WohnwagenBooking = {
      id: 'b' + Date.now(),
      guestName: guestName.trim(),
      from: selStart,
      to: selEnd,
      invitedBy: user.id,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, bookings: [...s.bookings, booking] }));
    setSelStart(null);
    setSelEnd(null);
    setGuestName('');
  };

  const removeBooking = (id: string) => {
    setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }));
  };

  const upcoming = [...state.bookings]
    .filter((b) => b.to >= toDateStr(now))
    .sort((a, b) => a.from.localeCompare(b.from));

  // Selection info text
  const selectionInfo = selStart && !selEnd
    ? `Startdatum: ${formatDateDE(selStart)} — wähle jetzt das Enddatum`
    : selStart && selEnd
      ? `${formatDateDE(selStart)} – ${formatDateDE(selEnd)}`
      : null;

  return (
    <>
      <h2 className="page-title">Wohnwagen</h2>
      <div className="page-sub">Gästewohnwagen · Direkt im Kalender buchen</div>

      {/* Calendar */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <button className="btn small ghost" onClick={prevMonth}>‹</button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            {monthNames[calMonth]} {calYear}
          </span>
          <button className="btn small ghost" onClick={nextMonth}>›</button>
        </div>

        {!selStart && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 }}>
            Tippe auf ein Datum um eine Buchung zu starten
          </div>
        )}

        <div className="cal-grid">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
            <div key={d} className="cal-head">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="cal-cell empty" />;
            const booked = isBooked(day);
            const booking = booked ? getBooking(day) : null;
            const today = isToday(day);
            const inSel = isInSelection(day);
            const start = isSelStart(day);
            const end = isSelEnd(day);
            return (
              <div
                key={day}
                className={`cal-cell ${booked ? 'booked' : ''} ${today ? 'today' : ''} ${inSel ? 'selected' : ''} ${start || end ? 'sel-edge' : ''} ${!booked ? 'clickable' : ''}`}
                title={booking ? booking.guestName : 'Frei'}
                onClick={() => !booked && onDayClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="row" style={{ marginTop: 10, gap: 12 }}>
          <div className="row" style={{ gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent-dim)', border: '1px solid var(--accent)' }} />
            <span className="muted" style={{ fontSize: 9, fontFamily: 'var(--mono)' }}>Belegt</span>
          </div>
          <div className="row" style={{ gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--orange-dim)', border: '1px solid var(--orange)' }} />
            <span className="muted" style={{ fontSize: 9, fontFamily: 'var(--mono)' }}>Auswahl</span>
          </div>
          <div className="row" style={{ gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} />
            <span className="muted" style={{ fontSize: 9, fontFamily: 'var(--mono)' }}>Frei</span>
          </div>
        </div>
      </div>

      {/* Selection / booking form */}
      {error && <div className="err" style={{ marginTop: 10 }}>{error}</div>}

      {selStart && (
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--orange)', letterSpacing: 1, marginBottom: 8 }}>
            {selectionInfo}
          </div>

          {selEnd ? (
            <form onSubmit={confirmBooking}>
              <div className="field">
                <label>Name des Gasts</label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  placeholder="Vorname Nachname"
                  autoFocus
                />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" type="submit">Buchen</button>
                <button className="btn ghost" type="button" onClick={cancelSelection}>Abbrechen</button>
              </div>
            </form>
          ) : (
            <button className="btn ghost small" onClick={cancelSelection}>Abbrechen</button>
          )}
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="section-title">Buchungen</div>
      {upcoming.length === 0 && <div className="empty">Keine Buchungen</div>}
      {upcoming.map((b) => {
        const inviter = state.users.find((u) => u.id === b.invitedBy);
        return (
          <div key={b.id} className="list-item">
            <div style={{ flex: 1 }}>
              <div className="title">{b.guestName}</div>
              <div className="meta">
                {formatDateDE(b.from)} – {formatDateDE(b.to)} · Eingeladen von {inviter?.name.split(' ')[0] ?? '?'}
              </div>
            </div>
            <button className="btn small ghost" onClick={() => removeBooking(b.id)} title="Löschen">×</button>
          </div>
        );
      })}
    </>
  );
}
