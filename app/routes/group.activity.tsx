import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group.activity";
import { getGroup } from "../storage";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  ActivitySquareIcon,
  Banknote,
  ChartPie,
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
import { format } from "date-fns";
import { parseDateToYYYYMMDD } from "~/lib/date-utils";
import type { Group } from "~/types";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Card } from "~/components/ui/card";

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

export default function GroupActivityPage() {
  const { group } = useLoaderData<typeof clientLoader>();

  const hasExpensesOrTransfers =
    group.expenses.length > 0 || group.transfers.length > 0;

  return (
    <div className="p-4">
      {!hasExpensesOrTransfers && <GroupNoActivityEmptyState group={group} />}
      {hasExpensesOrTransfers && <Timeline group={group} />}
    </div>
  );
}

type GroupNoActivityEmptyStateProps = {
  group: Group;
};

function GroupNoActivityEmptyState({ group }: GroupNoActivityEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <ActivitySquareIcon size={48} />
        </EmptyMedia>
        <EmptyTitle className="text-2xl">No activity yet</EmptyTitle>
        <EmptyDescription>
          Add an expense or transfer to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-row gap-2 justify-center">
        <Button
          variant="default"
          size="lg"
          render={
            <Link
              to={`/${group.id}/expenses/new`}
              prefetch="viewport"
              className="cursor-pointer"
            >
              <Banknote /> New expense
            </Link>
          }
        />
        <Button
          variant="secondary"
          size="lg"
          render={
            <Link
              to={`/${group.id}/transfers/new`}
              prefetch="viewport"
              className="cursor-pointer"
            >
              <HandCoins /> New transfer
            </Link>
          }
        />
      </EmptyContent>
    </Empty>
  );
}

type TimelineProps = {
  group: Group;
};

function Timeline({ group }: TimelineProps) {
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

  const renderItem = (item: (typeof timeline)[number]) =>
    item.type === "expense" ? (
      <Item
        size="default"
        key={item.id}
        className="px-0"
        render={
          <Link
            to={`/${group.id}/expenses/${item.id}`}
            prefetch="viewport"
            className="cursor-pointer"
          >
            <ItemMedia variant="icon">
              <Banknote className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-base">
                {getPersonName(item.paidById)} paid $
                {item.amount.toFixed(2)}
              </ItemTitle>
              <ItemDescription className="text-base">
                {item.description}
              </ItemDescription>
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
                      <ChartPie />
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
        className="px-0"
        render={
          <Link
            to={`/${group.id}/transfers/${item.id}`}
            prefetch="viewport"
            className="cursor-pointer"
          >
            <ItemMedia variant="icon">
              <HandCoins className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-base">
                {getPersonName(item.paidById)} sent $
                {item.amount.toFixed(2)} to{" "}
                {getPersonName(item.paidToId)}
              </ItemTitle>
              {item.description && (
                <ItemDescription className="text-base">
                  {item.description}
                </ItemDescription>
              )}
            </ItemContent>
          </Link>
        }
      />
    );

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(timelineGroupedByDate).map(([date, items]) => (
        <Card key={date} size="sm" className="gap-4 py-5">
          <h3 className="px-5 text-muted-foreground">{date}</h3>
          <div className="flex flex-col gap-2 px-5 pb-1">
            {items.map(renderItem)}
          </div>
        </Card>
      ))}
    </div>
  );
}
