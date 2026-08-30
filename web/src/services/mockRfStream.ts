import type { ChannelId, TelemetryEvent } from '../types/rf';

const NS_PER_TICK = 10;
const MAX_TICK = 0xffffffff;

const randomChannel = (): ChannelId => Math.floor(Math.random() * 4) as ChannelId;

const randomEdge = (): 0 | 1 => (Math.random() > 0.5 ? 1 : 0);

const createEvent = (tick: number, channelId: ChannelId, correlated = false): TelemetryEvent => ({
  id: crypto.randomUUID(),
  channelId,
  edgeDirection: randomEdge(),
  timestampTick: tick >>> 0,
  timestampNs: (tick >>> 0) * NS_PER_TICK,
  rssi: Math.round(-95 + Math.random() * 65),
  correlated,
  createdAt: Date.now(),
});

export const createMockRfStream = () => {
  let tick = Math.floor(Math.random() * 500_000);
  let timer: number | undefined;

  return {
    start: (onEvent: (event: TelemetryEvent) => void, onRssi: (rssi: number) => void) => {
      timer = window.setInterval(() => {
        tick = (tick + Math.floor(Math.random() * 500 + 80)) % MAX_TICK;
        const channel = randomChannel();
        const baseEvent = createEvent(tick, channel);
        onEvent(baseEvent);
        if (baseEvent.rssi) {
          onRssi(baseEvent.rssi);
        }

        if (Math.random() > 0.76) {
          const sibling = ((channel + 1 + Math.floor(Math.random() * 3)) % 4) as ChannelId;
          const correlatedTick = (tick + Math.floor(Math.random() * 150)) % MAX_TICK;
          onEvent(createEvent(correlatedTick, sibling, true));
        }
      }, 120);
    },
    stop: () => {
      if (timer) {
        window.clearInterval(timer);
        timer = undefined;
      }
    },
  };
};
