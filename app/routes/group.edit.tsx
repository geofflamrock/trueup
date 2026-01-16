import { redirect, data } from "react-router";
import type { Route } from "./+types/group.edit";
import { updateGroupName, updateGroupPeople } from "../storage";

export type EditGroupRequest = {
  name: string;
  people: Array<{ id?: number; name: string }>;
};

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const editGroupRequest = (await request.json()) as EditGroupRequest;

  if (!editGroupRequest.name)
    throw data("Group name is required", { status: 400 });

  if (editGroupRequest.people.length === 0) {
    throw data("At least one person is required", { status: 400 });
  }

  updateGroupName(params.groupId, editGroupRequest.name);
  const peopleUpdateResult = updateGroupPeople(
    params.groupId,
    editGroupRequest.people,
  );

  if (!peopleUpdateResult.success) {
    throw data(peopleUpdateResult.error, { status: 400 });
  }

  return redirect(`/${params.groupId}`);
}
