"use client";
import LeaseQueryDetails from "@/components/lease-queries/lease-query-details";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  return <LeaseQueryDetails id={id} />;
}
