import { Link, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/group.new";
import { createGroup, addPerson } from "../storage";
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
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { PageLayout } from "~/components/app/PageLayout";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  people: z
    .array(z.string().min(1, "Person name cannot be empty"))
    .min(2, "At least two people are required"),
});

export function meta() {
  return [
    { title: "True Up" },
    {
      name: "description",
      content: "Track expenses for your group and who owes what",
    },
  ];
}

export type NewGroupRequest = {
  name: string;
  people: string[];
};

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const people = formData.getAll("people");

  const group = createGroup(name);

  people.forEach((personName) => {
    const trimmed = personName.toString().trim();
    if (trimmed) {
      addPerson(group.id, trimmed);
    }
  });

  return redirect(`/${group.id}`);
}

export default function NewGroup() {
  const fetcher = useFetcher();

  const form = useForm({
    defaultValues: {
      name: "",
      people: ["", ""],
    },
    validators: {
      onSubmit: groupSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.set("name", value.name);
      value.people.forEach((person) => {
        formData.append("people", person);
      });
      fetcher.submit(formData, { method: "post" });
    },
  });

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            render={
              <Link to={`/`} prefetch="viewport" className="cursor-pointer">
                <ArrowLeft className="size-6" />
              </Link>
            }
          />
          <h1 className="text-2xl font-title text-foreground text-ellipsis overflow-hidden">
            New group
          </h1>
        </div>
      }
    >
      <form
        id="new-group"
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
                      aria-invalid={isInvalid}
                      autoFocus
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
                    <FieldLabel>People</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {field.state.value.map((_, index) => (
                        <form.Field key={index} name={`people[${index}]`}>
                          {(subField) => {
                            const isSubFieldInvalid =
                              subField.state.meta.isTouched &&
                              !subField.state.meta.isValid;

                            return (
                              <Field data-invalid={isSubFieldInvalid}>
                                <InputGroup>
                                  <InputGroupInput
                                    type="text"
                                    placeholder={`Person ${index + 1}`}
                                    className="flex-1"
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                    onBlur={subField.handleBlur}
                                    name="people"
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
                        onClick={() => field.pushValue("")}
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

            <div className="flex">
              <Button
                type="submit"
                size="xl"
                className="flex-1 sm:flex-initial cursor-pointer"
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle" ? "Saving..." : "Save"}
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
    </PageLayout>
  );
}
