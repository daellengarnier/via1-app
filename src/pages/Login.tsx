import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('alain@via1.ch');
  const [password, setPassword] = useState('via1');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) setError(res.error ?? 'Login fehlgeschlagen');
    else nav('/', { replace: true });
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Via 1</h1>
        <div className="sub">Organisations-App</div>
        {error && <div className="err">{error}</div>}
        <div className="field">
          <label>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label>Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn" type="submit" style={{ width: '100%' }}>
          Anmelden
        </button>
        <div className="login-hint">
          Prototyp · Demo-Logins:<br />
          alain@via1.ch · noah@via1.ch · luca@via1.ch · …<br />
          Passwort für alle: <strong>via1</strong>
        </div>
      </form>
    </div>
  );
}
