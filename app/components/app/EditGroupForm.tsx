import { useState } from "react";
import { useFetcher } from "react-router";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { Group } from "~/types";
import type { EditGroupRequest } from "~/routes/group.edit";

type EditGroupFormProps = {
  group: Group;
  onClose: () => void;
};

export function EditGroupForm({ group, onClose }: EditGroupFormProps) {
  const [editGroupRequest, setEditGroupRequest] = useState<EditGroupRequest>({
    name: group.name,
    people: group.people,
  });
  const fetcher = useFetcher();

  const onGroupNameChanged = (name: string) => {
    setEditGroupRequest({ ...editGroupRequest, name: name });
  };

  const onPersonAdded = () => {
    setEditGroupRequest({
      ...editGroupRequest,
      people: [...editGroupRequest.people, { name: "" }],
    });
  };

  const onPersonRemoved = (index: number) => {
    setEditGroupRequest({
      ...editGroupRequest,
      people: editGroupRequest.people.filter((_, i) => i !== index),
    });
  };

  const onPersonNameChanged = (index: number, name: string) => {
    const newPeople = [...editGroupRequest.people];
    newPeople[index] = { ...newPeople[index], name };
    setEditGroupRequest({ ...editGroupRequest, people: newPeople });
  };

  const handleSubmit = async () => {
    await fetcher.submit(editGroupRequest as any, {
      action: `/${group.id}/edit`,
      method: "post",
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
          value={editGroupRequest.name}
          onChange={(e) => onGroupNameChanged(e.target.value)}
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
            onClick={onPersonAdded}
            variant="ghost"
            size="sm"
          >
            + Add Person
          </Button>
        </div>
        <div className="space-y-2">
          {editGroupRequest.people.map((person, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                value={person.name}
                onChange={(e) => onPersonNameChanged(index, e.target.value)}
                placeholder="Person name"
                className="flex-1"
                required
              />
              {editGroupRequest.people.length > 1 && (
                <Button
                  type="button"
                  onClick={() => onPersonRemoved(index)}
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
          {fetcher.state !== "idle" ? "Saving..." : "Save Changes"}
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
