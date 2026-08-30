import { Bluetooth, Cable, PlugZap, Wifi } from 'lucide-react';
import type { ConnectionState, TransportMode } from '../types/rf';

interface ConnectionManagerProps {
  state: ConnectionState;
  onConnect: (mode: TransportMode) => void;
  onDisconnect: () => void;
}

const statusColor: Record<ConnectionState['status'], string> = {
  connected: 'bg-emerald-500',
  syncing: 'bg-amber-400',
  disconnected: 'bg-rose-500',
};

const Button = ({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
  >
    <Icon size={16} />
    {label}
  </button>
);

export const ConnectionManager = ({ state, onConnect, onDisconnect }: ConnectionManagerProps) => (
  <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Connection Manager</h2>
        <p className="text-xs text-slate-400">BLE service UUID 4fafc201-1fb5-459e-8fcc-c5c9c331914b</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-200">
        <span className={`h-3 w-3 rounded-full ${statusColor[state.status]}`} />
        <span className="capitalize">{state.status}</span>
      </div>
    </div>

    <div className="mb-3 flex flex-wrap gap-2">
      <Button icon={Bluetooth} label="Pair BLE" onClick={() => onConnect('ble')} />
      <Button icon={Wifi} label="WebSocket" onClick={() => onConnect('ws')} />
      <Button icon={PlugZap} label="Mock Stream" onClick={() => onConnect('mock')} />
      <Button icon={Cable} label="Disconnect" onClick={onDisconnect} />
    </div>

    <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
      <p>Mode: <span className="font-medium uppercase text-slate-100">{state.mode}</span></p>
      <p>Target: <span className="font-medium text-slate-100">{state.target}</span></p>
      <p>RSSI: <span className="font-medium text-slate-100">{state.rssi ?? 'N/A'} dBm</span></p>
    </div>
  </section>
);
