// import type { GstFiling } from "@/data/gst-filings";
// REMOVE top-level imports of jspdf and autotable

// Function to generate and download a GST invoice PDF
export async function generateGstInvoice(
  filing: any, // GstFiling,
  memberName: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  // Create a new PDF document
  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `GST Invoice - ${filing.id}`,
    subject: `GST Filing for ${filing.filingPeriod}`,
    author: "TSMWA Management System",
    creator: "TSMWA Management System",
  });

  // Add invoice information
  addInvoiceInfo(doc, filing, memberName);

  // Add GST items table
  addGstItemsTable(doc, filing, autoTable);

  // Add totals section
  addTotalsSection(doc, filing);

  // Add footer with terms and contact information
  addFooter(doc);

  // Save the PDF with a filename
  doc.save(
    `GST_Invoice_${filing.id}_${filing.filingPeriod.replace(/\s/g, "_")}.pdf`
  );
}

// Function to generate and download a tax invoice PDF
export async function generateTaxInvoicePDF(
  invoice: any,
  member: any
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  // Create a new PDF document
  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `Tax Invoice - ${invoice.invoiceId}`,
    subject: `Tax Invoice for ${member?.applicantName || "Member"}`,
    author: "TSMWA Management System",
    creator: "TSMWA Management System",
  });

  // Add organization header
  addTaxInvoiceHeader(doc, member);

  // Add invoice information
  addTaxInvoiceInfo(doc, invoice, member);

  // Add invoice items table if available
  if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
    addTaxInvoiceItemsTable(doc, invoice, autoTable);
  }

  // Add totals section
  addTaxInvoiceTotals(doc, invoice);

  // Add footer
  addTaxInvoiceFooter(doc);

  // Save the PDF with a filename
  doc.save(`Tax_Invoice_${invoice.invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Function to add tax invoice header
function addTaxInvoiceHeader(doc: any, member: any): void {
  // Add member firm name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(member?.firmName || "Firm Name", 105, 20, { align: "center" });

  // Add member address and GST
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(member?.complianceDetails?.fullAddress || "Address not available", 105, 27, { align: "center" });
  doc.text(`GSTIN: ${member?.complianceDetails?.gstInNumber || "GST Number not available"}`, 105, 34, { align: "center" });

  // Add invoice title box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(85, 40, 40, 10);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 47, { align: "center" });
}

// Function to add tax invoice information
function addTaxInvoiceInfo(doc: any, invoice: any, member: any): void {
  const startY = 65;

  // Invoice details on the left
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details:", 15, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoice.invoiceId}`, 15, startY + 7);
  doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 15, startY + 14);

  // Member details on the right
  doc.setFont("helvetica", "bold");
  doc.text("Member Details:", 120, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`Member ID: ${invoice.membershipId}`, 120, startY + 7);
  doc.text(`Member Name: ${member?.applicantName || "N/A"}`, 120, startY + 14);

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, startY + 20, 195, startY + 20);
}



// Function to add tax invoice items table
function addTaxInvoiceItemsTable(doc: any, invoice: any, autoTable: any): void {
  const startY = 100;

  // Items title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Items", 15, startY);

  // Prepare table data
  const headers = [
    "HSN Code",
    "Particulars", 
    "No. of Stones",
    "Size",
    "Total Sq. Ft.",
    "Rate (₹)",
    "Amount (₹)"
  ];

  const data = invoice.invoiceItems.map((item: any) => [
    item.hsnCode,
    item.particular,
    item.stoneCount.toString(),
    item.size,
    item.totalSqFeet,
    `₹${parseFloat(item.ratePerSqFeet).toLocaleString()}`,
    `₹${parseFloat(item.amount).toLocaleString()}`
  ]);

  // Create table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: startY + 5,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 18 }, // HSN Code
      1: { cellWidth: 32 }, // Particulars
      2: { cellWidth: 22, halign: 'center' }, // No. of Stones
      3: { cellWidth: 18, halign: 'center' }, // Size
      4: { cellWidth: 22, halign: 'center' }, // Total Sq. Ft.
      5: { cellWidth: 22, halign: 'right' }, // Rate
      6: { cellWidth: 22, halign: 'right' }  // Amount
    }
  });
}

// Function to add tax invoice totals
function addTaxInvoiceTotals(doc: any, invoice: any): void {
  // Get the Y position after the items table
  const finalY = (doc as any).lastAutoTable.finalY || 250;
  const startY = finalY + 10;

  // Calculate GST amounts
  const subTotal = parseFloat(invoice.subTotal || 0);
  const total = parseFloat(invoice.total || 0);
  const cgstAmount = (subTotal * (invoice.cGSTInPercent || 0)) / 100;
  const sgstAmount = (subTotal * (invoice.sGSTInPercent || 0)) / 100;
  const igstAmount = (subTotal * (invoice.iGSTInPercent || 0)) / 100;

  // Totals section
  const totalsX = 115;
  const totalsWidth = 80;
  
  // Create totals box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(totalsX, startY, totalsWidth, 40);

  // Totals content
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  let currentY = startY + 5;

  // Sub Total
  doc.text("Sub Total:", totalsX + 3, currentY);
  doc.text(`₹${subTotal.toLocaleString()}`, totalsX + totalsWidth - 3, currentY, { align: "right" });
  currentY += 5;

  // CGST
  if (invoice.cGSTInPercent > 0) {
    doc.text(`CGST (${invoice.cGSTInPercent}%):`, totalsX + 3, currentY);
    doc.text(`₹${cgstAmount.toLocaleString()}`, totalsX + totalsWidth - 3, currentY, { align: "right" });
    currentY += 5;
  }

  // SGST
  if (invoice.sGSTInPercent > 0) {
    doc.text(`SGST (${invoice.sGSTInPercent}%):`, totalsX + 3, currentY);
    doc.text(`₹${sgstAmount.toLocaleString()}`, totalsX + totalsWidth - 3, currentY, { align: "right" });
    currentY += 5;
  }

  // IGST
  if (invoice.iGSTInPercent > 0) {
    doc.text(`IGST (${invoice.iGSTInPercent}%):`, totalsX + 3, currentY);
    doc.text(`₹${igstAmount.toLocaleString()}`, totalsX + totalsWidth - 3, currentY, { align: "right" });
    currentY += 5;
  }

  // Separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 3, currentY, totalsX + totalsWidth - 3, currentY);
  currentY += 5;

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Total:", totalsX + 3, currentY);
  doc.text(`₹${total.toLocaleString()}`, totalsX + totalsWidth - 3, currentY, { align: "right" });
}

// Function to add tax invoice footer
function addTaxInvoiceFooter(doc: any): void {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Note: This is a computer-generated invoice and does not require signature or stamp.", 15, pageHeight - 20);
  
  doc.setFont("helvetica", "normal");
  doc.text("Generated on: " + new Date().toLocaleString(), 15, pageHeight - 15);
}


// Function to add invoice information
function addInvoiceInfo(
  doc: any,
  filing: any,
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

// Function to add GST items table (for GST invoice)
function addGstItemsTable(doc: any, filing: any, autoTable: any): void {
  const tableColumn = [
    "S.No",
    "Item Description",
    "Taxable Amount (₹)",
    "GST Rate",
    "GST Amount (₹)",
    "Total (₹)",
  ];
  const tableRows = filing.gstItems.map((item: any, index: number) => {
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
function addTotalsSection(doc: any, filing: any): void {
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
function addFooter(doc: any): void {
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
