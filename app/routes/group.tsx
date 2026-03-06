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
  PopoverTrigger,
} from "~/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  CheckmarkBadge02Icon,
  ChevronRight,
  Money03Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  SaveMoneyDollarIcon,
  Trash2,
} from "@hugeicons/core-free-icons";
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
import { cn, parseDateToYYYYMMDD } from "~/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "~/components/ui/drawer";
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

const snapPoints = [0.5, 1];

export default function GroupPage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const isDesktop = useIsDesktop();

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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon-lg"
            render={
              <Link to={`/`} prefetch="viewport">
                <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
              </Link>
            }
          ></Button>

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
                <HugeiconsIcon icon={MoreVerticalIcon} size={24} />
              </Button>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link to={`/${group.id}/edit`} prefetch="viewport">
                  <HugeiconsIcon icon={PencilEdit01Icon} /> Edit
                </Link>
              }
            ></DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              render={
                <Link to={`/${group.id}/delete`} prefetch="viewport">
                  <HugeiconsIcon icon={Trash2} /> Delete
                </Link>
              }
            ></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
        {timeline.length === 0 && (
          <Item variant="default" className="p-4">
            <h2 className="text-lg text-muted-foreground">
              No expenses or transfers yet.
            </h2>
          </Item>
        )}
        {timeline.length !== 0 && (
          <div>
            {balances.length === 0 ? (
              <Item className="p-4 text-green-600">
                <ItemContent className="flex flex-row gap-3 items-center text-xl">
                  <HugeiconsIcon icon={CheckmarkBadge02Icon} size={36} /> All
                  balanced!
                </ItemContent>
              </Item>
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
                        >
                          <ItemMedia variant="icon">
                            <HugeiconsIcon
                              icon={SaveMoneyDollarIcon}
                              size={24}
                              className="size-6"
                            />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-lg">
                              {fromPerson.name} owes {toPerson.name}{" "}
                              <span className="text-primary">
                                ${balance.amount.toFixed(2)}
                              </span>
                            </ItemTitle>
                            {/* <ItemDescription className="text-primary text-lg">
                              ${balance.amount.toFixed(2)}
                            </ItemDescription> */}
                          </ItemContent>
                          {/* <ItemActions>
                            Mark as paid{" "}
                            <HugeiconsIcon icon={ChevronRight} size={24} />
                          </ItemActions> */}
                        </Link>
                      }
                    ></Item>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Drawer
        open={true}
        dismissible={false}
        modal={false}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent className="h-full">
          {/* <div className="relative"> */}
          <DrawerHeader />
          <div
            className={cn("mb-4", {
              "overflow-y-auto": snap === 1,
              "overflow-hidden": snap !== 1,
            })}
          >
            {Object.entries(timelineGroupedByDate).map(([date, items]) => (
              <div key={date} className="flex flex-col gap-2">
                <h3 className="text-muted-foreground ml-1">{date}</h3>
                <div className="flex flex-col -ml-3">
                  {items.map((item) =>
                    item.type === "expense" ? (
                      <Item
                        render={
                          <Link
                            to={`/${group.id}/expenses/${item.id}/edit`}
                            prefetch="viewport"
                          >
                            <ItemMedia variant="icon">
                              <HugeiconsIcon icon={Money03Icon} />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>
                                {getPersonName(item.paidById)} paid $
                                {item.amount.toFixed(2)}
                              </ItemTitle>
                              <ItemDescription>
                                {item.description}
                              </ItemDescription>
                            </ItemContent>
                          </Link>
                        }
                        size="default"
                        key={item.id}
                      ></Item>
                    ) : (
                      <Item
                        render={
                          <Link
                            to={`/${group.id}/transfers/${item.id}/edit`}
                            prefetch="viewport"
                          >
                            <ItemMedia variant="icon">
                              <HugeiconsIcon icon={SaveMoneyDollarIcon} />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>
                                {getPersonName(item.paidById)} sent $
                                {item.amount.toFixed(2)} to{" "}
                                {getPersonName(item.paidToId)}
                              </ItemTitle>
                              {item.description && (
                                <ItemDescription>
                                  {item.description}
                                </ItemDescription>
                              )}
                            </ItemContent>
                          </Link>
                        }
                        size="default"
                        key={item.id}
                      ></Item>
                    ),
                  )}
                </div>
              </div>
            ))}
            {/* </div> */}
            {/* <DrawerFooter> */}
            {/* </DrawerFooter> */}
          </div>
          <div className="fixed bottom-0 flex flex-row gap-2 justify-between">
            <Button
              render={
                <Link to={`/${group.id}/expenses/new`} prefetch="viewport">
                  <HugeiconsIcon icon={Money03Icon} /> New Expense
                </Link>
              }
              variant="default"
              size="lg"
              className="flex-1"
            ></Button>
            <Button
              render={
                <Link to={`/${group.id}/transfers/new`} prefetch="viewport">
                  <HugeiconsIcon icon={SaveMoneyDollarIcon} /> New Transfer
                </Link>
              }
              variant="secondary"
              size="lg"
              className="flex-1"
            ></Button>
          </div>
        </DrawerContent>
      </Drawer>
      <Outlet />
    </div>
  );
}
