import type { AppSettings, CalendarPermissionPreset } from '../storage/types';

const isCollaborationContext = (settings: AppSettings) =>
  settings.collaborationEnabled && settings.collaborationMode !== 'private';

export const hasCollaborationWriteAccess = (settings: AppSettings) => {
  if (!isCollaborationContext(settings)) {
    return true;
  }
  return settings.collaborationRole === 'owner' || settings.collaborationRole === 'editor';
};

export const hasCollaborationAdminAccess = (settings: AppSettings) => {
  if (!isCollaborationContext(settings)) {
    return true;
  }
  return settings.collaborationRole === 'owner';
};

export const resolveCalendarPermissionPreset = (
  settings: AppSettings,
  calendarId: string
): CalendarPermissionPreset => settings.collaborationCalendarPermissions?.[calendarId] ?? 'owner-editor';

export const hasCalendarWriteAccess = (settings: AppSettings, calendarId: string) => {
  if (!isCollaborationContext(settings)) {
    return true;
  }
  if (settings.collaborationRole === 'owner') {
    return true;
  }
  if (settings.collaborationRole !== 'editor') {
    return false;
  }
  return resolveCalendarPermissionPreset(settings, calendarId) === 'owner-editor';
};
