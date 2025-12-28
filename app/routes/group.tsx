import { Form, Link, redirect, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/group";
import { getGroup, addPerson, addExpense, addTransfer } from "../storage";
import { calculateBalances } from "../balances";
import { useState } from "react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  const balances = calculateBalances(group);
  return { group, balances };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "addPerson") {
    const name = formData.get("name") as string;
    if (name) {
      addPerson(params.groupId, name);
    }
  } else if (actionType === "addExpense") {
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
  } else if (actionType === "addTransfer") {
    const amount = parseFloat(formData.get("amount") as string);
    const paidById = parseInt(formData.get("paidById") as string);
    const paidToId = parseInt(formData.get("paidToId") as string);
    
    if (amount && paidById && paidToId) {
      addTransfer(params.groupId, {
        amount,
        paidById,
        paidToId,
        date: new Date().toISOString(),
      });
    }
  }

  return null;
}

export default function GroupPage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddTransfer, setShowAddTransfer] = useState(false);

  // Combine expenses and transfers into a timeline
  const timeline = [
    ...group.expenses.map((e) => ({ type: "expense" as const, ...e })),
    ...group.transfers.map((t) => ({ type: "transfer" as const, ...t })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPersonName = (id: number) =>
    group.people.find((p) => p.id === id)?.name || "Unknown";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to groups
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {group.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            {/* People section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  People
                </h2>
                <button
                  onClick={() => setShowAddPerson(!showAddPerson)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  + Add Person
                </button>
              </div>

              {showAddPerson && (
                <Form
                  method="post"
                  onSubmit={() => {
                    setShowAddPerson(false);
                    setTimeout(() => revalidator.revalidate(), 100);
                  }}
                  className="mb-4 flex gap-2"
                >
                  <input type="hidden" name="actionType" value="addPerson" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Person name"
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                </Form>
              )}

              {group.people.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No people yet. Add someone to get started!
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.people.map((person) => (
                    <li
                      key={person.id}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                    >
                      {person.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Balances section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Who Owes What
              </h2>
              {balances.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  All balanced! No one owes anything.
                </p>
              ) : (
                <ul className="space-y-2">
                  {balances.map((balance, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-gray-100"
                    >
                      <span className="font-medium">{getPersonName(balance.fromPersonId)}</span>
                      {" owes "}
                      <span className="font-medium">{getPersonName(balance.toPersonId)}</span>
                      {" "}
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${balance.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Timeline section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Timeline
              </h2>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  disabled={group.people.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  + Add Expense
                </button>
                <button
                  onClick={() => setShowAddTransfer(!showAddTransfer)}
                  disabled={group.people.length < 2}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  + Add Transfer
                </button>
              </div>

              {showAddExpense && <AddExpenseForm group={group} onClose={() => setShowAddExpense(false)} revalidate={() => revalidator.revalidate()} />}
              {showAddTransfer && <AddTransferForm group={group} onClose={() => setShowAddTransfer(false)} revalidate={() => revalidator.revalidate()} />}

              {timeline.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No expenses or transfers yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                      </div>
                      {item.type === "expense" ? (
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.description}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            Paid by {getPersonName(item.paidById)}: ${item.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Split: {item.shares.map((s) => `${getPersonName(s.personId)} ($${s.amount.toFixed(2)})`).join(", ")}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            Transfer
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            {getPersonName(item.paidById)} paid {getPersonName(item.paidToId)}: ${item.amount.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AddExpenseForm({
  group,
  onClose,
  revalidate,
}: {
  group: any;
  onClose: () => void;
  revalidate: () => void;
}) {
  const [shares, setShares] = useState(
    group.people.map((p: any) => ({ personId: p.id, amount: 0 }))
  );
  const [amount, setAmount] = useState(0);

  const totalShares = shares.reduce((sum, s) => sum + s.amount, 0);
  const isValid = Math.abs(totalShares - amount) < 0.01 && amount > 0;

  const handleEqualSplit = () => {
    const perPerson = amount / group.people.length;
    setShares(group.people.map((p: any) => ({ personId: p.id, amount: perPerson })));
  };

  return (
    <Form
      method="post"
      onSubmit={(e) => {
        if (!isValid) {
          e.preventDefault();
          return;
        }
        onClose();
        setTimeout(() => revalidate(), 100);
      }}
      className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4"
    >
      <input type="hidden" name="actionType" value="addExpense" />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <input
          type="text"
          name="description"
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <input
          type="number"
          name="amount"
          step="0.01"
          required
          value={amount || ""}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Paid By
        </label>
        <select
          name="paidById"
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {group.people.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Share per person
          </label>
          <button
            type="button"
            onClick={handleEqualSplit}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Split equally
          </button>
        </div>
        {group.people.map((person: any, idx: number) => (
          <div key={person.id} className="flex gap-2 items-center mb-2">
            <label className="flex-1 text-gray-900 dark:text-gray-100">
              {person.name}
            </label>
            <input
              type="number"
              step="0.01"
              value={shares[idx]?.amount || 0}
              onChange={(e) => {
                const newShares = [...shares];
                newShares[idx] = {
                  personId: person.id,
                  amount: parseFloat(e.target.value) || 0,
                };
                setShares(newShares);
              }}
              className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        ))}
        <input type="hidden" name="shares" value={JSON.stringify(shares)} />
        <div className="mt-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">Total shares: ${totalShares.toFixed(2)}</span>
          {!isValid && amount > 0 && (
            <span className="ml-2 text-red-600 dark:text-red-400">
              Must equal ${amount.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isValid}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg"
        >
          Add Expense
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}

function AddTransferForm({
  group,
  onClose,
  revalidate,
}: {
  group: any;
  onClose: () => void;
  revalidate: () => void;
}) {
  const [fromPersonId, setFromPersonId] = useState(group.people[0]?.id || 0);
  const [toPersonId, setToPersonId] = useState(group.people[1]?.id || group.people[0]?.id || 0);

  const isValid = fromPersonId !== toPersonId;

  return (
    <Form
      method="post"
      onSubmit={(e) => {
        if (!isValid) {
          e.preventDefault();
          return;
        }
        onClose();
        setTimeout(() => revalidate(), 100);
      }}
      className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4"
    >
      <input type="hidden" name="actionType" value="addTransfer" />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <input
          type="number"
          name="amount"
          step="0.01"
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          From
        </label>
        <select
          name="paidById"
          required
          value={fromPersonId}
          onChange={(e) => setFromPersonId(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {group.people.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To
        </label>
        <select
          name="paidToId"
          required
          value={toPersonId}
          onChange={(e) => setToPersonId(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {group.people.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {!isValid && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Cannot transfer to the same person
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isValid}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg"
        >
          Add Transfer
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}
