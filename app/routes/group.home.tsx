import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group.home";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import {
  BadgeCheckIcon,
  Banknote,
  ChartNoAxesCombined,
  Coins,
  HandCoins,
} from "lucide-react";
import type { Balance, Group, Person } from "~/types";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useMemo } from "react";
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
  const balances = calculateBalances(group);
  return { group, balances };
}

export default function GroupHomePage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();

  const personBalances = useMemo(() => {
    const map = new Map<number, Balance[]>();
    for (const balance of balances) {
      if (!map.has(balance.fromPersonId)) map.set(balance.fromPersonId, []);
      map.get(balance.fromPersonId)!.push(balance);
    }
    return Array.from(map.entries()).map(([personId, bals]) => ({
      person: group.people.find((p) => p.id === personId)!,
      balances: bals,
    }));
  }, [group.people, balances]);

  return (
    <div className="p-4">
      {balances.length === 0 ? (
        <GroupBalancedEmptyState group={group} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personBalances.map(({ person, balances: pBalances }) => (
            <BalanceCard
              key={person.id}
              group={group}
              person={person}
              balances={pBalances}
            />
          ))}
          <div className="md:col-span-2">
            <BreakdownCard group={group} />
          </div>
        </div>
      )}
    </div>
  );
}

type BalanceCardProps = {
  group: Group;
  person: Person;
  balances: Balance[];
};

function formatBalance(value: number): string {
  if (value === 0) return `$0.00`;
  return `${value > 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
}

function BalanceCard({ group, person, balances }: BalanceCardProps) {
  const creditors = useMemo(
    () =>
      balances.map((b) => ({
        balance: b,
        person: group.people.find((p) => p.id === b.toPersonId)!,
      })),
    [balances, group.people],
  );

  return (
    <Card size="sm">
      <CardHeader className="items-center">
        <CardTitle className="flex items-center gap-2">
          <Coins size={24} className="size-6" />
          <span>
            {person.name} owes{" "}
            {creditors.map(({ balance, person: creditor }, i) => (
              <span key={creditor.id}>
                {i > 0 && (i === creditors.length - 1 ? " and " : ", ")}
                {creditor.name}{" "}
                <span className="text-primary">
                  ${balance.amount.toFixed(2)}
                </span>
              </span>
            ))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardFooter className="pt-2 flex gap-2 flex-wrap">
        {creditors.map(({ balance, person: creditor }) => (
          <Button
            key={creditor.id}
            render={
              <Link
                to={`/${group.id}/transfers/new?from=${person.id}&to=${creditor.id}&amount=${balance.amount.toFixed(2)}`}
                prefetch="viewport"
                className="cursor-pointer"
              />
            }
            variant="muted"
            size="lg"
          >
            Pay {creditor.name}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}

type BreakdownCardProps = {
  group: Group;
};

function BreakdownCard({ group }: BreakdownCardProps) {
  const tableRows = useMemo(() => {
    return group.people.map((p) => {
      const expenses = group.expenses.reduce((sum, e) => {
        const share = e.shares.find((s) => s.personId === p.id);
        return sum + (share?.amount ?? 0);
      }, 0);
      const paid = group.expenses
        .filter((e) => e.paidById === p.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const sent = group.transfers
        .filter((t) => t.paidById === p.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const received = group.transfers
        .filter((t) => t.paidToId === p.id)
        .reduce((sum, t) => sum + t.amount, 0);
      // Positive = owed money, negative = owes money
      const balance = paid - expenses + sent - received;
      return { person: p, expenses, paid, sent, received, balance };
    });
  }, [group.people, group.expenses, group.transfers]);

  const totals = useMemo(
    () =>
      tableRows.reduce(
        (acc, r) => ({
          expenses: acc.expenses + r.expenses,
          paid: acc.paid + r.paid,
          sent: acc.sent + r.sent,
          received: acc.received + r.received,
          balance: acc.balance + r.balance,
        }),
        { expenses: 0, paid: 0, sent: 0, received: 0, balance: 0 },
      ),
    [tableRows],
  );

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between -mr-1">
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined size={24} className="size-6" />
            <span>Breakdown</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

type GroupBalancedEmptyStateProps = {
  group: Group;
};

function GroupBalancedEmptyState({ group }: GroupBalancedEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader className="text-primary">
        <EmptyMedia>
          <BadgeCheckIcon size={48} />
        </EmptyMedia>
        <EmptyTitle className="text-2xl">All balanced!</EmptyTitle>
        <EmptyDescription>Everything is settled up. Yay!</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-row gap-2 justify-center">
        <Button
          variant="default"
          size="xl"
          render={
            <Link
              to={`/${group.id}/expenses/new`}
              prefetch="viewport"
              className="cursor-pointer"
            >
              <Banknote /> New Expense
            </Link>
          }
        />
        <Button
          variant="muted"
          size="xl"
          render={
            <Link
              to={`/${group.id}/transfers/new`}
              prefetch="viewport"
              className="cursor-pointer"
            >
              <HandCoins /> New Transfer
            </Link>
          }
        />
      </EmptyContent>
    </Empty>
  );
}
