import { getStore } from "@netlify/blobs";
import type { Route } from "./+types/api.shares.$shareId";

// GET: Fetch group data (for receivers joining)
export async function loader({ params, request }: Route.LoaderArgs) {
  const { shareId } = params;
  const authHeader = request.headers.get("Authorization");
  const code = authHeader?.replace("Bearer ", "");
  const ifNoneMatch = request.headers.get("If-None-Match");

  const store = getStore("shares");

  // Pass the client's ETag so Netlify handles the conditional check:
  //   null        → 404 (blob not found)
  //   {data:null} → 304 (blob exists, etag matched)
  //   {data}      → 200 (blob exists, newer version)
  const blobResult = await store.getWithMetadata(shareId, {
    type: "json",
    etag: ifNoneMatch ?? undefined,
  }).catch(() => null);

  if (!blobResult) {
    return new Response("Not found", { status: 404 });
  }

  const { data, metadata, etag } = blobResult;
  const storedCode = metadata?.shareCode as string | undefined;

  if (!storedCode || storedCode !== code) {
    return new Response("Unauthorized", { status: 401 });
  }

  // data is null when Netlify returned 304 (client already has the latest version)
  if (data === null) {
    return new Response(null, { status: 304 });
  }

  return Response.json(data, {
    headers: etag ? { ETag: etag } : {},
  });
}

// POST/DELETE: Upload/update or remove group data (owner sharing)
export async function action({ params, request }: Route.ActionArgs) {
  const { shareId } = params;
  const authHeader = request.headers.get("Authorization");
  const code = authHeader?.replace("Bearer ", "");
  const ifMatch = request.headers.get("If-Match");

  if (!code || !/^\d{6}$/.test(code)) {
    return new Response("Bad Request: invalid code", { status: 400 });
  }

  const store = getStore("shares");

  if (request.method === "DELETE") {
    // Validate ownership before delete
    const existing = await store.getWithMetadata(shareId, { type: "json" }).catch(() => null);
    if (!existing) return new Response("Not found", { status: 404 });
    const storedCode = existing.metadata?.shareCode as string | undefined;
    if (storedCode !== code) return new Response("Unauthorized", { status: 401 });

    await store.delete(shareId);
    return new Response(null, { status: 204 });
  }

  // POST: update only (creation is handled by the server action in group.share.tsx)
  const existing = await store.getWithMetadata(shareId, { type: "json" }).catch(() => null);

  if (!existing) {
    return new Response("Not found", { status: 404 });
  }

  // Update: validate code matches
  const storedCode = existing.metadata?.shareCode as string | undefined;
  if (storedCode !== code) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();

  // Use onlyIfMatch for conditional update; Netlify returns modified:false on ETag mismatch
  const result = await store.setJSON(shareId, body, {
    onlyIfMatch: ifMatch ?? undefined,
    metadata: { shareCode: code },
  });

  if (!result.modified) {
    return new Response("Precondition Failed", { status: 412 });
  }

  if (!result.etag) {
    return new Response("Internal Server Error: missing ETag", { status: 500 });
  }

  return Response.json({ etag: result.etag }, {
    status: 200,
    headers: { ETag: result.etag },
  });
}
