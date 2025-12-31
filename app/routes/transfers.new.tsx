import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/transfers.new";
import { getGroup, addTransfer } from "../storage";
import { useState } from "react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  return { group };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const amount = parseFloat(formData.get("amount") as string);
  const paidById = parseInt(formData.get("paidById") as string);
  const paidToId = parseInt(formData.get("paidToId") as string);
  
  if (amount && paidById && paidToId && paidById !== paidToId) {
    addTransfer(params.groupId, {
      amount,
      paidById,
      paidToId,
      date: new Date().toISOString(),
    });
  }
  
  return redirect(`/${params.groupId}`);
}

export default function NewTransfer() {
  const { group } = useLoaderData<typeof clientLoader>();
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(group.people[0]?.id.toString() || "");
  const [paidToId, setPaidToId] = useState(group.people[1]?.id.toString() || group.people[0]?.id.toString() || "");

  const isValid = amount && paidById && paidToId && paidById !== paidToId;

  if (group.people.length < 2) {
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
              You need at least 2 people in the group before creating transfers.
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
          Add Transfer
        </h1>

        <Form method="post" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="paidById" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From *
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
            <label htmlFor="paidToId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To *
            </label>
            <select
              id="paidToId"
              name="paidToId"
              value={paidToId}
              onChange={(e) => setPaidToId(e.target.value)}
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

          {paidById === paidToId && (
            <div className="mb-6 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              Cannot transfer to the same person
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isValid}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Add Transfer
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
