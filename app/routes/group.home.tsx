import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group.home";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import {
  BadgeCheckIcon,
  Banknote,
  ChevronDownIcon,
  ChevronRight,
  Coins,
  HandCoins,
} from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import type { Balance, Group } from "~/types";
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
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import { useState } from "react";

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

function BalanceCard({ group, balance }: BalanceCardProps) {
  const [open, setOpen] = useState(false);

  const fromPerson = group.people.find((p) => p.id === balance.fromPersonId)!;
  const toPerson = group.people.find((p) => p.id === balance.toPersonId)!;

  return (
    <Card size="sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="items-center" onClick={() => setOpen(!open)}>
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
            <Button
              variant="ghost"
              size="icon-sm"
              title="Details"
              className="cursor-pointer"
            >
              <ChevronDownIcon
                size={16}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CollapsibleContent>
          <CardFooter className="pt-4">
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
