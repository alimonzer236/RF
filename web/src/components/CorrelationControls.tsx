import { CHANNELS } from '../constants/channels';
import { nsToFriendly } from '../utils/time';
import type { ChannelId } from '../types/rf';

interface CorrelationControlsProps {
  correlationWindowNs: number;
  channelMask: Record<ChannelId, boolean>;
  onWindowChange: (value: number) => void;
  onToggleChannel: (channelId: ChannelId) => void;
}

export const CorrelationControls = ({
  correlationWindowNs,
  channelMask,
  onWindowChange,
  onToggleChannel,
}: CorrelationControlsProps) => (
  <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
    <h2 className="mb-3 text-lg font-semibold text-slate-100">Correlation Engine & Controls</h2>

    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>Correlation window N</span>
        <span className="font-semibold text-cyan-300">{nsToFriendly(correlationWindowNs)}</span>
      </div>
      <input
        type="range"
        min={10}
        max={10_000_000}
        step={10}
        value={correlationWindowNs}
        onChange={(event) => onWindowChange(Number(event.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>

    <div className="grid gap-2 sm:grid-cols-2">
      {CHANNELS.map((channel) => {
        const active = channelMask[channel.id];
        return (
          <button
            key={channel.id}
            onClick={() => onToggleChannel(channel.id)}
            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
              active
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
            }`}
          >
            Ch{channel.id} — {channel.label}
          </button>
        );
      })}
    </div>
  </section>
);
