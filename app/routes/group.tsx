import { Link, Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/group";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import {
  PeopleAvatarGroup,
  PersonAvatar,
} from "~/components/app/PeopleAvatarGroup";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChartPie,
  ChevronRight,
  Coins,
  HandCoins,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { parseDateToYYYYMMDD } from "~/lib/date-utils";
import type { Group } from "~/types";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { useState } from "react";
import { cn } from "~/lib/utils";
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

const snapPoints = ["350px", 1];

export default function GroupPage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();
  const isDesktop = useIsDesktop();
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  const hasExpensesOrTransfers =
    group.expenses.length > 0 || group.transfers.length > 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon-lg"
            render={
              <Link to={`/`} prefetch="viewport">
                <ArrowLeft className="size-6" />
              </Link>
            }
          />

          <div className="flex gap-3 items-center">
            <Popover>
              <PopoverTrigger className="flex gap-2 items-center">
                <PeopleAvatarGroup
                  people={group.people}
                  max={2}
                  size="default"
                />
              </PopoverTrigger>
              <PopoverContent align="start">
                {group.people.map((person) => (
                  <div key={person.id} className="flex items-center gap-2">
                    <PersonAvatar person={person} />
                    <span>{person.name}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            <Link to={`/${group.id}/edit`} prefetch="viewport">
              <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
                {group.name}
              </h1>
            </Link>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-lg" className="cursor-pointer">
                <MoreVertical size={24} />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link to={`/${group.id}/edit`} prefetch="viewport">
                  <Pencil /> Edit
                </Link>
              }
            />
            <DropdownMenuItem
              variant="destructive"
              render={
                <Link to={`/${group.id}/delete`} prefetch="viewport">
                  <Trash2 /> Delete
                </Link>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!hasExpensesOrTransfers && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Banknote />
              </EmptyMedia>
              <EmptyTitle>No expenses or transfers yet</EmptyTitle>
              <EmptyDescription>
                Add an expense or transfer to start tracking who owes what in
                your group.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button
                variant="default"
                size="lg"
                className="flex-1 sm:flex-initial"
                render={
                  <Link to={`/${group.id}/expenses/new`} prefetch="viewport">
                    <Banknote /> New Expense
                  </Link>
                }
              />
              <Button
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-initial"
                render={
                  <Link to={`/${group.id}/transfers/new`} prefetch="viewport">
                    <HandCoins /> New Transfer
                  </Link>
                }
              />
            </EmptyContent>
          </Empty>
        )}
        {hasExpensesOrTransfers && (
          <div>
            {balances.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="default" className="text-primary">
                    <BadgeCheck size={48} />
                  </EmptyMedia>
                  <EmptyTitle className="text-3xl text-primary">
                    All balanced!
                  </EmptyTitle>
                  <EmptyDescription className="text-xl">
                    Everything is settled up. Yay!
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
                      variant="default"
                      size="default"
                      key={idx}
                      className="px-2"
                      render={
                        <Link
                          to={`/${group.id}/transfers/new?from=${fromPerson.id}&to=${toPerson.id}&amount=${balance.amount.toFixed(2)}`}
                          prefetch="viewport"
                        >
                          <ItemMedia variant="icon">
                            <Coins size={24} className="size-6" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-lg">
                              {fromPerson.name} owes {toPerson.name}
                              <span className="text-primary">
                                ${balance.amount.toFixed(2)}
                              </span>
                            </ItemTitle>
                            {/* <ItemDescription className="text-primary text-lg">
                              ${balance.amount.toFixed(2)}
                            </ItemDescription> */}
                          </ItemContent>
                          {/* <ItemActions>
                            Mark as paid <ChevronRight size={24} />
                          </ItemActions> */}
                        </Link>
                      }
                    />
                  );
                })}
              </div>
            )}
            {isDesktop && (
              <div className="flex flex-col gap-6">
                <div className="flex gap-2 items-center justify-between sm:justify-start">
                  <Button
                    variant="default"
                    size="lg"
                    className="flex-1 sm:flex-initial"
                    render={
                      <Link
                        to={`/${group.id}/expenses/new`}
                        prefetch="viewport"
                      >
                        <Banknote /> New Expense
                      </Link>
                    }
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-initial"
                    render={
                      <Link
                        to={`/${group.id}/transfers/new`}
                        prefetch="viewport"
                      >
                        <HandCoins /> New Transfer
                      </Link>
                    }
                  />
                </div>
                <Timeline group={group} />
              </div>
            )}
            {!isDesktop && (
              <Drawer
                open={true}
                dismissible={false}
                modal={false}
                snapPoints={snapPoints}
                activeSnapPoint={snap}
                setActiveSnapPoint={setSnap}
              >
                <DrawerContent className="before:right-0 before:left-0 before:bottom-0 before:border-muted dark:before:border-0 dark:before:bg-card before:rounded-b-none min-h-[80vh]">
                  <DrawerHeader />
                  <div className="no-scrollbar overflow-y-auto">
                    <Timeline group={group} />
                  </div>
                  <DrawerFooter className="fixed bottom-[calc(var(--snap-point-height))] left-0 right-0 flex flex-row gap-2 p-2 dark:bg-card">
                    <Button
                      variant="default"
                      size="lg"
                      className="flex-1 sm:flex-initial"
                      render={
                        <Link
                          to={`/${group.id}/expenses/new`}
                          prefetch="viewport"
                        >
                          <Banknote /> New Expense
                        </Link>
                      }
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-initial"
                      render={
                        <Link
                          to={`/${group.id}/transfers/new`}
                          prefetch="viewport"
                        >
                          <HandCoins /> New Transfer
                        </Link>
                      }
                    />
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
}

type TimelineProps = {
  group: Group;
};

export function Timeline({ group }: TimelineProps) {
  // Combine expenses and transfers into a timeline
  // Keep track of insertion order using array index
  const timeline = [
    ...group.expenses.map((e, idx) => ({
      type: "expense" as const,
      insertionOrder: idx,
      dateString: parseDateToYYYYMMDD(e.date),
      ...e,
    })),
    ...group.transfers.map((t, idx) => ({
      type: "transfer" as const,
      insertionOrder: group.expenses.length + idx,
      dateString: parseDateToYYYYMMDD(t.date),
      ...t,
    })),
  ].sort((a, b) => {
    // Sort by date descending (newest first) using string comparison
    // YYYY-MM-DD format allows lexicographic comparison
    const dateCompare = b.dateString.localeCompare(a.dateString);

    // If dates are the same, maintain insertion order
    if (dateCompare === 0) {
      return a.insertionOrder - b.insertionOrder;
    }
    return dateCompare;
  });

  const timelineGroupedByDate = timeline.reduce(
    (acc, item) => {
      const dateKey = format(new Date(item.dateString + "T00:00:00"), "PP");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    },
    {} as Record<string, typeof timeline>,
  );

  const getPersonName = (id: number) =>
    group.people.find((p) => p.id === id)?.name || "Unknown";

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(timelineGroupedByDate).map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground">{date}</h3>
          <div className="flex flex-col -mx-4">
            {items.map((item) =>
              item.type === "expense" ? (
                <Item
                  size="default"
                  key={item.id}
                  className="px-4"
                  render={
                    <Link
                      to={`/${group.id}/expenses/${item.id}/edit`}
                      prefetch="viewport"
                    >
                      <ItemMedia variant="icon">
                        <Banknote />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {getPersonName(item.paidById)} paid $
                          {item.amount.toFixed(2)}
                        </ItemTitle>
                        <ItemDescription>{item.description}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                className="cursor-pointer text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <ChartPie size={16} />
                              </Button>
                            }
                          ></PopoverTrigger>
                          <PopoverContent
                            align="end"
                            side="top"
                            className="w-auto min-w-48"
                          >
                            <PopoverHeader>
                              <PopoverTitle>Split</PopoverTitle>
                            </PopoverHeader>
                            <div className="flex flex-col gap-2">
                              {item.shares.map((share) => (
                                <div
                                  key={share.personId}
                                  className="flex justify-between gap-4"
                                >
                                  <span>{getPersonName(share.personId)}</span>
                                  <span>${share.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </ItemActions>
                    </Link>
                  }
                />
              ) : (
                <Item
                  size="default"
                  key={item.id}
                  className="px-4"
                  render={
                    <Link
                      to={`/${group.id}/transfers/${item.id}/edit`}
                      prefetch="viewport"
                    >
                      <ItemMedia variant="icon">
                        <HandCoins />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {getPersonName(item.paidById)} sent $
                          {item.amount.toFixed(2)} to{" "}
                          {getPersonName(item.paidToId)}
                        </ItemTitle>
                        {item.description && (
                          <ItemDescription>{item.description}</ItemDescription>
                        )}
                      </ItemContent>
                    </Link>
                  }
                />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
