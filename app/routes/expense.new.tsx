import { Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/expense.new";
import { getGroup, addExpense } from "../storage";
import { Button } from "~/components/ui/button";
import { getTodayYYYYMMDD } from "~/lib/date-utils";
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
  const date = formData.get("date") as string;

  if (description && amount && paidById && sharesJson && date) {
    const shares = JSON.parse(sharesJson);
    addExpense(params.groupId, {
      description,
      amount,
      paidById,
      shares,
      date,
    });
  }

  return redirect(`/${params.groupId}`);
}

export type { SplitType } from "~/components/app/ExpenseForm";

export default function NewExpense() {
  const { group } = useLoaderData<typeof clientLoader>();

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            render={
              <Link
                to={`/${group.id}`}
                prefetch="viewport"
                className="cursor-pointer"
              >
                <ArrowLeft className="size-6" />
              </Link>
            }
          />
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            New expense
          </h1>
        </div>
      }
    >
      <ExpenseForm
        formId="new-expense"
        people={group.people}
        initialDate={getTodayYYYYMMDD()}
        actions={(isValid) => (
          <div className="flex">
            <Button
              type="submit"
              form="new-expense"
              size="xl"
              disabled={!isValid}
              className="flex-1 sm:flex-initial cursor-pointer"
            >
              Save
            </Button>
          </div>
        )}
      />
    </PageLayout>
  );
}
