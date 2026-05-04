import { Form, useActionData, useLoaderData, useNavigation, useNavigate } from "react-router";
import type { Route } from "./+types/group.share";
import { getStore } from "@netlify/blobs";
import { getGroup, markGroupShared } from "../storage";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2 } from "lucide-react";

export async function action({ params, request }: Route.ActionArgs) {
  const { groupId } = params;
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
  const { shareMetadata: _stripped, ...groupToStore } = groupData as { shareMetadata?: unknown; [key: string]: unknown };

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
    const result = await store.setJSON(groupId, groupToStore, {
      onlyIfNew: true,
      metadata: { shareCode },
    });
    if (!result.modified) {
      return { error: "A share for this group already exists. Stop sharing first and try again." };
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
  const joinUrl = `${url.origin}/join/${groupId}?name=${encodeURIComponent(groupName)}`;

  return { shareId: groupId, shareCode, etag, joinUrl };
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

  // When action succeeds, persist share state to localStorage
  useEffect(() => {
    if (actionData && "shareCode" in actionData && actionData.shareCode && actionData.etag) {
      markGroupShared(group.id, actionData.shareCode, actionData.etag);
    }
  }, [actionData, group.id]);

  // Extract values from the action result (if it was a successful share creation)
  const newShareData = actionData && "shareCode" in actionData && actionData.shareCode
    ? { shareCode: actionData.shareCode, joinUrl: actionData.joinUrl }
    : null;

  const showSharedStep = !!(newShareData ?? group.shareMetadata?.isShared);

  const currentCode = newShareData?.shareCode ?? group.shareMetadata?.shareCode ?? "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = newShareData?.joinUrl
    ?? `${origin}/join/${group.id}?name=${encodeURIComponent(group.name)}`;

  const formattedCode = currentCode.length === 6
    ? `${currentCode.slice(0, 3)} ${currentCode.slice(3)}`
    : currentCode;

  const copyLink = () => navigator.clipboard.writeText(joinUrl);
  const copyCode = () => navigator.clipboard.writeText(currentCode);
  const copyBoth = () =>
    navigator.clipboard.writeText(
      `Join my TrueUp group '${group.name}': ${joinUrl}\nCode: ${currentCode}`
    );

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
            Sharing this group will upload it to the cloud. Anyone with the link
            and 6-digit access code you create will be able to view this group
            on their own device and receive updates when you make changes.
          </p>
          <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
            <li>Group name: <strong>{group.name}</strong></li>
            <li>{group.people.length} people</li>
            <li>{group.expenses.length} expenses</li>
            <li>{group.transfers.length} transfers</li>
          </ul>
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
            Anyone with this link and the 6-digit code can view this group on
            their device.
          </p>
          <QRCodeSVG value={joinUrl} size={180} />
          <div className="flex w-full gap-2 items-center">
            <input
              readOnly
              value={joinUrl}
              className="flex-1 text-sm border rounded px-3 py-2 bg-muted text-muted-foreground overflow-hidden text-ellipsis"
            />
            <Button size="icon-lg" variant="muted" className="cursor-pointer shrink-0" onClick={copyLink}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex w-full items-center justify-between gap-4 bg-muted rounded-lg px-4 py-3">
            <span className="text-3xl font-mono font-bold tracking-widest">{formattedCode}</span>
            <Button size="icon-lg" variant="muted" className="cursor-pointer" onClick={copyCode}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col w-full gap-2">
            <Button size="xl" variant="muted" className="cursor-pointer" onClick={copyBoth}>
              <Share2 className="size-4" /> Re-share
            </Button>
            <Button size="xl" className="cursor-pointer" onClick={() => navigate(-1)}>
              Done
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="text-destructive cursor-pointer"
              onClick={() => navigate(`/${group.id}/share/stop`)}
            >
              Stop sharing
            </Button>
          </div>
        </div>
      )}
    </DialogOrDrawer>
  );
}
