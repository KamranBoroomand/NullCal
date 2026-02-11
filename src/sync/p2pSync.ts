const CHANNEL = 'nullcal-sync';
import type { SyncHandle, SyncMessage, SyncPayload } from './types';

export const createP2PSync = (
  senderId: string,
  onReceive: (message: SyncMessage) => void,
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
    onReceive(message);
  });

  return {
    broadcast: (payload: SyncPayload) => {
      channel.postMessage({ senderId, payload, sentAt: Date.now() } satisfies SyncMessage);
    },
    close: () => channel.close()
  };
};
