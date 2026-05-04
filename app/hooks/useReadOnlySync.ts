import { useCallback, useEffect, useRef, useState } from "react";
import { saveGroup } from "~/storage";
import type { Group } from "~/types";

/**
 * Polls the share API for a read-only group and detects when the owner has
 * pushed new data.  Also checks on page-focus (visibilitychange).
 *
 * Returns:
 *   hasUpdates  – true when the server has a newer ETag than the local copy
 *   isSyncing   – true while a full download is in progress
 *   syncNow     – downloads the latest group data, saves it to localStorage,
 *                 and returns the updated Group so the caller can revalidate
 */
export function useReadOnlySync(group: Group) {
  const [hasUpdates, setHasUpdates] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Always reference the freshest group without recreating callbacks
  const groupRef = useRef(group);
  groupRef.current = group;

  /** Check whether the server has a newer version (uses If-None-Match). */
  const checkForUpdates = useCallback(async () => {
    const { shareMetadata, id } = groupRef.current;
    const { isReadOnly, shareCode, lastETag } = shareMetadata ?? {};
    if (!isReadOnly || !shareCode) return;

    // Without a known ETag we can't distinguish "new version" from "first fetch",
    // so skip silently rather than showing a false-positive update banner.
    if (!lastETag) return;

    try {
      const res = await fetch(`/api/shares/${id}`, {
        headers: {
          Authorization: `Bearer ${shareCode}`,
          "If-None-Match": lastETag,
        },
      });
      // 200 → server has a different version; 304 → already up to date
      if (res.status === 200) {
        setHasUpdates(true);
      }
    } catch {
      // Network error – silently ignore
    }
  }, []);

  /**
   * Downloads the latest group data and saves it to localStorage.
   * Returns the updated Group on success, or null on failure.
   */
  const syncNow = useCallback(async (): Promise<Group | null> => {
    const { shareMetadata, id } = groupRef.current;
    const { isReadOnly, shareCode } = shareMetadata ?? {};
    if (!isReadOnly || !shareCode) return null;

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
        setHasUpdates(false);
        return updated;
      }
    } catch {
      // Network error – caller can surface to user
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, []);

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

  return { hasUpdates, isSyncing, syncNow };
}
