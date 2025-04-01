// This is a dummy data file that simulates a database for invoices
// In a real application, this would be replaced with API calls to your backend

import { getMemberById } from "./members";

export interface InvoiceItem {
  id: string;
  hsnCode: string;
  particulars: string;
  noOfStones: number;
  sizes: string;
  totalSqFeet: number;
  ratePerSqFt: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  memberId: string;
  memberName: string;
  firmName: string;
  firmAddress: string;
  gstNumber: string;
  state: string;
  items: InvoiceItem[];
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  amountInWords: string;
  createdAt: string;
  updatedAt: string;
}

// Sample data
const invoices: Invoice[] = [
  {
    id: "INV001",
    invoiceNumber: "INV/2024/001",
    invoiceDate: "2024-01-15",
    memberId: "MEM001",
    memberName: "John Doe",
    firmName: "Doe Industries",
    firmAddress: "123 Industrial Area, Greenville, Telangana - 500001",
    gstNumber: "27AAPFU0939F1ZV",
    state: "telangana",
    items: [
      {
        id: "ITEM001",
        hsnCode: "6802",
        particulars: "Granite Slabs",
        noOfStones: 10,
        sizes: "2x2 ft",
        totalSqFeet: 40,
        ratePerSqFt: 120,
        amount: 4800,
      },
      {
        id: "ITEM002",
        hsnCode: "6802",
        particulars: "Marble Tiles",
        noOfStones: 20,
        sizes: "1x1 ft",
        totalSqFeet: 20,
        ratePerSqFt: 150,
        amount: 3000,
      },
    ],
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 0,
    subTotal: 7800,
    cgstAmount: 702,
    sgstAmount: 702,
    igstAmount: 0,
    totalAmount: 9204,
    amountInWords: "Nine Thousand Two Hundred Four Only",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "INV002",
    invoiceNumber: "INV/2024/002",
    invoiceDate: "2024-02-20",
    memberId: "MEM002",
    memberName: "Jane Smith",
    firmName: "Smith Manufacturing",
    firmAddress: "456 Manufacturing Hub, Riverside, Telangana - 500018",
    gstNumber: "36AADCS1234A1ZX",
    state: "telangana",
    items: [
      {
        id: "ITEM003",
        hsnCode: "6802",
        particulars: "Polished Granite",
        noOfStones: 15,
        sizes: "3x2 ft",
        totalSqFeet: 90,
        ratePerSqFt: 180,
        amount: 16200,
      },
    ],
    cgstPercentage: 0,
    sgstPercentage: 0,
    igstPercentage: 18,
    subTotal: 16200,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 2916,
    totalAmount: 19116,
    amountInWords: "Nineteen Thousand One Hundred Sixteen Only",
    createdAt: "2024-02-20T14:15:00Z",
    updatedAt: "2024-02-20T14:15:00Z",
  },
];

// Helper functions to simulate API calls

// Get all invoices
export function getAllInvoices() {
  return invoices;
}

// Get invoices by date range
export function getInvoicesByDateRange(startDate: string, endDate: string) {
  return invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return invoiceDate >= start && invoiceDate <= end;
  });
}

// Get invoices by member ID
export function getInvoicesByMemberId(memberId: string) {
  return invoices.filter((invoice) => invoice.memberId === memberId);
}

// Get invoice by ID
export function getInvoiceById(id: string) {
  return invoices.find((invoice) => invoice.id === id);
}

// Generate a new invoice number
export function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const lastInvoice = invoices
    .filter((inv) => inv.invoiceNumber.includes(`INV/${year}/`))
    .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber))[0];

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = Number.parseInt(
      lastInvoice.invoiceNumber.split("/").pop() || "0"
    );
    nextNumber = lastNumber + 1;
  }

  return `INV/${year}/${nextNumber.toString().padStart(3, "0")}`;
}

// Calculate invoice amounts
export function calculateInvoiceAmounts(
  items: InvoiceItem[],
  cgst: number,
  sgst: number,
  igst: number
) {
  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const cgstAmount = (subTotal * cgst) / 100;
  const sgstAmount = (subTotal * sgst) / 100;
  const igstAmount = (subTotal * igst) / 100;
  const totalAmount = subTotal + cgstAmount + sgstAmount + igstAmount;

  return {
    subTotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
  };
}

// Convert number to words for Indian currency
export function numberToWords(num: number): string {
  const single = [
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
  ];
  const double = [
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
  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return (
      tens[Math.floor(num / 10)] +
      (num % 10 !== 0 ? " " + single[num % 10] : "")
    );
  };

  if (num === 0) return "Zero";

  let words = "";

  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }

  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }

  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + " Hundred ";
    num %= 100;
  }

  if (num > 0) {
    words += formatTens(num);
  }

  return words.trim();
}

// Export invoice data to CSV
export function exportInvoicesToCSV(invoices: Invoice[]): string {
  // Define CSV headers
  const headers = [
    "Sl",
    "Date",
    "Firm Name",
    "GSTIN",
    "State",
    "Taxable Amount",
    "IGST",
    "CGST",
    "SGST",
    "Total",
    "Quantity",
    "Unit",
  ];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  // Add data rows
  invoices.forEach((invoice, index) => {
    // Calculate total quantity from all items
    const totalQuantity = invoice.items.reduce(
      (sum, item) => sum + item.noOfStones,
      0
    );

    const row = [
      index + 1, // Sl
      invoice.invoiceDate, // Date
      invoice.firmName, // Firm Name
      invoice.gstNumber, // GSTIN
      invoice.state, // State
      invoice.subTotal, // Taxable Amount
      invoice.igstAmount, // IGST
      invoice.cgstAmount, // CGST
      invoice.sgstAmount, // SGST
      invoice.totalAmount, // Total
      totalQuantity, // Quantity
      "Sq. Ft.", // Unit
    ];

    csvContent += row.join(",") + "\n";
  });

  return csvContent;
}

// Add a new invoice
export function addInvoice(
  invoiceData: Omit<
    Invoice,
    "id" | "invoiceNumber" | "amountInWords" | "createdAt" | "updatedAt"
  >
) {
  const newId = `INV${(invoices.length + 1).toString().padStart(3, "0")}`;
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();
  const amountInWords =
    numberToWords(Math.round(invoiceData.totalAmount)) + " Only";

  const newInvoice: Invoice = {
    ...invoiceData,
    id: newId,
    invoiceNumber,
    amountInWords,
    createdAt: now,
    updatedAt: now,
  };

  invoices.push(newInvoice);
  return newInvoice;
}

// Update an existing invoice
export function updateInvoice(
  id: string,
  invoiceData: Partial<
    Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">
  >
) {
  const index = invoices.findIndex((invoice) => invoice.id === id);
  if (index !== -1) {
    // Update amount in words if total amount changed
    let amountInWords = invoices[index].amountInWords;
    if (
      invoiceData.totalAmount &&
      invoiceData.totalAmount !== invoices[index].totalAmount
    ) {
      amountInWords =
        numberToWords(Math.round(invoiceData.totalAmount)) + " Only";
    }

    invoices[index] = {
      ...invoices[index],
      ...invoiceData,
      amountInWords,
      updatedAt: new Date().toISOString(),
    };
    return invoices[index];
  }
  return null;
}

// Delete an invoice
export function deleteInvoice(id: string) {
  const index = invoices.findIndex((invoice) => invoice.id === id);
  if (index !== -1) {
    invoices.splice(index, 1);
    return true;
  }
  return false;
}

// Get member details for invoice
export function getMemberDetailsForInvoice(memberId: string) {
  const member = getMemberById(memberId);
  if (!member) return null;

  return {
    memberId: member.id,
    memberName: member.memberDetails.applicantName,
    firmName: member.firmDetails.firmName,
    firmAddress: member.communicationDetails?.fullAddress || "",
    gstNumber: member.complianceDetails?.gstinNo || "",
    state: member.businessDetails?.state || "",
  };
}
