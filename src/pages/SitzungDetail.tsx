import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useStore, useAuth, MealSignup } from '../store';

export default function SitzungDetail() {
  const { id } = useParams();
  const { state, setState } = useStore();
  const { user } = useAuth();
  const nav = useNavigate();
  const sitzung = state.sitzungen.find((s) => s.id === id);
  const [newTrakt, setNewTrakt] = useState('');
  const [showMealExtras, setShowMealExtras] = useState(false);
  const [mealKids, setMealKids] = useState(0);
  const [mealGuest, setMealGuest] = useState('');

  if (!sitzung) {
    return (
      <>
        <Link to="/termine" className="tag gray">‹ Zurück</Link>
        <div className="empty">Termin nicht gefunden</div>
      </>
    );
  }

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || sitzung.createdBy === user?.id;

  const updateSitzung = (patch: Partial<typeof sitzung>) => {
    setState((st) => ({
      ...st,
      sitzungen: st.sitzungen.map((s) => (s.id === sitzung.id ? { ...s, ...patch } : s)),
    }));
  };

  const addTraktandum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrakt.trim()) return;
    updateSitzung({ agenda: [...sitzung.agenda, { id: 'a' + Date.now(), text: newTrakt.trim() }] });
    setNewTrakt('');
  };

  const removeTraktandum = (aid: string) => {
    updateSitzung({
      agenda: sitzung.agenda.filter((a) => a.id !== aid),
      protocolNotes: sitzung.protocolNotes.filter((n) => n.agendaId !== aid),
    });
  };

  const toggleAttendee = (uid: string) => {
    const att = sitzung.attendees.includes(uid)
      ? sitzung.attendees.filter((a) => a !== uid)
      : [...sitzung.attendees, uid];
    updateSitzung({ attendees: att });
  };

  const updateNote = (agendaId: string, note: string) => {
    const existing = sitzung.protocolNotes.find((n) => n.agendaId === agendaId);
    const notes = existing
      ? sitzung.protocolNotes.map((n) => (n.agendaId === agendaId ? { ...n, note } : n))
      : [...sitzung.protocolNotes, { agendaId, note }];
    updateSitzung({ protocolNotes: notes });
  };

  // Meal: simple "Ich bin dabei" signup
  const mySignup = sitzung.mealSignups.find((m) => m.userId === user?.id);

  const joinMeal = () => {
    if (!user) return;
    const signup: MealSignup = {
      userId: user.id,
      adults: 1,
      kids: mealKids,
      guestName: mealGuest.trim() || undefined,
    };
    updateSitzung({ mealSignups: [...sitzung.mealSignups.filter((m) => m.userId !== user.id), signup] });
    setShowMealExtras(false);
    setMealKids(0);
    setMealGuest('');
  };

  const leaveMeal = () => {
    if (!user) return;
    updateSitzung({ mealSignups: sitzung.mealSignups.filter((m) => m.userId !== user.id) });
  };

  const totalAdults = sitzung.mealSignups.reduce((s, m) => s + m.adults, 0);
  const totalKids = sitzung.mealSignups.reduce((s, m) => s + m.kids, 0);
  const totalGuests = sitzung.mealSignups.filter((m) => m.guestName).length;
  const totalAll = totalAdults + totalKids + totalGuests;

  const deleteSitzung = () => {
    if (!confirm('Termin wirklich löschen?')) return;
    setState((st) => ({ ...st, sitzungen: st.sitzungen.filter((s) => s.id !== sitzung.id) }));
    nav('/termine', { replace: true });
  };

  const exportPDF = () => {
    alert('PDF-Export kommt mit der Backend-Anbindung.');
  };

  const d = new Date(sitzung.date);
  const dateStr = d.toLocaleDateString('de-CH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  const orgWg = sitzung.organizedByWg ? state.wgs.find((w) => w.id === sitzung.organizedByWg) : null;

  const wgsWithUsers = state.wgs.map((wg) => ({
    ...wg,
    users: state.users.filter((u) => u.wgId === wg.id),
  }));

  const typeLabels = { haussitzung: '🏠 Haussitzung', hausessen: '🍽 Hausessen', andere: '📌 Termin' };

  return (
    <>
      <Link to="/termine" className="tag gray">‹ Termine</Link>
      <h2 className="page-title" style={{ marginTop: 10 }}>{sitzung.title}</h2>
      <div className="page-sub">{dateStr} · {timeStr} · {sitzung.location}</div>
      <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
        <span className="tag gray">{typeLabels[sitzung.type]}</span>
        {sitzung.withMeal && <span className="tag">🍽 mit Essen</span>}
        {orgWg && <span className="tag gray">Org: {orgWg.name}</span>}
      </div>

      {/* ── Essen ── */}
      {sitzung.withMeal && (
        <>
          <div className="section-title">
            Essen {sitzung.mealTime ? `· ${sitzung.mealTime} Uhr` : ''}
          </div>

          {sitzung.mealMenu && (
            <div className="card iso" style={{ marginBottom: 10 }}>
              <h3 style={{ color: 'var(--orange)' }}>Menü</h3>
              <div className="muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{sitzung.mealMenu}</div>
            </div>
          )}

          {/* Ich bin dabei / Abmelden */}
          <div className="card" style={{ marginBottom: 10 }}>
            {mySignup ? (
              <div>
                <div className="row between">
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 1 }}>
                    ✓ Du bist dabei
                  </div>
                  <button className="btn ghost small" onClick={leaveMeal}>Abmelden</button>
                </div>
                {(mySignup.kids > 0 || mySignup.guestName) && (
                  <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>
                    {mySignup.kids > 0 ? `${mySignup.kids} Kind${mySignup.kids > 1 ? 'er' : ''}` : ''}
                    {mySignup.kids > 0 && mySignup.guestName ? ' · ' : ''}
                    {mySignup.guestName ? `Gast: ${mySignup.guestName}` : ''}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button className="btn" style={{ width: '100%' }} onClick={showMealExtras ? joinMeal : () => joinMeal()}>
                  Ich bin dabei
                </button>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => setShowMealExtras((s) => !s)}
                    style={{ fontSize: 9 }}
                  >
                    {showMealExtras ? 'Weniger' : 'Kinder / Gast hinzufügen'}
                  </button>
                </div>
                {showMealExtras && (
                  <div style={{ marginTop: 10 }}>
                    <div className="row" style={{ gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Kinder</div>
                        <div className="row" style={{ gap: 6 }}>
                          <button type="button" className="btn small ghost" onClick={() => setMealKids(Math.max(0, mealKids - 1))}>−</button>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{mealKids}</span>
                          <button type="button" className="btn small ghost" onClick={() => setMealKids(mealKids + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <label>Gast mitbringen (optional)</label>
                      <input value={mealGuest} onChange={(e) => setMealGuest(e.target.value)} placeholder="Name des Gasts" />
                    </div>
                    <button className="btn" style={{ width: '100%' }} onClick={joinMeal}>
                      Anmelden mit Details
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Anmeldungsliste */}
          {sitzung.mealSignups.length > 0 && (
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                {totalAll} angemeldet ({totalAdults} Erw.{totalKids > 0 ? ` · ${totalKids} Kinder` : ''}{totalGuests > 0 ? ` · ${totalGuests} Gäste` : ''})
              </div>
              {sitzung.mealSignups.map((m) => {
                const u = state.users.find((x) => x.id === m.userId);
                if (!u) return null;
                return (
                  <div key={m.userId} className="row" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                    <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>
                      {u.name.split(' ')[0]}
                      {m.kids > 0 && <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>+ {m.kids} Kind{m.kids > 1 ? 'er' : ''}</span>}
                    </span>
                    {m.guestName && (
                      <span className="chip" style={{ fontSize: 8 }}>+ {m.guestName}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Anwesenheit (nur bei Haussitzung) ── */}
      {sitzung.type === 'haussitzung' && (
        <>
          <div className="section-title">Anwesenheit ({sitzung.attendees.length})</div>
          <div className="card">
            {wgsWithUsers.map((wg) => (
              <div key={wg.id} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>
                  {wg.name}
                </div>
                <div className="row wrap" style={{ gap: 6 }}>
                  {wg.users.map((u) => {
                    const present = sitzung.attendees.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        className="chip"
                        onClick={() => toggleAttendee(u.id)}
                        style={{
                          cursor: 'pointer',
                          background: present ? 'var(--accent-dim)' : undefined,
                          color: present ? 'var(--accent)' : undefined,
                          borderColor: present ? 'var(--accent)' : undefined,
                          border: present ? '1px solid var(--accent)' : undefined,
                        }}
                      >
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: u.color }} />
                        {u.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Traktandenliste (Haussitzung oder wenn Traktanden vorhanden) ── */}
      {(sitzung.type === 'haussitzung' || sitzung.agenda.length > 0) && (
        <>
          <div className="section-title">Traktandenliste</div>
          <div className="card">
            {sitzung.agenda.length === 0 && <div className="muted" style={{ marginBottom: 8 }}>Noch keine Traktanden.</div>}
            {sitzung.agenda.map((a, i) => {
              const note = sitzung.protocolNotes.find((n) => n.agendaId === a.id)?.note || '';
              return (
                <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="row between">
                    <div>
                      <span className="tag gray" style={{ marginRight: 8 }}>{i + 1}</span>
                      {a.text}
                    </div>
                    {canEdit && <button className="btn small ghost" onClick={() => removeTraktandum(a.id)}>×</button>}
                  </div>
                  {canEdit && (
                    <textarea
                      style={{
                        width: '100%', marginTop: 6, minHeight: 50,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: 8, color: 'var(--text)',
                        fontFamily: 'var(--sans)', fontSize: 12, resize: 'vertical',
                      }}
                      placeholder="Notizen…"
                      value={note}
                      onChange={(e) => updateNote(a.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
            {canEdit && (
              <form onSubmit={addTraktandum} className="row" style={{ marginTop: 12 }}>
                <input
                  style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  value={newTrakt}
                  onChange={(e) => setNewTrakt(e.target.value)}
                  placeholder="Neues Traktandum…"
                />
                <button className="btn small" type="submit">+</button>
              </form>
            )}
          </div>
        </>
      )}

      {/* ── Notizen ── */}
      <div className="section-title">Allgemeine Notizen</div>
      <div className="card">
        {canEdit ? (
          <textarea
            style={{
              width: '100%', minHeight: 100, background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)', borderRadius: 8, padding: 12,
              color: 'var(--text)', fontFamily: 'var(--sans)', resize: 'vertical',
            }}
            placeholder="Weitere Notizen…"
            value={sitzung.protocol}
            onChange={(e) => updateSitzung({ protocol: e.target.value })}
          />
        ) : (
          <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>
            {sitzung.protocol || '— keine Notizen —'}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="row wrap" style={{ marginTop: 16, gap: 8 }}>
        <button className="btn small" onClick={exportPDF}>PDF exportieren</button>
        {canEdit && <button className="btn danger small" onClick={deleteSitzung}>Termin löschen</button>}
      </div>
    </>
  );
}
