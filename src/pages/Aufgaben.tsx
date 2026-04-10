import { useState } from 'react';
import { useStore, useAuth, Aufgabe } from '../store';

export default function Aufgaben() {
  const { state, setState } = useStore();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignee, setAssignee] = useState('');
  const [pinX, setPinX] = useState('');
  const [pinZ, setPinZ] = useState('');
  const [pinLabel, setPinLabel] = useState('');
  const [filter, setFilter] = useState<'alle' | 'offen' | 'meine' | 'erledigt'>('offen');

  const list = state.aufgaben.filter((t) => {
    if (filter === 'offen') return !t.done;
    if (filter === 'erledigt') return t.done;
    if (filter === 'meine') return t.assigneeId === user?.id;
    return true;
  });

  const toggle = (t: Aufgabe) => {
    setState((st) => ({ ...st, aufgaben: st.aufgaben.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }));
  };

  const remove = (t: Aufgabe) => {
    setState((st) => ({ ...st, aufgaben: st.aufgaben.filter((x) => x.id !== t.id) }));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const pin = pinX && pinZ ? { x: parseFloat(pinX), z: parseFloat(pinZ), label: pinLabel || undefined } : undefined;
    const t: Aufgabe = {
      id: 't' + Date.now(),
      title: title.trim(),
      description: desc.trim() || undefined,
      assigneeId: assignee || undefined,
      done: false,
      pin,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    setState((st) => ({ ...st, aufgaben: [t, ...st.aufgaben] }));
    setTitle('');
    setDesc('');
    setAssignee('');
    setPinX('');
    setPinZ('');
    setPinLabel('');
    setShowForm(false);
  };

  return (
    <>
      <div className="row between" style={{ margin: '8px 0 4px' }}>
        <h2 className="page-title">Aufgaben</h2>
        <button className="btn small" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>
      <div className="page-sub">To-dos rund um die Via 1</div>

      <div className="row wrap" style={{ marginBottom: 14, gap: 6 }}>
        {(['offen', 'meine', 'erledigt', 'alle'] as const).map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{
              cursor: 'pointer',
              background: filter === f ? 'var(--accent-dim)' : undefined,
              color: filter === f ? 'var(--accent)' : undefined,
              borderColor: filter === f ? 'var(--accent)' : undefined,
              textTransform: 'uppercase',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="card" onSubmit={addTask} style={{ marginBottom: 14 }}>
          <div className="field">
            <label>Titel</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Was ist zu tun?" />
          </div>
          <div className="field">
            <label>Beschreibung (optional)</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="field">
            <label>Zuweisen an</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">— niemand —</option>
              {state.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({state.wgs.find((w) => w.id === u.wgId)?.name})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Karten-Pin (optional) · Koordinaten X / Z (Meter)</label>
            <div className="row">
              <input placeholder="X" value={pinX} onChange={(e) => setPinX(e.target.value)} style={{ flex: 1 }} />
              <input placeholder="Z" value={pinZ} onChange={(e) => setPinZ(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="field">
            <label>Pin-Beschriftung</label>
            <input value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} placeholder="z. B. Garten Nordseite" />
          </div>
          <button className="btn" type="submit">Aufgabe anlegen</button>
        </form>
      )}

      {list.length === 0 && <div className="empty">Keine Aufgaben in dieser Ansicht</div>}

      {list.map((t) => {
        const assignee = state.users.find((u) => u.id === t.assigneeId);
        return (
          <div key={t.id} className={`list-item ${t.done ? 'done' : ''}`}>
            <div
              className={`check ${t.done ? 'checked' : ''}`}
              onClick={() => toggle(t)}
              role="checkbox"
              aria-checked={t.done}
            >
              {t.done ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div className="title">{t.title}</div>
              {t.description && <div className="muted" style={{ marginTop: 2 }}>{t.description}</div>}
              <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                {assignee && (
                  <span className="chip">
                    <span className="dot" style={{ background: assignee.color }} />
                    {assignee.name.split(' ')[0]}
                  </span>
                )}
                {t.pin && (
                  <span className="chip">
                    📍 {t.pin.label ?? `${t.pin.x}, ${t.pin.z}`}
                  </span>
                )}
              </div>
            </div>
            <button className="btn small ghost" onClick={() => remove(t)} title="Löschen">×</button>
          </div>
        );
      })}
    </>
  );
}
