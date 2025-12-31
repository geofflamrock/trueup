import { Form, Link, redirect, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/group.edit";
import { getGroup, updateGroupName, updateGroupPeople } from "../storage";
import { useState, useEffect } from "react";

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to={`/${group.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to group
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Edit Group
        </h1>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <Form method="post" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="groupName"
              name="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                People
              </label>
              <button
                type="button"
                onClick={addPersonField}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add Person
              </button>
            </div>
            <div className="space-y-2">
              {people.map((person, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={person.name}
                    onChange={(e) => updatePersonName(index, e.target.value)}
                    placeholder="Person name"
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removePersonField(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <input type="hidden" name="people" />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <Link
              to={`/${group.id}`}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
