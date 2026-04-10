import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Karte from './pages/Karte';
import Sitzungen from './pages/Sitzungen';
import SitzungDetail from './pages/SitzungDetail';
import Aufgaben from './pages/Aufgaben';
import Putzplan from './pages/Putzplan';
import Sauna from './pages/Sauna';
import Wohnwagen from './pages/Wohnwagen';
import Profil from './pages/Profil';
import { useAuth } from './store';

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/karte" element={<Karte />} />
        <Route path="/termine" element={<Sitzungen />} />
        <Route path="/termine/:id" element={<SitzungDetail />} />
        <Route path="/aufgaben" element={<Aufgaben />} />
        <Route path="/putzplan" element={<Putzplan />} />
        <Route path="/sauna" element={<Sauna />} />
        <Route path="/wohnwagen" element={<Wohnwagen />} />
        <Route path="/profil" element={<Profil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
