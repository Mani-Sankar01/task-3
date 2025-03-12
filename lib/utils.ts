import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  try {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}
