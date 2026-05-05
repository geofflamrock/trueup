import { getGroup, markGroupShared } from "~/storage";

// ---------------------------------------------------------------------------
// Sync state broadcasting
// ---------------------------------------------------------------------------
type SyncStateListener = (syncing: boolean) => void;
const _syncListeners = new Set<SyncStateListener>();

/** Subscribe to share sync state changes. Returns an unsubscribe function. */
export function onSyncStateChange(cb: SyncStateListener): () => void {
  _syncListeners.add(cb);
  return () => _syncListeners.delete(cb);
}

// Backward-compat alias
export const onOwnerSyncStateChange = onSyncStateChange;

function notifySyncState(syncing: boolean) {
  _syncListeners.forEach((cb) => cb(syncing));
}

// ---------------------------------------------------------------------------

/**
 * Uploads the current group data to the share blob.
 * Called after mutations when the group is shared.
 * Strips shareMetadata before uploading so internal client state is not stored.
 */
export async function syncSharedGroup(groupId: string, shareCode: string, lastETag?: string): Promise<string | null> {
  const group = getGroup(groupId);
  if (!group) return null;

  // Strip client-side metadata before uploading
  const { shareMetadata: _stripped, ...groupToUpload } = group;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${shareCode}`,
  };
  if (lastETag) {
    headers["If-Match"] = lastETag;
  }

  notifySyncState(true);
  try {
    const res = await fetch(`/api/shares/${groupId}`, {
      method: "POST",
      headers,
      body: JSON.stringify(groupToUpload),
    });

    if (res.ok) {
      const data = await res.json();
      markGroupShared(groupId, shareCode, data.etag);
      return data.etag;
    }
  } finally {
    notifySyncState(false);
  }

  return null;
}
