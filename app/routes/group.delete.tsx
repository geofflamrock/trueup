import { redirect, useLoaderData, Link, Form } from "react-router";
import type { Route } from "./+types/group.delete";
import { deleteGroup, getGroup } from "../storage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Delete Group?
        </h1>
        <p className="text-foreground mb-6">
          Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone and will delete all expenses, transfers, and people in this group.
        </p>
        <Form method="post" className="flex gap-3">
          <Button
            type="submit"
            variant="destructive"
            className="flex-1"
          >
            Delete Group
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
        </Form>
      </Card>
    </main>
  );
}
