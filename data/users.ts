import { z } from "zod";

// Define the role enum to match API
export enum UserRole {
  
   ADMIN = "ADMIN",
   ADMIN_VIEWER =  "ADMIN_VIEWER",
   TSMWA_VIEWER ="TSMWA_VIEWER",
   TSMWA_EDITOR = "TSMWA_EDITOR",
   TQMA_EDITOR = "TQMA_EDITOR",
   TQMA_VIEWER ="TQMA_VIEWER"
}

// Define the status enum to match API
export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// Define the gender enum
export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// Define the User interface to match API
export interface User {
  id: number;
  fullName: string;
  gender: UserGender;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Create a schema for user validation
export const userSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  gender: z.nativeEnum(UserGender, {
    errorMap: () => ({ message: "Please select a valid gender" }),
  }),
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
    id: 2,
    fullName: "Jane Smith",
    gender: UserGender.FEMALE,
    email: "jane.smith@example.com",
    phone: "8765432109",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: "2023-02-20T00:00:00Z",
    updatedAt: "2023-03-15T00:00:00Z",
  },
  {
    id: 3,
    fullName: "Robert Johnson",
    gender: UserGender.MALE,
    email: "robert.johnson@example.com",
    phone: "7654321098",
    role: UserRole.ADMIN_VIEWER,
    status: UserStatus.ACTIVE,
    createdAt: "2023-03-10T00:00:00Z",
    updatedAt: "2023-03-10T00:00:00Z",
  },
  {
    id: 4,
    fullName: "Emily Davis",
    gender: UserGender.FEMALE,
    email: "emily.davis@example.com",
    phone: "6543210987",
    role: UserRole.TQMA_EDITOR,
    status: UserStatus.INACTIVE,
    createdAt: "2023-04-05T00:00:00Z",
    updatedAt: "2023-05-20T00:00:00Z",
  },
  {
    id: 5,
    fullName: "Michael Wilson",
    gender: UserGender.MALE,
    email: "michael.wilson@example.com",
    phone: "5432109876",
    role: UserRole.TSMWA_EDITOR,
    status: UserStatus.ACTIVE,
    createdAt: "2023-05-15T00:00:00Z",
    updatedAt: "2023-05-15T00:00:00Z",
  }
];

// CRUD operations
export const getAllUsers = () => {
  return [...users];
};

export const getUserById = (id: string) => {
  const userId = parseInt(id);
  return users.find((user) => user.id === userId);
};

export const createUser = (
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
) => {
  const newUser: User = {
    ...userData,
    id: Math.floor(Math.random() * 10000) + 1000, // Generate a numeric ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = (
  id: string,
  userData: Omit<User, "id" | "createdAt" | "updatedAt">
) => {
  const userId = parseInt(id);
  const index = users.findIndex((user) => user.id === userId);
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString(),
    };
    return users[index];
  }
  return null;
};

export const deleteUser = (id: string) => {
  const userId = parseInt(id);
  const index = users.findIndex((user) => user.id === userId);
  if (index !== -1) {
    const deletedUser = users[index];
    users = users.filter((user) => user.id !== userId);
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
  return users.filter((user) => user.status === UserStatus.ACTIVE).length;
};

export const getRoleDistribution = () => {
  const distribution: Record<UserRole, number> = {
    [UserRole.ADMIN]: 0,
    [UserRole.TQMA_EDITOR]: 0,
    [UserRole.TSMWA_VIEWER]: 0,
    [UserRole.TQMA_VIEWER]: 0,
    [UserRole.ADMIN_VIEWER]: 0,
     [UserRole.TSMWA_EDITOR]: 0,
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
      user.fullName.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.phone.includes(query)
  );
};
