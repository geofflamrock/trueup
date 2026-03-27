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

  return (
    <div className="p-4">
      {balances.length === 0 ? (
        <GroupBalancedEmptyState group={group} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {balances.map((balance) => {
            return (
              <BalanceCard
                key={`${balance.fromPersonId}-${balance.toPersonId}`}
                group={group}
                balance={balance}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type BalanceCardProps = {
  group: Group;
  balance: Balance;
};

type BalanceBreakdown = {
  fromPersonShare: number;
  fromPersonPaid: number;
  fromPersonTransfersSent: number;
  fromPersonTotalDebt: number;
  toPersonPaid: number;
  toPersonShare: number;
  toPersonTransfersReceived: number;
};

function getBalanceBreakdown(
  group: Group,
  fromPersonId: number,
  toPersonId: number,
): BalanceBreakdown {
  const fromPersonShare = group.expenses.reduce((sum, e) => {
    const share = e.shares.find((s) => s.personId === fromPersonId);
    return sum + (share?.amount ?? 0);
  }, 0);

  const fromPersonPaid = group.expenses
    .filter((e) => e.paidById === fromPersonId)
    .reduce((sum, e) => sum + e.amount, 0);

  const fromPersonTransfersSent = group.transfers
    .filter((t) => t.paidById === fromPersonId)
    .reduce((sum, t) => sum + t.amount, 0);

  const fromPersonTransfersReceived = group.transfers
    .filter((t) => t.paidToId === fromPersonId)
    .reduce((sum, t) => sum + t.amount, 0);

  // fromPerson is always a debtor (net balance < 0) so this value is always > 0
  const fromPersonTotalDebt =
    fromPersonShare -
    fromPersonPaid -
    fromPersonTransfersSent +
    fromPersonTransfersReceived;

  const toPersonPaid = group.expenses
    .filter((e) => e.paidById === toPersonId)
    .reduce((sum, e) => sum + e.amount, 0);

  const toPersonShare = group.expenses.reduce((sum, e) => {
    const share = e.shares.find((s) => s.personId === toPersonId);
    return sum + (share?.amount ?? 0);
  }, 0);

  const toPersonTransfersReceived = group.transfers
    .filter((t) => t.paidToId === toPersonId)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    fromPersonShare,
    fromPersonPaid,
    fromPersonTransfersSent,
    fromPersonTotalDebt,
    toPersonPaid,
    toPersonShare,
    toPersonTransfersReceived,
  };
}

type BalanceBreakdownViewProps = {
  breakdown: BalanceBreakdown;
  balance: Balance;
  fromPerson: Person;
  toPerson: Person;
};

function BalanceBreakdownView({
  breakdown,
  balance,
  fromPerson,
  toPerson,
}: BalanceBreakdownViewProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {fromPerson.name}&apos;s share
        </span>
        <span>${breakdown.fromPersonShare.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{fromPerson.name} paid</span>
        <span>${breakdown.fromPersonPaid.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {fromPerson.name}&apos;s transfers
        </span>
        <span>${breakdown.fromPersonTransfersSent.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between gap-4 font-medium">
        <span>{fromPerson.name} owes in total</span>
        <span>${breakdown.fromPersonTotalDebt.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4 pt-2">
        <span className="text-muted-foreground">{toPerson.name} paid</span>
        <span>${breakdown.toPersonPaid.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {toPerson.name}&apos;s share
        </span>
        <span>${breakdown.toPersonShare.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          Transfers to {toPerson.name}
        </span>
        <span>${breakdown.toPersonTransfersReceived.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between gap-4 font-medium">
        <span>
          {fromPerson.name} owes {toPerson.name}
        </span>
        <span className="text-primary">${balance.amount.toFixed(2)}</span>
      </div>
    </div>
  );
}

function BalanceCard({ group, balance }: BalanceCardProps) {
  const [open, setOpen] = useState(false);

  const fromPerson = useMemo(
    () => group.people.find((p) => p.id === balance.fromPersonId)!,
    [group.people, balance.fromPersonId],
  );
  const toPerson = useMemo(
    () => group.people.find((p) => p.id === balance.toPersonId)!,
    [group.people, balance.toPersonId],
  );
  const breakdown = useMemo(
    () => getBalanceBreakdown(group, balance.fromPersonId, balance.toPersonId),
    [group, balance.fromPersonId, balance.toPersonId],
  );

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
                {fromPerson.name} owes {toPerson.name}{" "}
                <span className="text-primary">
                  ${balance.amount.toFixed(2)}
                </span>
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
            <BalanceBreakdownView
              breakdown={breakdown}
              balance={balance}
              fromPerson={fromPerson}
              toPerson={toPerson}
            />
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              render={
                <Link
                  to={`/${group.id}/transfers/new?from=${fromPerson.id}&to=${toPerson.id}&amount=${balance.amount.toFixed(2)}`}
                  prefetch="viewport"
                  className="cursor-pointer"
                />
              }
              variant="muted"
              size="lg"
            >
              Mark as paid
            </Button>
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
