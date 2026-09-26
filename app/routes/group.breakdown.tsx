import { useMemo } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/group.breakdown";
import { getGroup } from "../storage";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "~/components/ui/table";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

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

const breakdownTypes = [
  { key: "paid", label: "Expenses paid for", shortLabel: "Paid", sign: "" },
  {
    key: "expenses",
    label: "Share of expenses",
    shortLabel: "Expenses",
    sign: "-",
  },
  { key: "sent", label: "Transfers sent", shortLabel: "Sent", sign: "+" },
  {
    key: "received",
    label: "Transfers received",
    shortLabel: "Received",
    sign: "-",
  },
  { key: "balance", label: "Balance", shortLabel: "Balance", sign: "=" },
] as const;

type RowType = (typeof breakdownTypes)[number]["key"];

export default function GroupBreakdownPage() {
  const { group } = useLoaderData<typeof clientLoader>();

  const tableRows = useMemo(() => {
    return group.people.map((person) => {
      const expenses = group.expenses.reduce((sum, expense) => {
        const share = expense.shares.find(
          (item) => item.personId === person.id,
        );
        return sum + (share?.amount ?? 0);
      }, 0);
      const paid = group.expenses
        .filter((expense) => expense.paidById === person.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const sent = group.transfers
        .filter((transfer) => transfer.paidById === person.id)
        .reduce((sum, transfer) => sum + transfer.amount, 0);
      const received = group.transfers
        .filter((transfer) => transfer.paidToId === person.id)
        .reduce((sum, transfer) => sum + transfer.amount, 0);
      const balance = paid - expenses + sent - received;

      return { person, expenses, paid, sent, received, balance };
    });
  }, [group.people, group.expenses, group.transfers]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {tableRows.map((row) => (
        <PersonBreakdownCard key={row.person.id} row={row} />
      ))}
    </div>
  );
}

type PersonRow = {
  person: { id: number; name: string };
  paid: number;
  expenses: number;
  sent: number;
  received: number;
  balance: number;
};

type PersonBreakdownCardProps = {
  row: PersonRow;
};

function PersonBreakdownCard({ row }: PersonBreakdownCardProps) {
  return (
    <Card size="sm" className="gap-4 px-5 py-6">
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-medium">{row.person.name}</span>
      </div>
      <Table>
        <TableBody>
          {breakdownTypes.map(({ key, label, sign }) => (
            <TableRow key={key} className="h-10 border-0 hover:bg-transparent">
              <TableCell className="p-0 pr-3 font-medium">
                {sign && (
                  <span className="mr-2 text-muted-foreground">{sign}</span>
                )}
                {label}
              </TableCell>
              <TableCell
                className={cn("p-0 text-right", {
                  "font-semibold": key === "balance",
                  "text-primary": key === "balance" && row.balance > 0,
                  "text-destructive": key === "balance" && row.balance < 0,
                })}
              >
                {key === "balance"
                  ? formatBalance(row.balance)
                  : `$${row[key as Exclude<RowType, "balance">].toFixed(2)}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function formatBalance(value: number): string {
  if (value === 0) return "$0.00";
  return `${value > 0 ? "" : "-"}$${Math.abs(value).toFixed(2)}`;
}
