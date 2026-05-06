import { redirect, useLoaderData, Form, useNavigate, useActionData } from "react-router";
import type { Route } from "./+types/group.share.delete";
import { getGroup, disconnectGroup } from "../storage";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { Input } from "~/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { useState } from "react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) throw new Response("Group not found", { status: 404 });
  return { group };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  const group = getGroup(params.groupId);
  if (!group?.shareMetadata?.shareCode) {
    return redirect(`/${params.groupId}`);
  }

  // Delete the share blob from the cloud
  try {
    const res = await fetch(`/api/shares/${params.groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${group.shareMetadata.shareCode}` },
    });
    // 204 = deleted, 404 = already gone — both are fine
    if (!res.ok && res.status !== 404) {
      return { error: "Failed to delete share. Please try again." };
    }
  } catch {
    return { error: "Failed to delete share. Please check your connection and try again." };
  }

  disconnectGroup(params.groupId);
  return redirect(`/${params.groupId}`);
}

export default function DeleteSharePage({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const actionData = useActionData<typeof clientAction>();
  const navigate = useNavigate();
  const [confirmName, setConfirmName] = useState("");
  const isConfirmed = confirmName.trim() === group.name;
  const errorMsg = actionData && "error" in actionData ? actionData.error : null;

  return (
    <DialogOrDrawer
      title="Delete share"
      description="This will permanently delete the share from the cloud. All devices connected to this share will be automatically disconnected the next time they sync."
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Type &ldquo;{group.name}&rdquo; to confirm</FieldLabel>
            <Input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
            />
          </Field>
        </FieldGroup>
        {errorMsg && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {errorMsg}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            size="xl"
            variant="destructive"
            className="cursor-pointer"
            disabled={!isConfirmed}
          >
            Delete share
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
        </div>
      </Form>
    </DialogOrDrawer>
  );
}
