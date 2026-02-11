import type { AppSettings } from '../storage/types';

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
