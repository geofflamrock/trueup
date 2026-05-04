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
  date: string; // Date string in YYYY-MM-DD format
  paidById: number;
  amount: number;
  description: string;
  shares: ExpenseShare[];
}

export interface Transfer {
  id: string;
  date: string; // Date string in YYYY-MM-DD format
  paidById: number;
  paidToId: number;
  amount: number;
  description?: string;
}

export interface Group {
  id: string; // 8 character hexadecimal string
  name: string;
  people: Person[];
  expenses: Expense[];
  transfers: Transfer[];
  isShared?: boolean;
  shareCode?: string; // 6-digit code owner sees
  lastETag?: string; // ETag from last blob upload
  isReadOnly?: boolean; // true for receiver groups
  shareId?: string; // the groupId of the original group (for read-only groups, same as id)
}

export interface Balance {
  fromPersonId: number;
  toPersonId: number;
  amount: number;
}
