import { Form, Link, redirect, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/group.edit";
import { getGroup, updateGroupName, updateGroupPeople } from "../storage";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  return { group };
}

export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const groupName = formData.get("groupName") as string;
  const peopleJson = formData.get("people") as string;
  
  if (groupName) {
    updateGroupName(params.groupId, groupName);
  }
  
  if (peopleJson) {
    const people = JSON.parse(peopleJson) as Array<{ id?: number; name: string }>;
    const result = updateGroupPeople(params.groupId, people);
    
    if (!result.success) {
      return { error: result.error };
    }
  }
  
  return redirect(`/${params.groupId}`);
}

export default function EditGroup() {
  const { group } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();
  const [groupName, setGroupName] = useState(group.name);
  const [people, setPeople] = useState<Array<{ id?: number; name: string }>>(
    group.people.map((p) => ({ id: p.id, name: p.name }))
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actionData && 'error' in actionData && actionData.error) {
      setError(actionData.error);
      setTimeout(() => setError(null), 5000);
    }
  }, [actionData]);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const peopleInput = form.querySelector('input[name="people"]') as HTMLInputElement;
    if (peopleInput) {
      peopleInput.value = JSON.stringify(people);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          asChild
          variant="ghost"
          className="mb-4"
        >
          <Link to={`/${group.id}`}>
            ← Back to group
          </Link>
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">
          Edit Group
        </h1>

        {error && (
          <div className="mb-4 px-4 py-2 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <Card className="p-6">
          <Form method="post" onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="groupName">
                Group Name *
              </Label>
              <Input
                type="text"
                id="groupName"
                name="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label>
                  People
                </Label>
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
                      value={person.name}
                      onChange={(e) => updatePersonName(index, e.target.value)}
                      placeholder="Person name"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removePersonField(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <input type="hidden" name="people" />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link to={`/${group.id}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </main>
  );
}
