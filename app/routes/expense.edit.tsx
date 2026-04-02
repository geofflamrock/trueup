import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/expense.edit";
import { getGroup, getExpense, updateExpense } from "../storage";
import { Button } from "~/components/ui/button";
import { parseDateToYYYYMMDD } from "~/lib/date-utils";
import { PageLayout } from "~/components/app/PageLayout";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "~/components/app/ExpenseForm";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `True Up: ${loaderData?.group.name ?? ""}` },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

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

  const initialSplitType = (() => {
    if (!expense.shares || expense.shares.length === 0) return "custom" as const;
    const first = expense.shares[0].amount;
    const allEqual = expense.shares.every(
      (s) => Math.abs(s.amount - first) < 0.01,
    );
    return allEqual ? "equal" as const : "custom" as const;
  })();

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            className="cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-6" />
          </Button>
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            Edit expense
          </h1>
        </div>
      }
    >
      <ExpenseForm
        formId="edit-expense"
        people={group.people}
        initialDescription={expense.description}
        initialAmount={expense.amount.toString()}
        initialDate={parseDateToYYYYMMDD(expense.date)}
        initialPaidById={expense.paidById.toString()}
        initialSplitType={initialSplitType}
        initialShares={expense.shares}
        actions={(isValid) => (
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              type="submit"
              form="edit-expense"
              size="xl"
              disabled={!isValid}
              className="cursor-pointer"
            >
              Save
            </Button>
            <Button
              render={
                <Link
                  to={`/${group.id}/expenses/${expense.id}/delete`}
                  prefetch="viewport"
                  className="cursor-pointer"
                >
                  Delete expense
                </Link>
              }
              variant="ghost"
              size="xl"
              className="cursor-pointer text-destructive"
            />
          </div>
        )}
      />
      <Outlet />
    </PageLayout>
  );
}
