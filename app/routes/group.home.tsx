import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group.home";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import {
  BadgeCheckIcon,
  Banknote,
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
import type { Group } from "~/types";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

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
        <div className="flex flex-col gap-4">
          {balances.map((balance, idx) => {
            const fromPerson = group.people.find(
              (p) => p.id === balance.fromPersonId,
            )!;
            const toPerson = group.people.find(
              (p) => p.id === balance.toPersonId,
            )!;
            return (
              <Item
                variant="muted"
                size="default"
                key={idx}
                render={
                  <Link
                    to={`/${group.id}/transfers/new?from=${fromPerson.id}&to=${toPerson.id}&amount=${balance.amount.toFixed(2)}`}
                    prefetch="viewport"
                    className="cursor-pointer"
                  >
                    <ItemMedia variant="icon">
                      <Coins size={24} className="size-6" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-lg">
                        {fromPerson.name} owes {toPerson.name}
                      </ItemTitle>
                      <ItemDescription className="text-primary text-lg">
                        ${balance.amount.toFixed(2)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      Mark as paid <ChevronRight size={24} />
                    </ItemActions>
                  </Link>
                }
              />
            );
          })}
        </div>
      )}
    </div>
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
