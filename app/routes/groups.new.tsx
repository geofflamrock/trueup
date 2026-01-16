import { data, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/groups.new";
import { createGroup, addPerson } from "../storage";

export type NewGroupRequest = {
  name: string;
  people: string[];
};

export async function clientAction({ request }: Route.ClientActionArgs) {
  const newGroupRequest = (await request.json()) as NewGroupRequest;

  if (!newGroupRequest.name)
    throw data("Group name is required", { status: 400 });

  if (newGroupRequest.people.length === 0) {
    throw data("At least one person is required", { status: 400 });
  }

  const group = createGroup(newGroupRequest.name);

  newGroupRequest.people.forEach((name) => {
    if (name.toString().trim()) {
      addPerson(group.id, name.toString().trim());
    }
  });

  return redirect(`/${group.id}`);
}
