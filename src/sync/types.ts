import type {
  CalendarPermissionPreset,
  Calendar,
  CalendarEvent,
  CollaborationMember,
  EventTemplate,
  Profile
} from '../storage/types';
import type { EncryptedPayload } from '../security/encryption';

export type SyncCollaborationSnapshot = {
  enabled: boolean;
  mode: 'private' | 'shared' | 'team';
  members: CollaborationMember[];
  calendarPermissions?: Record<string, CalendarPermissionPreset>;
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
  payload?: SyncPayload;
  payloadCiphertext?: EncryptedPayload;
  payloadEncoding?: 'e2ee-v1';
  sentAt: number;
  revision?: number;
};

export type SyncHandle = {
  broadcast: (payload: SyncPayload) => void;
  close: () => void;
};
