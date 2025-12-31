import type { Group, Balance } from "./types";

export function calculateBalances(group: Group): Balance[] {
  // Track net balance for each person (positive = owed to them, negative = they owe)
  const netBalances = new Map<number, number>();

  // Initialize balances for all people
  group.people.forEach((person) => {
    netBalances.set(person.id, 0);
  });

  // Process expenses
  group.expenses.forEach((expense) => {
    // Person who paid gets credited
    const currentPaid = netBalances.get(expense.paidById) || 0;
    netBalances.set(expense.paidById, currentPaid + expense.amount);

    // Each person's share is debited
    expense.shares.forEach((share) => {
      const currentShare = netBalances.get(share.personId) || 0;
      netBalances.set(share.personId, currentShare - share.amount);
    });
  });

  // Process transfers
  group.transfers.forEach((transfer) => {
    // Person who paid gains credit (they paid out money to settle debt)
    const currentPaid = netBalances.get(transfer.paidById) || 0;
    netBalances.set(transfer.paidById, currentPaid + transfer.amount);

    // Person who received loses credit (they received money)
    const currentReceived = netBalances.get(transfer.paidToId) || 0;
    netBalances.set(transfer.paidToId, currentReceived - transfer.amount);
  });

  // Convert net balances to individual debts
  const balances: Balance[] = [];
  const creditors: Array<{ id: number; amount: number }> = [];
  const debtors: Array<{ id: number; amount: number }> = [];

  netBalances.forEach((balance, personId) => {
    if (balance > 0.01) {
      creditors.push({ id: personId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: personId, amount: -balance });
    }
  });

  // Match debtors to creditors
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i].amount;
    const credit = creditors[j].amount;
    const amount = Math.min(debt, credit);

    balances.push({
      fromPersonId: debtors[i].id,
      toPersonId: creditors[j].id,
      amount: Math.round(amount * 100) / 100,
    });

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return balances;
}
