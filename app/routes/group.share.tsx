import { Form, useActionData, useLoaderData, useNavigation, useNavigate } from "react-router";
import type { Route } from "./+types/group.share";
import { getStore } from "@netlify/blobs";
import { getGroup, markGroupShared, saveGroup, deleteGroup } from "../storage";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Globe, KeyRound } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const groupJson = formData.get("groupData") as string;

  if (!groupJson) {
    return { error: "Missing group data" };
  }

  let groupData: Record<string, unknown>;
  try {
    groupData = JSON.parse(groupJson);
  } catch {
    return { error: "Invalid group data" };
  }

  // Strip client-side share metadata before storing
  const { shareMetadata: _stripped, ...groupWithoutMeta } = groupData as { shareMetadata?: unknown; [key: string]: unknown };

  // Generate a new unique group/share ID for every share creation so that
  // disconnecting and re-sharing always creates a fresh, independent share.
  // Using 8 bytes (64 bits) for adequate collision resistance.
  const idBytes = new Uint8Array(8);
  crypto.getRandomValues(idBytes);
  const newGroupId = Array.from(idBytes, (b) => b.toString(16).padStart(2, "0")).join("");

  // Embed the new ID in the stored data so joining devices get the correct group ID
  const groupToStore = { ...groupWithoutMeta, id: newGroupId };

  // Generate unbiased 6-digit code using rejection sampling
  const digits: number[] = [];
  const buffer = new Uint8Array(32);
  while (digits.length < 6) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte < 250 && digits.length < 6) digits.push(byte % 10);
    }
  }
  const shareCode = digits.join("");

  let etag: string;
  try {
    const store = getStore("shares");
    const result = await store.setJSON(newGroupId, groupToStore, {
      onlyIfNew: true,
      metadata: { shareCode },
    });
    if (!result.modified) {
      return { error: "Failed to create share. Please try again." };
    }
    if (!result.etag) {
      return { error: "Failed to retrieve share token. Please try again." };
    }
    etag = result.etag;
  } catch {
    return { error: "Failed to upload share data. Please try again." };
  }

  const url = new URL(request.url);
  const groupName = (groupData.name as string) ?? "";
  const joinUrl = `${url.origin}/join/${newGroupId}?name=${encodeURIComponent(groupName)}`;

  return { shareId: newGroupId, shareCode, etag, joinUrl };
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) throw new Response("Group not found", { status: 404 });
  return { group };
}

export default function GroupSharePage({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === "submitting";

  // When action succeeds, persist share state to localStorage.
  // The action always generates a new group ID, so we need to migrate the group
  // from the old ID to the new one and navigate to the new URL.
  useEffect(() => {
    if (actionData && "shareCode" in actionData && actionData.shareCode && actionData.etag) {
      const newId = actionData.shareId as string;
      if (newId && newId !== group.id) {
        // New group ID — copy group data under new ID, mark as shared, delete old
        const { shareMetadata: _sm, ...groupWithoutMeta } = group;
        saveGroup({ ...groupWithoutMeta, id: newId });
        markGroupShared(newId, actionData.shareCode, actionData.etag);
        deleteGroup(group.id);
        navigate(`/${newId}/share`, { replace: true });
      } else {
        markGroupShared(group.id, actionData.shareCode, actionData.etag);
      }
    }
  }, [actionData, group.id, navigate]);

  // Extract values from the action result (if it was a successful share creation)
  const newShareData = actionData && "shareCode" in actionData && actionData.shareCode
    ? { shareCode: actionData.shareCode, joinUrl: actionData.joinUrl }
    : null;

  const showSharedStep = !!(newShareData ?? group.shareMetadata?.shareCode);

  const currentCode = newShareData?.shareCode ?? group.shareMetadata?.shareCode ?? "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = newShareData?.joinUrl
    ?? `${origin}/join/${group.id}?name=${encodeURIComponent(group.name)}`;

  const copyLink = () => navigator.clipboard.writeText(joinUrl);
  const copyCode = () => navigator.clipboard.writeText(currentCode);

  const errorMsg = actionData && "error" in actionData ? actionData.error : null;

  return (
    <DialogOrDrawer
      title={`Share ${group.name}`}
      open={true}
      onClose={() => navigate(-1)}
    >
      {!showSharedStep ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sharing <strong>{group.name}</strong> will upload it to the cloud.
            Anyone with the link and code can view and edit this group on their own device.
          </p>
          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {errorMsg}
            </div>
          )}
          <Form method="post" className="flex flex-col gap-2">
            <input type="hidden" name="groupData" value={JSON.stringify(group)} />
            <Button
              type="submit"
              size="xl"
              className="cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start sharing"}
            </Button>
            <Button
              type="button"
              size="xl"
              variant="muted"
              className="cursor-pointer"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </Form>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <p className="text-sm text-muted-foreground text-center">
            Anyone with this link and the 6-digit code can view and edit this group on
            their device.
          </p>
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <ItemGroup className="w-full">
            <Item variant="muted">
              <ItemMedia variant="icon">
                <Globe className="size-4" />
              </ItemMedia>
              <ItemContent className="overflow-hidden min-w-0">
                <ItemTitle className="text-sm font-normal truncate w-full">
                  {joinUrl}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="cursor-pointer"
                  onClick={copyLink}
                >
                  <Copy />
                </Button>
              </ItemActions>
            </Item>
            <Item variant="muted">
              <ItemMedia variant="icon">
                <KeyRound className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-2xl font-mono font-bold tracking-widest">
                  {currentCode}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="cursor-pointer"
                  onClick={copyCode}
                >
                  <Copy />
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
          <div className="flex flex-col w-full gap-2">
            <Button
              size="xl"
              className="cursor-pointer"
              onClick={() =>
                actionData && "shareId" in actionData && actionData.shareId
                  ? navigate(`/${actionData.shareId}`)
                  : navigate(-1)
              }
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </DialogOrDrawer>
  );
}
