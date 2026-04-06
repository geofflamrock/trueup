import { Link, redirect, useLoaderData, useSubmit } from "react-router";
import type { Route } from "./+types/expense.new";
import { getGroup, addExpense } from "../storage";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
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

const expenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z
      .number({
        error: "Amount is required",
      })
      .gt(0, "Amount must be greater than 0"),
    date: z.iso.date({ error: "Date is required" }),
    paidById: z.string().min(1, "Paid by is required"),
    shares: z
      .array(z.object({ personId: z.number(), amount: z.number() }))
      .min(1, "At least one share is required"),
  })
  .refine(
    (data) => {
      const totalShares = data.shares.reduce((sum, s) => sum + s.amount, 0);
      const sharesValid = Math.abs(totalShares - data.amount) < 0.01;
      return sharesValid;
    },
    { message: "Shares must add up to the total amount" },
  );

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

  return redirect(`/${params.groupId}`);
}

export type SplitType = "equal" | "custom";

export default function NewExpense() {
  const { group } = useLoaderData<typeof clientLoader>();
  const submit = useSubmit();
  const [splitType, setSplitType] = useState<SplitType>("equal");

  const form = useForm({
    defaultValues: {
      description: "",
      amount: undefined as unknown as number,
      date: getTodayYYYYMMDD(),
      paidById: group.people[0]?.id.toString() || "",
      shares: group.people.map((p) => ({ personId: p.id, amount: 0 })),
    },
    validators: {
      onSubmit: expenseSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.set("description", value.description);
      formData.set("amount", value.amount.toString());
      formData.set("date", value.date);
      formData.set("paidById", value.paidById);
      formData.set("shares", JSON.stringify(value.shares));
      submit(formData, { method: "post" });
    },
  });

  const handleAmountChange = (value: number) => {
    if (splitType === "equal" && value) {
      const equalShare = value / group.people.length;
      form.setFieldValue("shares", (shares) =>
        group.people.map((p) => ({ personId: p.id, amount: equalShare })),
      );
    }
  };

  const handleSplitTypeChange = (type: SplitType, currentAmount: number) => {
    setSplitType(type);
    if (type === "equal" && currentAmount) {
      const equalShare = currentAmount / group.people.length;
      form.setFieldValue(
        "shares",
        group.people.map((p) => ({ personId: p.id, amount: equalShare })),
      );
    }
  };

  const updateShare = (personId: number, value: string) => {
    const shareAmount = parseFloat(value) || 0;
    form.setFieldValue("shares", (shares) =>
      shares.map((s) =>
        s.personId === personId ? { ...s, amount: shareAmount } : s,
      ),
    );
  };

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
      <form
        id="new-expense"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="p-4"
      >
        <FieldSet>
          <FieldGroup>
            <form.Field name="description">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Input
                      type="text"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Hotel booking"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="amount">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                    <Input
                      type="number"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.handleChange(value);
                        handleAmountChange(value);
                      }}
                      step="0.01"
                      min="0"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="date">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                    <Input
                      type="date"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="paidById">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Paid By</FieldLabel>
                    <Select
                      name={field.name}
                      items={peopleItems}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value!)}
                    >
                      <SelectTrigger
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                      >
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {group.people.map((person) => (
                          <SelectItem
                            key={person.id}
                            value={person.id.toString()}
                          >
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe
              selector={(state) => ({
                amount: state.values.amount,
                shares: state.values.shares,
              })}
            >
              {({ amount, shares }) => (
                <RadioGroup
                  value={splitType}
                  onValueChange={(value) =>
                    handleSplitTypeChange(value as SplitType, amount)
                  }
                >
                  <FieldLabel>Split</FieldLabel>
                  <FieldLabel htmlFor="split-equal">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Equal</FieldTitle>
                        <FieldDescription>
                          Split the expense equally between everyone in the
                          group.
                          {!isNaN(amount) &&
                            amount > 0 &&
                            ` Each person owes $${(amount / group.people.length).toFixed(2)}.`}
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
                          Split the expense using custom amounts for each
                          person.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="custom" id="split-custom" />
                    </Field>
                  </FieldLabel>
                  {splitType === "custom" && (
                    <CustomSplitEditor
                      amount={amount}
                      people={group.people}
                      shares={shares}
                      onUpdateShare={updateShare}
                    />
                  )}
                </RadioGroup>
              )}
            </form.Subscribe>

            <div className="flex">
              <Button
                type="submit"
                size="xl"
                className="flex-1 sm:flex-initial cursor-pointer"
              >
                Save
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
    </PageLayout>
  );
}
