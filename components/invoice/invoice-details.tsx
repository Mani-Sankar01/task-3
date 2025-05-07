"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit, Printer } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/data/invoices";

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/admin/invoices");
  };

  const handleEdit = () => {
    router.push(`/admin/invoices/${invoice.id}/edit/`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert(`Downloading invoice ${invoice.id}...`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Invoice Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      <Card className="mx-auto print:shadow-none print:border-none">
        <CardHeader className="print:pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="font-bold">Invoice No: {invoice.invoiceNumber}</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <p className="font-bold">
                Date: {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center mb-4">
            <CardTitle className="text-3xl font-bold">
              {invoice.firmName}
            </CardTitle>

            <p className="text-muted-foreground">{invoice.firmAddress}</p>
            <p className="text-muted-foreground">GSTIN: {invoice.gstNumber}</p>
            <div className="mt-2 border border-black px-4 py-1 rounded">
              <p className="font-bold">TAX INVOICE</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator className="my-4" />

          {/* Invoice Items */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">No. of Stones</TableHead>
                  <TableHead>Sizes</TableHead>
                  <TableHead className="text-right">Total Sq. Ft.</TableHead>
                  <TableHead className="text-right">Rate (₹)</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.hsnCode}</TableCell>
                    <TableCell>{item.particulars}</TableCell>
                    <TableCell className="text-right">
                      {item.noOfStones}
                    </TableCell>
                    <TableCell>{item.sizes}</TableCell>
                    <TableCell className="text-right">
                      {item.totalSqFeet}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.ratePerSqFt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Sub Total:</div>
                <div className="text-right">
                  ₹{invoice.subTotal.toLocaleString()}
                </div>

                {invoice.cgstPercentage > 0 && (
                  <>
                    <div className="font-medium">
                      CGST ({invoice.cgstPercentage}%):
                    </div>
                    <div className="text-right">
                      ₹{invoice.cgstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                {invoice.sgstPercentage > 0 && (
                  <>
                    <div className="font-medium">
                      SGST ({invoice.sgstPercentage}%):
                    </div>
                    <div className="text-right">
                      ₹{invoice.sgstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                {invoice.igstPercentage > 0 && (
                  <>
                    <div className="font-medium">
                      IGST ({invoice.igstPercentage}%):
                    </div>
                    <div className="text-right">
                      ₹{invoice.igstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                <Separator className="col-span-2 my-2" />

                <div className="font-bold text-lg">Total:</div>
                <div className="text-right font-bold text-lg">
                  ₹{invoice.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Amount in Words */}
          <div className="mt-4">
            <p className="font-medium">Amount in Words:</p>
            <p>{invoice.amountInWords}</p>
          </div>

          {/* System Generated Note */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Note: This is a computer-generated invoice and does not require
              signature or stamp.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
