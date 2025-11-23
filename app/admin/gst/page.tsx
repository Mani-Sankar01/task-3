import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import GSTList from "@/components/invoice/gst-list";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All GST Filling" }]} />
      <div className="flex flex-1 flex-col">
        <GSTList />
      </div>
    </SidebarInset>
  );
};

export default page;
