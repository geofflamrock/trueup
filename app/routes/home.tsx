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
import { PeopleAvatarGroup } from "~/components/app/PeopleAvatarGroup";
import { Header } from "~/components/app/Header";
import { ChevronRight } from "lucide-react";
import { PageLayout } from "~/components/app/PageLayout";

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
    <PageLayout header={<Header />}>
      <div className="flex flex-col gap-4 p-4">
        {groups.length === 0 && (
          <div className="flex flex-col gap-8 text-foreground text-3xl">
            <p>
              Track who paid for what on your{" "}
              <span className="text-primary">family holiday to Europe.</span>
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
              <Item
                variant="muted"
                size="default"
                render={
                  <Link
                    key={group.id}
                    to={`/${group.id}`}
                    prefetch="viewport"
                    className="cursor-pointer"
                  >
                    <ItemMedia>
                      <PeopleAvatarGroup people={group.people} max={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-xl">{group.name}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <ChevronRight size={24} />
                    </ItemActions>
                  </Link>
                }
              />
            ))}
          </div>
        )}
        <div>
          <Button
            variant="default"
            size="xl"
            className={cn("cursor-pointer rounded-full")}
            render={
              <Link
                to="/groups/new"
                prefetch="viewport"
                className="cursor-pointer"
              >
                {groups.length === 0 ? "Get Started" : "Create Group"}
              </Link>
            }
          />
        </div>
      </div>
      <Outlet />
    </PageLayout>
  );
}
