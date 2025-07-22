import InvoiceForm from "@/components/invoice/invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const invoiceId = await params.id;

  return <InvoiceForm invoiceId={invoiceId} isEditMode={true} />;
}
