import { Link, Outlet, useLoaderData, useMatch, useRevalidator } from "react-router";
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
  Eye,
  HandCoins,
  RefreshCwIcon,
  SettingsIcon,
  Share2,
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
import { useReadOnlySync } from "~/hooks/useReadOnlySync";
import { useOwnerSync } from "~/hooks/useOwnerSync";

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
  const { revalidate } = useRevalidator();

  const match = useMatch("/:groupId/*");
  const subPage = match?.params["*"] || "";
  const tab = subPage === "" ? "group" : subPage;

  // Receiver: auto-sync polls and applies updates silently
  const { isSyncing: isReceiverSyncing } = useReadOnlySync(group, revalidate);
  // Owner: tracks upload state from syncSharedGroup calls in child routes
  const { isSyncing: isOwnerSyncing } = useOwnerSync();

  const isSyncing = group.shareMetadata?.isReadOnly ? isReceiverSyncing : isOwnerSyncing;

  return (
    <PageLayout
      header={<GroupHeader group={group} isSyncing={isSyncing} />}
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
                to={`/${group.id}/share`}
                prefetch="viewport"
                className="cursor-pointer"
              >
                <Share2 /> Share group
              </Link>
            }
          />
          <DropdownMenuItem
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
          <DropdownMenuItem
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
                to={`/${group.id}/share`}
                prefetch="viewport"
                className="cursor-pointer"
              >
                <Share2 /> Share group
              </Link>
            }
          />
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
                <Banknote /> New expense
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
                <HandCoins /> New transfer
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
  isSyncing: boolean;
};

function GroupHeader({ group, isSyncing }: GroupHeaderProps) {
  const isReadOnly = group.shareMetadata?.isReadOnly;

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
        {isReadOnly ? (
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            {group.name}
          </h1>
        ) : (
          <Link
            to={`/${group.id}/edit`}
            prefetch="viewport"
            className="cursor-pointer"
          >
            <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
              {group.name}
            </h1>
          </Link>
        )}
      </div>

      {isReadOnly ? (
        // Receiver: show spinner while syncing, eye icon otherwise
        <Button variant="muted" size="icon-lg" disabled aria-label={isSyncing ? "Syncing" : "Read-only group"}>
          {isSyncing
            ? <RefreshCwIcon className="size-6 text-muted-foreground animate-spin" />
            : <Eye className="size-6 text-muted-foreground" />
          }
        </Button>
      ) : (
        // Owner: show share/sync icon + action menu
        <div className="flex items-center gap-1">
          {isSyncing ? (
            <Button variant="muted" size="icon-lg" disabled aria-label="Syncing">
              <RefreshCwIcon className="size-6 text-muted-foreground animate-spin" />
            </Button>
          ) : (
            <Button
              variant="muted"
              size="icon-lg"
              aria-label="Share group"
              render={
                <Link to={`/${group.id}/share`} prefetch="viewport" className="cursor-pointer">
                  <Share2 className="size-6" />
                </Link>
              }
            />
          )}
          <GroupHeaderMenu group={group} />
        </div>
      )}
    </div>
  );
}
