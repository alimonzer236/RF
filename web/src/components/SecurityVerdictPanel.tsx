import { Radar } from 'lucide-react';
import type { SecurityVerdict } from '../types/rf';

interface SecurityVerdictPanelProps {
  verdict: SecurityVerdict;
}

const riskColor: Record<SecurityVerdict['replayLikelihood'], string> = {
  Low: 'text-emerald-300',
  Medium: 'text-amber-300',
  High: 'text-rose-300',
};

export const SecurityVerdictPanel = ({ verdict }: SecurityVerdictPanelProps) => (
  <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-100">
      <Radar size={18} /> RF Attack & Security Verdict
    </h2>

    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <h3 className="mb-1 text-slate-300">Replay vs Rolling Code Classifier</h3>
        <p>Replay likelihood: <span className={`font-semibold ${riskColor[verdict.replayLikelihood]}`}>{verdict.replayLikelihood}</span></p>
        <p>
          Rolling-code likelihood: <span className="font-semibold text-cyan-200">{verdict.rollingCodeLikelihood}</span>
        </p>
      </article>
      <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <h3 className="mb-1 text-slate-300">Attack Detection Alerts</h3>
        <p>Jam-then-Replay: <span className={verdict.jamReplayDetected ? 'text-rose-300' : 'text-emerald-300'}>{verdict.jamReplayDetected ? 'Detected' : 'Not detected'}</span></p>
        <p>Multi-band hopping: <span className={verdict.hoppingDetected ? 'text-amber-300' : 'text-emerald-300'}>{verdict.hoppingDetected ? 'Detected' : 'Not detected'}</span></p>
      </article>
    </div>
  </section>
);
