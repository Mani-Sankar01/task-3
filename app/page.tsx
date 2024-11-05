import { AddReadingButton } from "@/components/AddReadingButton";
import FilterableTable from "@/components/filterable-table";
import FilterableTable2 from "@/components/FilterableTable2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

export default async function Home() {
  const readings = await prisma.meterReading.findMany({
    orderBy: {
      date: "desc",
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

  console.log(readings);

  return (
    <div>
      <h2>
        Hiii
        {JSON.stringify(formattedReadings)}
        <AddReadingButton />
        {/* <FilterableTable /> */}
        <FilterableTable2 initialData={formattedReadings} />
      </h2>
    </div>
  );
}
