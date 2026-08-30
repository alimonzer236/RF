import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { CHANNELS } from '../constants/channels';
import type { TelemetryEvent } from '../types/rf';

interface LogViewerExportHubProps {
  events: TelemetryEvent[];
}

const channelLabel = (id: number) => CHANNELS.find((channel) => channel.id === id)?.label ?? `Channel ${id}`;

const downloadFile = (name: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const LogViewerExportHub = ({ events }: LogViewerExportHubProps) => {
  const recent = [...events].reverse().slice(0, 150);

  const exportJson = () => {
    downloadFile(
      `rf-events-${new Date().toISOString()}.json`,
      JSON.stringify(
        recent.map((event) => ({
          ...event,
          channel: channelLabel(event.channelId),
        })),
        null,
        2,
      ),
      'application/json',
    );
  };

  const exportCsv = () => {
    const header = ['id', 'channelId', 'channelLabel', 'edgeDirection', 'timestampTick', 'timestampNs', 'rssi', 'correlated'];
    const rows = recent.map((event) =>
      [
        event.id,
        event.channelId,
        channelLabel(event.channelId),
        event.edgeDirection,
        event.timestampTick,
        event.timestampNs,
        event.rssi ?? '',
        event.correlated ? 'true' : 'false',
      ]
        .map((entry) => `"${String(entry).replaceAll('"', '""')}"`)
        .join(','),
    );

    downloadFile(`rf-events-${new Date().toISOString()}.csv`, [header.join(','), ...rows].join('\n'), 'text/csv');
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Log Viewer & Export Hub</h2>
        <div className="flex gap-2 text-xs">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-cyan-500"
          >
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button
            onClick={exportJson}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-cyan-500"
          >
            <FileJson size={14} /> JSON
          </button>
        </div>
      </div>

      <div className="mb-2 text-xs text-slate-400">Recent entries (local cache + live stream)</div>
      <div className="max-h-72 overflow-auto rounded border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="sticky top-0 bg-slate-900 text-slate-300">
            <tr>
              <th className="px-2 py-2">Band</th>
              <th className="px-2 py-2">Edge</th>
              <th className="px-2 py-2">Tick</th>
              <th className="px-2 py-2">RSSI</th>
              <th className="px-2 py-2">Correlation</th>
              <th className="px-2 py-2">Captured</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((event) => (
              <tr key={event.id} className="border-t border-slate-800 text-slate-200">
                <td className="px-2 py-1.5">{channelLabel(event.channelId)}</td>
                <td className="px-2 py-1.5">{event.edgeDirection ? 'Rising' : 'Falling'}</td>
                <td className="px-2 py-1.5">{event.timestampTick}</td>
                <td className="px-2 py-1.5">{event.rssi ?? 'N/A'}</td>
                <td className="px-2 py-1.5">{event.correlated ? 'Flagged' : '-'}</td>
                <td className="px-2 py-1.5">{new Date(event.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
        <Download size={14} /> One-click export for forensic thesis analysis.
      </p>
    </section>
  );
};
