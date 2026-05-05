import { useCallback, useEffect, useRef, useState } from "react";
import { saveGroup } from "~/storage";
import type { Group } from "~/types";

/**
 * Polls the share API for a read-only group and automatically applies updates.
 * Also checks on page-focus (visibilitychange).
 *
 * Automatically downloads and saves the latest group data whenever the server
 * reports a newer version, then calls `revalidate` to refresh the UI.
 *
 * Returns:
 *   isSyncing – true while a full download is in progress
 */
export function useReadOnlySync(group: Group, revalidate: () => void) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Always reference the freshest group/revalidate without recreating callbacks
  const groupRef = useRef(group);
  groupRef.current = group;
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  /** Downloads the latest group, saves to localStorage, and revalidates. */
  const syncNow = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { isReadOnly, shareCode } = shareMetadata ?? {};
    if (!isReadOnly || !shareCode) return;

    setIsSyncing(true);
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
            isReadOnly: true,
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
      setIsSyncing(false);
    }
  }, []);

  /** Checks for updates via If-None-Match; auto-syncs if a newer version exists. */
  const checkForUpdates = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { isReadOnly, shareCode, lastETag } = shareMetadata ?? {};
    if (!isReadOnly || !shareCode) return;

    // Without a known ETag we can't distinguish "new version" from "first fetch"
    if (!lastETag) return;

    try {
      const res = await fetch(`/api/shares/${id}`, {
        headers: {
          Authorization: `Bearer ${shareCode}`,
          "If-None-Match": lastETag,
        },
      });
      // 200 → server has a newer version; automatically apply it
      if (res.status === 200) {
        await syncNow();
      }
    } catch {
      // Network error – silently ignore
    }
  }, [syncNow]);

  // 60-second polling interval
  useEffect(() => {
    const interval = setInterval(checkForUpdates, 60_000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Check for updates whenever the page becomes visible again
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [checkForUpdates]);

  return { isSyncing };
}
