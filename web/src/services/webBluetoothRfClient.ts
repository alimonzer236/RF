import type { RfTransport, TelemetryEvent } from '../types/rf';

const NS_PER_TICK = 10;
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const TELEMETRY_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const CONTROL_CHAR_UUID = '2d4d6f29-c321-4472-9955-f17cd43a7f10';

const decoder = new TextDecoder();

const parsePacket = (value: DataView): TelemetryEvent | null => {
  const payload = decoder.decode(value.buffer);

  try {
    const packet = JSON.parse(payload) as {
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

export const createWebBluetoothTransport = (): RfTransport => {
  let controlChar: BluetoothRemoteGATTCharacteristic | null = null;
  let telemetryChar: BluetoothRemoteGATTCharacteristic | null = null;
  let server: BluetoothRemoteGATTServer | null = null;

  return {
    start: async (onEvent, onRssi) => {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API unavailable in this browser');
      }

      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] });
      server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Unable to connect to BLE server');
      }

      const service = await server.getPrimaryService(SERVICE_UUID);
      telemetryChar = await service.getCharacteristic(TELEMETRY_CHAR_UUID);
      controlChar = await service.getCharacteristic(CONTROL_CHAR_UUID);

      await telemetryChar.startNotifications();
      telemetryChar.addEventListener('characteristicvaluechanged', (event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (!target.value) {
          return;
        }

        const parsed = parsePacket(target.value);
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
      server?.disconnect();
      server = null;
      controlChar = null;
      telemetryChar = null;
    },
    setCorrelationWindow: async (windowNs) => {
      if (!controlChar) {
        return;
      }

      const payload = new TextEncoder().encode(JSON.stringify({ type: 'setCorrelationWindow', windowNs }));
      await controlChar.writeValueWithoutResponse(payload);
    },
    setChannelMask: async (mask) => {
      if (!controlChar) {
        return;
      }

      const payload = new TextEncoder().encode(JSON.stringify({ type: 'setChannelMask', mask }));
      await controlChar.writeValueWithoutResponse(payload);
    },
  };
};
