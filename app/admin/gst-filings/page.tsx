import GstFilingsList from "@/components/gst/gst-filings-list";
import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "GST Filing Details" }]} />
      <div className="flex flex-1 flex-col p-4">
        <GstFilingsList />
      </div>
    </SidebarInset>
  );
};

export default page;
