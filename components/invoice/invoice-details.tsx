"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Edit, Printer } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

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
import { generateTaxInvoicePDF } from "@/lib/invoice-generator";
import { Badge } from "../ui/badge";
import { renderRoleBasedPath } from "@/lib/utils";

// API Invoice interface
interface ApiInvoice {
  id: number;
  invoiceId: string;
  membershipId: string;
  invoiceDate: string;
  cGSTInPercent: number;
  sGSTInPercent: number;
  iGSTInPercent: number;
  subTotal: string;
  total: string;
  status: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number | null;
  invoiceItems?: ApiInvoiceItem[];
}

// API Invoice Item interface
interface ApiInvoiceItem {
  id: number;
  invoiceId: string;
  hsnCode: string;
  particular: string;
  stoneCount: number;
  size: string;
  totalSqFeet: string;
  ratePerSqFeet: string;
  amount: string;
}

// API Member interface
interface ApiMember {
  id: string;
  membershipId: string;
  applicantName: string;
  firmName: string;
  complianceDetails?: {
    fullAddress?: string;
    gstInNumber?: string;
  };
}

interface InvoiceDetailsProps {
  invoiceId: string;
}

export default function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [member, setMember] = useState<ApiMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoice details from API
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    const fetchInvoiceDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const response = await axios.get(
          `${apiUrl}/api/tax_invoice/get_tax_invoice_id/${invoiceId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log("Invoice API response:", response.data);

        // Handle the response structure with taxInvoice array
        let invoiceData: ApiInvoice | null = null;
        if (
          response.data &&
          response.data.taxInvoice &&
          Array.isArray(response.data.taxInvoice)
        ) {
          invoiceData = response.data.taxInvoice[0]; // Get the first invoice from the array
        } else if (response.data && !response.data.taxInvoice) {
          // Fallback: if response.data is the invoice directly
          invoiceData = response.data;
        }

        if (invoiceData) {
          setInvoice(invoiceData);

          // Fetch member details
          const memberResponse = await axios.get(
            `${apiUrl}/api/member/get_member/${invoiceData.membershipId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );

          console.log("Member API response:", memberResponse.data);
          setMember(memberResponse.data);
        } else {
          setError("Invoice not found");
        }
      } catch (err: unknown) {
        console.error("Error fetching invoice details:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load invoice details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId, status, session?.user?.token]);

  const handleBack = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/invoices`);
  };

  const handleEdit = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/invoices/${invoiceId}/edit/`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoice || !member) {
      alert("Invoice data not available");
      return;
    }

    try {
      generateTaxInvoicePDF(invoice, member);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading invoice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice || !member) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Invoice not found"}</p>
            <Button onClick={handleBack}>Back to Invoices</Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate GST amounts
  const subTotal = parseFloat(invoice.subTotal);
  const total = parseFloat(invoice.total);
  const cgstAmount = (subTotal * invoice.cGSTInPercent) / 100;
  const sgstAmount = (subTotal * invoice.sGSTInPercent) / 100;
  const igstAmount = (subTotal * invoice.iGSTInPercent) / 100;

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
              <p className="font-bold">Invoice No: {invoice.invoiceId}</p>
              {invoice.status === "APPROVED" ? (
                <Badge variant="default">Approved</Badge>
              ) : invoice.status === "PENDING" ? (
                <Badge variant="outline">Pending</Badge>
              ) : (
                <Badge variant="destructive">DECLINED</Badge>
              )}
            </div>
            <div className="text-right mt-4 md:mt-0">
              <p className="font-bold">
                Date: {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center mb-4">
            <CardTitle className="text-3xl font-bold">
              {member.firmName}
            </CardTitle>

            <p className="text-muted-foreground">
              {member.complianceDetails?.fullAddress || "Address not available"}
            </p>
            <p className="text-muted-foreground">
              GSTIN:{" "}
              {member.complianceDetails?.gstInNumber ||
                "GST Number not available"}
            </p>
            <div className="mt-2 border border-black px-4 py-1 rounded">
              <p className="font-bold">TAX INVOICE</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator className="my-4" />

          {/* Invoice Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Invoice Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Member ID:</span>{" "}
                {invoice.membershipId}
              </div>
              <div>
                <span className="font-medium">Member Name:</span>{" "}
                {member.applicantName}
              </div>
              <div>
                <span className="font-medium">Invoice Date:</span>{" "}
                {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {format(new Date(invoice.createdAt), "dd/MM/yyyy")}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          {invoice.invoiceItems && invoice.invoiceItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Invoice Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">No. of Stones</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Total Sq. Ft.</TableHead>
                    <TableHead className="text-right">Rate (₹)</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoiceItems.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.hsnCode}</TableCell>
                      <TableCell>{item.particular}</TableCell>
                      <TableCell className="text-right">
                        {item.stoneCount}
                      </TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell className="text-right">
                        {item.totalSqFeet}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{parseFloat(item.ratePerSqFeet).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{parseFloat(item.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Sub Total:</div>
                <div className="text-right">₹{subTotal.toLocaleString()}</div>

                {invoice.cGSTInPercent > 0 && (
                  <>
                    <div className="font-medium">
                      CGST ({invoice.cGSTInPercent}%):
                    </div>
                    <div className="text-right">
                      ₹{cgstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                {invoice.sGSTInPercent > 0 && (
                  <>
                    <div className="font-medium">
                      SGST ({invoice.sGSTInPercent}%):
                    </div>
                    <div className="text-right">
                      ₹{sgstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                {invoice.iGSTInPercent > 0 && (
                  <>
                    <div className="font-medium">
                      IGST ({invoice.iGSTInPercent}%):
                    </div>
                    <div className="text-right">
                      ₹{igstAmount.toLocaleString()}
                    </div>
                  </>
                )}

                <Separator className="col-span-2 my-2" />

                <div className="font-bold text-lg">Total:</div>
                <div className="text-right font-bold text-lg">
                  ₹{total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

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
