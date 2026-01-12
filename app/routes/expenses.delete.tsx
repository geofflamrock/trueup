import { redirect, useLoaderData, Link, Form } from "react-router";
import type { Route } from "./+types/expenses.delete";
import { getGroup, getExpense, deleteExpense } from "../storage";
import { Button } from "~/components/ui/button";
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

export async function clientAction({ params }: Route.ClientActionArgs) {
  deleteExpense(params.groupId, params.expenseId);
  return redirect(`/${params.groupId}`);
}

export default function DeleteExpense() {
  const { group, expense } = useLoaderData<typeof clientLoader>();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Delete Expense?
        </h1>
        <p className="text-foreground mb-6">
          Are you sure you want to delete the expense{" "}
          <strong>{expense.description}</strong> (${expense.amount.toFixed(2)})?
          This action cannot be undone.
        </p>
        <Form method="post" className="flex gap-3">
          <Button type="submit" variant="destructive" className="flex-1">
            Delete Expense
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/${group.id}`}>Cancel</Link>
          </Button>
        </Form>
      </Card>
    </main>
  );
}
