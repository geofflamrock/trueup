import { getStore } from "@netlify/blobs";
import type { Route } from "./+types/api.shares.$shareId";

// GET: Fetch group data (for receivers joining)
export async function loader({ params, request }: Route.LoaderArgs) {
  const { shareId } = params;
  const authHeader = request.headers.get("Authorization");
  const code = authHeader?.replace("Bearer ", "");

  const store = getStore("shares");
  const blobResult = await store.getWithMetadata(shareId, { type: "json" }).catch(() => null);

  if (!blobResult) {
    return new Response("Not found", { status: 404 });
  }

  const { data, metadata } = blobResult;
  const storedCode = metadata?.shareCode as string | undefined;

  if (!storedCode || storedCode !== code) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Return Response with ETag header
  const etag = metadata?.etag as string | undefined;
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

  // POST: create or update
  const existing = await store.getWithMetadata(shareId, { type: "json" }).catch(() => null);

  if (existing) {
    // Update: validate code matches and ETag matches
    const storedCode = existing.metadata?.shareCode as string | undefined;
    if (storedCode !== code) return new Response("Unauthorized", { status: 401 });

    const storedEtag = existing.metadata?.etag as string | undefined;
    if (ifMatch && storedEtag && ifMatch !== storedEtag) {
      return new Response("Precondition Failed", { status: 412 });
    }
  }

  const body = await request.json();
  const newEtag = crypto.randomUUID();

  await store.setJSON(shareId, body, {
    metadata: { shareCode: code, etag: newEtag },
  });

  return Response.json({ etag: newEtag }, {
    status: existing ? 200 : 201,
    headers: { ETag: newEtag },
  });
}
