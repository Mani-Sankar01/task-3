"use client";
import Header from "@/components/header";
import InvoiceForm from "@/components/invoice/invoice-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function CreateInvoicePage() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Create an Invoice" }]} />
      <div className="flex flex-1 flex-col p-4">
        <InvoiceForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
}
