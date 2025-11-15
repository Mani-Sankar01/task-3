"use client";
import Header from "@/components/header";
import LeaseQueryForm from "@/components/lease-queries/lease-query-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `Edit Lease Query: ${id}` }]} />
      <div className="flex flex-1 flex-col">
        <LeaseQueryForm id={id} />
      </div>
    </SidebarInset>
  );
}
