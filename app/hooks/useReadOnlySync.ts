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
    const { isReadOnly, shareCode, id, lastETag } = groupRef.current;
    if (!isReadOnly || !shareCode) return;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${shareCode}`,
      };
      if (lastETag) headers["If-None-Match"] = lastETag;

      const res = await fetch(`/api/shares/${id}`, { headers });
      // 304 → nothing changed; 200 → new data available; anything else → ignore
      if (res.ok) {
        setHasUpdates(true);
      }
      // 304 Not Modified or error – no update available
    } catch {
      // Network error – silently ignore
    }
  }, []);

  /**
   * Downloads the latest group data and saves it to localStorage.
   * Returns the updated Group on success, or null on failure.
   */
  const syncNow = useCallback(async (): Promise<Group | null> => {
    const { isReadOnly, shareCode, id } = groupRef.current;
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
          isReadOnly: true,
          shareCode,
          lastETag: newEtag ?? undefined,
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
