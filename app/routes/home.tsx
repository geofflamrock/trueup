import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Item, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { useMediaQuery } from "usehooks-ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { CreateGroupForm } from "~/components/app/CreateGroupForm";

function getInitials(name: string) {
  if (!name) return "";
  // Remove special characters except letters, numbers and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  const first = parts[0].slice(0, 1);
  const second = parts[1].slice(0, 1);
  return (first + second).toUpperCase();
}

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
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const { groups } = loaderData;

  return (
    <div className="flex flex-col gap-8">
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
            <Link key={group.id} to={`/${group.id}`}>
              <Item variant="muted">
                <ItemMedia>
                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-4 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale *:data-[slot=avatar]:size-10">
                    {(() => {
                      const show = group.people.slice(0, 2);
                      const remaining = group.people.length - show.length;
                      return (
                        <>
                          {show.map((person) => (
                            <Avatar key={person.id}>
                              <AvatarFallback>
                                {getInitials(person.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {remaining > 0 && (
                            <Avatar key="more">
                              <AvatarFallback>{`+${remaining}`}</AvatarFallback>
                            </Avatar>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{group.name}</ItemTitle>
                </ItemContent>
              </Item>
            </Link>
          ))}
        </div>
      )}
      <div>
        <Button
          variant="hero"
          size="hero"
          className={cn("cursor-pointer rounded-full")}
          onClick={() => setNewGroupOpen(true)}
        >
          {groups.length === 0 ? "Get Started" : "Create Group"}
        </Button>
      </div>
      <DialogOrDrawer
        title="Create New Group"
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
      >
        <CreateGroupForm onClose={() => setNewGroupOpen(false)} />
      </DialogOrDrawer>
    </div>
  );
}

type DialogOrDrawerProps = React.PropsWithChildren<{
  title: string;
  open: boolean;
  onClose: () => void;
}>;

export function DialogOrDrawer({
  title,
  open,
  onClose,
  children,
}: DialogOrDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 40rem)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
