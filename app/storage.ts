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

export function updateGroupName(groupId: string, name: string): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  group.name = name;
  saveGroup(group);
  return true;
}

export function updatePersonName(groupId: string, personId: number, name: string): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  const person = group.people.find((p) => p.id === personId);
  if (!person) return false;
  
  person.name = name;
  saveGroup(group);
  return true;
}

export function updateExpense(
  groupId: string,
  expenseId: string,
  updatedExpense: Omit<Expense, "id">
): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  const expenseIndex = group.expenses.findIndex((e) => e.id === expenseId);
  if (expenseIndex === -1) return false;
  
  group.expenses[expenseIndex] = {
    ...updatedExpense,
    id: expenseId,
  };
  saveGroup(group);
  return true;
}

export function updateTransfer(
  groupId: string,
  transferId: string,
  updatedTransfer: Omit<Transfer, "id">
): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  const transferIndex = group.transfers.findIndex((t) => t.id === transferId);
  if (transferIndex === -1) return false;
  
  group.transfers[transferIndex] = {
    ...updatedTransfer,
    id: transferId,
  };
  saveGroup(group);
  return true;
}

export function deleteGroup(groupId: string): boolean {
  const groups = getAllGroups();
  const filteredGroups = groups.filter((g) => g.id !== groupId);
  
  if (filteredGroups.length === groups.length) {
    return false; // Group not found
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGroups));
  return true;
}

export function deletePerson(groupId: string, personId: number): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  // Check if person is involved in any expenses or transfers
  const hasExpenses = group.expenses.some(
    (e) => e.paidById === personId || e.shares.some((s) => s.personId === personId)
  );
  const hasTransfers = group.transfers.some(
    (t) => t.paidById === personId || t.paidToId === personId
  );
  
  if (hasExpenses || hasTransfers) {
    return false; // Cannot delete person with expenses/transfers
  }
  
  group.people = group.people.filter((p) => p.id !== personId);
  saveGroup(group);
  return true;
}

export function deleteExpense(groupId: string, expenseId: string): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  const initialLength = group.expenses.length;
  group.expenses = group.expenses.filter((e) => e.id !== expenseId);
  
  if (group.expenses.length === initialLength) {
    return false; // Expense not found
  }
  
  saveGroup(group);
  return true;
}

export function deleteTransfer(groupId: string, transferId: string): boolean {
  const group = getGroup(groupId);
  if (!group) return false;
  
  const initialLength = group.transfers.length;
  group.transfers = group.transfers.filter((t) => t.id !== transferId);
  
  if (group.transfers.length === initialLength) {
    return false; // Transfer not found
  }
  
  saveGroup(group);
  return true;
}

export function getExpense(groupId: string, expenseId: string): Expense | null {
  const group = getGroup(groupId);
  if (!group) return null;
  return group.expenses.find((e) => e.id === expenseId) || null;
}

export function getTransfer(groupId: string, transferId: string): Transfer | null {
  const group = getGroup(groupId);
  if (!group) return null;
  return group.transfers.find((t) => t.id === transferId) || null;
}

function generateId(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
