"use client";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";

export default function DownloadPage() {
  const sampleInvoice = {
    invoiceId: "INV2025-002",
    membershipId: "MEM001",
    invoiceDate: "2025-10-27",
    customerName: "Mani",
    gstInNumber: "12SDF134324244",
    billingAddress: "At-MPV-10, Po-Pulimetta",
    shippingAddress: "Ps-Kalimela",
    eWayNumber: "1232DSDG2352",
    phoneNumber: "9078569678",
    cGSTInPercent: 9,
    sGSTInPercent: 9,
    iGSTInPercent: 0,
    subTotal: 1400,
    total: 1652,
    invoiceItems: [
      {
        hsnCode: "6802",
        particulars: "Granite Slabs",
        noOfStones: 10,
        unit: "Square Fit",
        totalSqFeet: 140,
        ratePerSqFt: 10,
        amount: 1400,
      }
    ],
  };

  const sampleMember = {
    applicantName: "Ravi Agro",
    firmName: "Ravi Agro Farms",
    complianceDetails: {
      fullAddress: "Full address goes here",
      gstInNumber: "27AAPFU0939F1ZV",
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={() => generateInvoicePDF(sampleInvoice, sampleMember)}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        Download Invoice
      </button>
    </div>
  );
}
