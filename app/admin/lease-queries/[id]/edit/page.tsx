import LeaseQueryForm from "@/components/lease-queries/lease-query-form";

export default function Page({ params }: { params: { id: string } }) {
  return <LeaseQueryForm id={params.id} />;
}
