import { useStore, useAuth } from '../store';

export default function Sauna() {
  const { state, setState } = useStore();
  const { user } = useAuth();
  const { sauna } = state;

  const toggleHeating = () => {
    if (!user) return;
    setState((s) => ({
      ...s,
      sauna: sauna.heating
        ? { heating: false, temperature: 22, startedBy: null, startedAt: null }
        : { heating: true, temperature: sauna.temperature, startedBy: user.id, startedAt: new Date().toISOString() },
    }));
  };

  const startedByUser = sauna.startedBy ? state.users.find((u) => u.id === sauna.startedBy) : null;
  const elapsed = sauna.startedAt
    ? Math.floor((Date.now() - new Date(sauna.startedAt).getTime()) / 60000)
    : 0;

  // Mock temperature that rises when heating
  const mockTemp = sauna.heating ? Math.min(95, 22 + elapsed * 3) : sauna.temperature;

  return (
    <>
      <h2 className="page-title">Sauna</h2>
      <div className="page-sub">Status & Temperatur</div>

      <div className={`sauna-status ${sauna.heating ? 'active' : ''}`}>
        <div className="sauna-temp-ring">
          <span className="sauna-temp">{mockTemp}°</span>
          <span className="sauna-unit">C</span>
        </div>
        <div className="sauna-label">
          {sauna.heating ? 'Wird geheizt' : 'Aus'}
        </div>
        {sauna.heating && startedByUser && (
          <div className="sauna-meta">
            Eingeheizt von {startedByUser.name.split(' ')[0]} · vor {elapsed} Min.
          </div>
        )}
      </div>

      <button
        className={`btn ${sauna.heating ? 'danger' : ''}`}
        style={{ width: '100%', marginBottom: 16 }}
        onClick={toggleHeating}
      >
        {sauna.heating ? 'Heizung stoppen' : 'Sauna einheizen'}
      </button>

      {sauna.heating && (
        <div className="card iso">
          <div className="muted" style={{ fontSize: 11, lineHeight: 1.6 }}>
            Alle Bewohner:innen wurden benachrichtigt, dass die Sauna geheizt wird.
            Die Temperatur wird in Echtzeit vom Sensor angezeigt (Sensor-Anbindung noch offen).
          </div>
        </div>
      )}

      <div className="section-title">Info</div>
      <div className="card">
        <div className="muted" style={{ lineHeight: 1.6 }}>
          Die Sauna befindet sich im hinteren Bereich des Geländes.
          Bei Problemen bitte Alain oder Noah kontaktieren.
        </div>
      </div>
    </>
  );
}
