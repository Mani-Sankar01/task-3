import { UserRole } from "@/data/users";
import { clsx, type ClassValue } from "clsx";
import { useSession } from "next-auth/react";
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

export function renderRoleBasedPath(role: any) {
  let path = "";

  switch (role) {
    case "ADMIN":
    case "ADMIN_VIEWER":
      path = "admin";
      break;
    case "TSMWA_EDITOR":
    case "TSMWA_VIEWER":
      path = "tsmwa";
      break;
    case "TQMA_EDITOR":
      path = "twwa";
      break;
    case "TQMA_VIEWER":
      path = "twwa";
      break;
    default:
      path = "admin";
  }
  console.log("role", role);

  return path;
}
