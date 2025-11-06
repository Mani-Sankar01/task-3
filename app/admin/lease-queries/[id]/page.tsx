"use client";
import Header from "@/components/header";
import LeaseQueryDetails from "@/components/lease-queries/lease-query-details";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <SidebarInset>
        <Header breadcrumbs={[{ label: "Lease Query Details" }]} />
        <div className="flex flex-1 flex-col">
        <LeaseQueryDetails id={id} />
        </div>
    </SidebarInset>
  );
}
