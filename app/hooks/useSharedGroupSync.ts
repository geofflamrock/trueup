import { useCallback, useEffect, useRef, useState } from "react";
import { saveGroup, disconnectGroup } from "~/storage";
import type { Group } from "~/types";
import { onSyncStateChange } from "~/lib/share-sync";

/**
 * Combined hook for shared group sync (both upload and download).
 * Polls every 60s and checks on page-focus (visibilitychange).
 * Also tracks upload state from syncSharedGroup calls.
 *
 * Returns:
 *   isSyncing          – true while an upload or download is in progress
 *   shareDeletedNotice – true when a 404 was received (share deleted remotely)
 *   dismissShareDeletedNotice – clears the notice
 */
export function useSharedGroupSync(group: Group, revalidate: () => void) {
  const [isUploadSyncing, setIsUploadSyncing] = useState(false);
  const [isDownloadSyncing, setIsDownloadSyncing] = useState(false);
  const [shareDeletedNotice, setShareDeletedNotice] = useState(false);

  // Subscribe to upload sync state
  useEffect(() => {
    return onSyncStateChange(setIsUploadSyncing);
  }, []);

  // Always reference the freshest group/revalidate without recreating callbacks
  const groupRef = useRef(group);
  groupRef.current = group;
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  /**
   * Downloads the latest group, saves to localStorage, and revalidates.
   * Only called when the server confirms a newer version is available (HTTP 200).
   */
  const syncNow = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { shareCode } = shareMetadata ?? {};
    if (!shareCode) return;

    setIsDownloadSyncing(true);
    try {
      const res = await fetch(`/api/shares/${id}`, {
        headers: { Authorization: `Bearer ${shareCode}` },
      });

      if (res.ok) {
        const newEtag = res.headers.get("ETag");
        const groupData: Group = await res.json();
        const updated: Group = {
          ...groupData,
          shareMetadata: {
            isShared: true,
            shareCode,
            lastETag: newEtag ?? undefined,
          },
        };
        saveGroup(updated);
        revalidateRef.current();
      }
    } catch {
      // Network error – silently ignore
    } finally {
      setIsDownloadSyncing(false);
    }
  }, []);

  /** Checks for updates via If-None-Match; auto-syncs if a newer version exists. */
  const checkForUpdates = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { shareCode, lastETag } = shareMetadata ?? {};
    if (!shareCode) return;

    // Without a known ETag we can't distinguish "new version" from "first fetch"
    if (!lastETag) return;

    try {
      const res = await fetch(`/api/shares/${id}`, {
        headers: {
          Authorization: `Bearer ${shareCode}`,
          "If-None-Match": lastETag,
        },
      });

      if (res.status === 404) {
        // Share was deleted by another device — disconnect and notify
        disconnectGroup(id);
        setShareDeletedNotice(true);
        revalidateRef.current();
        return;
      }

      // 200 → server has a newer version; automatically apply it
      if (res.status === 200) {
        await syncNow();
      }
    } catch {
      // Network error – silently ignore
    }
  }, [syncNow]);

  // 60-second polling interval (only for shared groups)
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    const interval = setInterval(checkForUpdates, 60_000);
    return () => clearInterval(interval);
  }, [checkForUpdates, group.shareMetadata?.shareCode]);

  // Check for updates whenever the page becomes visible again
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [checkForUpdates, group.shareMetadata?.shareCode]);

  return {
    isSyncing: isUploadSyncing || isDownloadSyncing,
    shareDeletedNotice,
    dismissShareDeletedNotice: () => setShareDeletedNotice(false),
  };
}
