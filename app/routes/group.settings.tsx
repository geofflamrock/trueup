import { redirect, data, useFetcher, Link, Outlet } from "react-router";
import type { Route } from "./+types/group.settings";
import { getGroup, updateGroupName, updateGroupPeople } from "../storage";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "~/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Trash2, UserPlus } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  people: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Person name cannot be empty"),
      }),
    )
    .min(2, "At least two people are required"),
});

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `True Up: ${loaderData?.group.name ?? ""}` },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

export type EditGroupRequest = {
  name: string;
  people: EditGroupPeople;
};

type EditGroupPeople = Array<EditGroupPerson>;

type EditGroupPerson = {
  id?: number;
  name: string;
};

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) {
    throw data("Group not found", { status: 404 });
  }

  return { group };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const peopleJson = formData.get("people") as string;
  const people: EditGroupPeople = peopleJson ? JSON.parse(peopleJson) : [];

  updateGroupName(params.groupId, name);
  const peopleUpdateResult = updateGroupPeople(params.groupId, people);

  if (!peopleUpdateResult.success) {
    throw data(peopleUpdateResult.error, { status: 400 });
  }

  return redirect(`/${params.groupId}`);
}

export default function EditGroup({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const fetcher = useFetcher();

  const form = useForm({
    defaultValues: {
      name: group.name,
      people: group.people as Array<{ id?: number; name: string }>,
    },
    validators: {
      onSubmit: groupSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.set("name", value.name);
      formData.set("people", JSON.stringify(value.people));
      fetcher.submit(formData, { method: "post" });
    },
  });

  return (
    <>
      <form
        id="edit-group"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="p-4"
      >
        <FieldSet>
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Group Name</FieldLabel>
                    <Input
                      type="text"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Trip to Paris"
                      className="mt-2"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="people" mode="array">
              {(field) => {
                return (
                  <Field>
                    <FieldLabel htmlFor="people">People</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {field.state.value.map((_, index) => (
                        <form.Field key={index} name={`people[${index}].name`}>
                          {(subField) => {
                            const isSubFieldInvalid =
                              subField.state.meta.isTouched &&
                              !subField.state.meta.isValid;

                            return (
                              <Field data-invalid={isSubFieldInvalid}>
                                <InputGroup>
                                  <InputGroupInput
                                    type="text"
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                    onBlur={subField.handleBlur}
                                    name={subField.name}
                                    placeholder={`Person ${index + 1}`}
                                    className="flex-1"
                                    aria-invalid={isSubFieldInvalid}
                                  />
                                  {field.state.value.length > 2 && (
                                    <InputGroupAddon align="inline-end">
                                      <InputGroupButton
                                        type="button"
                                        onClick={() => field.removeValue(index)}
                                        variant="ghost"
                                        size="icon-xs"
                                        className="cursor-pointer"
                                      >
                                        <Trash2 />
                                      </InputGroupButton>
                                    </InputGroupAddon>
                                  )}
                                </InputGroup>
                                {isSubFieldInvalid && (
                                  <FieldError
                                    errors={subField.state.meta.errors}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>
                      ))}
                    </div>
                    <div>
                      <Button
                        type="button"
                        onClick={() => field.pushValue({ name: "" })}
                        variant="outline"
                        size="lg"
                        className="cursor-pointer"
                      >
                        <UserPlus /> Add person
                      </Button>
                    </div>
                  </Field>
                );
              }}
            </form.Field>

            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="submit"
                size="xl"
                form="edit-group"
                className="cursor-pointer"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle" ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                size="xl"
                variant="ghost"
                className="text-destructive cursor-pointer"
                render={
                  <Link
                    to={`/${group.id}/settings/delete`}
                    prefetch="viewport"
                    className="cursor-pointer"
                  >
                    Delete group
                  </Link>
                }
              />
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
      <Outlet />
    </>
  );
}
