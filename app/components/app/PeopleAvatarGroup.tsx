import type { Person } from "~/types";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "../ui/avatar";
import { data } from "react-router";

type PeopleAvatarGroupProps = {
  people: Person[];
  max?: number;
  size?: "default" | "sm" | "lg";
};

export function getPersonAvatarFallback(name: string) {
  if (!name) return "";
  // Remove special characters except letters, numbers and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  const first = parts[0].slice(0, 1);
  const second = parts[1].slice(0, 1);
  return (first + second).toUpperCase();
}

export function PeopleAvatarGroup({
  people,
  max,
  size = "default",
}: PeopleAvatarGroupProps) {
  const show = people.slice(0, max ?? people.length);
  const remaining = people.length - show.length;
  return (
    <AvatarGroup>
      {show.map((person) => (
        <PersonAvatar key={person.id} person={person} size={size} />
      ))}
      {remaining > 0 && (
        <Avatar key="more" size={size}>
          <AvatarFallback>{`+${remaining}`}</AvatarFallback>
        </Avatar>
      )}
    </AvatarGroup>
  );
}

type PersonAvatarProps = {
  person: Person;
  size?: "default" | "sm" | "lg";
};

export function PersonAvatar({ person, size = "default" }: PersonAvatarProps) {
  return (
    <Avatar size={size}>
      {/* <AvatarImage src="https://lh3.googleusercontent.com/a-/ALV-UjWDDn6HARDPMt4FHUZxuhe4ea_lU91kmIU4XOiyqa7a7cnWRzA=s600-p-k-rw-no" /> */}
      <AvatarFallback>{getPersonAvatarFallback(person.name)}</AvatarFallback>
    </Avatar>
  );
}
