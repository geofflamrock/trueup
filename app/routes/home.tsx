import { Link, Outlet } from "react-router";
import type { Route } from "./+types/home";
import { getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { Avatar, AvatarFallback, AvatarGroup } from "~/components/ui/avatar";
import { PeopleAvatarGroup } from "~/components/app/PeopleAvatarGroup";
import { Header } from "~/components/app/Header";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronRight } from "@hugeicons/core-free-icons";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "True Up" },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

export async function clientLoader() {
  return { groups: getAllGroups() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { groups } = loaderData;

  return (
    <div className="flex flex-col gap-8 py-16">
      <Header />
      {groups.length === 0 && (
        <div className="flex flex-col gap-8 text-foreground text-3xl font-title">
          <p>
            Track who paid for what on your{" "}
            <span className="text-primary">family holiday to Europe.</span>
            {/* <TextLoop interval={5}>
              <span className="text-primary">family holiday to Europe.</span>
              <span className="text-primary">road trip with friends.</span>
              <span className="text-primary">weekend away with the girls.</span>
              <span className="text-primary">weekend away with the boys.</span>
              <span className="text-primary">holiday with the in-laws.</span>
            </TextLoop> */}
          </p>
          <p>
            Work out who owes what and{" "}
            <span className="text-primary">true up.</span>
          </p>
          <p>All data stays on your device. No account required. Free.</p>
        </div>
      )}
      {groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <Item variant="muted" size="xl" asChild>
              <Link key={group.id} to={`/${group.id}`} prefetch="viewport">
                <ItemMedia>
                  <PeopleAvatarGroup people={group.people} max={2} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-lg">{group.name}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <HugeiconsIcon icon={ChevronRight} size={24} />
                </ItemActions>
              </Link>
            </Item>
          ))}
        </div>
      )}
      <div>
        <Button
          variant="hero"
          size="hero"
          className={cn("cursor-pointer rounded-full")}
          asChild
        >
          <Link to="/groups/new" prefetch="viewport">
            {groups.length === 0 ? "Get Started" : "Create Group"}
          </Link>
        </Button>
      </div>
      <Outlet />
    </div>
  );
}
