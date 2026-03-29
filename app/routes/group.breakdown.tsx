import { useMemo } from "react";
import { useLoaderData } from "react-router";
import { ChartNoAxesCombined } from "lucide-react";
import type { Route } from "./+types/group.breakdown";
import { getGroup } from "../storage";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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

  const totals = useMemo(
    () =>
      tableRows.reduce(
        (acc, row) => ({
          expenses: acc.expenses + row.expenses,
          paid: acc.paid + row.paid,
          sent: acc.sent + row.sent,
          received: acc.received + row.received,
          balance: acc.balance + row.balance,
        }),
        { expenses: 0, paid: 0, sent: 0, received: 0, balance: 0 },
      ),
    [tableRows],
  );

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.person.id}>
                <TableCell>{row.person.name}</TableCell>
                <TableCell className="text-right">
                  ${row.expenses.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${row.paid.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${row.sent.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${row.received.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn("text-right", {
                    "text-primary": row.balance > 0,
                    "text-destructive": row.balance < 0,
                  })}
                >
                  {formatBalance(row.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                ${totals.expenses.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.paid.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.sent.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${totals.received.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {formatBalance(totals.balance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

function formatBalance(value: number): string {
  if (value === 0) return "$0.00";
  return `${value > 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
}
