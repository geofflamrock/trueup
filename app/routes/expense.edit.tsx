import {
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/expense.edit";
import { getGroup, getExpense, updateExpense } from "../storage";
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
import type { SplitType } from "./expense.new";
import { parseDateToYYYYMMDD, parseYYYYMMDDDate } from "~/lib/date-utils";
import { PageLayout } from "~/components/app/PageLayout";
import { ArrowLeft, ChevronDownIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { CustomSplitEditor } from "~/components/app/CustomSplitEditor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "~/components/ui/calendar";

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

  const expense = getExpense(params.groupId, params.expenseId);
  if (!expense) {
    throw new Response("Expense not found", { status: 404 });
  }

  return { group, expense };
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
    updateExpense(params.groupId, params.expenseId, {
      description,
      amount,
      paidById,
      shares,
      date,
    });
  }

  return redirect(`/${params.groupId}`);
}

type DatePickerProps = {
  date: Date;
  onSelect: (date: Date) => void;
  id?: string;
};

function DatePicker({ date, onSelect, id }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="xl"
            data-empty={!date}
            className="justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          defaultMonth={date}
          required
          id={id}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function EditExpense() {
  const { group, expense } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidById, setPaidById] = useState(expense.paidById.toString());
  const [date, setDate] = useState(parseYYYYMMDDDate(expense.date));
  const [splitType, setSplitType] = useState<SplitType>(() => {
    if (!expense.shares || expense.shares.length === 0) return "custom";
    const first = expense.shares[0].amount;
    const allEqual = expense.shares.every(
      (s) => Math.abs(s.amount - first) < 0.01,
    );
    return allEqual ? "equal" : "custom";
  });
  const [shares, setShares] = useState<ExpenseShare[]>(expense.shares);

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
            className="cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            Edit expense
          </h1>
        </div>
      }
    >
      <Form
        id="edit-expense"
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
              <DatePicker id="date" date={date} onSelect={setDate} />
            </Field>

            <Field>
              <FieldLabel htmlFor="paidById">Paid By</FieldLabel>
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
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="submit"
                form="edit-expense"
                size="xl"
                disabled={!isValid}
                className="cursor-pointer"
              >
                Save
              </Button>
              <Button
                render={
                  <Link
                    to={`/${group.id}/expenses/${expense.id}/delete`}
                    prefetch="viewport"
                    className="cursor-pointer"
                  >
                    Delete expense
                  </Link>
                }
                variant="ghost"
                size="xl"
                className="cursor-pointer text-destructive"
              />
            </div>
          </FieldGroup>
        </FieldSet>
      </Form>
      <Outlet />
    </PageLayout>
  );
}
