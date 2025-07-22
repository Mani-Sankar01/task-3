import React from "react";
import { notFound } from "next/navigation";
import GstFilingDetails from "@/components/gst/gst-filing-details";
import { getGstFilingById } from "@/data/gst-filings";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

const page = async ({ params }: { params: { id: string } }) => {
  const filingId = await params.id;
  const filing = getGstFilingById(filingId);

  if (!filing) {
    notFound();
  }
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "GST Filing Details" }]} />
      <div className="flex flex-1 flex-col p-4">
        <GstFilingDetails filing={filing} />
      </div>
    </SidebarInset>
  );
};

export default page;
