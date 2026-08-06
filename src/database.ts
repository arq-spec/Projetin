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
    localStorage.setItem(`frello_local_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`frello_update_${key}`, { detail: data }));
    console.log(`[Database] Saved ${key} locally.`);
  } catch (err) {
    console.warn(`[Database] Failed to save document: ${key}`, err);
  }
}

export async function loadFromDatabase(key: string): Promise<any | null> {
  try {
    const saved = localStorage.getItem(`frello_local_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn(`[Database] Failed to load document: ${key}`, err);
  }
  return null;
}

export function subscribeToDatabase(key: string, callback: (data: any) => void) {
  const handleUpdate = (e: Event) => {
    const customEvent = e as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(`frello_update_${key}`, handleUpdate);
  
  loadFromDatabase(key).then(data => {
    if (data !== null) {
      callback(data);
    }
  });
  
  return () => {
    window.removeEventListener(`frello_update_${key}`, handleUpdate);
  };
}
