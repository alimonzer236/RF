export type ChannelId = 0 | 1 | 2 | 3;

export type EdgeDirection = 0 | 1;

export type ConnectionStatus = 'disconnected' | 'syncing' | 'connected';
export type TransportMode = 'none' | 'mock' | 'ble' | 'ws';

export interface TelemetryEvent {
  id: string;
  channelId: ChannelId;
  edgeDirection: EdgeDirection;
  timestampTick: number;
  timestampNs: number;
  rssi?: number;
  correlated?: boolean;
  createdAt: number;
}

export interface CorrelationAlert {
  id: string;
  channels: [ChannelId, ChannelId];
  deltaNs: number;
  severity: 'low' | 'medium' | 'high';
  atTick: number;
  reason: string;
}

export interface SecurityVerdict {
  replayLikelihood: 'Low' | 'Medium' | 'High';
  rollingCodeLikelihood: 'Low' | 'Medium' | 'High';
  jamReplayDetected: boolean;
  hoppingDetected: boolean;
}

export interface ConnectionState {
  status: ConnectionStatus;
  mode: TransportMode;
  rssi: number | null;
  target: string;
}

export interface RfTransport {
  start: (onEvent: (event: TelemetryEvent) => void, onRssi: (rssi: number) => void) => Promise<void>;
  stop: () => void;
  setCorrelationWindow: (windowNs: number) => Promise<void>;
  setChannelMask: (mask: boolean[]) => Promise<void>;
}
