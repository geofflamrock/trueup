import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { addPerson, createGroup, getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import {
  MinusSignIcon,
  SaveMoneyDollarIcon,
  Trash,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "~/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

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

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const groupName = formData.get("groupName") as string;
  const peopleJson = formData.get("people") as string;

  if (groupName) {
    const group = createGroup(groupName);

    // Add people if provided
    if (peopleJson) {
      const people = JSON.parse(peopleJson) as string[];
      people.forEach((personName) => {
        if (personName.trim()) {
          addPerson(group.id, personName.trim());
        }
      });
    }

    return redirect(`/${group.id}`);
  }

  return null;
}

export async function clientLoader() {
  return { groups: getAllGroups() };
}

export default function Home() {
  const { groups } = useLoaderData<typeof clientLoader>();
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<string[]>([""]);

  const addPersonField = () => {
    setPeople([...people, ""]);
  };

  const removePersonField = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePersonName = (index: number, name: string) => {
    const newPeople = [...people];
    newPeople[index] = name;
    setPeople(newPeople);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const validPeople = people.filter((p) => p.trim());
    const form = e.currentTarget;
    const peopleInput = form.querySelector(
      'input[name="people"]'
    ) as HTMLInputElement;
    if (peopleInput) {
      peopleInput.value = JSON.stringify(validPeople);
    }
  };

  return (
    <main className="h-dvh bg-background flex flex-col justify-between gap-4">
      <div className="container mx-auto p-6 pb-0 max-w-4xl">
        <div className="bg-transparent/95 backdrop-blur-xs flex gap-4 items-center">
          <HugeiconsIcon
            icon={SaveMoneyDollarIcon}
            className="text-primary"
            size={24}
          />
          <h1 className="text-2xl text-primary font-title">True Up</h1>
        </div>
        {groups.length === 0 && (
          <div className="flex flex-col gap-8 mt-8">
            <p className="text-center text-foreground text-3xl font-title">
              Track who paid for what on your{" "}
              <span className="text-primary">family holiday to Europe.</span>
            </p>
            {/* <Item variant="muted" className="p-8"> */}
            {/* <ItemContent className="text-center text-3xl font-title"> */}
            <p className="text-center text-foreground text-3xl font-title">
              Work out who owes what and{" "}
              <span className="text-primary">true up.</span>
            </p>
            {/* </ItemContent> */}
            {/* </Item> */}
            {/* <Item variant="muted" className="p-8"> */}
            {/* <ItemContent className="text-center text-3xl font-title"> */}
            <p className="text-center text-foreground text-3xl font-title">
              All data stays on your device. No account required. Free.
            </p>
            {/* </ItemContent> */}
            {/* </Item> */}
          </div>
        )}
      </div>
      {groups.length > 0 && (
        <div className="container mx-auto p-4 max-w-4xl flex flex-col gap-4 flex-auto rounded-t-2xl">
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
                  <ItemDescription>All expenses balanced 😀</ItemDescription>
                </ItemContent>
              </Item>
            </Link>
          ))}
        </div>
      )}
      <div className={cn("container mx-auto p-4 max-w-4xl")}>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="hero"
              size="hero"
              className={cn("cursor-pointer rounded-full")}
            >
              {groups.length === 0 ? "Get Started" : "Create Group"}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="container mx-auto">
              <DrawerHeader className="text-left">
                <DrawerTitle>Create Group</DrawerTitle>
              </DrawerHeader>
              <Form method="post" onSubmit={handleSubmit}>
                <div className="grid gap-4 p-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      type="text"
                      id="groupName"
                      name="groupName"
                      required
                      placeholder="e.g. Trip to Paris"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>People</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {people.map((person, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            type="text"
                            value={person}
                            onChange={(e) =>
                              updatePersonName(index, e.target.value)
                            }
                            placeholder="Name"
                            className="flex-1"
                          />
                          {people.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removePersonField(index)}
                              variant="destructive"
                              size="icon-sm"
                            >
                              <HugeiconsIcon icon={Trash} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <Button
                        type="button"
                        onClick={addPersonField}
                        variant="ghost"
                        size="sm"
                        className="text-left"
                      >
                        + Add Person
                      </Button>
                    </div>
                    <input type="hidden" name="people" />
                  </div>
                </div>
                <DrawerFooter className="pt-2">
                  <Button type="submit">Save</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </Form>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </main>
  );
}
