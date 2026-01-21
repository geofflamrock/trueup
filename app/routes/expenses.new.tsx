import { Form, Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/expenses.new";
import { getGroup, addExpense } from "../storage";
import { useState } from "react";
import type { ExpenseShare } from "../types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

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

  if (description && amount && paidById && sharesJson) {
    const shares = JSON.parse(sharesJson);
    addExpense(params.groupId, {
      description,
      amount,
      paidById,
      shares,
      date: new Date().toISOString(),
    });
  }

  return redirect(`/${params.groupId}`);
}

export default function NewExpense() {
  const { group } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(
    group.people[0]?.id.toString() || "",
  );
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
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

  const handleSplitTypeChange = (type: "equal" | "custom") => {
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

  if (group.people.length === 0) {
    return (
      <DialogOrDrawer
        title="Add Expense"
        open={true}
        onClose={() => navigate(-1)}
      >
        <div className="space-y-4">
          <p className="text-foreground">
            You need to add people to the group before creating expenses.
          </p>
          <Button asChild className="w-full">
            <Link to={`/${group.id}/edit`}>Add People</Link>
          </Button>
        </div>
      </DialogOrDrawer>
    );
  }

  return (
    <DialogOrDrawer
      title="Add Expense"
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" onSubmit={handleSubmit}>
        <div className="mb-6">
          <Label htmlFor="description">Description *</Label>
          <Input
            type="text"
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="e.g., Hotel booking"
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

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
          <Button
            type="submit"
            size="xl"
            disabled={!isValid}
            className="sm:flex-1 cursor-pointer"
          >
            Add Expense
          </Button>
          <Button
            type="button"
            size="xl"
            variant="muted"
            className="sm:flex-1 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </DialogOrDrawer>
  );
}
