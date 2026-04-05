import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "react-router";
import type { Route } from "./+types/transfer.edit";
import { getGroup, getTransfer, updateTransfer } from "../storage";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "~/components/ui/field";
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

const transferSchema = z
  .object({
    description: z.string(),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
        "Amount must be greater than 0",
      ),
    date: z.string().min(1, "Date is required"),
    paidById: z.string().min(1, "From person is required"),
    paidToId: z.string().min(1, "To person is required"),
  })
  .refine((data) => data.paidById !== data.paidToId, {
    message: "Cannot transfer to the same person",
    path: ["paidToId"],
  });

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
  const submit = useSubmit();

  const form = useForm({
    defaultValues: {
      description: transfer.description || "",
      amount: transfer.amount.toString(),
      date: parseDateToYYYYMMDD(transfer.date),
      paidById: transfer.paidById.toString(),
      paidToId: transfer.paidToId.toString(),
    },
    validators: {
      onSubmit: transferSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.set("description", value.description || "");
      formData.set("amount", value.amount);
      formData.set("date", value.date);
      formData.set("paidById", value.paidById);
      formData.set("paidToId", value.paidToId);
      submit(formData, { method: "post" });
    },
  });

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
            Edit transfer
          </h1>
        </div>
      }
    >
      <form
        id="edit-transfer"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="p-4"
      >
        <FieldSet>
          <FieldGroup>
            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Description (optional)
                  </FieldLabel>
                  <Input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Payment for dinner"
                  />
                </Field>
              )}
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
                    <FieldLabel>From</FieldLabel>
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

            <form.Field name="paidToId">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>To</FieldLabel>
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

            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="submit"
                size="xl"
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
                    Delete transfer
                  </Link>
                }
              />
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
      <Outlet />
    </PageLayout>
  );
}
