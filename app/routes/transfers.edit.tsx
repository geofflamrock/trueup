import { Form, Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/transfers.edit";
import { getGroup, getTransfer, updateTransfer } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "~/components/ui/field";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
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
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [amount, setAmount] = useState(transfer.amount.toString());
  const [paidById, setPaidById] = useState(transfer.paidById.toString());
  const [paidToId, setPaidToId] = useState(transfer.paidToId.toString());

  const isValid = amount && paidById && paidToId && paidById !== paidToId;

  return (
    <DialogOrDrawer
      title="Edit Transfer"
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post">
        <input type="hidden" name="date" value={transfer.date} />
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="paidById">From</FieldLabel>
              <Select
                name="paidById"
                value={paidById}
                onValueChange={(value) => setPaidById(value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {group.people.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="paidToId">To</FieldLabel>
              <Select
                name="paidToId"
                value={paidToId}
                onValueChange={(value) => setPaidToId(value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {group.people.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {paidById === paidToId && (
              <div className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg">
                Cannot transfer to the same person
              </div>
            )}

            <Field orientation={isDesktop ? "horizontal" : "vertical"}>
              <Button
                type="submit"
                size={isDesktop ? "lg" : "xl"}
                disabled={!isValid}
                className="sm:flex-1 cursor-pointer"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                size={isDesktop ? "lg" : "xl"}
                variant="muted"
                className="sm:flex-1 cursor-pointer"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </Field>
            <Field>
              <Button
                asChild
                variant="ghost"
                size={isDesktop ? "lg" : "xl"}
                className="w-full text-destructive cursor-pointer"
              >
                <Link to={`/${group.id}/transfers/${transfer.id}/delete`}>
                  Delete Transfer
                </Link>
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </Form>
    </DialogOrDrawer>
  );
}
