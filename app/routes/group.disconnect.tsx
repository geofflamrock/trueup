import { redirect, useLoaderData, Form, useNavigate } from "react-router";
import type { Route } from "./+types/group.disconnect";
import { getGroup, deleteGroup } from "../storage";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) throw new Response("Group not found", { status: 404 });
  return { group };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  deleteGroup(params.groupId);
  return redirect("/");
}

export default function DisconnectPage({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Disconnect from share"
      description={
        <span>
          This will remove <strong>{group.name}</strong> from your device. You
          will no longer receive updates. You can re-join using the original
          link and code.
        </span>
      }
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
          Disconnect
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
