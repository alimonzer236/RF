import { create } from 'zustand';
import { CHANNELS } from '../constants/channels';
import type { ChannelId, ConnectionState, CorrelationAlert, SecurityVerdict, TelemetryEvent, TransportMode } from '../types/rf';

const MAX_EVENTS = 1200;
const MAX_ALERTS = 200;
const WINDOW_MIN_NS = 10;
const WINDOW_MAX_NS = 10_000_000;

const defaultVerdict: SecurityVerdict = {
  replayLikelihood: 'Low',
  rollingCodeLikelihood: 'High',
  jamReplayDetected: false,
  hoppingDetected: false,
};

interface RfMonitorState {
  connection: ConnectionState;
  events: TelemetryEvent[];
  alerts: CorrelationAlert[];
  correlationWindowNs: number;
  channelMask: Record<ChannelId, boolean>;
  channelPulseAt: Record<ChannelId, number>;
  verdict: SecurityVerdict;
  setConnectionMode: (mode: TransportMode, target: string) => void;
  setConnectionStatus: (status: ConnectionState['status']) => void;
  setRssi: (rssi: number | null) => void;
  ingestEvent: (event: TelemetryEvent) => void;
  setCorrelationWindowNs: (value: number) => void;
  toggleChannel: (channelId: ChannelId) => void;
  clearAlerts: () => void;
}

const estimateVerdict = (events: TelemetryEvent[]): SecurityVerdict => {
  const recent = events.slice(-220);
  if (recent.length < 10) {
    return defaultVerdict;
  }

  const byChannel = CHANNELS.map((channel) => recent.filter((event) => event.channelId === channel.id));

  const diffs = byChannel.flatMap((eventsInChannel) =>
    eventsInChannel.slice(1).map((event, index) => event.timestampTick - eventsInChannel[index].timestampTick),
  );

  const distinctDiffs = new Set(diffs.slice(-80).map((entry) => Math.round(entry / 20))).size;
  const replayLikelihood: SecurityVerdict['replayLikelihood'] = distinctDiffs < 7 ? 'High' : distinctDiffs < 20 ? 'Medium' : 'Low';
  const rollingCodeLikelihood: SecurityVerdict['rollingCodeLikelihood'] =
    replayLikelihood === 'High' ? 'Low' : replayLikelihood === 'Medium' ? 'Medium' : 'High';

  const strongBursts = recent.filter((event) => (event.rssi ?? -120) > -35);
  const jamReplayDetected = strongBursts.some((burst) =>
    recent.some(
      (event) =>
        event.channelId !== burst.channelId &&
        event.timestampTick > burst.timestampTick &&
        event.timestampTick - burst.timestampTick < 1200 &&
        (event.rssi ?? -120) < -55,
    ),
  );

  const hoppingDetected = CHANNELS.some((channel) => {
    const horizon = recent.filter((event) => event.channelId === channel.id).slice(-6);
    return horizon.length > 4;
  }) && new Set(recent.slice(-20).map((event) => event.channelId)).size >= 3;

  return {
    replayLikelihood,
    rollingCodeLikelihood,
    jamReplayDetected,
    hoppingDetected,
  };
};

export const useRfMonitorStore = create<RfMonitorState>((set, get) => ({
  connection: {
    status: 'disconnected',
    mode: 'none',
    rssi: null,
    target: 'Not connected',
  },
  events: [],
  alerts: [],
  correlationWindowNs: 15_000,
  channelMask: { 0: true, 1: true, 2: true, 3: true },
  channelPulseAt: { 0: 0, 1: 0, 2: 0, 3: 0 },
  verdict: defaultVerdict,
  setConnectionMode: (mode, target) => {
    set((state) => ({ connection: { ...state.connection, mode, target } }));
  },
  setConnectionStatus: (status) => {
    set((state) => ({ connection: { ...state.connection, status } }));
  },
  setRssi: (rssi) => {
    set((state) => ({ connection: { ...state.connection, rssi } }));
  },
  ingestEvent: (event) => {
    const state = get();
    if (!state.channelMask[event.channelId]) {
      return;
    }

    const activeEvents = [...state.events, event].slice(-MAX_EVENTS);
    const correlated = [...activeEvents]
      .reverse()
      .find((candidate) => candidate.channelId !== event.channelId && Math.abs(candidate.timestampNs - event.timestampNs) <= state.correlationWindowNs);

    const alert =
      correlated && state.channelMask[correlated.channelId]
        ? {
            id: crypto.randomUUID(),
            channels: [correlated.channelId, event.channelId] as [ChannelId, ChannelId],
            deltaNs: Math.abs(correlated.timestampNs - event.timestampNs),
            severity:
              Math.abs(correlated.timestampNs - event.timestampNs) < state.correlationWindowNs * 0.2
                ? 'high'
                : Math.abs(correlated.timestampNs - event.timestampNs) < state.correlationWindowNs * 0.6
                  ? 'medium'
                  : 'low',
            atTick: event.timestampTick,
            reason: 'Cross-band temporal overlap',
          }
        : null;

    set({
      events: activeEvents,
      alerts: alert ? [alert, ...state.alerts].slice(0, MAX_ALERTS) : state.alerts,
      channelPulseAt: {
        ...state.channelPulseAt,
        [event.channelId]: Date.now(),
      },
      verdict: estimateVerdict(activeEvents),
    });
  },
  setCorrelationWindowNs: (value) => {
    const bounded = Math.min(WINDOW_MAX_NS, Math.max(WINDOW_MIN_NS, value));
    set({ correlationWindowNs: bounded });
  },
  toggleChannel: (channelId) => {
    set((state) => ({
      channelMask: {
        ...state.channelMask,
        [channelId]: !state.channelMask[channelId],
      },
    }));
  },
  clearAlerts: () => set({ alerts: [] }),
}));
