import { useEffect, useState } from "react";
import { onOwnerSyncStateChange } from "~/lib/share-sync";

/**
 * Subscribes to the owner's share sync state.
 * Returns `isSyncing: true` while `syncSharedGroup` is uploading data.
 */
export function useOwnerSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  useEffect(() => {
    return onOwnerSyncStateChange(setIsSyncing);
  }, []);
  return { isSyncing };
}
