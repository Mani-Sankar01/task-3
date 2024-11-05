"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { revalidatePath } from "next/cache";

export async function addRandomMeterReading() {
  const statuses = ["ACTIVE", "INACTIVE", "CANCELLED", "FAILED"];
  const names = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Brown",
    "Charlie Davis",
  ];

  const randomReading = {
    meterId: `MET${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`,
    name: names[Math.floor(Math.random() * names.length)],
    email: `user${Date.now()}@example.com`,
    date: new Date(),
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    price: Math.floor(Math.random() * 1000),
  };

  try {
    await prisma.meterReading.create({
      data: randomReading,
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create meter reading:", error);
    return { success: false, error: "Failed to create meter reading" };
  }
}
