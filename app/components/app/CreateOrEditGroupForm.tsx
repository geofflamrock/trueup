import { useState } from "react";
import { Form, useFetcher } from "react-router";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { Group } from "~/types";

type CreateOrEditGroupFormProps = {
  group?: Group;
  onClose: () => void;
};

export function CreateOrEditGroupForm({
  group,
  onClose,
}: CreateOrEditGroupFormProps) {
  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [people, setPeople] = useState<Array<{ id?: number; name: string }>>(
    group?.people.map((p) => ({ id: p.id, name: p.name })) ?? [{ name: "" }]
  );
  const fetcher = useFetcher();

  const addPersonField = () => {
    setPeople([...people, { name: "" }]);
  };

  const removePersonField = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePersonName = (index: number, name: string) => {
    const newPeople = [...people];
    newPeople[index] = { ...newPeople[index], name };
    setPeople(newPeople);
  };

  const submitButtonText = group
    ? fetcher.state !== "idle"
      ? "Saving..."
      : "Save Changes"
    : fetcher.state !== "idle"
      ? "Creating..."
      : "Create Group";

  return (
    <fetcher.Form
      action={group ? `/groups/${group.id}/edit` : "/groups/new"}
      method="post"
    >
      <div className="mb-6">
        <Label htmlFor="groupName">Group Name</Label>
        <Input
          type="text"
          id="groupName"
          name="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
          placeholder="e.g., Trip to Paris"
          className="mt-2"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label>People</Label>
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
                name="people"
                value={person.name}
                onChange={(e) => updatePersonName(index, e.target.value)}
                placeholder="Person name"
                className="flex-1"
                required
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
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={fetcher.state !== "idle"}
        >
          {submitButtonText}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </fetcher.Form>
  );
}
