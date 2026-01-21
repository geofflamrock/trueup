import { data, redirect, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/groups.new";
import { createGroup, addPerson } from "../storage";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { useState } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

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

type CreateGroupFormProps = {
  onClose: () => void;
};

export function CreateGroupForm({ onClose }: CreateGroupFormProps) {
  const [people, setPeople] = useState<string[]>([""]);
  const fetcher = useFetcher();

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
    <fetcher.Form method="post">
      <div className="mb-6">
        <Label htmlFor="name">Group Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          placeholder="e.g., Trip to Paris"
          className="mt-2"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label>People</Label>
          <Button type="button" onClick={addPerson} variant="ghost" size="sm">
            + Add Person
          </Button>
        </div>
        <div className="space-y-2">
          {people.map((person, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                placeholder="Person name"
                className="flex-1"
                value={person}
                onChange={(e) => updatePersonName(index, e.target.value)}
                required
                name="people"
              />
              {people.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removePerson(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          className="sm:flex-1"
          disabled={fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" ? "Creating..." : "Create Group"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="sm:flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </fetcher.Form>
  );
}

export default function NewGroup() {
  const navigate = useNavigate();

  return (
    <DialogOrDrawer
      title="Create New Group"
      open={true}
      onClose={() => navigate(-1)}
    >
      <CreateGroupForm onClose={() => navigate(-1)} />
    </DialogOrDrawer>
  );
}
