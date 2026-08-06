export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function getAuthSafely() {
  return null;
}

export async function saveToDatabase(key: string, data: any) {
  try {
    // 1. Save locally in browser for instant reactive UI updates
    localStorage.setItem(`frello_local_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`frello_update_${key}`, { detail: data }));
    
    // 2. Persist to server backend database asynchronously
    fetch(`/api/db/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    }).then(res => {
      if (!res.ok) {
        console.warn(`[Database] Server returned non-ok status ${res.status} for ${key}`);
      }
    }).catch(err => {
      console.warn(`[Database] Async server save failed for ${key}:`, err);
    });
  } catch (err) {
    console.warn(`[Database] Failed to save document: ${key}`, err);
  }
}

export async function loadFromDatabase(key: string): Promise<any | null> {
  // 1. Try fetching from server backend database
  try {
    const response = await fetch(`/api/db/${key}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result && result.success && result.data !== null && result.data !== undefined) {
        localStorage.setItem(`frello_local_${key}`, JSON.stringify(result.data));
        return result.data;
      }
    }
  } catch (err) {
    console.warn(`[Database] Could not fetch ${key} from server, checking local cache:`, err);
  }

  // 2. Fallback to localStorage if server is offline or returned null
  try {
    const saved = localStorage.getItem(`frello_local_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn(`[Database] Failed to load document locally: ${key}`, err);
  }
  return null;
}

export function subscribeToDatabase(key: string, callback: (data: any) => void) {
  let lastKnownJson = '';

  const handleUpdate = (e: Event) => {
    const customEvent = e as CustomEvent;
    lastKnownJson = JSON.stringify(customEvent.detail);
    callback(customEvent.detail);
  };
  
  window.addEventListener(`frello_update_${key}`, handleUpdate);
  
  // Initial load from server or local
  loadFromDatabase(key).then(data => {
    if (data !== null) {
      lastKnownJson = JSON.stringify(data);
      callback(data);
    }
  });

  // Periodically poll server database for remote changes from other browsers/devices
  const checkServerUpdates = async () => {
    try {
      const response = await fetch(`/api/db/${key}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.success && result.data !== null && result.data !== undefined) {
          const currentJson = JSON.stringify(result.data);
          if (lastKnownJson !== currentJson) {
            localStorage.setItem(`frello_local_${key}`, JSON.stringify(result.data));
            lastKnownJson = currentJson;
            callback(result.data);
          }
        }
      }
    } catch {}
  };

  const intervalId = setInterval(checkServerUpdates, 10000);

  const handleFocus = () => {
    checkServerUpdates();
  };
  window.addEventListener('focus', handleFocus);
  
  return () => {
    window.removeEventListener(`frello_update_${key}`, handleUpdate);
    window.removeEventListener('focus', handleFocus);
    clearInterval(intervalId);
  };
}


