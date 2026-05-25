import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import {
  disconnectGroup,
  getAllGroups,
  getGroup,
  markGroupShared,
  saveGroup,
} from "~/storage";
import type { Group } from "~/types";

// How often to check for local changes that need uploading (fast)
const SYNC_INTERVAL_MS = 10_000; // 10 seconds
// Minimum time between cloud polls per group
const CLOUD_POLL_INTERVAL_MS = 60_000; // 60 seconds

const LAST_SYNCED_KEY = "trueup-last-synced";

type SyncErrorType = "deleted" | "error";

interface SyncError {
  groupId: string;
  groupName: string;
  type: SyncErrorType;
}

interface SyncContextValue {
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextValue>({ isSyncing: false });

export function useSyncContext() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  // Only run in browser
  if (typeof window === "undefined") {
    return <SyncContext.Provider value={{ isSyncing: false }}>{children}</SyncContext.Provider>;
  }
  return <SyncProviderClient>{children}</SyncProviderClient>;
}

function SyncProviderClient({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);
  const { revalidate } = useRevalidator();

  // Tracks the lastModified value at the time of each group's last successful sync.
  // Keyed by group ID.
  const lastSyncedModifiedRef = useRef<Record<string, string | undefined>>({});

  // Timestamp of the last cloud poll (shared across all groups).
  const lastCloudCheckRef = useRef<number>(0);

  // Tracks whether the sync function is currently running to prevent overlap.
  const isSyncingRef = useRef(false);

  // Keep a stable reference to avoid stale closures in effects.
  const syncErrorsRef = useRef(syncErrors);
  syncErrorsRef.current = syncErrors;

  // Initialize lastSyncedModified from current groups on mount.
  useEffect(() => {
    const groups = getAllGroups().filter((g) => g.shareMetadata?.shareCode);
    const initial: Record<string, string | undefined> = {};
    for (const g of groups) {
      initial[g.id] = g.lastModified;
    }
    lastSyncedModifiedRef.current = initial;
  }, []);

  const syncAll = useCallback(async () => {
    if (isSyncingRef.current) return;
    const sharedGroups = getAllGroups().filter((g) => g.shareMetadata?.shareCode);
    if (sharedGroups.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    const now = Date.now();
    const shouldCheckCloud = now - lastCloudCheckRef.current >= CLOUD_POLL_INTERVAL_MS;

    const newErrors: SyncError[] = [...syncErrorsRef.current];
    let cloudChecked = false;

    for (const group of sharedGroups) {
      const { shareCode, lastETag } = group.shareMetadata!;
      if (!shareCode) continue;

      const hasLocalChange =
        group.lastModified !== undefined &&
        group.lastModified !== lastSyncedModifiedRef.current[group.id];

      if (hasLocalChange) {
        // ── Upload local changes ──────────────────────────────────────────
        const { shareMetadata: _sm, lastModified: _lm, ...groupToUpload } = group;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shareCode}`,
        };
        if (lastETag) headers["If-Match"] = lastETag;

        try {
          const res = await fetch(`/api/shares/${group.id}`, {
            method: "POST",
            headers,
            body: JSON.stringify(groupToUpload),
          });

          if (res.ok) {
            const data = await res.json();
            markGroupShared(group.id, shareCode, data.etag);
            const fresh = getGroup(group.id);
            lastSyncedModifiedRef.current[group.id] =
              fresh?.lastModified ?? lastSyncedModifiedRef.current[group.id];
          }
        } catch {
          // Network error — retain current lastSyncedModified so we retry
        }

        // Skip cloud check after an upload this cycle
        continue;
      }

      // ── Check cloud for newer version ─────────────────────────────────
      if (!shouldCheckCloud || !lastETag) continue;

      cloudChecked = true;

      try {
        const res = await fetch(`/api/shares/${group.id}`, {
          headers: {
            Authorization: `Bearer ${shareCode}`,
            "If-None-Match": lastETag,
          },
        });

        if (res.status === 404) {
          disconnectGroup(group.id);
          // Add or update error entry
          const idx = newErrors.findIndex((e) => e.groupId === group.id);
          const entry: SyncError = { groupId: group.id, groupName: group.name, type: "deleted" };
          if (idx >= 0) newErrors[idx] = entry;
          else newErrors.push(entry);
          revalidate();
        } else if (res.status === 200) {
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
          const saved = getGroup(group.id);
          lastSyncedModifiedRef.current[group.id] =
            saved?.lastModified ?? lastSyncedModifiedRef.current[group.id];
          revalidate();
        }
        // 304 → nothing to do
      } catch {
        // Network error — will retry on next interval
      }
    }

    if (cloudChecked || shouldCheckCloud) {
      lastCloudCheckRef.current = now;
      try {
        localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
      } catch {
        // Ignore storage errors
      }
    }

    if (JSON.stringify(newErrors) !== JSON.stringify(syncErrorsRef.current)) {
      setSyncErrors(newErrors);
    }

    isSyncingRef.current = false;
    setIsSyncing(false);
  }, [revalidate]);

  // ── Periodic interval ─────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(syncAll, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncAll]);

  // ── Immediate sync on mount ───────────────────────────────────────────────
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // ── Re-sync on page regaining focus ──────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") syncAll();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [syncAll]);

  const dismissError = (groupId: string) => {
    setSyncErrors((prev) => prev.filter((e) => e.groupId !== groupId));
  };

  return (
    <SyncContext.Provider value={{ isSyncing }}>
      {children}
      {syncErrors.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col gap-2 p-4 container mx-auto max-w-4xl pointer-events-none">
          {syncErrors.map((error) => (
            <div
              key={error.groupId}
              className="pointer-events-auto flex items-start justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <span>
                {error.type === "deleted"
                  ? `The share for "${error.groupName}" has been deleted. This group is no longer synced.`
                  : `Sync failed for "${error.groupName}". Changes may not have been saved.`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0 cursor-pointer text-destructive"
                onClick={() => dismissError(error.groupId)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </SyncContext.Provider>
  );
}
