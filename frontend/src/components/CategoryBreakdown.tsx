import { formatMoney } from '../utils/format';

interface Row {
  name: string;
  total: number;
  count?: number;
}

export default function CategoryBreakdown({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  if (rows.length === 0) return <p className="muted">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const sum = rows.reduce((s, r) => s + r.total, 0);

  return (
    <ul className="breakdown">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="breakdown-head">
            <span>{r.name}</span>
            <span>
              {formatMoney(r.total)} <small className="muted">{sum > 0 ? Math.round((r.total / sum) * 100) : 0}%</small>
            </span>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
