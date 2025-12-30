import { redirect, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/expenses.delete";
import { getGroup, getExpense, deleteExpense } from "../storage";

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

export async function clientAction({ params }: Route.ClientActionArgs) {
  deleteExpense(params.groupId, params.expenseId);
  return redirect(`/${params.groupId}`);
}

export default function DeleteExpense() {
  const { group, expense } = useLoaderData<typeof clientLoader>();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Delete Expense?
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete the expense <strong>{expense.description}</strong> (${expense.amount.toFixed(2)})? This action cannot be undone.
        </p>
        <form method="post" className="flex gap-3">
          <button
            type="submit"
            className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Delete Expense
          </button>
          <Link
            to={`/${group.id}`}
            className="flex-1 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </form>
      </div>
    </main>
  );
}
