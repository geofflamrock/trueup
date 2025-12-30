import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/group";
import { getGroup } from "../storage";
import { calculateBalances } from "../balances";

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

  // Combine expenses and transfers into a timeline
  const timeline = [
    ...group.expenses.map((e) => ({ type: "expense" as const, ...e })),
    ...group.transfers.map((t) => ({ type: "transfer" as const, ...t })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPersonName = (id: number) =>
    group.people.find((p) => p.id === id)?.name || "Unknown";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to groups
          </Link>
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {group.name}
              </h1>
              <Link
                to={`/${group.id}/edit`}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Edit
              </Link>
            </div>
            <Link
              to={`/${group.id}/delete`}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Delete Group
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            {/* People section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  People
                </h2>
              </div>

              {group.people.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No people yet. Add someone to get started!
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.people.map((person) => (
                    <li
                      key={person.id}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                    >
                      {person.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Balances section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Who Owes What
              </h2>
              {balances.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  All balanced! No one owes anything.
                </p>
              ) : (
                <ul className="space-y-2">
                  {balances.map((balance, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-gray-100"
                    >
                      <span className="font-medium">{getPersonName(balance.fromPersonId)}</span>
                      {" owes "}
                      <span className="font-medium">{getPersonName(balance.toPersonId)}</span>
                      {" "}
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${balance.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Timeline section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Timeline
              </h2>

              <div className="flex gap-2 mb-6">
                <Link
                  to={`/${group.id}/expenses/new`}
                  className={`flex-1 px-4 py-2 text-center font-medium rounded-lg transition-colors ${
                    group.people.length === 0
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  onClick={(e) => {
                    if (group.people.length === 0) {
                      e.preventDefault();
                    }
                  }}
                >
                  + Add Expense
                </Link>
                <Link
                  to={`/${group.id}/transfers/new`}
                  className={`flex-1 px-4 py-2 text-center font-medium rounded-lg transition-colors ${
                    group.people.length < 2
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  onClick={(e) => {
                    if (group.people.length < 2) {
                      e.preventDefault();
                    }
                  }}
                >
                  + Add Transfer
                </Link>
              </div>

              {timeline.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No expenses or transfers yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      {item.type === "expense" ? (
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                          </div>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {item.description}
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                Paid by {getPersonName(item.paidById)}: ${item.amount.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Split: {item.shares.map((s) => `${getPersonName(s.personId)} ($${s.amount.toFixed(2)})`).join(", ")}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                to={`/${group.id}/expenses/${item.id}/edit`}
                                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded"
                              >
                                Edit
                              </Link>
                              <Link
                                to={`/${group.id}/expenses/${item.id}/delete`}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                              >
                                Delete
                              </Link>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                          </div>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                Transfer
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {getPersonName(item.paidById)} paid {getPersonName(item.paidToId)}: ${item.amount.toFixed(2)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                to={`/${group.id}/transfers/${item.id}/edit`}
                                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded"
                              >
                                Edit
                              </Link>
                              <Link
                                to={`/${group.id}/transfers/${item.id}/delete`}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                              >
                                Delete
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
