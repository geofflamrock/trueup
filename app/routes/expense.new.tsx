import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/expense.new";
import { getGroup, addExpense } from "../storage";
import { useState } from "react";
import type { ExpenseShare } from "../types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "~/components/ui/field";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { CustomSplitEditor } from "~/components/app/CustomSplitEditor";
import { notifyGroupModified } from "~/lib/share-sync";

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
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paidById = parseInt(formData.get("paidById") as string);
  const sharesJson = formData.get("shares") as string;
  const date = formData.get("date") as string;

  if (description && amount && paidById && sharesJson && date) {
    const shares = JSON.parse(sharesJson);
    addExpense(params.groupId, {
      description,
      amount,
      paidById,
      shares,
      date,
    });
  }

  const updatedGroup = getGroup(params.groupId);
  if (updatedGroup?.shareMetadata?.shareCode) {
    notifyGroupModified(updatedGroup.id);
  }

  return redirect(`/${params.groupId}`);
}

export type SplitType = "equal" | "custom";

export default function NewExpense() {
  const { group } = useLoaderData<typeof clientLoader>();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(
    group.people[0]?.id.toString() || "",
  );
  const [date, setDate] = useState(getTodayYYYYMMDD());
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [shares, setShares] = useState<ExpenseShare[]>(
    group.people.map((p) => ({ personId: p.id, amount: 0 })),
  );

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (splitType === "equal" && value) {
      const amountNum = parseFloat(value);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(
          group.people.map((p) => ({ personId: p.id, amount: equalShare })),
        );
      }
    }
  };

  const handleSplitTypeChange = (type: SplitType) => {
    setSplitType(type);
    if (type === "equal" && amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(
          group.people.map((p) => ({ personId: p.id, amount: equalShare })),
        );
      }
    }
  };

  const updateShare = (personId: number, value: string) => {
    const shareAmount = parseFloat(value) || 0;
    setShares(
      shares.map((s) =>
        s.personId === personId ? { ...s, amount: shareAmount } : s,
      ),
    );
  };

  const totalShares = shares.reduce((sum, s) => sum + s.amount, 0);
  const isValid = amount && Math.abs(totalShares - parseFloat(amount)) < 0.01;
  const peopleItems = group.people.map((person) => ({
    label: person.name,
    value: person.id.toString(),
  }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const sharesInput = form.querySelector(
      'input[name="shares"]',
    ) as HTMLInputElement;
    if (sharesInput) {
      sharesInput.value = JSON.stringify(shares);
    }
  };

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
            New expense
          </h1>
        </div>
      }
    >
      <Form
        id="new-expense"
        method="post"
        onSubmit={handleSubmit}
        className="p-4"
      >
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                type="text"
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g., Hotel booking"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
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
              <FieldLabel htmlFor="paidById">Paid By</FieldLabel>
              <Select
                name="paidById"
                items={peopleItems}
                required
                defaultValue={group.people[0]?.id.toString() || ""}
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

            <RadioGroup
              value={splitType}
              onValueChange={(value) =>
                handleSplitTypeChange(value as SplitType)
              }
            >
              <FieldLabel>Split</FieldLabel>
              <FieldLabel htmlFor="split-equal">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Equal</FieldTitle>
                    <FieldDescription>
                      Split the expense equally between everyone in the group.
                      {amount &&
                        ` Each person owes $${(parseFloat(amount) / group.people.length).toFixed(2)}.`}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="equal" id="split-equal" />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="split-custom">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Custom</FieldTitle>
                    <FieldDescription>
                      Split the expense using custom amounts for each person.
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="custom" id="split-custom" />
                </Field>
              </FieldLabel>
              {splitType === "custom" && (
                <>
                  <CustomSplitEditor
                    amount={amount}
                    people={group.people}
                    shares={shares}
                    onUpdateShare={updateShare}
                  />
                </>
              )}
              <input type="hidden" name="shares" />
            </RadioGroup>
            <div className="flex">
              <Button
                type="submit"
                form="new-expense"
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
