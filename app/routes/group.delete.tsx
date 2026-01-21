import { redirect, useLoaderData, Link, Form, useNavigate } from "react-router";
import type { Route } from "./+types/group.delete";
import { deleteGroup, getGroup } from "../storage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  return { group };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  const success = deleteGroup(params.groupId);
  if (success) {
    return redirect("/");
  }
  return redirect(`/${params.groupId}`);
}

export default function DeleteGroup({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Delete Group"
      description={
        <span>
          Are you sure you want to delete <strong>{group.name}</strong>? This
          action cannot be undone.
        </span>
      }
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" className="flex flex-col gap-2">
        <Button type="submit" variant="destructive">
          Delete
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Form>
    </DialogOrDrawer>
  );
}
