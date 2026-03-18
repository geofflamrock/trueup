import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useSearchParams,
} from "react-router";
import type { Route } from "./+types/transfer.new";
import { getGroup, addTransfer } from "../storage";
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
import { getTodayYYYYMMDD } from "~/lib/date-utils";
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
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;

  if (amount && paidById && paidToId && date && paidById !== paidToId) {
    addTransfer(params.groupId, {
      amount,
      paidById,
      paidToId,
      date,
      description: description || undefined,
    });
  }

  return redirect(`/${params.groupId}`);
}

export default function NewTransfer() {
  const { group } = useLoaderData<typeof clientLoader>();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayYYYYMMDD());
  const [paidById, setPaidById] = useState(
    searchParams.get("from") || group.people[0]?.id.toString() || "",
  );
  const [paidToId, setPaidToId] = useState(
    searchParams.get("to") ||
      group.people[1]?.id.toString() ||
      group.people[0]?.id.toString() ||
      "",
  );

  const isValid = amount && paidById && paidToId && paidById !== paidToId;
  const peopleItems = group.people.map((person) => ({
    label: person.name,
    value: person.id.toString(),
  }));

  if (group.people.length < 2) {
    return (
      <PageLayout
        header={
          <div className="flex gap-4 items-center p-4">
            <Button
              variant="muted"
              size="icon-lg"
              render={
                <Link to={`/`} prefetch="viewport" className="cursor-pointer">
                  <ArrowLeft className="size-6" />
                </Link>
              }
            />
            <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
              Add Transfer
            </h1>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <p className="text-foreground">
            You need at least 2 people in the group before creating transfers.
          </p>
          <Button
            className="w-full"
            render={
              <Link
                to={`/${group.id}/edit`}
                prefetch="viewport"
                className="cursor-pointer"
              >
                Add People
              </Link>
            }
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            render={
              <Link
                to={`/${group.id}`}
                prefetch="viewport"
                className="cursor-pointer"
              >
                <ArrowLeft className="size-6" />
              </Link>
            }
          />
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            Add Transfer
          </h1>
        </div>
      }
    >
      <Form id="new-transfer" method="post" className="p-4">
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

            <div className="flex">
              <Button
                type="submit"
                form="new-transfer"
                size="xl"
                disabled={!isValid}
                className="flex-1 sm:flex-initial cursor-pointer"
              >
                Save
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </Form>
    </PageLayout>
  );
}
