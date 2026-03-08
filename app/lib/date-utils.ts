import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a date string that may be in ISO 8601 format (with time) or YYYY-MM-DD format
 * and returns just the date portion in YYYY-MM-DD format
 */
export function parseDateToYYYYMMDD(date: string): string {
  // If it's already in YYYY-MM-DD format, return as-is
  if (!date.includes("T")) {
    return date;
  }
  // Parse ISO string and format as YYYY-MM-DD
  return format(parseISO(date), "yyyy-MM-dd");
}

/**
 * Returns today's date in YYYY-MM-DD format using local timezone
 */
export function getTodayYYYYMMDD(): string {
  return format(new Date(), "yyyy-MM-dd");
}
