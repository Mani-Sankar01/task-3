import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
