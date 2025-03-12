import { z } from "zod";

// Define the role enum
export enum UserRole {
  Admin = "Admin",
  TSMWAAdmin = "TSMWA Admin",
  TSMWAEditor = "TSMWA Editor",
  TSMWAViewer = "TSMWA Viewer",
  TQMWAEditor = "TQMWA Editor",
  TQMWAViewer = "TQMWA Viewer",
}

// Define the status enum
export enum UserStatus {
  Active = "Active",
  Inactive = "Inactive",
}

// Define the User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Create a schema for user validation
export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" }),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
});

// Sample users data
let users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    role: UserRole.Admin,
    status: UserStatus.Active,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "8765432109",
    role: UserRole.TSMWAAdmin,
    status: UserStatus.Active,
    createdAt: new Date("2023-02-20"),
    updatedAt: new Date("2023-03-15"),
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    phone: "7654321098",
    role: UserRole.TSMWAEditor,
    status: UserStatus.Active,
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10"),
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "6543210987",
    role: UserRole.TSMWAViewer,
    status: UserStatus.Inactive,
    createdAt: new Date("2023-04-05"),
    updatedAt: new Date("2023-05-20"),
  },
  {
    id: "5",
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    phone: "5432109876",
    role: UserRole.TQMWAEditor,
    status: UserStatus.Active,
    createdAt: new Date("2023-05-15"),
    updatedAt: new Date("2023-05-15"),
  },
  {
    id: "6",
    name: "Sarah Brown",
    email: "sarah.brown@example.com",
    phone: "4321098765",
    role: UserRole.TQMWAViewer,
    status: UserStatus.Active,
    createdAt: new Date("2023-06-20"),
    updatedAt: new Date("2023-06-20"),
  },
];

// CRUD operations
export const getAllUsers = () => {
  return [...users];
};

export const getUserById = (id: string) => {
  return users.find((user) => user.id === id);
};

export const createUser = (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
) => {
  const newUser: User = {
    ...userData,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = (
  id: string,
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date(),
    };
    return users[index];
  }
  return null;
};

export const deleteUser = (id: string) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    const deletedUser = users[index];
    users = users.filter((user) => user.id !== id);
    return deletedUser;
  }
  return null;
};

// Helper functions for filtering and statistics
export const getUsersByRole = (role: UserRole) => {
  return users.filter((user) => user.role === role);
};

export const getUsersByStatus = (status: UserStatus) => {
  return users.filter((user) => user.status === status);
};

export const getUsersCount = () => {
  return users.length;
};

export const getActiveUsersCount = () => {
  return users.filter((user) => user.status === UserStatus.Active).length;
};

export const getRoleDistribution = () => {
  const distribution: Record<UserRole, number> = {
    [UserRole.Admin]: 0,
    [UserRole.TSMWAAdmin]: 0,
    [UserRole.TSMWAEditor]: 0,
    [UserRole.TSMWAViewer]: 0,
    [UserRole.TQMWAEditor]: 0,
    [UserRole.TQMWAViewer]: 0,
  };

  users.forEach((user) => {
    distribution[user.role]++;
  });

  return distribution;
};

export const searchUsers = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.phone.includes(query)
  );
};
