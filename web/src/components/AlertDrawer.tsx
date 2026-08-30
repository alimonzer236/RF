import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { nsToFriendly } from '../utils/time';
import type { CorrelationAlert } from '../types/rf';

interface AlertDrawerProps {
  alerts: CorrelationAlert[];
  onClear: () => void;
}

const severityClass: Record<CorrelationAlert['severity'], string> = {
  high: 'border-rose-500/70 bg-rose-500/15 text-rose-100',
  medium: 'border-amber-400/70 bg-amber-400/15 text-amber-100',
  low: 'border-cyan-500/70 bg-cyan-500/15 text-cyan-100',
};

export const AlertDrawer = ({ alerts, onClear }: AlertDrawerProps) => (
  <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
        <ShieldAlert size={18} /> Real-time Correlation Alerts
      </h2>
      <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-200">
        Clear
      </button>
    </div>

    <div className="max-h-72 space-y-2 overflow-auto pr-1">
      {alerts.length === 0 && <p className="text-sm text-slate-400">No active alerts. Monitoring all enabled channels.</p>}
      {alerts.map((alert) => (
        <article key={alert.id} className={`rounded-md border px-3 py-2 text-sm ${severityClass[alert.severity]}`}>
          <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide">
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={14} /> {alert.severity}
            </span>
            <span>Tick {alert.atTick}</span>
          </div>
          <p>Bands: Ch{alert.channels[0]} ↔ Ch{alert.channels[1]}</p>
          <p>Δt: {nsToFriendly(alert.deltaNs)}</p>
          <p className="text-xs opacity-90">{alert.reason}</p>
        </article>
      ))}
    </div>
  </section>
);
