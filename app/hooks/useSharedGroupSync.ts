import { useCallback, useEffect, useRef, useState } from "react";
import { getGroup, saveGroup, disconnectGroup, markGroupShared } from "~/storage";
import type { Group } from "~/types";
import { onSyncStateChange, onGroupModified, notifySyncState } from "~/lib/share-sync";

/**
 * Combined hook for shared group sync (both upload and download).
 * - Polls every 60s and re-checks on visibilitychange / mount.
 * - Tracks upload state and uploads whenever a local mutation is signalled via
 *   `notifyGroupModified`.
 * - Combines the former checkForUpdates + syncNow into a single `checkAndSync`
 *   that uses If-None-Match and handles 200 / 304 / 404 in one pass.
 *
 * Returns:
 *   isSyncing                  – true while an upload or download is in progress
 *   shareDeletedNotice         – true when a 404 was received (share deleted remotely)
 *   dismissShareDeletedNotice  – clears the notice
 */
export function useSharedGroupSync(group: Group, revalidate: () => void) {
  const [isUploadSyncing, setIsUploadSyncing] = useState(false);
  const [isDownloadSyncing, setIsDownloadSyncing] = useState(false);
  const [shareDeletedNotice, setShareDeletedNotice] = useState(false);

  // Subscribe to upload sync state (for spinner feedback)
  useEffect(() => {
    return onSyncStateChange(setIsUploadSyncing);
  }, []);

  // Always reference the freshest group/revalidate without recreating callbacks
  const groupRef = useRef(group);
  groupRef.current = group;
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  // Guards against concurrent uploads: if an upload is in progress when another
  // mutation arrives, we re-run once after the current one finishes.
  const isUploadingRef = useRef(false);
  const needsReuploadRef = useRef(false);

  /**
   * Uploads the current group data (read fresh from localStorage) to the share
   * blob. Strips shareMetadata before uploading. Serialises concurrent calls so
   * rapid mutations don't race each other.
   */
  const uploadGroup = useCallback(async () => {
    if (isUploadingRef.current) {
      // An upload is already in-flight; schedule a re-run after it finishes
      needsReuploadRef.current = true;
      return;
    }

    // Always read the freshest copy from localStorage so we capture the latest mutation
    const currentGroup = getGroup(groupRef.current.id);
    if (!currentGroup) return;

    const { shareMetadata, id } = currentGroup;
    const { shareCode, lastETag } = shareMetadata ?? {};
    if (!shareCode) return;

    const { shareMetadata: _stripped, ...groupToUpload } = currentGroup;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${shareCode}`,
    };
    if (lastETag) headers["If-Match"] = lastETag;

    isUploadingRef.current = true;
    notifySyncState(true);
    try {
      const res = await fetch(`/api/shares/${id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(groupToUpload),
      });

      if (res.ok) {
        const data = await res.json();
        markGroupShared(id, shareCode, data.etag);
      }
    } finally {
      isUploadingRef.current = false;
      notifySyncState(false);
      // If another mutation arrived while we were uploading, send the latest state
      if (needsReuploadRef.current) {
        needsReuploadRef.current = false;
        uploadGroup();
      }
    }
  }, []);

  // Upload whenever a local mutation is signalled for this group
  useEffect(() => {
    return onGroupModified((modifiedId) => {
      if (modifiedId === groupRef.current.id) {
        uploadGroup();
      }
    });
  }, [uploadGroup]);

  /**
   * Polls the share API with If-None-Match; auto-syncs when the server has a
   * newer version (HTTP 200), or auto-disconnects when the share is gone (HTTP 404).
   * Uses a single fetch for both the "any update?" check and the data download,
   * avoiding a redundant round-trip.
   */
  const checkAndSync = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { shareCode, lastETag } = shareMetadata ?? {};
    if (!shareCode) return;

    // Without a known ETag we can't distinguish "new version" from "first fetch"
    if (!lastETag) return;

    setIsDownloadSyncing(true);
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

      // 200 → server has a newer version; apply it immediately
      if (res.status === 200) {
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
      // 304 → nothing to do
    } catch {
      // Network error – silently ignore
    } finally {
      setIsDownloadSyncing(false);
    }
  }, []);

  // 60-second polling interval (only for shared groups)
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    const interval = setInterval(checkAndSync, 60_000);
    return () => clearInterval(interval);
  }, [checkAndSync, group.shareMetadata?.shareCode]);

  // Check for updates whenever the page becomes visible again,
  // and immediately on mount.
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    // Sync immediately when entering the group
    checkAndSync();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndSync();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [checkAndSync, group.shareMetadata?.shareCode]);

  return {
    isSyncing: isUploadSyncing || isDownloadSyncing,
    shareDeletedNotice,
    dismissShareDeletedNotice: () => setShareDeletedNotice(false),
  };
}
