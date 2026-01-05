import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { addPerson, createGroup, getAllGroups } from "../storage";
import { Button } from "~/components/ui/button";
import { SaveMoneyDollarIcon } from "@hugeicons/core-free-icons";
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
          // <div>
          //   <Link to="/groups/new" className="text-2xl">
          //     <Button variant="hero" size="hero" className="cursor-pointer">
          //       <span>Create Group</span>
          //     </Button>
          //   </Link>
          // </div>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="hero" size="hero" className="cursor-pointer">
                Create Group
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Create Group</DrawerTitle>
              </DrawerHeader>
              <Form method="post" onSubmit={handleSubmit}>
                <div className="px-4">
                  <div className="mb-6">
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      type="text"
                      id="groupName"
                      name="groupName"
                      required
                      placeholder="e.g., Trip to Paris"
                      className="mt-2"
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <Label>People *</Label>
                      <Button
                        type="button"
                        onClick={addPersonField}
                        variant="ghost"
                        size="sm"
                      >
                        + Add Person
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {people.map((person, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="text"
                            value={person}
                            onChange={(e) =>
                              updatePersonName(index, e.target.value)
                            }
                            placeholder="Person name"
                            className="flex-1"
                          />
                          {people.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removePersonField(index)}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
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
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </main>
  );
}
