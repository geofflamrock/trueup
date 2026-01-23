import { Form, Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/expenses.edit";
import { getGroup, getExpense, updateExpense } from "../storage";
import { useState } from "react";
import type { ExpenseShare } from "../types";
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
import type { SplitType } from "./expenses.new";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

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

export default function EditExpense() {
  const { group, expense } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidById, setPaidById] = useState(expense.paidById.toString());
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
    <DialogOrDrawer
      title="Edit Expense"
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" onSubmit={handleSubmit}>
        <input type="hidden" name="date" value={expense.date} />
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
              <FieldLabel htmlFor="paidById">Paid By</FieldLabel>
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
              <div className="flex justify-between items-center">
                <FieldLabel>Share per person</FieldLabel>
                <div className="flex gap-2">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={splitType}
                    onValueChange={(value) =>
                      handleSplitTypeChange(value as SplitType)
                    }
                  >
                    <ToggleGroupItem value="equal">
                      Split equally
                    </ToggleGroupItem>
                    <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <div className="space-y-2">
                {group.people.map((person) => {
                  const share = shares.find((s) => s.personId === person.id);
                  return (
                    <div key={person.id} className="flex items-center gap-2">
                      <p className="flex-1">{person.name}</p>
                      <Input
                        type="number"
                        value={share?.amount || 0}
                        onChange={(e) => updateShare(person.id, e.target.value)}
                        step="0.01"
                        min="0"
                        disabled={splitType === "equal"}
                        className="w-32"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Total: ${totalShares.toFixed(2)}
                {!isValid && amount && (
                  <span className="text-destructive ml-2">
                    (must equal ${parseFloat(amount).toFixed(2)})
                  </span>
                )}
              </div>
              <input type="hidden" name="shares" />
            </Field>

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
          </FieldGroup>
        </FieldSet>
      </Form>
    </DialogOrDrawer>
  );
}
