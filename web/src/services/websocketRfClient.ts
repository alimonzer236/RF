import type { RfTransport, TelemetryEvent } from '../types/rf';

const NS_PER_TICK = 10;

const parseIncoming = (raw: string): TelemetryEvent | null => {
  try {
    const packet = JSON.parse(raw) as {
      channelId: number;
      edgeDirection: number;
      timestampTick: number;
      rssi?: number;
      correlated?: boolean;
    };

    if (packet.channelId < 0 || packet.channelId > 3) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      channelId: packet.channelId as 0 | 1 | 2 | 3,
      edgeDirection: packet.edgeDirection ? 1 : 0,
      timestampTick: packet.timestampTick >>> 0,
      timestampNs: (packet.timestampTick >>> 0) * NS_PER_TICK,
      rssi: packet.rssi,
      correlated: packet.correlated,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
};

export const createWebSocketTransport = (url: string): RfTransport => {
  let socket: WebSocket | null = null;

  return {
    start: async (onEvent, onRssi) => {
      await new Promise<void>((resolve, reject) => {
        socket = new WebSocket(url);
        socket.addEventListener('open', () => resolve(), { once: true });
        socket.addEventListener('error', () => reject(new Error('WebSocket failed')), { once: true });
      });

      socket?.addEventListener('message', (message) => {
        const parsed = parseIncoming(String(message.data));
        if (!parsed) {
          return;
        }

        onEvent(parsed);
        if (typeof parsed.rssi === 'number') {
          onRssi(parsed.rssi);
        }
      });
    },
    stop: () => {
      socket?.close();
      socket = null;
    },
    setCorrelationWindow: async (windowNs) => {
      socket?.send(JSON.stringify({ type: 'setCorrelationWindow', windowNs }));
    },
    setChannelMask: async (mask) => {
      socket?.send(JSON.stringify({ type: 'setChannelMask', mask }));
    },
  };
};
