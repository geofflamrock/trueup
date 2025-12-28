import type { Group, Person, Expense, Transfer } from "./types";

const STORAGE_KEY = "trueup-groups";

export function getAllGroups(): Group[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getGroup(id: string): Group | null {
  const groups = getAllGroups();
  return groups.find((g) => g.id === id) || null;
}

export function saveGroup(group: Group): void {
  const groups = getAllGroups();
  const index = groups.findIndex((g) => g.id === group.id);
  if (index >= 0) {
    groups[index] = group;
  } else {
    groups.push(group);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function createGroup(name: string): Group {
  const id = generateId();
  const group: Group = {
    id,
    name,
    people: [],
    expenses: [],
    transfers: [],
  };
  saveGroup(group);
  return group;
}

export function addPerson(groupId: string, name: string): Person | null {
  const group = getGroup(groupId);
  if (!group) return null;

  const id = group.people.length > 0 
    ? Math.max(...group.people.map((p) => p.id)) + 1 
    : 1;
  const person: Person = { id, name };
  group.people.push(person);
  saveGroup(group);
  return person;
}

export function addExpense(
  groupId: string,
  expense: Omit<Expense, "id">
): Expense | null {
  const group = getGroup(groupId);
  if (!group) return null;

  const newExpense: Expense = {
    ...expense,
    id: crypto.randomUUID(),
  };
  group.expenses.push(newExpense);
  saveGroup(group);
  return newExpense;
}

export function addTransfer(
  groupId: string,
  transfer: Omit<Transfer, "id">
): Transfer | null {
  const group = getGroup(groupId);
  if (!group) return null;

  const newTransfer: Transfer = {
    ...transfer,
    id: crypto.randomUUID(),
  };
  group.transfers.push(newTransfer);
  saveGroup(group);
  return newTransfer;
}

function generateId(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
