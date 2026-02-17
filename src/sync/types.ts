import type {
  Calendar,
  CalendarEvent,
  CollaborationMember,
  EventTemplate,
  Profile
} from '../storage/types';

export type SyncCollaborationSnapshot = {
  enabled: boolean;
  mode: 'private' | 'shared' | 'team';
  members: CollaborationMember[];
};

export type SyncPayload = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  templates: EventTemplate[];
  collaboration?: SyncCollaborationSnapshot;
};

export type SyncMessage = {
  senderId: string;
  payload: SyncPayload;
  sentAt: number;
  revision?: number;
};

export type SyncHandle = {
  broadcast: (payload: SyncPayload) => void;
  close: () => void;
};
