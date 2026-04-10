import { useAuth, useStore } from '../store';

export default function Profil() {
  const { user, logout } = useAuth();
  const { state, resetAll } = useStore();
  if (!user) return null;
  const wg = state.wgs.find((w) => w.id === user.wgId);
  const wgMates = state.users.filter((u) => u.wgId === user.wgId && u.id !== user.id);

  return (
    <>
      <h2 className="page-title">Profil</h2>
      <div className="page-sub">Konto & Einstellungen</div>

      <div className="card iso">
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: user.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--mono)',
              fontWeight: 700,
              color: '#0e0d0b',
              fontSize: 18,
            }}
          >
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h3>{user.name}</h3>
            <div className="muted">{user.email}</div>
            <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
              <span className="tag">{wg?.name}</span>
              <span className={`tag ${user.role === 'admin' ? '' : 'gray'}`}>
                {user.role === 'admin' ? 'Admin' : 'Bewohner:in'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">Meine WG</div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>{wg?.name}</h3>
        {wgMates.map((u) => (
          <div key={u.id} className="row" style={{ padding: '6px 0', gap: 10 }}>
            <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: u.color }} />
            <span>{u.name}</span>
            {u.role === 'admin' && <span className="tag small" style={{ marginLeft: 'auto' }}>Admin</span>}
          </div>
        ))}
      </div>

      <div className="section-title">Einstellungen</div>
      <div className="card">
        <button
          className="btn ghost"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={() => alert('Push-Benachrichtigungen: kommt mit Backend-Anbindung.')}
        >
          Push-Benachrichtigungen verwalten
        </button>
        <button className="btn ghost" style={{ width: '100%', marginBottom: 10 }} onClick={logout}>
          Abmelden
        </button>
        <button
          className="btn danger"
          style={{ width: '100%' }}
          onClick={() => {
            if (confirm('Alle lokalen Daten zurücksetzen? (Demo-Daten werden neu geladen)')) resetAll();
          }}
        >
          Demo-Daten zurücksetzen
        </button>
      </div>
    </>
  );
}
