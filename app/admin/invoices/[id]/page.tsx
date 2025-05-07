import { notFound } from "next/navigation";
import InvoiceDetails from "@/components/invoice/invoice-details";
import { getInvoiceById } from "@/data/invoices";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default async function InvoiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const invoiceId = params.id;
  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Invoice Details" }]} />
      <div className="flex flex-1 flex-col">
        <InvoiceDetails invoice={invoice} />
      </div>
    </SidebarInset>
  );
}
