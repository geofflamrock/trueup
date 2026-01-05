import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/expenses.edit";
import { getGroup, getExpense, updateExpense } from "../storage";
import { useState } from "react";
import type { ExpenseShare } from "../types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";

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
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidById, setPaidById] = useState(expense.paidById.toString());
  const [splitType, setSplitType] = useState<"equal" | "custom">("custom");
  const [shares, setShares] = useState<ExpenseShare[]>(expense.shares);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (splitType === "equal" && value) {
      const amountNum = parseFloat(value);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(
          group.people.map((p) => ({ personId: p.id, amount: equalShare }))
        );
      }
    }
  };

  const handleSplitTypeChange = (type: "equal" | "custom") => {
    setSplitType(type);
    if (type === "equal" && amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(
          group.people.map((p) => ({ personId: p.id, amount: equalShare }))
        );
      }
    }
  };

  const updateShare = (personId: number, value: string) => {
    const shareAmount = parseFloat(value) || 0;
    setShares(
      shares.map((s) =>
        s.personId === personId ? { ...s, amount: shareAmount } : s
      )
    );
  };

  const totalShares = shares.reduce((sum, s) => sum + s.amount, 0);
  const isValid = amount && Math.abs(totalShares - parseFloat(amount)) < 0.01;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const sharesInput = form.querySelector(
      'input[name="shares"]'
    ) as HTMLInputElement;
    if (sharesInput) {
      sharesInput.value = JSON.stringify(shares);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link to={`/${group.id}`}>← Back to group</Link>
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">
          Edit Expense
        </h1>

        <Card className="p-6">
          <Form method="post" onSubmit={handleSubmit}>
            <input type="hidden" name="date" value={expense.date} />

            <div className="mb-6">
              <Label htmlFor="description">Description *</Label>
              <Input
                type="text"
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                step="0.01"
                min="0"
                required
                className="mt-2"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="paidById">Paid By *</Label>
              <select
                id="paidById"
                name="paidById"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                required
                className="mt-2 w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 outline-none"
              >
                {group.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label>Share per person *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSplitTypeChange("equal")}
                    variant={splitType === "equal" ? "default" : "outline"}
                    size="sm"
                  >
                    Split equally
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSplitTypeChange("custom")}
                    variant={splitType === "custom" ? "default" : "outline"}
                    size="sm"
                  >
                    Custom
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {group.people.map((person) => {
                  const share = shares.find((s) => s.personId === person.id);
                  return (
                    <div key={person.id} className="flex items-center gap-2">
                      <Label className="flex-1">{person.name}</Label>
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
                Total shares: ${totalShares.toFixed(2)}
                {!isValid && amount && (
                  <span className="text-destructive ml-2">
                    (must equal ${parseFloat(amount).toFixed(2)})
                  </span>
                )}
              </div>
              <input type="hidden" name="shares" />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!isValid} className="flex-1">
                Save Changes
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/${group.id}`}>Cancel</Link>
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </main>
  );
}
