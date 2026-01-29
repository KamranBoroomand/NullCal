export const safeLocalStorage = {
  getItem(key: string) {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (e.g., Safari private mode).
    }
  },
  removeItem(key: string) {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  },
  clear() {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.clear();
    } catch {
      // Ignore storage failures.
    }
  }
};
