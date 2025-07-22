import LeaseQueryDetails from "@/components/lease-queries/lease-query-details";

export default async function Page({ params }: { params: { id: string } }) {
  const id = await params.id;
  return <LeaseQueryDetails id={id} />;
}
