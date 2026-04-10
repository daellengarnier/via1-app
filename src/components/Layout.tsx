import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth, useCurrentWG } from '../store';

export default function Layout() {
  const { user } = useAuth();
  const wg = useCurrentWG();

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Via 1</h1>
          <div className="sub">Via Felsenau · Bern</div>
        </div>
        <Link to="/profil" className="me">
          <strong>{user?.name.split(' ')[0]}</strong>
          {wg?.name}
        </Link>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="nav">
        <NavLink to="/" end>
          <span className="dot" />
          Home
        </NavLink>
        <NavLink to="/karte">
          <span className="dot" />
          Karte
        </NavLink>
        <NavLink to="/termine">
          <span className="dot" />
          Termine
        </NavLink>
        <NavLink to="/sauna">
          <span className="dot" />
          Sauna
        </NavLink>
        <NavLink to="/wohnwagen">
          <span className="dot" />
          Gäste
        </NavLink>
      </nav>
    </div>
  );
}
