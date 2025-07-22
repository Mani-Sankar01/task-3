"use client";
import LeaseQueryForm from "@/components/lease-queries/lease-query-form";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  return <LeaseQueryForm id={id} />;
}
