import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHANNELS } from '../constants/channels';
import type { ChannelId, TelemetryEvent } from '../types/rf';

interface MultiBandMonitorProps {
  events: TelemetryEvent[];
  pulseAt: Record<ChannelId, number>;
}

const WINDOW_MS = 6_000;

export const MultiBandMonitor = ({ events, pulseAt }: MultiBandMonitorProps) => {
  const now = Date.now();

  const chartData = useMemo(() => {
    const bins = new Map<number, { t: number; c0: number; c1: number; c2: number; c3: number }>();

    events.forEach((event) => {
      if (now - event.createdAt > WINDOW_MS) {
        return;
      }

      const bucket = Math.floor(event.createdAt / 250) * 250;
      if (!bins.has(bucket)) {
        bins.set(bucket, { t: bucket, c0: 0, c1: 0, c2: 0, c3: 0 });
      }

      const row = bins.get(bucket)!;
      row[`c${event.channelId}` as 'c0' | 'c1' | 'c2' | 'c3'] += 1;
    });

    return [...bins.values()].sort((a, b) => a.t - b.t);
  }, [events, now]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">Real-Time Multi-Band Waterfall & Activity</h2>

      <div className="mb-4 grid gap-2">
        {CHANNELS.map((channel) => {
          const hot = now - pulseAt[channel.id] < 220;
          return (
            <div key={channel.id} className="flex items-center gap-3 rounded-lg border border-slate-800 p-2 text-sm">
              <span className="inline-flex w-42 items-center gap-2 text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                {channel.label}
              </span>
              <div className="h-2 flex-1 rounded bg-slate-800">
                <div
                  className="h-2 rounded transition-all duration-150"
                  style={{
                    width: hot ? '100%' : '5%',
                    backgroundColor: channel.color,
                    opacity: hot ? 1 : 0.25,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-56 w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="t" hide />
            <YAxis allowDecimals={false} stroke="#64748b" />
            <Tooltip
              contentStyle={{ background: '#020617', border: '1px solid #334155' }}
              formatter={(value) => [`${value} pulses`, 'Count']}
              labelFormatter={() => 'Recent activity'}
            />
            {CHANNELS.map((channel) => (
              <Line
                key={channel.id}
                dot={false}
                strokeWidth={2}
                type="monotone"
                dataKey={`c${channel.id}`}
                stroke={channel.color}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
