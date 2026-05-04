/**
 * Uploads the current group data to the share blob.
 * Called after mutations when the group is shared.
 */
export async function syncSharedGroup(groupId: string, shareCode: string, lastETag?: string): Promise<string | null> {
  const { getGroup, markGroupShared } = await import("~/storage");
  const group = getGroup(groupId);
  if (!group) return null;

  // Don't sync read-only groups
  if (group.isReadOnly) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${shareCode}`,
  };
  if (lastETag) {
    headers["If-Match"] = lastETag;
  }

  const res = await fetch(`/api/shares/${groupId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(group),
  });

  if (res.ok) {
    const data = await res.json();
    markGroupShared(groupId, shareCode, data.etag);
    return data.etag;
  }

  return null;
}
