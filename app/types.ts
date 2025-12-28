export interface Person {
  id: number;
  name: string;
}

export interface ExpenseShare {
  personId: number;
  amount: number;
}

export interface Expense {
  id: string;
  date: string; // ISO 8601 string with timezone
  paidById: number;
  amount: number;
  description: string;
  shares: ExpenseShare[];
}

export interface Transfer {
  id: string;
  date: string; // ISO 8601 string with timezone
  paidById: number;
  paidToId: number;
  amount: number;
}

export interface Group {
  id: string; // 8 character hexadecimal string
  name: string;
  people: Person[];
  expenses: Expense[];
  transfers: Transfer[];
}

export interface Balance {
  fromPersonId: number;
  toPersonId: number;
  amount: number;
}
