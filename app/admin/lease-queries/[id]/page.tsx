import LeaseQueryDetails from "@/components/lease-queries/lease-query-details";

export default function Page({ params }: { params: { id: string } }) {
  return <LeaseQueryDetails id={params.id} />;
}
