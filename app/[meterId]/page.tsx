import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Page({
  params,
}: {
  params: Promise<{ meterId: string }>;
}) {
  const meterId = (await params).meterId;
  const meterIdDetails = await prisma.meterReading.findFirst({
    where: {
      meterId: meterId.toLocaleUpperCase(),
    },
  });

  console.log(meterIdDetails);
  return (
    <div>
      <div>My Post: {meterId}</div>
      <div>{JSON.stringify(meterIdDetails)}</div>
    </div>
  );
}
