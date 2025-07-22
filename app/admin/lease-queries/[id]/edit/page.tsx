import LeaseQueryForm from "@/components/lease-queries/lease-query-form";

export default async function Page({ params }: { params: { id: string } }) {
  const id = await params.id;
  return <LeaseQueryForm id={id} />;
}
