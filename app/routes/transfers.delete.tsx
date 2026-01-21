import { redirect, useLoaderData, Link, Form, useNavigate } from "react-router";
import type { Route } from "./+types/transfers.delete";
import { getGroup, getTransfer, deleteTransfer } from "../storage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }

  const transfer = getTransfer(params.groupId, params.transferId);
  if (!transfer) {
    throw new Response("Transfer not found", { status: 404 });
  }

  const getPersonName = (id: number) =>
    group.people.find((p) => p.id === id)?.name || "Unknown";

  return { group, transfer, getPersonName };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  deleteTransfer(params.groupId, params.transferId);
  return redirect(`/${params.groupId}`);
}

export default function DeleteTransfer() {
  const { group, transfer, getPersonName } =
    useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Delete Transfer"
      description={
        <span>
          Are you sure you want to delete the transfer from{" "}
          <strong>{getPersonName(transfer.paidById)}</strong> to{" "}
          <strong>{getPersonName(transfer.paidToId)}</strong> ($
          {transfer.amount.toFixed(2)})? This action cannot be undone.
        </span>
      }
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="destructive" className="sm:flex-1">
          Delete
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="sm:flex-1"
        >
          Cancel
        </Button>
      </Form>
    </DialogOrDrawer>
  );
}
