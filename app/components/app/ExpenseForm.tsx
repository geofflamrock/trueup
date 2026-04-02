import { Form } from "react-router";
import { useState } from "react";
import type { ExpenseShare, Person } from "~/types";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { CustomSplitEditor } from "./CustomSplitEditor";

export type SplitType = "equal" | "custom";

interface ExpenseFormProps {
  formId: string;
  people: Person[];
  initialDescription?: string;
  initialAmount?: string;
  initialDate?: string;
  initialPaidById?: string;
  initialSplitType?: SplitType;
  initialShares?: ExpenseShare[];
  actions: (isValid: boolean) => React.ReactNode;
}

export function ExpenseForm({
  formId,
  people,
  initialDescription = "",
  initialAmount = "",
  initialDate = "",
  initialPaidById,
  initialSplitType = "equal",
  initialShares,
  actions,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(initialDescription);
  const [amount, setAmount] = useState(initialAmount);
  const [paidById, setPaidById] = useState(
    initialPaidById ?? people[0]?.id.toString() ?? "",
  );
  const [date, setDate] = useState(initialDate);
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType);
  const [shares, setShares] = useState<ExpenseShare[]>(
    initialShares ?? people.map((p) => ({ personId: p.id, amount: 0 })),
  );

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (splitType === "equal" && value) {
      const amountNum = parseFloat(value);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / people.length;
        setShares(
          people.map((p) => ({ personId: p.id, amount: equalShare })),
        );
      }
    }
  };

  const handleSplitTypeChange = (type: SplitType) => {
    setSplitType(type);
    if (type === "equal" && amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / people.length;
        setShares(
          people.map((p) => ({ personId: p.id, amount: equalShare })),
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
  const isValid = !!(
    amount && Math.abs(totalShares - parseFloat(amount)) < 0.01
  );
  const peopleItems = people.map((person) => ({
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
    <Form
      id={formId}
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
              value={paidById}
              onValueChange={(value) => setPaidById(value ?? paidById)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
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
                      ` Each person owes $${(parseFloat(amount) / people.length).toFixed(2)}.`}
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
              <CustomSplitEditor
                amount={amount}
                people={people}
                shares={shares}
                onUpdateShare={updateShare}
              />
            )}
            <input type="hidden" name="shares" />
          </RadioGroup>
          {actions(isValid)}
        </FieldGroup>
      </FieldSet>
    </Form>
  );
}
