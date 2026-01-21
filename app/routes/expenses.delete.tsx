import { redirect, useLoaderData, Link, Form, useNavigate } from "react-router";
import type { Route } from "./+types/expenses.delete";
import { getGroup, getExpense, deleteExpense } from "../storage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";

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
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Delete Expense"
      description={
        <span>
          Are you sure you want to delete the expense{" "}
          <strong>{expense.description}</strong> (${expense.amount.toFixed(2)})?
          This action cannot be undone.
        </span>
      }
      open={true}
      onClose={() => navigate(-1)}
    >
      <Form method="post" className="flex flex-col gap-4 sm:flex-row sm:gap-2">
        <Button
          type="submit"
          size="xl"
          variant="destructive"
          className="sm:flex-1"
        >
          Delete
        </Button>
        <Button
          type="button"
          size="xl"
          variant="muted"
          onClick={() => navigate(-1)}
          className="sm:flex-1"
        >
          Cancel
        </Button>
      </Form>
    </DialogOrDrawer>
  );
}
