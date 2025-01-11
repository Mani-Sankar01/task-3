import { AddReadingButton } from "@/components/AddReadingButton";
import AuthButton from "@/components/AuthButton";
import FilterableTable2 from "@/components/FilterableTable2";
import { PrismaClient } from "@prisma/client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path as needed
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { read } from "fs";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin"); // Redirects to login page if not authenticated
  }

  if (session.user?.role === "twwaManager") {
    redirect("/twwa");
  }
  if (session.user?.role === "tsmwaManager") {
    redirect("/tsmwa");
  }

  // const readings = await prisma.meterReading.findMany({
  //   orderBy: {
  //     date: "asc",
  //   },
  // });

  const readings = [
    {
      id: "1",
      meterId: "MET459",
      name: "Charlie Davis",
      email: "user1730813275123@example.com",
      date: new Date(),
      status: "FAILED",
      price: 351,
    },
    {
      id: "2",
      meterId: "MET794",
      name: "John Doe",
      email: "user1730813350120@example.com",
      date: new Date(),
      status: "ACTIVE",
      price: 965,
    },
    {
      id: "3",
      meterId: "MET845",
      name: "John Doe",
      email: "user1730813353495@example.com",
      date: new Date(),
      status: "ACTIVE",
      price: 129,
    },
    {
      id: "4",
      meterId: "MET024",
      name: "Alice Brown",
      email: "user1730816428256@example.com",
      date: new Date(),
      status: "INACTIVE",
      price: 232,
    },
    {
      id: "5",
      meterId: "MET382",
      name: "Bob Johnson",
      email: "user1730818830359@example.com",
      date: new Date(),
      status: "FAILED",
      price: 242,
    },
    {
      id: "6",
      meterId: "MET783",
      name: "Jane Smith",
      email: "user1730823161952@example.com",
      date: new Date(),
      status: "CANCELLED",
      price: 841,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "ACTIVE",
      price: 252,
    },
  ];

  console.log(readings);

  const formattedReadings = readings.map((reading) => ({
    ...reading,
    date: reading.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
    status: reading.status.toLowerCase() as
      | "active"
      | "inactive"
      | "cancelled"
      | "failed",
  }));

  return (
    <div>
      <div>
        <a href="/admin">
          <Button>Admin</Button>
        </a>
        <a href="/twwa">
          <Button>Twwa</Button>
        </a>
        <a href="/tsmwa">
          <Button>TSMWA</Button>
        </a>
      </div>
      <div className="flex justify-center gap-x-2  mt-2 ">
        <h2 className="text-2xl"> Click the button to add a new data </h2>
        <AddReadingButton />
        <AuthButton />
      </div>

      <FilterableTable2 initialData={formattedReadings} />
    </div>
  );
}
