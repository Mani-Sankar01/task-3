"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  Edit,
  Eye,
  FileDown,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllInvoices,
  getInvoicesByDateRange,
  deleteInvoice,
  exportInvoicesToCSV,
  type Invoice,
} from "@/data/invoices";
import { getAllMembers } from "@/data/members";

export default function InvoiceList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Load all invoices and members initially
    const allInvoices = getAllInvoices();
    const allMembers = getAllMembers();
    setInvoices(allInvoices);
    setFilteredInvoices(allInvoices);
    setMembers(allMembers);
  }, []);

  useEffect(() => {
    let filtered = invoices;

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = getInvoicesByDateRange(
        dateRange.from.toISOString().split("T")[0],
        dateRange.to.toISOString().split("T")[0]
      );
    }

    // Filter by member
    if (selectedMemberId) {
      filtered = filtered.filter(
        (invoice) => invoice.memberId === selectedMemberId
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.firmName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateRange, selectedMemberId, invoices]);

  // Paginate the filtered invoices
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleCreateInvoice = () => {
    router.push("/admin/invoices/create");
  };

  const handleViewInvoice = (id: string) => {
    router.push(`/admin/invoices/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    router.push(`/admin/invoices/edit/${id}`);
  };

  const handleDeleteInvoice = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      deleteInvoice(id);
      // Refresh the list
      setInvoices(getAllInvoices());
    }
  };

  const handleDownloadInvoice = (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) {
      alert("Invoice not found");
      return;
    }

    try {
      // Create a printable version in a new window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-header { text-align: center; margin-bottom: 20px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .totals { margin-left: auto; width: 300px; }
              .note { margin-top: 30px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
             
              <div style="border: 1px solid black; display: inline-block; padding: 5px 15px; margin-top: 10px;">
                <p style="font-weight: bold; margin: 0;">TAX INVOICE</p>
              </div>
            </div>
            
            <div class="invoice-details">
              <div>
                <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Member Name:</strong> ${invoice.memberName}</p>
                <p><strong>Firm Name:</strong> ${invoice.firmName}</p>
                <p><strong>Address:</strong> ${invoice.firmAddress}</p>
                <p><strong>GSTIN:</strong> ${invoice.gstNumber}</p>
              </div>
              <div>
                <p><strong>Date:</strong> ${new Date(
                  invoice.invoiceDate
                ).toLocaleDateString()}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>HSN Code</th>
                  <th>Particulars</th>
                  <th>No. of Stones</th>
                  <th>Sizes</th>
                  <th>Total Sq. Ft.</th>
                  <th>Rate (₹)</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.hsnCode}</td>
                    <td>${item.particulars}</td>
                    <td>${item.noOfStones}</td>
                    <td>${item.sizes}</td>
                    <td>${item.totalSqFeet}</td>
                    <td>${item.ratePerSqFt.toLocaleString()}</td>
                    <td>${item.amount.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="totals">
              <p><strong>Sub Total:</strong> ₹${invoice.subTotal.toLocaleString()}</p>
              ${
                invoice.cgstPercentage > 0
                  ? `<p><strong>CGST (${
                      invoice.cgstPercentage
                    }%):</strong> ₹${invoice.cgstAmount.toLocaleString()}</p>`
                  : ""
              }
              ${
                invoice.sgstPercentage > 0
                  ? `<p><strong>SGST (${
                      invoice.sgstPercentage
                    }%):</strong> ₹${invoice.sgstAmount.toLocaleString()}</p>`
                  : ""
              }
              ${
                invoice.igstPercentage > 0
                  ? `<p><strong>IGST (${
                      invoice.igstPercentage
                    }%):</strong> ₹${invoice.igstAmount.toLocaleString()}</p>`
                  : ""
              }
              <p style="font-weight: bold; font-size: 18px;"><strong>Total:</strong> ₹${invoice.totalAmount.toLocaleString()}</p>
            </div>
            
            <div class="note">
              <p>Note: This is a computer-generated invoice and does not require signature or stamp.</p>
            </div>
          </body>
        </html>
      `);
        printWindow.document.close();
        printWindow.print();
      } else {
        alert(
          "Unable to open print window. Please check your browser settings."
        );
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const csvContent = exportInvoicesToCSV(filteredInvoices);

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Set link properties
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoices_export_${new Date().toISOString().split("T")[0]}.csv`
    );

    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const clearMemberFilter = () => {
    setSelectedMemberId("");
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Invoices</CardTitle>
            <CardDescription>Manage all invoices</CardDescription>
          </div>
          <Button onClick={handleCreateInvoice}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, member or firm..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedMemberId}
                onValueChange={(v) => {
                  if (v == "all") {
                    setSelectedMemberId("");
                  } else {
                    setSelectedMemberId(v);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firmDetails.firmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMemberId && (
                <Button variant="ghost" size="sm" onClick={clearMemberFilter}>
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  Clear
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredInvoices.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Firm</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{invoice.memberName}</TableCell>
                      <TableCell>{invoice.firmName}</TableCell>
                      <TableCell className="text-right">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(invoice.id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditInvoice(invoice.id);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(invoice.id);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvoice(invoice.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedInvoices.length} of {filteredInvoices.length}{" "}
                invoices
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center text-sm font-medium">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
