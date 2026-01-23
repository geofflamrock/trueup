import { Form, Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/transfers.new";
import { getGroup, addTransfer } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
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
  return { group };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const amount = parseFloat(formData.get("amount") as string);
  const paidById = parseInt(formData.get("paidById") as string);
  const paidToId = parseInt(formData.get("paidToId") as string);

  if (amount && paidById && paidToId && paidById !== paidToId) {
    addTransfer(params.groupId, {
      amount,
      paidById,
      paidToId,
      date: new Date().toISOString(),
    });
  }

  return redirect(`/${params.groupId}`);
}

export default function NewTransfer() {
  const { group } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(
    group.people[0]?.id.toString() || "",
  );
  const [paidToId, setPaidToId] = useState(
    group.people[1]?.id.toString() || group.people[0]?.id.toString() || "",
  );

  const isValid = amount && paidById && paidToId && paidById !== paidToId;

  if (group.people.length < 2) {
    return (
      <DialogOrDrawer
        title="Add Transfer"
        open={true}
        onClose={() => navigate(-1)}
      >
        <div className="space-y-4">
          <p className="text-foreground">
            You need at least 2 people in the group before creating transfers.
          </p>
          <Button asChild className="w-full">
            <Link to={`/${group.id}/edit`} prefetch="viewport">
              Add People
            </Link>
          </Button>
        </div>
      </DialogOrDrawer>
    );
  }

  return (
    <DialogOrDrawer
      title="Add Transfer"
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post">
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
                Add Transfer
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
          </FieldGroup>
        </FieldSet>
      </Form>
    </DialogOrDrawer>
  );
}
