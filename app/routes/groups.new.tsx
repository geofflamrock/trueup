import { data, redirect, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/groups.new";
import { createGroup, addPerson } from "../storage";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Trash2,
  UserAdd01FreeIcons,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

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
  const navigate = useNavigate();
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
    <DialogOrDrawer
      title="Create New Group"
      open={true}
      onClose={() => navigate(-1)}
    >
      <fetcher.Form method="post">
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
                          <HugeiconsIcon icon={Trash2} />
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
                  variant="muted"
                  size="xs"
                  className="cursor-pointer"
                >
                  <HugeiconsIcon icon={UserAdd01Icon} /> Add Person
                </Button>
              </div>
            </Field>
            <Field orientation={isDesktop ? "horizontal" : "vertical"}>
              <Button
                type="submit"
                size="xl"
                className="sm:flex-1 cursor-pointer"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle" ? "Creating..." : "Create Group"}
              </Button>
              <Button
                type="button"
                size="xl"
                variant="muted"
                className="sm:flex-1 cursor-pointer"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </fetcher.Form>
    </DialogOrDrawer>
  );
}
