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

export function notifySyncState(syncing: boolean) {
  _syncListeners.forEach((cb) => cb(syncing));
}

// ---------------------------------------------------------------------------
// Group modification broadcasting
// ---------------------------------------------------------------------------
type ModifiedListener = (groupId: string) => void;
const _modifiedListeners = new Set<ModifiedListener>();

/**
 * Subscribe to local group modification events.
 * The hook calls this to know when to upload after a mutation.
 */
export function onGroupModified(cb: ModifiedListener): () => void {
  _modifiedListeners.add(cb);
  return () => _modifiedListeners.delete(cb);
}

/**
 * Signal that the local group has been modified and needs to be uploaded.
 * Call this from route actions after any mutation (add/edit/delete expense or
 * transfer, settings save) instead of calling syncSharedGroup directly.
 */
export function notifyGroupModified(groupId: string) {
  _modifiedListeners.forEach((cb) => cb(groupId));
}
