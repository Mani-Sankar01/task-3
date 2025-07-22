import React from "react";
import { notFound } from "next/navigation";
import GstFilingDetails from "@/components/gst/gst-filing-details";
import { getGstFilingById } from "@/data/gst-filings";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import GstFilingForm from "@/components/gst/gst-filing-form";
<GstFilingForm isEditMode={false} />;

const page = async ({ params }: { params: { id: string } }) => {
  const filingId = await params.id;
  const filing = getGstFilingById(filingId);

  if (!filing) {
    notFound();
  }
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit GST Filing" }]} />
      <div className="flex flex-1 flex-col p-4">
        <GstFilingForm filing={filing} isEditMode={true} />
      </div>
    </SidebarInset>
  );
};

export default page;
