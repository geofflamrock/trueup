import { useCallback, useEffect, useRef, useState } from "react";
import { getGroup, saveGroup, disconnectGroup, markGroupShared } from "~/storage";
import type { Group } from "~/types";

/**
 * Unified hook for shared group sync (upload and download).
 *
 * Uses group.lastModified to detect local changes:
 * - saveGroup() stamps every write with a new ISO timestamp.
 * - The hook tracks lastSyncedModified (the lastModified at the time of the
 *   last successful sync).  When group.lastModified differs, a local mutation
 *   occurred and the group is uploaded.
 * - Polling (60 s) and visibilitychange triggers check the cloud for newer
 *   versions using If-None-Match.
 * - A single sync() function handles both directions so there is no need for
 *   module-level listeners or complex ref/callback chains.
 */
export function useSharedGroupSync(group: Group, revalidate: () => void) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareDeletedNotice, setShareDeletedNotice] = useState(false);

  // The lastModified value at the time of the last successful sync.
  // Initialised to the group's current value so that loading an already-saved
  // group does not trigger an immediate spurious upload.
  const lastSyncedModified = useRef<string | undefined>(group.lastModified);

  // Keep a fresh reference to revalidate without triggering effect re-runs.
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  /**
   * Single sync function: uploads local changes if detected, then checks the
   * cloud for newer versions.  All state transitions happen here.
   */
  const sync = useCallback(async () => {
    const currentGroup = getGroup(group.id);
    if (!currentGroup) return;

    const { shareCode, lastETag } = currentGroup.shareMetadata ?? {};
    if (!shareCode) return;

    setIsSyncing(true);
    try {
      // ── 1. Upload local changes if lastModified advanced ─────────────────
      const hasLocalChange =
        currentGroup.lastModified !== undefined &&
        currentGroup.lastModified !== lastSyncedModified.current;

      if (hasLocalChange) {
        // Strip client-only fields before uploading
        const {
          shareMetadata: _sm,
          lastModified: _lm,
          ...groupToUpload
        } = currentGroup;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shareCode}`,
        };
        if (lastETag) headers["If-Match"] = lastETag;

        try {
          const res = await fetch(`/api/shares/${currentGroup.id}`, {
            method: "POST",
            headers,
            body: JSON.stringify(groupToUpload),
          });

          if (res.ok) {
            const data = await res.json();
            // markGroupShared saves shareMetadata (incl. new ETag) and updates
            // lastModified again; read it fresh so our ref stays in sync.
            markGroupShared(currentGroup.id, shareCode, data.etag);
            const fresh = getGroup(currentGroup.id);
            // Fall back to current value so we don't re-trigger an upload if
            // getGroup() unexpectedly returns null.
            lastSyncedModified.current = fresh?.lastModified ?? lastSyncedModified.current;
          }
        } catch {
          // Network error — leave lastSyncedModified unchanged so we retry
        }

        // We just uploaded our version; skip the download check this cycle.
        return;
      }

      // ── 2. Check cloud for a newer version ───────────────────────────────
      if (!lastETag) return;

      const res = await fetch(`/api/shares/${currentGroup.id}`, {
        headers: {
          Authorization: `Bearer ${shareCode}`,
          "If-None-Match": lastETag,
        },
      });

      if (res.status === 404) {
        // Share deleted remotely — disconnect locally and surface a notice
        disconnectGroup(currentGroup.id);
        setShareDeletedNotice(true);
        revalidateRef.current();
        return;
      }

      if (res.status === 200) {
        // Newer version available — save it and update our sync marker so
        // the subsequent revalidation does not trigger an upload.
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
        const saved = getGroup(currentGroup.id);
        // Fall back to current value so we don't re-trigger an upload if
        // getGroup() unexpectedly returns null after the save.
        lastSyncedModified.current = saved?.lastModified ?? lastSyncedModified.current;
        revalidateRef.current();
      }
      // 304 → nothing to do
    } catch {
      // Silently ignore unexpected errors
    } finally {
      setIsSyncing(false);
    }
  }, [group.id]);

  // ── Trigger: local group changed ──────────────────────────────────────────
  // Fires on mount (performs the initial cloud check) and whenever the group
  // is saved locally (new lastModified means a mutation occurred).
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.lastModified, group.shareMetadata?.shareCode]);

  // ── Trigger: periodic poll every 60 seconds ───────────────────────────────
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    const interval = setInterval(sync, 60_000);
    return () => clearInterval(interval);
  }, [group.shareMetadata?.shareCode, sync]);

  // ── Trigger: page regains focus ───────────────────────────────────────────
  useEffect(() => {
    if (!group.shareMetadata?.shareCode) return;
    const handler = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [group.shareMetadata?.shareCode, sync]);

  return {
    isSyncing,
    shareDeletedNotice,
    dismissShareDeletedNotice: () => setShareDeletedNotice(false),
  };
}
