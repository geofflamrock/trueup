import { Link, data, redirect, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/group.new";
import { createGroup, addPerson } from "../storage";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { PageLayout } from "~/components/app/PageLayout";

export function meta() {
  return [
    { title: "True Up" },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

export type NewGroupRequest = {
  name: string;
  people: string[];
};

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const people = formData.getAll("people");

  if (!name) throw data("Group name is required", { status: 400 });

  if (people.length === 0) {
    throw data("At least one person is required", { status: 400 });
  }

  const group = createGroup(name);

  people.forEach((name) => {
    if (name.toString().trim()) {
      addPerson(group.id, name.toString().trim());
    }
  });

  return redirect(`/${group.id}`);
}

export default function NewGroup() {
  const [people, setPeople] = useState<string[]>([""]);
  const fetcher = useFetcher();
  const isDesktop = useIsDesktop();

  const addPerson = () => {
    setPeople((prev) => [...prev, ""]);
  };

  const removePerson = (index: number) => {
    setPeople((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePersonName = (index: number, name: string) => {
    setPeople((prev) => prev.map((person, i) => (i === index ? name : person)));
  };

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            render={
              <Link to={`/`} prefetch="viewport" className="cursor-pointer">
                <ArrowLeft className="size-6" />
              </Link>
            }
          />
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            New Group
          </h1>
        </div>
      }
    >
      <fetcher.Form id="new-group" method="post" className="p-4">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Group Name</FieldLabel>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Trip to Paris"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="people">People</FieldLabel>
              <div className="flex flex-col gap-2">
                {people.map((person, index) => (
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      placeholder="Person name"
                      className="flex-1"
                      value={person}
                      onChange={(e) => updatePersonName(index, e.target.value)}
                      required
                      name="people"
                    />
                    {people.length > 1 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          onClick={() => removePerson(index)}
                          variant="ghost"
                          size="icon-xs"
                          className="cursor-pointer"
                        >
                          <Trash2 />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                ))}
              </div>
              <div>
                <Button
                  type="button"
                  onClick={addPerson}
                  variant="outline"
                  size={isDesktop ? "sm" : "default"}
                  className="cursor-pointer"
                >
                  <UserPlus /> Add Person
                </Button>
              </div>
            </Field>
            <div className="flex">
              <Button
                type="submit"
                size="xl"
                form="new-group"
                className="flex-1 sm:flex-initial cursor-pointer"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle" ? "Saving..." : "Save"}
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </fetcher.Form>
    </PageLayout>
  );
}
