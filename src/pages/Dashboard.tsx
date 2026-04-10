import { Link } from 'react-router-dom';
import { useStore, useAuth, currentMonthStr, monthLabel } from '../store';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const { state } = useStore();
  const { user } = useAuth();
  if (!user) return null;

  const nextSitzung = [...state.sitzungen]
    .filter((s) => new Date(s.date).getTime() >= Date.now() - 1000 * 60 * 60 * 6)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const openTasks = state.aufgaben.filter((t) => !t.done);
  const myTasks = openTasks.filter((t) => t.assigneeId === user.id);

  const month = currentMonthStr();
  const putzNow = state.putzplan.find((p) => p.month === month);
  const putzWG = putzNow ? state.wgs.find((w) => w.id === putzNow.wgId) : null;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend';

  // Sauna
  const { sauna } = state;
  const saunaElapsed = sauna.startedAt ? Math.floor((Date.now() - new Date(sauna.startedAt).getTime()) / 60000) : 0;
  const saunaTemp = sauna.heating ? Math.min(95, 22 + saunaElapsed * 3) : sauna.temperature;

  // Wohnwagen
  const today = todayStr();
  const currentBooking = state.bookings.find((b) => today >= b.from && today <= b.to);
  const nextBooking = state.bookings
    .filter((b) => b.from > today)
    .sort((a, b) => a.from.localeCompare(b.from))[0];

  return (
    <>
      <section className="hero">
        <div className="greeting">{greeting}</div>
        <div className="name">{user.name.split(' ')[0]}</div>
        <div className="wg">{state.wgs.find((w) => w.id === user.wgId)?.name}</div>
      </section>

      <div className="section-title">Nächster Termin</div>
      {nextSitzung ? (
        <Link to={`/termine/${nextSitzung.id}`} className="card iso">
          <h3>{nextSitzung.title}</h3>
          <div className="muted">{formatDate(nextSitzung.date)}</div>
          <div className="muted">{nextSitzung.location}</div>
          <div className="row wrap" style={{ marginTop: 10, gap: 4 }}>
            <span className="tag gray">
              {nextSitzung.type === 'haussitzung' ? '🏠 Haussitzung' : nextSitzung.type === 'hausessen' ? '🍽 Hausessen' : '📌 Termin'}
            </span>
            {nextSitzung.withMeal && <span className="tag">🍽 Essen</span>}
            {nextSitzung.agenda.length > 0 && <span className="tag gray">{nextSitzung.agenda.length} Trakt.</span>}
          </div>
        </Link>
      ) : (
        <div className="card"><div className="muted">Kein anstehender Termin.</div></div>
      )}

      {/* Mini widgets row */}
      <div className="dash-widgets">
        <Link to="/sauna" className="card dash-widget">
          <div className="dash-widget-icon">{sauna.heating ? '🔥' : '♨'}</div>
          <div>
            <h3>Sauna</h3>
            <div className="muted">{sauna.heating ? `${saunaTemp}°C · heizt` : 'Aus'}</div>
          </div>
        </Link>
        <Link to="/wohnwagen" className="card dash-widget">
          <div className="dash-widget-icon">{currentBooking ? '🔴' : '🟢'}</div>
          <div>
            <h3>Wohnwagen</h3>
            <div className="muted">
              {currentBooking
                ? `Belegt · ${currentBooking.guestName}`
                : nextBooking
                  ? `Frei · nächste ${formatDateShort(nextBooking.from)}`
                  : 'Frei'}
            </div>
          </div>
        </Link>
      </div>

      <div className="section-title">Putzdienst diesen Monat</div>
      <div className="card iso">
        <div className="row between">
          <div>
            <h3>{putzWG?.name ?? '—'}</h3>
            <div className="muted">{monthLabel(month)} · Treppenhaus + Waschküche</div>
          </div>
          <Link to="/karte" className="tag">Karte ›</Link>
        </div>
      </div>

      {myTasks.length > 0 && (
        <>
          <div className="section-title">Deine Todos ({myTasks.length})</div>
          {myTasks.slice(0, 3).map((t) => (
            <div key={t.id} className="card" style={{ marginBottom: 6 }}>
              <div className="muted">· {t.title}</div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
