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
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronRight,
  MoreVertical,
  Pencil,
  PiggyBank,
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
import { parseDateToYYYYMMDD } from "~/lib/utils";

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
  // Keep track of insertion order using array index
  const timeline = [
    ...group.expenses.map((e, idx) => ({ 
      type: "expense" as const, 
      insertionOrder: idx,
      dateString: parseDateToYYYYMMDD(e.date),
      ...e 
    })),
    ...group.transfers.map((t, idx) => ({ 
      type: "transfer" as const, 
      insertionOrder: group.expenses.length + idx,
      dateString: parseDateToYYYYMMDD(t.date),
      ...t 
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
      const dateKey = format(new Date(item.dateString + 'T00:00:00'), "PP");
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
              <ArrowLeft className="size-6" />
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="cursor-pointer">
              <MoreVertical size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/${group.id}/edit`} prefetch="viewport">
                <Pencil /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" asChild>
              <Link to={`/${group.id}/delete`} prefetch="viewport">
                <Trash2 /> Delete
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {timeline.length === 0 && (
          <Item variant="muted" className="p-4">
            <h2 className="text-lg text-muted-foreground">
              No expenses or transfers yet.
            </h2>
          </Item>
        )}
        {timeline.length !== 0 && (
          <div>
            {balances.length === 0 ? (
              <Item className="p-4 bg-success text-foreground">
                <ItemContent className="flex flex-row gap-3 items-center text-xl">
                  <BadgeCheck size={36} /> All
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
                          <PiggyBank
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
                          <ChevronRight size={24} />
                        </ItemActions>
                      </Link>
                    </Item>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-6">
          <div className="flex gap-2 items-center justify-between sm:justify-start">
            <Button
              asChild
              variant="default"
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              <Link to={`/${group.id}/expenses/new`} prefetch="viewport">
                <Banknote /> New Expense
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              <Link to={`/${group.id}/transfers/new`} prefetch="viewport">
                <PiggyBank /> New Transfer
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {Object.entries(timelineGroupedByDate).map(([date, items]) => (
              <div key={date} className="flex flex-col gap-2">
                <h3 className="text-muted-foreground ml-1">{date}</h3>
                <div className="flex flex-col -ml-3">
                  {items.map((item) =>
                    item.type === "expense" ? (
                      <Item asChild size="xl" key={item.id}>
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
                            <ItemDescription>
                              {item.description}
                            </ItemDescription>
                          </ItemContent>
                        </Link>
                      </Item>
                    ) : (
                      <Item asChild size="xl" key={item.id}>
                        <Link
                          to={`/${group.id}/transfers/${item.id}/edit`}
                          prefetch="viewport"
                        >
                          <ItemMedia variant="icon">
                            <PiggyBank />
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
                      </Item>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
