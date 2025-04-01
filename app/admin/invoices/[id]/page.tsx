import { notFound } from "next/navigation";
import InvoiceDetails from "@/components/invoice/invoice-details";
import { getInvoiceById } from "@/data/invoices";

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

  return <InvoiceDetails invoice={invoice} />;
}
