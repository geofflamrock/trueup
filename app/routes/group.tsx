import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group";
import { getGroup, saveGroup } from "../storage";
import { calculateBalances } from "../balances";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useState } from "react";
import { DialogOrDrawer } from "./home";
import { EditGroupForm } from "~/components/app/EditGroupForm";
import type { Group } from "~/types";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `True Up: ${loaderData?.group.name ?? ""}` },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw new Response("Group not found", { status: 404 });
  }
  const balances = calculateBalances(group);
  return { group, balances };
}

export default function GroupPage() {
  const { group, balances } = useLoaderData<typeof clientLoader>();
  const [editGroupOpen, setEditGroupOpen] = useState(false);

  // Combine expenses and transfers into a timeline
  const timeline = [
    ...group.expenses.map((e) => ({ type: "expense" as const, ...e })),
    ...group.transfers.map((t) => ({ type: "transfer" as const, ...t })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onEditGroupClose = () => {
    setEditGroupOpen(false);
  };

  const getPersonName = (id: number) =>
    group.people.find((p) => p.id === id)?.name || "Unknown";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <h1 className="text-3xl font-title text-foreground">{group.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditGroupOpen(true)}
          >
            Edit
          </Button>
          <Button asChild variant="destructive">
            <Link to={`/${group.id}/delete`}>Delete Group</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* People section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-foreground">People</h2>
            </div>

            {group.people.length === 0 ? (
              <p className="text-muted-foreground">
                No people yet. Add someone to get started!
              </p>
            ) : (
              <ul className="space-y-2">
                {group.people.map((person) => (
                  <li
                    key={person.id}
                    className="px-4 py-2 bg-muted rounded-lg text-foreground"
                  >
                    {person.name}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Balances section */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Who Owes What
            </h2>
            {balances.length === 0 ? (
              <p className="text-muted-foreground">
                All balanced! No one owes anything.
              </p>
            ) : (
              <ul className="space-y-2">
                {balances.map((balance, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-3 bg-primary/10 rounded-lg text-foreground"
                  >
                    <span className="font-medium">
                      {getPersonName(balance.fromPersonId)}
                    </span>
                    {" owes "}
                    <span className="font-medium">
                      {getPersonName(balance.toPersonId)}
                    </span>{" "}
                    <span className="font-bold text-primary">
                      ${balance.amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div>
          {/* Timeline section */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Timeline
            </h2>

            <div className="flex gap-2 mb-6">
              <Button
                asChild
                disabled={group.people.length === 0}
                className="flex-1"
              >
                <Link
                  to={`/${group.id}/expenses/new`}
                  onClick={(e) => {
                    if (group.people.length === 0) {
                      e.preventDefault();
                    }
                  }}
                >
                  + Add Expense
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                disabled={group.people.length < 2}
                className="flex-1"
              >
                <Link
                  to={`/${group.id}/transfers/new`}
                  onClick={(e) => {
                    if (group.people.length < 2) {
                      e.preventDefault();
                    }
                  }}
                >
                  + Add Transfer
                </Link>
              </Button>
            </div>

            {timeline.length === 0 ? (
              <p className="text-muted-foreground">
                No expenses or transfers yet.
              </p>
            ) : (
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-l-4 border-primary bg-muted rounded"
                  >
                    {item.type === "expense" ? (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(item.date).toLocaleDateString()}{" "}
                          {new Date(item.date).toLocaleTimeString()}
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {item.description}
                            </div>
                            <div className="text-foreground">
                              Paid by {getPersonName(item.paidById)}: $
                              {item.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Split:{" "}
                              {item.shares
                                .map(
                                  (s) =>
                                    `${getPersonName(s.personId)} ($${s.amount.toFixed(2)})`,
                                )
                                .join(", ")}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link
                                to={`/${group.id}/expenses/${item.id}/edit`}
                              >
                                Edit
                              </Link>
                            </Button>
                            <Button asChild variant="destructive" size="sm">
                              <Link
                                to={`/${group.id}/expenses/${item.id}/delete`}
                              >
                                Delete
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(item.date).toLocaleDateString()}{" "}
                          {new Date(item.date).toLocaleTimeString()}
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              Transfer
                            </div>
                            <div className="text-foreground">
                              {getPersonName(item.paidById)} paid{" "}
                              {getPersonName(item.paidToId)}: $
                              {item.amount.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link
                                to={`/${group.id}/transfers/${item.id}/edit`}
                              >
                                Edit
                              </Link>
                            </Button>
                            <Button asChild variant="destructive" size="sm">
                              <Link
                                to={`/${group.id}/transfers/${item.id}/delete`}
                              >
                                Delete
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      <DialogOrDrawer
        title="Edit Group"
        open={editGroupOpen}
        onClose={onEditGroupClose}
      >
        <EditGroupForm onClose={onEditGroupClose} group={group} />
      </DialogOrDrawer>
    </div>
  );
}
