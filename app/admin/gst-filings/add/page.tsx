import GstFilingForm from "@/components/gst/gst-filing-form";
import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "GST Filing Details" }]} />
      <div className="flex flex-1 flex-col p-4">
        <GstFilingForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
};

export default page;
