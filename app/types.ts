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

export interface GroupShareMetadata {
  isShared?: boolean;    // true when the owner has shared this group
  shareCode?: string;    // 6-digit access code (owner and receiver)
  lastETag?: string;     // ETag from last blob upload/download
  shareId?: string;      // matches group id for now, seam for future change
}

export interface Group {
  id: string; // 8 character hexadecimal string
  name: string;
  people: Person[];
  expenses: Expense[];
  transfers: Transfer[];
  lastModified?: string; // ISO timestamp, updated on every local save; stripped before cloud upload
  shareMetadata?: GroupShareMetadata;
}

export interface Balance {
  fromPersonId: number;
  toPersonId: number;
  amount: number;
}
