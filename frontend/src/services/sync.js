/**
 * CompliScan Real-Time Cross-Tab & Cross-User Synchronization Service
 * 
 * Provides instantaneous synchronization across multiple browser tabs,
 * split windows, and different testing personas using the standard BroadcastChannel API,
 * window storage events, and tab focus listeners.
 */

const SYNC_CHANNEL_NAME = 'compliscan_realtime_sync';

let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (err) {
  console.warn('BroadcastChannel not supported in this browser environment:', err);
}

/**
 * Broadcast an event to all open tabs and the local window
 * @param {string} action - Event action type (e.g., 'INSPECTION_CREATED', 'NOTICE_ESCALATED', etc.)
 * @param {object} payload - Optional payload data
 */
export function broadcastSync(action, payload = {}) {
  const eventData = {
    action,
    payload,
    timestamp: Date.now(),
    tabId: window.__compliscan_tab_id || (window.__compliscan_tab_id = Math.random().toString(36).substring(2, 9))
  };

  // Broadcast to other tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (e) {
      console.warn('Failed to broadcast across tabs:', e);
    }
  }

  // Dispatch locally in the current tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('compliscan_sync_event', { detail: eventData }));
  }
}

/**
 * Subscribe to cross-tab and real-time synchronization updates
 * Automatically handles:
 * 1. BroadcastChannel messages from other tabs
 * 2. Window CustomEvent messages from the current tab
 * 3. Window focus events (when user switches back to an idle tab)
 * 
 * @param {function} callback - Callback function receiving eventData
 * @returns {function} unsubscribe function
 */
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
    callback({ action: 'WINDOW_FOCUS', timestamp: Date.now() });
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
