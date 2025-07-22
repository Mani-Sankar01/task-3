"use client";
import InvoiceDetails from "@/components/invoice/invoice-details";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default async function InvoiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const invoiceId = await params.id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Invoice Details" }]} />
      <div className="flex flex-1 flex-col">
        <InvoiceDetails invoiceId={invoiceId} />
      </div>
    </SidebarInset>
  );
}
