import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/transfers.edit";
import { getGroup, getTransfer, updateTransfer } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
  
  return { group, transfer };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const amount = parseFloat(formData.get("amount") as string);
  const paidById = parseInt(formData.get("paidById") as string);
  const paidToId = parseInt(formData.get("paidToId") as string);
  const date = formData.get("date") as string;
  
  if (amount && paidById && paidToId && date && paidById !== paidToId) {
    updateTransfer(params.groupId, params.transferId, {
      amount,
      paidById,
      paidToId,
      date,
    });
  }
  
  return redirect(`/${params.groupId}`);
}

export default function EditTransfer() {
  const { group, transfer } = useLoaderData<typeof clientLoader>();
  const [amount, setAmount] = useState(transfer.amount.toString());
  const [paidById, setPaidById] = useState(transfer.paidById.toString());
  const [paidToId, setPaidToId] = useState(transfer.paidToId.toString());

  const isValid = amount && paidById && paidToId && paidById !== paidToId;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          asChild
          variant="ghost"
          className="mb-4"
        >
          <Link to={`/${group.id}`}>
            ← Back to group
          </Link>
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">
          Edit Transfer
        </h1>

        <Card className="p-6">
          <Form method="post">
            <input type="hidden" name="date" value={transfer.date} />
            
            <div className="mb-6">
              <Label htmlFor="amount">
                Amount *
              </Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                className="mt-2"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="paidById">
                From *
              </Label>
              <select
                id="paidById"
                name="paidById"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                required
                className="mt-2 w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 outline-none"
              >
                {group.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <Label htmlFor="paidToId">
                To *
              </Label>
              <select
                id="paidToId"
                name="paidToId"
                value={paidToId}
                onChange={(e) => setPaidToId(e.target.value)}
                required
                className="mt-2 w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 outline-none"
              >
                {group.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            {paidById === paidToId && (
              <div className="mb-6 px-4 py-2 bg-destructive/10 text-destructive rounded-lg">
                Cannot transfer to the same person
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!isValid}
                className="flex-1"
              >
                Save Changes
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
            </div>
          </Form>
        </Card>
      </div>
    </main>
  );
}
