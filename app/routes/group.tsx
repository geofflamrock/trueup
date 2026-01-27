import { Link, Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/group";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  CheckmarkBadge02Icon,
  ChevronRight,
  CircleArrowDataTransferHorizontalIcon,
  Money03Icon,
  MoneySendCircleIcon,
  Pencil,
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
import { ButtonGroup } from "~/components/ui/button-group";
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemDescription,
  TimelineItemTitle,
} from "~/components/ui/timeline";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import { format } from "date-fns";

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

export default function GroupPage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();
  const isDesktop = useIsDesktop();

  // Combine expenses and transfers into a timeline
  const timeline = [
    ...group.expenses.map((e) => ({ type: "expense" as const, ...e })),
    ...group.transfers.map((t) => ({ type: "transfer" as const, ...t })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const timelineGroupedByDate = timeline.reduce(
    (acc, item) => {
      const dateKey = format(new Date(item.date), "PP");
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
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon-lg" asChild>
            <Link to={`/`} prefetch="viewport">
              <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
            </Link>
          </Button>

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
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          {balances.length === 0 ? (
            <Item className="p-4 bg-success text-foreground">
              <ItemContent className="flex flex-row gap-3 items-center text-2xl">
                <HugeiconsIcon icon={CheckmarkBadge02Icon} size={48} /> All
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
                  <Item variant="muted" size="xl" key={idx} asChild>
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
                          {fromPerson.name} owes {toPerson.name}
                        </ItemTitle>
                        <ItemDescription className="text-primary text-lg">
                          ${balance.amount.toFixed(2)}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        Mark as paid{" "}
                        <HugeiconsIcon icon={ChevronRight} size={24} />
                      </ItemActions>
                    </Link>
                  </Item>
                );
              })}
            </div>
          )}
        </div>
        {/* Right column */}
        <div>
          {/* <div className="flex gap-4 justify-between items-center mb-4">
            <h2 className="text-2xl text-foreground">Timeline</h2>
            <div className="flex gap-2 items-center">
              <Button asChild variant="ghost" size="sm">
                <Link to={`/${group.id}/expenses/new`} prefetch="viewport">
                  <HugeiconsIcon icon={Money03Icon} /> Add Expense
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/${group.id}/transfers/new`} prefetch="viewport">
                  <HugeiconsIcon icon={SaveMoneyDollarIcon} /> Add Transfer
                </Link>
              </Button>
            </div>
          </div> */}

          {Object.keys(timelineGroupedByDate).length === 0 ? (
            <p className="text-muted-foreground">
              No expenses or transfers yet.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(timelineGroupedByDate).map(([date, items]) => (
                <div key={date} className="flex flex-col gap-2">
                  <h3 className="text-lg text-muted-foreground ml-1">{date}</h3>
                  <div className="flex flex-col gap-4 -ml-3">
                    {items.map((item) =>
                      item.type === "expense" ? (
                        <Item asChild size="lg" key={item.id}>
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
                        </Item>
                      ) : (
                        <Item asChild size="lg" key={item.id}>
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
                            </ItemContent>
                          </Link>
                        </Item>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start -ml-2">
        <h3 className="ml-3 text-muted-foreground">Actions</h3>
        <Button asChild variant="ghost">
          <Link to={`/${group.id}/edit`} prefetch="viewport">
            <HugeiconsIcon icon={PencilEdit01Icon} /> Edit Group
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          <Link to={`/${group.id}/delete`} prefetch="viewport">
            <HugeiconsIcon icon={Trash2} /> Delete Group
          </Link>
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
