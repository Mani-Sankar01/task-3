import MembershipsTable from "@/components/memberships-table";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

const page = async () => {
  const memberships = await prisma.membership.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      meterNumber: true,
      industryName: true,
      email: true,
      membershipDueDate: true,
      status: true,
      monthlyFee: true,
    },
  });

  const formattedReadings = memberships.map((reading) => ({
    ...reading,
    // Format date as YYYY-MM-DD

    status: reading.status.toLocaleLowerCase() as
      | "live"
      | "inactive"
      | "cancelled",
  }));
  return (
    <div>
      <MembershipsTable initialData={formattedReadings} />
    </div>
  );
};

export default page;
