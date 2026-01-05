import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import { SaveMoneyDollarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "~/components/ui/card";

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

export default function Home() {
  const { groups } = useLoaderData<typeof clientLoader>();

  return (
    <main className="h-dvh bg-primary flex flex-col justify-between xl:justify-normal">
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="flex gap-4 justify-center items-center mb-8">
          <HugeiconsIcon
            icon={SaveMoneyDollarIcon}
            className="text-background"
            size={48}
          />
          <h1 className="text-4xl font-bold text-background font-title">
            True Up
          </h1>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-center text-background text-xl">
            Track expenses for your groups trip to Europe.
          </p>
          <p className="text-center text-background text-xl">
            Work out who owes what.
          </p>
          <p className="text-center text-background text-xl">
            All data stays on your phone. No accounts. Free.
          </p>
        </div>
      </div>
      <div className="container mx-auto p-4 max-w-4xl">
        {groups.length > 0 && (
          <Card className="flex flex-col gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/${group.id}`}>
                <div className="py-4 px-8 flex flex-col gap-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {group.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {group.people.length}{" "}
                    {group.people.length === 1 ? "person" : "people"}
                  </p>
                </div>
              </Link>
            ))}
          </Card>
        )}
        {groups.length === 0 && (
          <div>
            <Link to="/groups/new" className="text-2xl">
              <Button variant="hero" size="hero" className="cursor-pointer">
                <span>Create Group</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
