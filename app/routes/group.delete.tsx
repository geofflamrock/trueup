import { redirect, useLoaderData, Link, Form } from "react-router";
import type { Route } from "./+types/group.delete";
import { deleteGroup, getGroup } from "../storage";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  return { group };
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  const success = deleteGroup(params.groupId);
  if (success) {
    return redirect("/");
  }
  return redirect(`/${params.groupId}`);
}

export default function DeleteGroup() {
  const { group } = useLoaderData<typeof clientLoader>();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Delete Group?
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone and will delete all expenses, transfers, and people in this group.
        </p>
        <Form method="post" className="flex gap-3">
          <button
            type="submit"
            className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Delete Group
          </button>
          <Link
            to={`/${group.id}`}
            className="flex-1 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </Form>
      </div>
    </main>
  );
}
