import { useState } from "react";
import { Form, useFetcher, type SubmitTarget } from "react-router";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { Group } from "~/types";
import type { NewGroupRequest } from "~/routes/groups.new";

type CreateGroupFormProps = {
  onClose: () => void;
};

export function CreateGroupForm({ onClose }: CreateGroupFormProps) {
  const [groupName, setGroupName] = useState("");
  const [people, setPeople] = useState<string[]>([""]);
  const fetcher = useFetcher();

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

  const handleSubmit = async () => {
    const requestData: NewGroupRequest = {
      name: groupName,
      people: people,
    };

    await fetcher.submit(requestData, {
      action: "/groups/new",
      method: "POST",
      encType: "application/json",
    });

    onClose();
  };

  return (
    <fetcher.Form onSubmit={handleSubmit}>
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
                value={person}
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
          {fetcher.state !== "idle" ? "Creating..." : "Create Group"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </fetcher.Form>
  );
}
