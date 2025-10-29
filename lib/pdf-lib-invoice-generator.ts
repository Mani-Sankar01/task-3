import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

// Helper function to format currency with Rupee symbol
function formatCurrencyWithRupee(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs. ${numAmount.toLocaleString()}`;
}

// Helper function to replace Rupee symbol with INR text (fallback)
function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `INR ${numAmount.toLocaleString()}`;
}

// Interface for invoice data
interface InvoiceData {
  invoiceId: string;
  membershipId: string;
  invoiceDate: string;
  customerName?: string;
  gstInNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  eWayNumber?: string;
  phoneNumber?: string;
  cGSTInPercent: number;
  sGSTInPercent: number;
  iGSTInPercent: number;
  subTotal: number;
  total: number;
  status?: string;
  invoiceItems: InvoiceItem[];
}

interface InvoiceItem {
  hsnCode: string;
  particular: string;
  stoneCount: number;
  size: string;
  totalSqFeet: number;
  ratePerSqFeet: number;
  amount: number;
}

interface MemberData {
  applicantName: string;
  firmName: string;
  complianceDetails: {
    fullAddress: string;
    gstInNumber: string;
  };
}

// Function to generate and download a tax invoice PDF using pdf-lib
export async function generateTaxInvoicePDFWithPdfLib(
  invoice: InvoiceData,
  member: MemberData
): Promise<void> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  
  // Get fonts that support Unicode characters
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set up page dimensions
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - (margin * 2);
  
  let currentY = height - margin;
  
  // Add invoice header
  currentY = await addInvoiceHeader(page, invoice, member, font, boldFont, margin, contentWidth, currentY);
  
  // Add customer information if available
  if (invoice.customerName || invoice.gstInNumber || invoice.billingAddress) {
    currentY = await addCustomerInformation(page, invoice, font, boldFont, margin, contentWidth, currentY);
  }
  
  // Add invoice items table
  if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
    currentY = await addInvoiceItemsTable(page, invoice, font, boldFont, margin, contentWidth, currentY);
  }
  
  // Add totals section
  currentY = await addInvoiceTotals(page, invoice, font, boldFont, margin, contentWidth, currentY);
  
  // Add footer
  await addFooter(page, font, margin, contentWidth, 50);
  
  // Add border around the entire page
  page.drawRectangle({
    x: margin - 10,
    y: 50,
    width: contentWidth + 20,
    height: height - 100,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  
  // Create blob and download
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Tax_Invoice_${invoice.invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to add invoice header
async function addInvoiceHeader(
  page: PDFPage,
  invoice: InvoiceData,
  member: MemberData,
  font: PDFFont,
  boldFont: PDFFont,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;
  
  // Top row: Invoice number, TAX INVOICE box, and date
  page.setFont(boldFont);
  page.setFontSize(9);
  
  // Left: Invoice number
  page.drawText(`Invoice No: ${invoice.invoiceId}`, {
    x: margin,
    y: currentY - 20,
    size: 9,
  });
  
  // Status badge (blue rectangle)
  const status = invoice.status || "PENDING";
  const statusText = status === "APPROVED" ? "Approved" : status;
  
  // Draw blue badge background
  page.drawRectangle({
    x: margin,
    y: currentY - 35,
    width: 60,
    height: 15,
    color: rgb(0.23, 0.51, 0.96), // Blue color
  });
  
  // Add white text on blue background
  page.setFontColor(rgb(1, 1, 1));
  page.setFontSize(7);
  page.drawText(statusText, {
    x: margin + 30 - (statusText.length * 2),
    y: currentY - 30,
    size: 7,
  });
  
  // Reset text color to black
  page.setFontColor(rgb(0, 0, 0));
  
  // Center: TAX INVOICE box
  page.drawRectangle({
    x: margin + contentWidth / 2 - 70,
    y: currentY - 30,
    width: 140,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  page.setFont(boldFont);
  page.setFontSize(10);
  page.drawText("TAX INVOICE", {
    x: margin + contentWidth / 2 - 35,
    y: currentY - 20,
    size: 10,
  });
  
  // Right: Date
  page.setFontSize(9);
  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB');
  page.drawText(`Date: ${invoiceDate}`, {
    x: margin + contentWidth - 80,
    y: currentY - 20,
    size: 9,
  });
  
  currentY -= 60;
  
  // Company information section (centered)
  page.setFont(boldFont);
  page.setFontSize(14);
  const companyName = member?.firmName || "Company Name";
  page.drawText(companyName, {
    x: margin + contentWidth / 2 - (companyName.length * 3),
    y: currentY,
    size: 14,
  });
  
  page.setFont(font);
  page.setFontSize(8);
  const address = member?.complianceDetails?.fullAddress || "Full address goes here";
  page.drawText(address, {
    x: margin + contentWidth / 2 - (address.length * 2),
    y: currentY - 15,
    size: 8,
  });
  
  const gstNumber = `GSTIN: ${member?.complianceDetails?.gstInNumber || "GST Number not available"}`;
  page.drawText(gstNumber, {
    x: margin + contentWidth / 2 - (gstNumber.length * 2),
    y: currentY - 30,
    size: 8,
  });
  
  // Add separator line
  page.drawLine({
    start: { x: margin, y: currentY - 45 },
    end: { x: margin + contentWidth, y: currentY - 45 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  return currentY - 55;
}

// Function to add customer information section
async function addCustomerInformation(
  page: PDFPage,
  invoice: InvoiceData,
  font: PDFFont,
  boldFont: PDFFont,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;
  
  // Add separator line
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + contentWidth, y: currentY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  currentY -= 20;
  
  // Customer Information section
  page.setFont(boldFont);
  page.setFontSize(10);
  page.drawText("Customer Information", {
    x: margin,
    y: currentY,
    size: 10,
  });
  
  currentY -= 20;
  
  page.setFont(font);
  page.setFontSize(9);
  
  // Left side customer information
  let leftY = currentY;
  if (invoice.customerName) {
    page.drawText(`Customer Name: ${invoice.customerName}`, {
      x: margin,
      y: leftY,
      size: 9,
    });
    leftY -= 12;
  }
  
  if (invoice.phoneNumber) {
    page.drawText(`Phone Number: ${invoice.phoneNumber}`, {
      x: margin,
      y: leftY,
      size: 9,
    });
    leftY -= 12;
  }
  
  if (invoice.billingAddress) {
    page.drawText(`Billing Address: ${invoice.billingAddress}`, {
      x: margin,
      y: leftY,
      size: 9,
    });
    leftY -= 12;
  }
  
  if (invoice.shippingAddress && invoice.shippingAddress !== invoice.billingAddress) {
    page.drawText(`Shipping Address: ${invoice.shippingAddress}`, {
      x: margin,
      y: leftY,
      size: 9,
    });
    leftY -= 12;
  }
  
  // Right side additional information
  let rightY = currentY;
  if (invoice.gstInNumber) {
    page.drawText(`GSTIN Number: ${invoice.gstInNumber}`, {
      x: margin + contentWidth - 200,
      y: rightY,
      size: 9,
    });
    rightY -= 12;
  }
  
  if (invoice.eWayNumber) {
    page.drawText(`E-Way Number: ${invoice.eWayNumber}`, {
      x: margin + contentWidth - 200,
      y: rightY,
      size: 9,
    });
    rightY -= 12;
  }
  
  // Use the lower of the two Y positions
  currentY = Math.min(leftY, rightY);
  
  // Add separator line
  currentY -= 10;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + contentWidth, y: currentY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  return currentY - 20;
}

// Function to add invoice items table
async function addInvoiceItemsTable(
  page: PDFPage,
  invoice: InvoiceData,
  font: PDFFont,
  boldFont: PDFFont,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;
  
  // Items title
  page.setFont(boldFont);
  page.setFontSize(10);
  page.drawText("Invoice Items", {
    x: margin,
    y: currentY,
    size: 10,
  });
  
  currentY -= 20;
  
  // Table headers
  const headers = [
    "HSN Code",
    "Particulars",
    "No. of Stones",
    "Size",
    "Total Sq. Ft.",
    "Rate (Rs.)",
    "Amount (Rs.)"
  ];
  
  const columnWidths = [50, 100, 50, 50, 50, 60, 60];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const startX = margin;
  
  // Draw header background
  page.drawRectangle({
    x: startX,
    y: currentY - 15,
    width: tableWidth,
    height: 15,
    color: rgb(0.16, 0.5, 0.73), // Blue color
  });
  
  // Draw header text
  page.setFontColor(rgb(1, 1, 1));
  page.setFontSize(8);
  page.setFont(boldFont);
  
  let headerX = startX + 5;
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: headerX,
      y: currentY - 10,
      size: 8,
    });
    headerX += columnWidths[index];
  });
  
  // Reset text color
  page.setFontColor(rgb(0, 0, 0));
  
  currentY -= 20;
  
  // Draw table rows
  page.setFont(font);
  page.setFontSize(8);
  
  invoice.invoiceItems.forEach((item, rowIndex) => {
    const rowY = currentY - (rowIndex * 18);
    
    // Draw row data
    let cellX = startX + 5;
    const rowData = [
      item.hsnCode,
      item.particular,
      item.stoneCount.toString(),
      item.size,
      item.totalSqFeet.toString(),
      parseFloat(item.ratePerSqFeet.toString()).toLocaleString(),
      parseFloat(item.amount.toString()).toLocaleString()
    ];
    
    rowData.forEach((cellData, cellIndex) => {
      // Format currency columns (Rate and Amount) with Rs. prefix
      let formattedData = cellData;
      if (cellIndex === 5 || cellIndex === 6) {
        formattedData = formatCurrencyWithRupee(cellData);
      }
      
      page.drawText(formattedData, {
        x: cellX,
        y: rowY - 10,
        size: 8,
      });
      cellX += columnWidths[cellIndex];
    });
  });
  
  return currentY - (invoice.invoiceItems.length * 18) - 20;
}

// Function to add invoice totals
async function addInvoiceTotals(
  page: PDFPage,
  invoice: InvoiceData,
  font: PDFFont,
  boldFont: PDFFont,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<number> {
  let currentY = startY;
  
  // Calculate totals
  const cgstAmount = (invoice.subTotal * invoice.cGSTInPercent) / 100;
  const sgstAmount = (invoice.subTotal * invoice.sGSTInPercent) / 100;
  const igstAmount = (invoice.subTotal * invoice.iGSTInPercent) / 100;
  
  // Totals section - right aligned
  const totalsX = margin + contentWidth - 150;
  const labelWidth = 80;
  
  page.setFont(font);
  page.setFontSize(9);
  
  // Sub Total
  page.drawText("Sub Total:", {
    x: totalsX,
    y: currentY,
    size: 9,
  });
  page.drawText(formatCurrencyWithRupee(invoice.subTotal), {
    x: totalsX + labelWidth,
    y: currentY,
    size: 9,
  });
  currentY -= 15;
  
  // CGST
  if (cgstAmount > 0) {
    page.drawText(`CGST (${invoice.cGSTInPercent}%):`, {
      x: totalsX,
      y: currentY,
      size: 9,
    });
    page.drawText(formatCurrencyWithRupee(cgstAmount), {
      x: totalsX + labelWidth,
      y: currentY,
      size: 9,
    });
    currentY -= 15;
  }
  
  // SGST
  if (sgstAmount > 0) {
    page.drawText(`SGST (${invoice.sGSTInPercent}%):`, {
      x: totalsX,
      y: currentY,
      size: 9,
    });
    page.drawText(formatCurrencyWithRupee(sgstAmount), {
      x: totalsX + labelWidth,
      y: currentY,
      size: 9,
    });
    currentY -= 15;
  }
  
  // IGST
  if (igstAmount > 0) {
    page.drawText(`IGST (${invoice.iGSTInPercent}%):`, {
      x: totalsX,
      y: currentY,
      size: 9,
    });
    page.drawText(formatCurrencyWithRupee(igstAmount), {
      x: totalsX + labelWidth,
      y: currentY,
      size: 9,
    });
    currentY -= 15;
  }
  
  // Add separator line before total
  page.drawLine({
    start: { x: totalsX, y: currentY - 5 },
    end: { x: totalsX + 150, y: currentY - 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  // Total - bold and larger
  page.setFont(boldFont);
  page.setFontSize(10);
  page.drawText("Total:", {
    x: totalsX,
    y: currentY - 15,
    size: 10,
  });
  page.drawText(formatCurrencyWithRupee(invoice.total), {
    x: totalsX + labelWidth,
    y: currentY - 15,
    size: 10,
  });
  
  return currentY - 30;
}

// Function to add footer
async function addFooter(
  page: PDFPage,
  font: PDFFont,
  margin: number,
  contentWidth: number,
  startY: number
): Promise<void> {
  page.setFont(font);
  page.setFontSize(8);
  
  // Footer line
  page.drawLine({
    start: { x: margin, y: startY },
    end: { x: margin + contentWidth, y: startY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  
  // Footer text
  page.drawText("Note: This is a computer-generated invoice and does not require signature or stamp.", {
    x: margin + contentWidth / 2 - 150,
    y: startY - 20,
    size: 8,
  });
}

// Export the main function with the same name as the original
export { generateTaxInvoicePDFWithPdfLib as generateTaxInvoicePDF };
