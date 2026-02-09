import type { Calendar, CalendarEvent, EventTemplate, Profile } from '../storage/types';

const CHANNEL = 'nullcal-sync';

type SyncMessage = {
  senderId: string;
  payload: SyncPayload;
  sentAt: number;
};

export type SyncPayload = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  templates: EventTemplate[];
};

export type SyncHandle = {
  broadcast: (payload: SyncPayload) => void;
  close: () => void;
};

export const createP2PSync = (
  senderId: string,
  onReceive: (payload: SyncPayload) => void,
  shareToken?: string
): SyncHandle => {
  if (typeof BroadcastChannel === 'undefined') {
    return {
      broadcast: () => {},
      close: () => {}
    };
  }
  const channelName = shareToken ? `${CHANNEL}:${shareToken}` : CHANNEL;
  const channel = new BroadcastChannel(channelName);
  channel.addEventListener('message', (event) => {
    const message = event.data as SyncMessage;
    if (!message || message.senderId === senderId) {
      return;
    }
    onReceive(message.payload);
  });

  return {
    broadcast: (payload: SyncPayload) => {
      channel.postMessage({ senderId, payload, sentAt: Date.now() } satisfies SyncMessage);
    },
    close: () => channel.close()
  };
};
