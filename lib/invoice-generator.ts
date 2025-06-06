import type { GstFiling } from "@/data/gst-filings";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Function to generate and download a GST invoice PDF
export function generateGstInvoice(
  filing: GstFiling,
  memberName: string
): void {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `GST Invoice - ${filing.id}`,
    subject: `GST Filing for ${filing.filingPeriod}`,
    author: "TSMWA Management System",
    creator: "TSMWA Management System",
  });

  // Add organization logo and header
  addHeader(doc);

  // Add invoice information
  addInvoiceInfo(doc, filing, memberName);

  // Add GST items table
  addGstItemsTable(doc, filing);

  // Add totals section
  addTotalsSection(doc, filing);

  // Add footer with terms and contact information
  addFooter(doc);

  // Save the PDF with a filename
  doc.save(
    `GST_Invoice_${filing.id}_${filing.filingPeriod.replace(/\s/g, "_")}.pdf`
  );
}

// Function to add the header with logo and organization name
function addHeader(doc: jsPDF): void {
  // Add organization name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Tandur Stone Merchant Welfare Association", 105, 20, {
    align: "center",
  });

  // Add address
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("123 Transport Nagar, Hyderabad, Telangana - 500001", 105, 27, {
    align: "center",
  });
  doc.text(
    "Phone: +91 234567890 | Email: info@example.org | GSTIN: 36AABCT1234Z1ZA",
    105,
    32,
    { align: "center" }
  );

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 35, 195, 35);
}

// Function to add invoice information
function addInvoiceInfo(
  doc: jsPDF,
  filing: GstFiling,
  memberName: string
): void {
  // Add invoice title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GST INVOICE", 105, 45, { align: "center" });

  // Add invoice details on the left
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details:", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice Number: ${filing.id}`, 15, 62);
  doc.text(`Filing Period: ${filing.filingPeriod}`, 15, 69);
  doc.text(
    `Filing Date: ${
      filing.filingDate
        ? new Date(filing.filingDate).toLocaleDateString()
        : "Pending"
    }`,
    15,
    76
  );
  doc.text(
    `Due Date: ${new Date(filing.dueDate).toLocaleDateString()}`,
    15,
    83
  );

  // Add member details on the right
  doc.setFont("helvetica", "bold");
  doc.text("Member Details:", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Member ID: ${filing.membershipId}`, 120, 62);
  doc.text(`Member Name: ${memberName}`, 120, 69);
  doc.text(
    `Status: ${filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}`,
    120,
    76
  );

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, 90, 195, 90);
}

// Function to add GST items table
function addGstItemsTable(doc: jsPDF, filing: GstFiling): void {
  // Prepare table data
  const tableColumn = [
    "S.No",
    "Item Description",
    "Taxable Amount (₹)",
    "GST Rate",
    "GST Amount (₹)",
    "Total (₹)",
  ];
  const tableRows = filing.gstItems.map((item, index) => {
    const gstAmount = item.taxableAmount * 0.18;
    const total = item.taxableAmount + gstAmount;
    return [
      index + 1,
      item.name,
      item.taxableAmount.toLocaleString(),
      "18%",
      gstAmount.toLocaleString(),
      total.toLocaleString(),
    ];
  });

  // Add table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 95,
    theme: "grid",
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
  });
}

// Function to add totals section
function addTotalsSection(doc: jsPDF, filing: GstFiling): void {
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Add totals on the right
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Total Taxable Amount:", 130, finalY);
  doc.text("₹ " + filing.totalTaxableAmount.toLocaleString(), 195, finalY, {
    align: "right",
  });

  doc.text("Total GST Amount (18%):", 130, finalY + 7);
  doc.text("₹ " + filing.totalAmount.toLocaleString(), 195, finalY + 7, {
    align: "right",
  });

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(130, finalY + 9, 195, finalY + 9);

  doc.setFontSize(12);
  doc.text("Grand Total:", 130, finalY + 16);
  doc.text(
    "₹ " + (filing.totalTaxableAmount + filing.totalAmount).toLocaleString(),
    195,
    finalY + 16,
    {
      align: "right",
    }
  );

  // Add amount in words
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Amount in words:", 15, finalY + 25);
  doc.setFont("helvetica", "italic");
  const totalInWords = numberToWords(
    filing.totalTaxableAmount + filing.totalAmount
  );
  doc.text(`Rupees ${totalInWords} Only`, 15, finalY + 32);

  // Add notes if available
  if (filing.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 15, finalY + 42);
    doc.setFont("helvetica", "normal");
    doc.text(filing.notes, 15, finalY + 49);
  }
}

// Function to add footer
function addFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.height;

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 30, 195, pageHeight - 30);

  // Add footer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    105,
    pageHeight - 25,
    {
      align: "center",
    }
  );
  doc.text(
    "For any queries, please contact our office at +91 9876543210 or email at info@tsmwa.org",
    105,
    pageHeight - 20,
    { align: "center" }
  );
  doc.text("Thank you for your business!", 105, pageHeight - 15, {
    align: "center",
  });
}

// Helper function to convert number to words
function numberToWords(num: number): string {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";

  function convertLessThanOneThousand(num: number): string {
    if (num < 20) return units[num];

    const digit = num % 10;
    if (num < 100)
      return tens[Math.floor(num / 10)] + (digit ? " " + units[digit] : "");

    return (
      units[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 ? " and " + convertLessThanOneThousand(num % 100) : "")
    );
  }

  let words = "";
  let numToProcess = Math.floor(num);

  if (numToProcess < 0) {
    words = "Negative ";
    numToProcess = Math.abs(numToProcess);
  }

  if (numToProcess === 0) return "Zero";

  // Handle lakhs and crores (Indian numbering system)
  if (numToProcess >= 10000000) {
    words +=
      convertLessThanOneThousand(Math.floor(numToProcess / 10000000)) +
      " Crore ";
    numToProcess %= 10000000;
  }

  if (numToProcess >= 100000) {
    words +=
      convertLessThanOneThousand(Math.floor(numToProcess / 100000)) + " Lakh ";
    numToProcess %= 100000;
  }

  if (numToProcess >= 1000) {
    words +=
      convertLessThanOneThousand(Math.floor(numToProcess / 1000)) +
      " Thousand ";
    numToProcess %= 1000;
  }

  if (numToProcess > 0) {
    words += convertLessThanOneThousand(numToProcess);
  }

  // Handle decimal part
  const decimalPart = Math.round((num - Math.floor(num)) * 100);
  if (decimalPart > 0) {
    words += " and " + convertLessThanOneThousand(decimalPart) + " Paise";
  }

  return words.trim();
}
