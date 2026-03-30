import { Fragment, useMemo } from "react";
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
import { useIsDesktop } from "~/hooks/useIsDesktop";

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
  const isDesktop = useIsDesktop();

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

  if (isDesktop) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              {breakdownTypes.map(({ key, shortLabel }, index) => (
                <Fragment key={key}>
                  {index > 0 && (
                    <TableHead className="w-2 p-0" aria-hidden="true" />
                  )}
                  <TableHead className="text-right">{shortLabel}</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.person.id}>
                <TableCell>{row.person.name}</TableCell>
                {breakdownTypes.map(({ key, sign }, index) => (
                  <Fragment key={`${row.person.id}-${key}`}>
                    {index > 0 && (
                      <TableCell className="w-2 sm:pl-3 md:pl-8 lg:pl-12 text-right text-muted-foreground">
                        {sign}
                      </TableCell>
                    )}
                    <TableCell
                      className={cn("text-right", {
                        "text-primary": key === "balance" && row.balance > 0,
                        "text-destructive":
                          key === "balance" && row.balance < 0,
                      })}
                    >
                      {key === "balance"
                        ? formatBalance(row.balance)
                        : `$${row[key as Exclude<RowType, "balance">].toFixed(2)}`}
                    </TableCell>
                  </Fragment>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <Table>
        <TableBody>
          {tableRows.map((row, personIndex) =>
            breakdownTypes.map(({ key, label, sign }, index) => (
              <TableRow key={`${row.person.id}-${key}`} className="border-0">
                {index === 0 && (
                  <TableCell
                    rowSpan={breakdownTypes.length}
                    className={cn("align-top p-2", {
                      "border-b": personIndex < tableRows.length - 1,
                    })}
                  >
                    {row.person.name}
                  </TableCell>
                )}
                <TableCell
                  className={cn("w-2 text-center p-2", {
                    "border-b":
                      index === breakdownTypes.length - 1 &&
                      personIndex < tableRows.length - 1,
                  })}
                >
                  {sign}
                </TableCell>
                <TableCell
                  className={cn("p-2", {
                    "border-b":
                      index === breakdownTypes.length - 1 &&
                      personIndex < tableRows.length - 1,
                  })}
                >
                  {label}:
                </TableCell>

                <TableCell
                  className={cn("text-right p-2", {
                    "text-primary": key === "balance" && row.balance > 0,
                    "text-destructive": key === "balance" && row.balance < 0,
                    "border-b":
                      index === breakdownTypes.length - 1 &&
                      personIndex < tableRows.length - 1,
                  })}
                >
                  {key === "balance"
                    ? formatBalance(row.balance)
                    : `$${row[key as Exclude<RowType, "balance">].toFixed(2)}`}
                </TableCell>
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function formatBalance(value: number): string {
  if (value === 0) return "$0.00";
  return `${value > 0 ? "" : "-"}$${Math.abs(value).toFixed(2)}`;
}
