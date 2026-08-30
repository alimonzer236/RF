import type { ChannelId } from '../types/rf';

export interface ChannelMeta {
  id: ChannelId;
  label: string;
  color: string;
}

export const CHANNELS: ChannelMeta[] = [
  { id: 0, label: '433MHz CC1101', color: '#22c55e' },
  { id: 1, label: '868MHz CC1101', color: '#38bdf8' },
  { id: 2, label: '2.4/5GHz Wi-Fi/BLE', color: '#f59e0b' },
  { id: 3, label: 'Wideband SDR', color: '#f43f5e' },
];
