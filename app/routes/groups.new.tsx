import { data, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/groups.new";
import { createGroup, addPerson } from "../storage";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const groupName = formData.get("groupName") as string;
  const people = formData.getAll("people");

  if (!groupName) throw data("Group name is required", { status: 400 });

  if (people.length === 0) {
    throw data("At least one person is required", { status: 400 });
  }

  const group = createGroup(groupName);

  people.forEach((personName) => {
    if (personName.toString().trim()) {
      addPerson(group.id, personName.toString().trim());
    }
  });

  return redirect(`/${group.id}`);
}
