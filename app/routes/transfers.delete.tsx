import { redirect, useLoaderData, Link, Form } from "react-router";
import type { Route } from "./+types/transfers.delete";
import { getGroup, getTransfer, deleteTransfer } from "../storage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
  const { group, transfer, getPersonName } = useLoaderData<typeof clientLoader>();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Delete Transfer?
        </h1>
        <p className="text-foreground mb-6">
          Are you sure you want to delete the transfer from <strong>{getPersonName(transfer.paidById)}</strong> to <strong>{getPersonName(transfer.paidToId)}</strong> (${transfer.amount.toFixed(2)})? This action cannot be undone.
        </p>
        <Form method="post" className="flex gap-3">
          <Button
            type="submit"
            variant="destructive"
            className="flex-1"
          >
            Delete Transfer
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link to={`/${group.id}`}>
              Cancel
            </Link>
          </Button>
        </Form>
      </Card>
    </main>
  );
}
