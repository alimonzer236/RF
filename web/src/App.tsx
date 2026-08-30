import { useEffect, useRef } from 'react';
import { AlertDrawer } from './components/AlertDrawer';
import { ConnectionManager } from './components/ConnectionManager';
import { CorrelationControls } from './components/CorrelationControls';
import { LogViewerExportHub } from './components/LogViewerExportHub';
import { MultiBandMonitor } from './components/MultiBandMonitor';
import { SecurityVerdictPanel } from './components/SecurityVerdictPanel';
import { useRfMonitorStore } from './hooks/useRfMonitorStore';
import { createMockRfStream } from './services/mockRfStream';
import { createWebBluetoothTransport } from './services/webBluetoothRfClient';
import { createWebSocketTransport } from './services/websocketRfClient';
import type { RfTransport, TransportMode } from './types/rf';

const WS_DEFAULT_URL = 'ws://localhost:8080/rf-events';

function App() {
  const {
    connection,
    events,
    alerts,
    correlationWindowNs,
    channelMask,
    channelPulseAt,
    verdict,
    setConnectionMode,
    setConnectionStatus,
    setRssi,
    ingestEvent,
    clearAlerts,
    setCorrelationWindowNs,
    toggleChannel,
  } = useRfMonitorStore();

  const transportRef = useRef<RfTransport | null>(null);

  const disconnect = () => {
    transportRef.current?.stop();
    transportRef.current = null;
    setConnectionStatus('disconnected');
    setConnectionMode('none', 'Not connected');
    setRssi(null);
  };

  const connect = async (mode: TransportMode) => {
    try {
      disconnect();
      setConnectionStatus('syncing');

      const transport: RfTransport =
        mode === 'mock'
          ? {
              ...createMockRfStream(),
              setCorrelationWindow: async () => undefined,
              setChannelMask: async () => undefined,
            }
          : mode === 'ble'
            ? createWebBluetoothTransport()
            : createWebSocketTransport(WS_DEFAULT_URL);

      transportRef.current = transport;
      setConnectionMode(mode, mode === 'ws' ? WS_DEFAULT_URL : mode === 'ble' ? 'ESP32-C5 BLE GATT' : 'Local simulation');

      await transport.start(ingestEvent, setRssi);
      setConnectionStatus('connected');
      await transport.setCorrelationWindow(correlationWindowNs);
      await transport.setChannelMask([channelMask[0], channelMask[1], channelMask[2], channelMask[3]]);
    } catch (error) {
      console.error(error);
      disconnect();
      setConnectionStatus('disconnected');
    }
  };

  useEffect(
    () => () => {
      transportRef.current?.stop();
    },
    [],
  );

  useEffect(() => {
    void transportRef.current?.setCorrelationWindow(correlationWindowNs);
  }, [correlationWindowNs]);

  useEffect(() => {
    void transportRef.current?.setChannelMask([channelMask[0], channelMask[1], channelMask[2], channelMask[3]]);
  }, [channelMask]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h1 className="text-2xl font-bold">Multi-Band RF Correlation Monitor</h1>
          <p className="text-sm text-slate-300">
            React + WebBluetooth/WebSocket dashboard for 433MHz, 868MHz, 2.4/5GHz, and SDR timestamped telemetry.
          </p>
        </header>

        <ConnectionManager state={connection} onConnect={connect} onDisconnect={disconnect} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <MultiBandMonitor events={events} pulseAt={channelPulseAt} />
            <LogViewerExportHub events={events} />
          </div>
          <div className="space-y-4">
            <CorrelationControls
              correlationWindowNs={correlationWindowNs}
              channelMask={channelMask}
              onWindowChange={setCorrelationWindowNs}
              onToggleChannel={toggleChannel}
            />
            <AlertDrawer alerts={alerts} onClear={clearAlerts} />
            <SecurityVerdictPanel verdict={verdict} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
