"use client";
import Header from "@/components/header";
import InvoiceForm from "@/components/invoice/invoice-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function CreateInvoicePage() {
  return (
    <InvoiceForm isEditMode={false} />
  );
}
