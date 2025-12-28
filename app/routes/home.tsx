import { Form, Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { getAllGroups, createGroup } from "../storage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TrueUp - Expense Tracker" },
    { name: "description", content: "Track shared expenses with groups" },
  ];
}

export async function clientLoader() {
  return { groups: getAllGroups() };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  
  if (name) {
    const group = createGroup(name);
    return redirect(`/${group.id}`);
  }
  
  return null;
}

export default function Home() {
  const { groups } = useLoaderData<typeof clientLoader>();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          TrueUp
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create New Group
          </h2>
          <Form method="post" className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Group name"
              required
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create
            </button>
          </Form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Groups
          </h2>
          {groups.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No groups yet. Create one to get started!
            </p>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/${group.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {group.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {group.people.length} {group.people.length === 1 ? "person" : "people"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
