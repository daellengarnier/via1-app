import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, useAuth, currentMonthStr, monthLabel, Aufgabe } from '../store';

type LegendItem = { id: string; name: string; color: string; tag: string };

export default function Karte() {
  const { state, setState } = useStore();
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'offen' | 'meine' | 'erledigt'>('offen');
  const [legend, setLegend] = useState<LegendItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignee, setAssignee] = useState('');
  const [pinX, setPinX] = useState('');
  const [pinZ, setPinZ] = useState('');
  const [pinLabel, setPinLabel] = useState('');

  // Send pins to iframe whenever aufgaben change
  const sendPins = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const pins = state.aufgaben
      .filter((t) => t.pin && !t.done)
      .map((t) => ({ id: t.id, x: t.pin!.x, z: t.pin!.z, label: t.pin!.label || t.title.substring(0, 16) }));
    iframe.contentWindow.postMessage({ type: 'SET_PINS', pins }, '*');
  }, [state.aufgaben]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'LEGEND') setLegend(e.data.legend);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(sendPins, 1000);
    return () => clearTimeout(timer);
  }, [sendPins]);

  const onIframeLoad = () => { setTimeout(sendPins, 500); };

  // Tasks
  const filteredTasks = state.aufgaben.filter((t) => {
    if (taskFilter === 'offen') return !t.done;
    if (taskFilter === 'erledigt') return t.done;
    if (taskFilter === 'meine') return t.assigneeId === user?.id;
    return true;
  });

  const toggleTask = (t: Aufgabe) => {
    setState((st) => ({ ...st, aufgaben: st.aufgaben.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }));
  };

  const removeTask = (t: Aufgabe) => {
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
    setTitle(''); setDesc(''); setAssignee(''); setPinX(''); setPinZ(''); setPinLabel('');
    setShowForm(false);
  };

  // Putzplan
  const current = currentMonthStr();
  const currentAssignment = state.putzplan.find((p) => p.month === current);
  const currentWG = currentAssignment ? state.wgs.find((w) => w.id === currentAssignment.wgId) : null;
  const nextMonths = state.putzplan
    .filter((p) => p.month >= current)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(0, 4);

  return (
    <>
      {/* ── 3D Karte ── */}
      <h2 className="page-title">Gelände</h2>
      <div className="page-sub">3D-Karte · Via 1</div>
      <div className="map-frame">
        <iframe ref={iframeRef} src="/map.html" title="Via1 3D Karte" onLoad={onIframeLoad} />
      </div>

      {/* ── Legende ── */}
      {legend.length > 0 && (
        <>
          <div className="section-title">Legende</div>
          <div className="legend-grid">
            {legend.map((item) => (
              <div key={item.id} className="legend-item">
                <span className="legend-dot" style={{ background: item.color }} />
                <span className="legend-label">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Todos ── */}
      <div className="row between" style={{ marginTop: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Todos ({state.aufgaben.filter((t) => !t.done).length} offen)</div>
        <button className="btn small" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={addTask} style={{ marginTop: 10, marginBottom: 6 }}>
          <div className="field">
            <label>Titel</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Was ist zu tun?" />
          </div>
          <div className="field">
            <label>Beschreibung (optional)</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 60 }} />
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
            <label>Karten-Pin (optional) · X / Z</label>
            <div className="row">
              <input placeholder="X" value={pinX} onChange={(e) => setPinX(e.target.value)} style={{ flex: 1 }} />
              <input placeholder="Z" value={pinZ} onChange={(e) => setPinZ(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="field">
            <label>Pin-Beschriftung</label>
            <input value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} placeholder="z.B. Garten Nordseite" />
          </div>
          <button className="btn" type="submit">Todo anlegen</button>
        </form>
      )}

      <div className="row wrap" style={{ marginTop: 8, marginBottom: 8, gap: 6 }}>
        {(['offen', 'meine', 'erledigt'] as const).map((f) => (
          <button
            key={f}
            className="chip"
            onClick={() => setTaskFilter(f)}
            style={{
              cursor: 'pointer',
              background: taskFilter === f ? 'var(--accent-dim)' : undefined,
              color: taskFilter === f ? 'var(--accent)' : undefined,
              borderColor: taskFilter === f ? 'var(--accent)' : undefined,
              textTransform: 'uppercase',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 && <div className="empty">Keine Todos in dieser Ansicht</div>}

      {filteredTasks.map((t) => {
        const taskAssignee = state.users.find((u) => u.id === t.assigneeId);
        return (
          <div key={t.id} className={`list-item ${t.done ? 'done' : ''}`} style={{ marginTop: 6 }}>
            <div
              className={`check ${t.done ? 'checked' : ''}`}
              onClick={() => toggleTask(t)}
              role="checkbox"
              aria-checked={t.done}
            >
              {t.done ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div className="title">{t.title}</div>
              {t.description && <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>{t.description}</div>}
              <div className="row wrap" style={{ marginTop: 4, gap: 6 }}>
                {taskAssignee && (
                  <span className="chip" style={{ fontSize: 9 }}>
                    <span className="dot" style={{ background: taskAssignee.color }} />
                    {taskAssignee.name.split(' ')[0]}
                  </span>
                )}
                {t.pin && (
                  <span className="chip" style={{ fontSize: 9, color: 'var(--orange)' }}>🚩 {t.pin.label ?? `${t.pin.x}, ${t.pin.z}`}</span>
                )}
              </div>
            </div>
            <button className="btn small ghost" onClick={() => removeTask(t)} title="Löschen">×</button>
          </div>
        );
      })}

      {/* ── Putzplan ── */}
      <div className="section-title" style={{ marginTop: 20 }}>Putzdienst</div>
      <div className="putz-now">
        <div className="label">Aktuell dran</div>
        <div className="wg">{currentWG?.name ?? '—'}</div>
        <div className="month">{monthLabel(current)} · Treppenhaus + Waschküche</div>
      </div>
      {nextMonths.slice(1).map((p) => {
        const wg = state.wgs.find((w) => w.id === p.wgId);
        return (
          <div key={p.month} className="putz-row">
            <span className="m">{monthLabel(p.month)}</span>
            <span>{wg?.name}</span>
          </div>
        );
      })}
    </>
  );
}
