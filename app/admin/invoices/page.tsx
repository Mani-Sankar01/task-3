import React from "react";
import InvoiceList from "@/components/invoice/invoice-list";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Invoices" }]} />
      <div className="flex flex-1 flex-col">
        <InvoiceList />
      </div>
    </SidebarInset>
  );
};

export default page;
