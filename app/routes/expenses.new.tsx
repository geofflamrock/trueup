import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/expenses.new";
import { getGroup, addExpense } from "../storage";
import { useState } from "react";
import type { ExpenseShare } from "../types";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  return { group };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
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
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(group.people[0]?.id.toString() || "");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [shares, setShares] = useState<ExpenseShare[]>(
    group.people.map((p) => ({ personId: p.id, amount: 0 }))
  );

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (splitType === "equal" && value) {
      const amountNum = parseFloat(value);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(group.people.map((p) => ({ personId: p.id, amount: equalShare })));
      }
    }
  };

  const handleSplitTypeChange = (type: "equal" | "custom") => {
    setSplitType(type);
    if (type === "equal" && amount) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum)) {
        const equalShare = amountNum / group.people.length;
        setShares(group.people.map((p) => ({ personId: p.id, amount: equalShare })));
      }
    }
  };

  const updateShare = (personId: number, value: string) => {
    const shareAmount = parseFloat(value) || 0;
    setShares(shares.map((s) => (s.personId === personId ? { ...s, amount: shareAmount } : s)));
  };

  const totalShares = shares.reduce((sum, s) => sum + s.amount, 0);
  const isValid = amount && totalShares === parseFloat(amount);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const sharesInput = form.querySelector('input[name="shares"]') as HTMLInputElement;
    if (sharesInput) {
      sharesInput.value = JSON.stringify(shares);
    }
  };

  if (group.people.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link
            to={`/${group.id}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to group
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-700 dark:text-gray-300">
              You need to add people to the group before creating expenses.
            </p>
            <Link
              to={`/${group.id}/edit`}
              className="mt-4 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Add People
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to={`/${group.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to group
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Add Expense
        </h1>

        <Form method="post" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Hotel booking"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="paidById" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paid By *
            </label>
            <select
              id="paidById"
              name="paidById"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Share per person *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSplitTypeChange("equal")}
                  className={`px-3 py-1 text-sm rounded ${
                    splitType === "equal"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Split equally
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitTypeChange("custom")}
                  className={`px-3 py-1 text-sm rounded ${
                    splitType === "custom"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {group.people.map((person) => {
                const share = shares.find((s) => s.personId === person.id);
                return (
                  <div key={person.id} className="flex items-center gap-2">
                    <label className="flex-1 text-gray-700 dark:text-gray-300">{person.name}</label>
                    <input
                      type="number"
                      value={share?.amount || 0}
                      onChange={(e) => updateShare(person.id, e.target.value)}
                      step="0.01"
                      min="0"
                      disabled={splitType === "equal"}
                      className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Total shares: ${totalShares.toFixed(2)}
              {!isValid && amount && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  (must equal ${parseFloat(amount).toFixed(2)})
                </span>
              )}
            </div>
            <input type="hidden" name="shares" />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isValid}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Add Expense
            </button>
            <Link
              to={`/${group.id}`}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
