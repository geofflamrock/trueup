import { Link, Outlet, useLoaderData, useMatch } from "react-router";
import type { Route } from "./+types/group";
import { getGroup } from "../storage";
import { Button } from "~/components/ui/button";
import {
  ActivitySquareIcon,
  ArrowLeft,
  Banknote,
  ChartNoAxesCombined,
  CoinsIcon,
  EllipsisVerticalIcon,
  HandCoins,
  SettingsIcon,
} from "lucide-react";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Group } from "~/types";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Drawer, DrawerContent, DrawerFooter } from "~/components/ui/drawer";
import { useState } from "react";
import { PageLayout } from "../components/app/PageLayout";

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

export default function GroupPage() {
  const { group } = useLoaderData<typeof clientLoader>();
  const match = useMatch("/:groupId/*");
  const subPage = match?.params["*"] || "";
  const tab = subPage === "" ? "group" : subPage.split("/")[0];

  return (
    <PageLayout
      header={<GroupHeader group={group} />}
      footer={
        <Tabs value={tab} className="flex items-center justify-center p-4">
          <TabsList className="group-data-horizontal/tabs:h-14 sm:group-data-horizontal/tabs:h-12 rounded-full p-1">
            <TabsTrigger
              value="group"
              className="rounded-full min-w-16 sm:min-w-32 cursor-pointer"
              render={
                <Link
                  to={`/${group.id}`}
                  prefetch="viewport"
                  className="cursor-pointer"
                />
              }
            >
              <CoinsIcon className="size-6" />
              <span className="hidden sm:inline">Group</span>
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              className="rounded-full min-w-16 sm:min-w-32 cursor-pointer"
              render={
                <Link
                  to={`/${group.id}/breakdown`}
                  prefetch="viewport"
                  className="cursor-pointer"
                />
              }
            >
              <ChartNoAxesCombined className="size-6" />
              <span className="hidden sm:inline">Breakdown</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-full min-w-16 sm:min-w-32 cursor-pointer"
              render={
                <Link
                  to={`/${group.id}/activity`}
                  prefetch="viewport"
                  className="cursor-pointer"
                />
              }
            >
              <ActivitySquareIcon className="size-6" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-full min-w-16 sm:min-w-32 cursor-pointer"
              render={
                <Link
                  to={`/${group.id}/settings`}
                  prefetch="viewport"
                  className="cursor-pointer"
                />
              }
            >
              <SettingsIcon className="size-6" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <Outlet />
    </PageLayout>
  );
}

type GroupHeaderMenuProps = {
  group: Group;
};

function GroupHeaderMenu({ group }: GroupHeaderMenuProps) {
  const isDesktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false); // For mobile drawer state

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="muted" size="icon-lg" className="cursor-pointer">
              <EllipsisVerticalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
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
          <DropdownMenuItem
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={() => setDrawerOpen(false)}>
      <Button
        variant="muted"
        size="icon-lg"
        className="cursor-pointer"
        onClick={() => setDrawerOpen(true)}
      >
        <EllipsisVerticalIcon className="size-6" />
      </Button>
      <DrawerContent>
        <DrawerFooter className="flex flex-col gap-2">
          <Button
            variant="muted"
            size="xl"
            onClick={() => setDrawerOpen(false)}
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
            onClick={() => setDrawerOpen(false)}
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
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
type GroupHeaderProps = {
  group: Group;
};

function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex gap-4 items-center">
        <Button
          variant="muted"
          size="icon-lg"
          render={
            <Link to={`/`} prefetch="viewport" className="cursor-pointer">
              <ArrowLeft className="size-6" />
            </Link>
          }
        />
        <Link
          to={`/${group.id}/edit`}
          prefetch="viewport"
          className="cursor-pointer"
        >
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            {group.name}
          </h1>
        </Link>
      </div>

      <GroupHeaderMenu group={group} />
    </div>
  );
}
