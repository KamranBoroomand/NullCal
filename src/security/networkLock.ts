type NetworkLock = {
  enabled: boolean;
};

const state: NetworkLock = {
  enabled: false
};

let originalFetch: typeof window.fetch | undefined;
let originalXhr: typeof window.XMLHttpRequest | undefined;
let originalWebSocket: typeof window.WebSocket | undefined;
let originalEventSource: typeof window.EventSource | undefined;
let originalSendBeacon: typeof navigator.sendBeacon | undefined;

const networkError = () => new Error('Network access blocked by NullCAL Network Lock.');

export const applyNetworkLock = (enabled: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!originalFetch) {
    originalFetch = window.fetch.bind(window);
  }
  if (!originalXhr) {
    originalXhr = window.XMLHttpRequest;
  }
  if (!originalWebSocket) {
    originalWebSocket = window.WebSocket;
  }
  if ('EventSource' in window && !originalEventSource) {
    originalEventSource = window.EventSource;
  }
  if (typeof navigator.sendBeacon === 'function' && !originalSendBeacon) {
    originalSendBeacon = navigator.sendBeacon.bind(navigator);
  }

  state.enabled = enabled;

  if (enabled) {
    window.fetch = (() => Promise.reject(networkError())) as typeof window.fetch;
    window.XMLHttpRequest = class extends originalXhr {
      constructor() {
        super();
        throw networkError();
      }
    };
    window.WebSocket = class {
      constructor() {
        throw networkError();
      }
    } as unknown as typeof window.WebSocket;
    if (originalEventSource) {
      window.EventSource = class {
        constructor() {
          throw networkError();
        }
      } as unknown as typeof window.EventSource;
    }
    if (originalSendBeacon) {
      try {
        navigator.sendBeacon = (() => false) as typeof navigator.sendBeacon;
      } catch {
        // Ignore non-writable environments.
      }
    }
    return;
  }

  if (originalFetch) {
    window.fetch = originalFetch;
  }
  if (originalXhr) {
    window.XMLHttpRequest = originalXhr;
  }
  if (originalWebSocket) {
    window.WebSocket = originalWebSocket;
  }
  if (originalEventSource) {
    window.EventSource = originalEventSource;
  }
  if (originalSendBeacon) {
    try {
      navigator.sendBeacon = originalSendBeacon;
    } catch {
      // Ignore non-writable environments.
    }
  }
};

export const getNetworkLockState = () => state.enabled;
