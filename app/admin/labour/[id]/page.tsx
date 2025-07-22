"use client";
import { notFound } from "next/navigation";
import LabourDetails from "@/components/labour/labour-details";
import { getLabourById } from "@/data/labour";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function Page({ params }: { params: { id: string } }) {
  const labourId = params.id;
  const labour = getLabourById(labourId);

  if (!labour) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Labours" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LabourDetails labour={labour} />
      </div>
    </SidebarInset>
  );
}
