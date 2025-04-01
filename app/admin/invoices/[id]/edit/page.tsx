import { notFound } from "next/navigation";
import InvoiceForm from "@/components/invoice/invoice-form";
import { getInvoiceById } from "@/data/invoices";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const invoiceId = params.id;
  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return <InvoiceForm invoice={invoice} isEditMode={true} />;
}
