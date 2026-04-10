import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore, useAuth, Sitzung, TerminType } from '../store';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toInputDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const TYPE_LABELS: Record<TerminType, string> = {
  haussitzung: '🏠 Haussitzung',
  hausessen: '🍽 Hausessen',
  andere: '📌 Termin',
};

export default function Sitzungen() {
  const { state, setState } = useStore();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [terminType, setTerminType] = useState<TerminType>('haussitzung');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toInputDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()));
  const [location, setLocation] = useState('Kulturspinnerei-Saal');
  const [withMeal, setWithMeal] = useState(false);
  const [mealTime, setMealTime] = useState('18:30');
  const [organizedByWg, setOrganizedByWg] = useState('');
  const [mealMenu, setMealMenu] = useState('');

  const sorted = [...state.sitzungen].sort((a, b) => b.date.localeCompare(a.date));

  const onTypeChange = (t: TerminType) => {
    setTerminType(t);
    const nextMonth = MONTH_NAMES[new Date(date).getMonth()];
    if (t === 'haussitzung') {
      setTitle(`Haussitzung ${nextMonth}`);
      setLocation('Kulturspinnerei-Saal');
      setWithMeal(false);
      setMealTime('18:30');
    } else if (t === 'hausessen') {
      setTitle(`Hausessen ${nextMonth}`);
      setLocation('Glaspyramide');
      setWithMeal(true);
      setMealTime('19:00');
    } else {
      setTitle('');
      setLocation('');
      setWithMeal(false);
    }
  };

  const addSitzung = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const hasMeal = terminType === 'hausessen' ? true : withMeal;
    const s: Sitzung = {
      id: 's' + Date.now(),
      title: title.trim(),
      date: new Date(date).toISOString(),
      location: location.trim(),
      type: terminType,
      withMeal: hasMeal,
      mealTime: hasMeal ? mealTime : undefined,
      mealMenu: terminType === 'hausessen' ? mealMenu.trim() || undefined : undefined,
      mealSignups: [],
      organizedByWg: (terminType === 'haussitzung' || terminType === 'hausessen') && organizedByWg ? organizedByWg : undefined,
      agenda: [],
      protocol: '',
      attendees: [],
      protocolNotes: [],
      decisions: [],
      nextSteps: [],
      createdBy: user.id,
    };
    setState((st) => ({ ...st, sitzungen: [s, ...st.sitzungen] }));
    setTitle(''); setMealMenu('');
    setShowForm(false);
  };

  return (
    <>
      <div className="row between" style={{ margin: '8px 0 4px' }}>
        <h2 className="page-title">Termine</h2>
        <button className="btn small" onClick={() => { setShowForm((s) => !s); if (!showForm) onTypeChange('haussitzung'); }}>
          {showForm ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>
      <div className="page-sub">Haussitzungen, Hausessen & mehr</div>

      {showForm && (
        <form className="card" onSubmit={addSitzung} style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Typ</label>
            <div className="row wrap" style={{ gap: 6 }}>
              {(['haussitzung', 'hausessen', 'andere'] as TerminType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  onClick={() => onTypeChange(t)}
                  style={{
                    cursor: 'pointer',
                    flex: 1,
                    justifyContent: 'center',
                    background: terminType === t ? 'var(--accent-dim)' : undefined,
                    color: terminType === t ? 'var(--accent)' : undefined,
                    borderColor: terminType === t ? 'var(--accent)' : undefined,
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Titel</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={terminType === 'andere' ? 'z.B. Klempner kommt' : undefined} />
          </div>
          <div className="field">
            <label>Datum & Zeit</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Ort</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder={terminType === 'andere' ? 'z.B. Waschküche' : undefined} />
          </div>

          {/* Haussitzung: Essen optional */}
          {terminType === 'haussitzung' && (
            <>
              <div className="row" style={{ gap: 8, margin: '8px 0 12px' }}>
                <button type="button" className={`check ${withMeal ? 'checked' : ''}`} onClick={() => setWithMeal(!withMeal)} style={{ width: 20, height: 20 }}>
                  {withMeal ? '✓' : ''}
                </button>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 0.5 }}>Mit Abendessen</span>
              </div>
              {withMeal && (
                <>
                  <div className="field">
                    <label>Essenszeit</label>
                    <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Organisiert von WG</label>
                    <select value={organizedByWg} onChange={(e) => setOrganizedByWg(e.target.value)}>
                      <option value="">— wählen —</option>
                      {state.wgs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          {/* Hausessen: Essen immer, Menü + org WG */}
          {terminType === 'hausessen' && (
            <>
              <div className="field">
                <label>Essenszeit</label>
                <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
              </div>
              <div className="field">
                <label>Organisiert von WG</label>
                <select value={organizedByWg} onChange={(e) => setOrganizedByWg(e.target.value)}>
                  <option value="">— wählen —</option>
                  {state.wgs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Menü (optional)</label>
                <textarea value={mealMenu} onChange={(e) => setMealMenu(e.target.value)} placeholder="Was gibt's zu essen?" style={{ minHeight: 60 }} />
              </div>
            </>
          )}

          <button className="btn" type="submit">Termin anlegen</button>
        </form>
      )}

      {sorted.length === 0 && <div className="empty">Noch keine Termine</div>}

      {sorted.map((s) => {
        const upcoming = new Date(s.date).getTime() >= Date.now() - 1000 * 60 * 60 * 6;
        const totalMeal = s.mealSignups.reduce((sum, m) => sum + m.adults + m.kids + (m.guestName ? 1 : 0), 0);
        return (
          <Link key={s.id} to={`/termine/${s.id}`} className="list-item">
            <div style={{ flex: 1 }}>
              <div className="title">{s.title}</div>
              <div className="meta">
                {formatDate(s.date)} · {s.location}
              </div>
              <div className="row wrap" style={{ marginTop: 6, gap: 4 }}>
                <span className="tag gray">{TYPE_LABELS[s.type]}</span>
                {s.withMeal && <span className="tag">🍽 Essen{totalMeal > 0 ? ` (${totalMeal})` : ''}</span>}
                {s.agenda.length > 0 && <span className="tag gray">{s.agenda.length} Trakt.</span>}
                {upcoming && <span className="tag">bevorstehend</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
