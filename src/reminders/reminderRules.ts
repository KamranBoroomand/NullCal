const OFFSET_PREFIX = 'offset:';

export const formatReminderRule = (minutes: number | null) =>
  minutes !== null ? `${OFFSET_PREFIX}${minutes}` : '';

export const parseReminderRule = (rule?: string) => {
  if (!rule) {
    return null;
  }
  if (rule.startsWith(OFFSET_PREFIX)) {
    const value = Number(rule.slice(OFFSET_PREFIX.length));
    return Number.isFinite(value) ? value : null;
  }
  const legacy = rule.match(/(\d+)\s*(m|min|minutes|h|hours|d|days)/i);
  if (!legacy) {
    return null;
  }
  const amount = Number(legacy[1]);
  const unit = legacy[2].toLowerCase();
  if (!Number.isFinite(amount)) {
    return null;
  }
  if (unit.startsWith('h')) {
    return amount * 60;
  }
  if (unit.startsWith('d')) {
    return amount * 60 * 24;
  }
  return amount;
};
