import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

const page = async () => {
  const memberships = await prisma.membership.findMany();
  return (
    <div>
      <h1>Details of All:</h1>
      {JSON.stringify(memberships)}
    </div>
  );
};

export default page;
