import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group.home";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import {
  BadgeCheckIcon,
  Banknote,
  ChevronDownIcon,
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
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import { useMemo, useState } from "react";
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
            <PersonBalanceCard
              key={person.id}
              group={group}
              person={person}
              balances={pBalances}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type PersonBalanceCardProps = {
  group: Group;
  person: Person;
  balances: Balance[];
};

function PersonBalanceCard({ group, person, balances }: PersonBalanceCardProps) {
  const [open, setOpen] = useState(false);

  const creditors = useMemo(
    () =>
      balances.map((b) => ({
        balance: b,
        person: group.people.find((p) => p.id === b.toPersonId)!,
      })),
    [balances, group.people],
  );

  const breakdown = useMemo(() => {
    const share = group.expenses.reduce((sum, e) => {
      const s = e.shares.find((s) => s.personId === person.id);
      return sum + (s?.amount ?? 0);
    }, 0);
    const paid = group.expenses
      .filter((e) => e.paidById === person.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const transfersSent = group.transfers
      .filter((t) => t.paidById === person.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const transfersReceived = group.transfers
      .filter((t) => t.paidToId === person.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { share, paidAndTransferred: paid + transfersSent - transfersReceived };
  }, [group.expenses, group.transfers, person.id]);

  return (
    <Card size="sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader
          className="items-center cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <CardTitle className="flex items-center gap-2 justify-between -mr-1">
            <div className="flex items-center gap-2">
              <Coins size={24} className="size-6" />
              <span>
                {person.name} owes{" "}
                {creditors.map(({ balance, person: creditor }, i) => (
                  <span key={creditor.id}>
                    {i > 0 &&
                      (i === creditors.length - 1 ? " and " : ", ")}
                    {creditor.name}{" "}
                    <span className="text-primary">
                      ${balance.amount.toFixed(2)}
                    </span>
                  </span>
                ))}
              </span>
            </div>
            <Button variant="ghost" size="icon-sm" title="Details">
              <ChevronDownIcon
                size={24}
                className={cn("size-6 transition-transform", {
                  "rotate-180": open,
                })}
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {person.name}&apos;s share
                </span>
                <span>${breakdown.share.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Paid + transferred
                </span>
                <span>${breakdown.paidAndTransferred.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex flex-col gap-1">
                {creditors.map(({ balance, person: creditor }) => (
                  <div
                    key={creditor.id}
                    className="flex justify-between gap-4 font-medium"
                  >
                    <span>Owes {creditor.name}</span>
                    <span className="text-primary">
                      ${balance.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
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
                {creditors.length === 1
                  ? "Mark as paid"
                  : `Pay ${creditor.name}`}
              </Button>
            ))}
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
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
