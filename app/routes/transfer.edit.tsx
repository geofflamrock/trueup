import {
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/transfer.edit";
import { getGroup, getTransfer, updateTransfer } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { parseDateToYYYYMMDD } from "~/lib/date-utils";
import { PageLayout } from "~/components/app/PageLayout";
import { ArrowLeft } from "lucide-react";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `True Up: ${loaderData?.group.name ?? ""}` },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

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
  const description = formData.get("description") as string;

  if (amount && paidById && paidToId && date && paidById !== paidToId) {
    updateTransfer(params.groupId, params.transferId, {
      amount,
      paidById,
      paidToId,
      date,
      description: description || undefined,
    });
  }

  return redirect(`/${params.groupId}`);
}

export default function EditTransfer() {
  const { group, transfer } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(transfer.amount.toString());
  const [description, setDescription] = useState(transfer.description || "");
  const [date, setDate] = useState(parseDateToYYYYMMDD(transfer.date));
  const [paidById, setPaidById] = useState(transfer.paidById.toString());
  const [paidToId, setPaidToId] = useState(transfer.paidToId.toString());

  const isValid = amount && paidById && paidToId && paidById !== paidToId;
  const peopleItems = group.people.map((person) => ({
    label: person.name,
    value: person.id.toString(),
  }));

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            className="cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            Edit Transfer
          </h1>
        </div>
      }
    >
      <Form id="edit-transfer" method="post" className="p-4">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="description">
                Description (optional)
              </FieldLabel>
              <Input
                type="text"
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Payment for dinner"
              />
            </Field>

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
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input
                type="date"
                id="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="paidById">From</FieldLabel>
              <Select
                name="paidById"
                items={peopleItems}
                value={paidById}
                onValueChange={(value) => setPaidById(value!)}
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
                items={peopleItems}
                value={paidToId}
                onValueChange={(value) => setPaidToId(value!)}
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

            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="submit"
                form="edit-transfer"
                size="xl"
                disabled={!isValid}
                className="cursor-pointer"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="text-destructive cursor-pointer"
                render={
                  <Link
                    to={`/${group.id}/transfers/${transfer.id}/delete`}
                    prefetch="viewport"
                    className="cursor-pointer"
                  >
                    Delete Transfer
                  </Link>
                }
              />
            </div>
          </FieldGroup>
        </FieldSet>
      </Form>
      <Outlet />
    </PageLayout>
  );
}
