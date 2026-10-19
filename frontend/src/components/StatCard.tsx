import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
}

export default function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className={`card stat stat-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
