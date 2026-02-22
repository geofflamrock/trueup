import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string that may be in ISO 8601 format (with time) or YYYY-MM-DD format
 * and returns just the date portion in YYYY-MM-DD format
 */
export function parseDateToYYYYMMDD(date: string): string {
  return date.includes("T") ? date.split("T")[0] : date;
}

/**
 * Returns today's date in YYYY-MM-DD format using local timezone
 */
export function getTodayYYYYMMDD(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
