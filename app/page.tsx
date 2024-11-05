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

  console.log(readings);

  return (
    <div>
      <h2>Hiii</h2>
    </div>
  );
}
