import { redirect, useLoaderData, Form, useNavigate } from "react-router";
import type { Route } from "./+types/group.share.stop";
import { getGroup, markGroupUnshared } from "../storage";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) throw new Response("Group not found", { status: 404 });
  return { group };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  const group = getGroup(params.groupId);
  if (group?.shareMetadata?.shareCode) {
    // Delete from server
    await fetch(`/api/shares/${params.groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${group.shareMetadata.shareCode}` },
    }).catch(() => {}); // ignore errors - still mark as unshared
  }
  markGroupUnshared(params.groupId);
  return redirect(`/${params.groupId}`);
}

export default function StopSharingPage({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Stop sharing"
      description="This will remove the shared link. Anyone with the link will no longer be able to access the group."
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" className="flex flex-col gap-2">
        <Button
          type="submit"
          size="xl"
          variant="destructive"
          className="cursor-pointer"
        >
          Stop sharing
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
    </DialogOrDrawer>
  );
}
