import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/groups.new";
import { createGroup, addPerson } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";

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

export default function NewGroup() {
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
    const peopleInput = form.querySelector('input[name="people"]') as HTMLInputElement;
    if (peopleInput) {
      peopleInput.value = JSON.stringify(validPeople);
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
          <Link to="/">
            ← Back to home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">
          Create New Group
        </h1>

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
                required
                placeholder="e.g., Trip to Paris"
                className="mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label>
                  People (Optional)
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
                      value={person}
                      onChange={(e) => updatePersonName(index, e.target.value)}
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

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
              >
                Create Group
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link to="/">
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
