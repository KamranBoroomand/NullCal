type NetworkLock = {
  enabled: boolean;
};

const state: NetworkLock = {
  enabled: false
};

let originalFetch: typeof window.fetch | undefined;
let originalXhr: typeof window.XMLHttpRequest | undefined;
let originalWebSocket: typeof window.WebSocket | undefined;

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
    } as typeof window.WebSocket;
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
};

export const getNetworkLockState = () => state.enabled;
