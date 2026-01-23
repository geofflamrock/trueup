import { redirect, data, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/group.edit";
import { getGroup, updateGroupName, updateGroupPeople } from "../storage";
import { useState } from "react";
import type { Group } from "~/types";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { HugeiconsIcon } from "@hugeicons/react";
import { Trash2, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { useIsDesktop } from "~/hooks/useIsDesktop";

export type EditGroupRequest = {
  name: string;
  people: EditGroupPeople;
};

type EditGroupPeople = Array<EditGroupPerson>;

type EditGroupPerson = {
  id?: number;
  name: string;
};

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw data("Group not found", { status: 404 });
  }

  return { group };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const peopleJson = formData.get("people") as string;
  const people: EditGroupPeople = peopleJson ? JSON.parse(peopleJson) : [];

  if (!name) throw data("Group name is required", { status: 400 });

  if (people.length === 0) {
    throw data("At least one person is required", { status: 400 });
  }

  updateGroupName(params.groupId, name);
  const peopleUpdateResult = updateGroupPeople(params.groupId, people);

  if (!peopleUpdateResult.success) {
    throw data(peopleUpdateResult.error, { status: 400 });
  }

  return redirect(`/${params.groupId}`);
}

export default function EditGroup({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <DialogOrDrawer title="Edit Group" open={true} onClose={() => navigate(-1)}>
      <EditGroupForm onClose={() => navigate(-1)} group={loaderData.group} />
    </DialogOrDrawer>
  );
}

type EditGroupFormProps = {
  group: Group;
  onClose: () => void;
};

function EditGroupForm({ group, onClose }: EditGroupFormProps) {
  const [name, setName] = useState<string>(group.name);
  const [people, setPeople] = useState<Array<{ id?: number; name: string }>>(
    group.people,
  );
  const fetcher = useFetcher();
  const isDesktop = useIsDesktop();

  const addPerson = () => {
    setPeople([...people, { name: "" }]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePersonName = (index: number, name: string) => {
    const newPeople = [...people];
    newPeople[index] = { ...newPeople[index], name };
    setPeople(newPeople);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const peopleInput = form.querySelector(
      'input[name="people"]',
    ) as HTMLInputElement;
    if (peopleInput) {
      peopleInput.value = JSON.stringify(people);
    }
  };

  return (
    <fetcher.Form onSubmit={onSubmit} method="post">
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
              className="mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="people">People</FieldLabel>
            <div className="flex flex-col gap-2">
              {people.map((person, index) => (
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePersonName(index, e.target.value)}
                    placeholder="Person name"
                    className="flex-1"
                    required
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
            <input type="hidden" name="people" />
            <div>
              <Button
                type="button"
                onClick={addPerson}
                variant="muted"
                size={isDesktop ? "sm" : "default"}
                className="cursor-pointer"
              >
                <HugeiconsIcon icon={UserAdd01Icon} /> Add Person
              </Button>
            </div>
          </Field>

          <Field orientation={isDesktop ? "horizontal" : "vertical"}>
            <Button
              type="submit"
              size={isDesktop ? "lg" : "xl"}
              className="sm:flex-1 cursor-pointer"
              disabled={fetcher.state !== "idle"}
            >
              {fetcher.state !== "idle" ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              size={isDesktop ? "lg" : "xl"}
              variant="muted"
              className="sm:flex-1 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </fetcher.Form>
  );
}
