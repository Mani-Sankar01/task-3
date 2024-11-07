import { AddReadingButton } from "@/components/AddReadingButton";
import AuthButton from "@/components/AuthButton";
import FilterableTable2 from "@/components/FilterableTable2";
import { PrismaClient } from "@prisma/client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path as needed
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin"); // Redirects to login page if not authenticated
  }

  const readings = await prisma.meterReading.findMany({
    orderBy: {
      date: "asc",
    },
  });

  const formattedReadings = readings.map((reading) => ({
    ...reading,
    date: reading.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
    status: reading.status.toLowerCase() as
      | "active"
      | "inactive"
      | "cancelled"
      | "failed",
  }));

  if (session.user?.role === "twwaManager") {
    redirect("/twwa");
  }
  if (session.user?.role === "tsmwaManager") {
    redirect("/tsmwa");
  }

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
