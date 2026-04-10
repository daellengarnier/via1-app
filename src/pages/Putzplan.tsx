import { useStore, currentMonthStr, monthLabel } from '../store';

export default function Putzplan() {
  const { state } = useStore();
  const current = currentMonthStr();
  const currentAssignment = state.putzplan.find((p) => p.month === current);
  const currentWG = currentAssignment ? state.wgs.find((w) => w.id === currentAssignment.wgId) : null;

  const sorted = [...state.putzplan].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <>
      <h2 className="page-title">Putzplan</h2>
      <div className="page-sub">Treppenhaus + Waschküche · monatlich rotierend</div>

      <div className="putz-now">
        <div className="label">Aktuell dran</div>
        <div className="wg">{currentWG?.name ?? '—'}</div>
        <div className="month">{monthLabel(current)}</div>
      </div>

      <div className="section-title">Rotation</div>
      {sorted.map((p) => {
        const wg = state.wgs.find((w) => w.id === p.wgId);
        const isCurrent = p.month === current;
        const isPast = p.month < current;
        return (
          <div key={p.month} className={`putz-row ${isCurrent ? 'current' : ''}`}>
            <span className="m" style={{ opacity: isPast ? 0.4 : 1 }}>{monthLabel(p.month)}</span>
            <span style={{ color: isCurrent ? 'var(--accent)' : isPast ? 'var(--muted-2)' : 'var(--text)' }}>
              {wg?.name}
            </span>
          </div>
        );
      })}
    </>
  );
}
