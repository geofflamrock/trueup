import { Link, Outlet } from "react-router";
import type { Route } from "./+types/home";
import { getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Header } from "~/components/app/Header";
import { BadgeCheckIcon, Coins, Eye, Share2 } from "lucide-react";
import { PageLayout } from "~/components/app/PageLayout";
import { calculateBalances } from "~/balances";

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
            {groups.map((group) => {
              const isBalanced = calculateBalances(group).length === 0;
              return (
                <Link
                  key={group.id}
                  to={`/${group.id}`}
                  prefetch="viewport"
                  className="cursor-pointer"
                >
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{group.name}</span>
                        <div className="flex items-center gap-1">
                          {group.isReadOnly && <Eye size={18} className="text-muted-foreground" />}
                          {group.isShared && !group.isReadOnly && <Share2 size={18} className="text-primary" />}
                          {isBalanced ? (
                            <BadgeCheckIcon size={20} className="text-primary" />
                          ) : (
                            <Coins size={20} />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
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
                {groups.length === 0 ? "Get started" : "Create group"}
              </Link>
            }
          />
        </div>
      </div>
      <Outlet />
    </PageLayout>
  );
}
