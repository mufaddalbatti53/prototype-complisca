const SYNC_CHANNEL_NAME = 'compliscan_realtime_sync';

let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (err) {
  console.warn('BroadcastChannel not supported in this browser environment:', err);
}

//broadcast
export function broadcastSync(action, payload = {}) {
  const eventData = {
    action,
    payload,
    timestamp: Date.now(),
    tabId: window.__compliscan_tab_id || (window.__compliscan_tab_id = Math.random().toString(36).substring(2, 9))
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (e) {
      console.warn('Failed to broadcast across tabs:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('compliscan_sync_event', { detail: eventData }));
  }
}

//subscription
export function subscribeSync(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event) => {
    if (event.data) {
      callback(event.data);
    }
  };

  const handleLocal = (event) => {
    if (event.detail) {
      callback(event.detail);
    }
  };

  const handleFocus = () => {
    callback({ action: 'WINDOW_FOCUSED', timestamp: Date.now() });
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('compliscan_sync_event', handleLocal);
  window.addEventListener('focus', handleFocus);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('compliscan_sync_event', handleLocal);
    window.removeEventListener('focus', handleFocus);
  };
}
