import { getGroup, markGroupShared } from "~/storage";

// ---------------------------------------------------------------------------
// Owner sync state broadcasting
// ---------------------------------------------------------------------------
type SyncStateListener = (syncing: boolean) => void;
const _syncListeners = new Set<SyncStateListener>();

/** Subscribe to owner sync state changes. Returns an unsubscribe function. */
export function onOwnerSyncStateChange(cb: SyncStateListener): () => void {
  _syncListeners.add(cb);
  return () => _syncListeners.delete(cb);
}

function notifyOwnerSyncState(syncing: boolean) {
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

  // Don't sync read-only groups
  if (group.shareMetadata?.isReadOnly) return null;

  // Strip client-side metadata before uploading
  const { shareMetadata: _stripped, ...groupToUpload } = group;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${shareCode}`,
  };
  if (lastETag) {
    headers["If-Match"] = lastETag;
  }

  notifyOwnerSyncState(true);
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
    notifyOwnerSyncState(false);
  }

  return null;
}
