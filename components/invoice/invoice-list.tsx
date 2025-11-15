"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
// Dynamic import for PDF generation to avoid SSR issues
import {
  CalendarIcon,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Edit,
  Eye,
  FileDown,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

// Define the invoice type based on API response
interface ApiInvoice {
  id: string;
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
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { renderRoleBasedPath } from "@/lib/utils";

export default function InvoiceList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ApiInvoice[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];

  // Fetch invoices from API
  useEffect(() => {
    console.log("Status:", status);
    console.log("Session:", session);
    console.log("BACKEND_API_URL:", process.env.BACKEND_API_URL);

    if (status !== "authenticated" || !session?.user?.token) {
      console.log("Not authenticated or no token");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const fullUrl = `${apiUrl}/api/tax_invoice/get_tax_invoice`;

        console.log("API URL:", fullUrl);
        console.log("Token:", session.user.token ? "Token exists" : "No token");

        const response = await axios.get(fullUrl, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        });

        console.log("Full API response:", response.data);
        console.log("Response status:", response.status);

        // Handle different possible response structures
        let responseData;
        if (response.data && Array.isArray(response.data)) {
          responseData = response.data;
        } else if (
          response.data &&
          response.data.taxInvoices &&
          Array.isArray(response.data.taxInvoices)
        ) {
          responseData = response.data.taxInvoices;
        } else if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          responseData = response.data.data;
        } else {
          responseData = [];
        }

        setInvoices(responseData);
        setFilteredInvoices(responseData);
        console.log("Invoices data:", responseData);
        console.log("Number of invoices:", responseData.length);
      } catch (err: unknown) {
        console.error("Error fetching invoice data:", err);
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        toast({
          title: "Error",
          description: "Failed to load invoice data",
          variant: "destructive"
        });
        setInvoices([]);
        setFilteredInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session?.user?.token]);

  // Load members from API
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchMembers = async () => {
      try {
        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const response = await axios.get(`${apiUrl}/api/member/get_members`, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        });
        setMembers(response.data || []);
      } catch (err: unknown) {
        console.error("Error fetching members:", err);
        setMembers([]);
      }
    };

    fetchMembers();
  }, [status, session?.user?.token]);

  useEffect(() => {
    let filtered = invoices;

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const start = dateRange.from!;
        const end = dateRange.to!;
        return invoiceDate >= start && invoiceDate <= end;
      });
    }

    // Filter by member
    if (selectedMemberId) {
      filtered = filtered.filter(
        (invoice) => invoice.membershipId === selectedMemberId
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.membershipId.toLowerCase().includes(searchTerm.toLowerCase())
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
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/invoices/create`);
  };

  const handleViewInvoice = (id: string) => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/invoices/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/invoices/${id}/edit`
    );
  };

    const handleDeleteInvoice = async (invoiceId: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete invoices",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";     
      await axios.delete(
        `${apiUrl}/api/tax_invoice/delete_tax_invoice/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      // Remove from local state after successful API call
      setInvoices((prevInvoices) =>
        prevInvoices.filter((inv) => inv.invoiceId !== invoiceId)
      );
      setFilteredInvoices((prevInvoices) =>
        prevInvoices.filter((inv) => inv.invoiceId !== invoiceId)
      );

      toast({
        title: "Invoice Deleted",
        description: "Invoice has been deleted successfully."
      });
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Failed to delete invoice. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Invoice not found or already deleted";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update invoice status",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      
      const payload = {
        invoiceId: invoiceId,
        status: newStatus
      };

      await axios.post(
        `${apiUrl}/api/tax_invoice/update_tax_invoice`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state after successful API call
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.invoiceId === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );
      setFilteredInvoices((prevInvoices) =>
        prevInvoices.map((inv) =>
          inv.invoiceId === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );

      toast({
        title: "Status Updated",
        description: `Invoice status updated to ${newStatus} successfully.`
      });
    } catch (error: any) {
      console.error("Error updating invoice status:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Failed to update invoice status. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to download invoices",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the invoice from the current list to get the invoiceId (billing ID)
      const invoiceFromList = invoices.find((inv) => inv.id === id);
      if (!invoiceFromList) {
        toast({
          title: "Download Failed",
          description: "Invoice not found in the list.",
          variant: "destructive"
        });
        return;
      }

      const billingId = invoiceFromList.invoiceId; // This is the billing ID like "INV2025-002"
      console.log("Starting download for invoice ID:", id, "Billing ID:", billingId);
      
      // Fetch complete invoice details including items using the billing ID
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      console.log("API URL:", apiUrl);
      console.log("Full endpoint:", `${apiUrl}/api/tax_invoice/get_tax_invoice_id/${billingId}`);
      
      const response = await axios.get(
        `${apiUrl}/api/tax_invoice/get_tax_invoice_id/${billingId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log("Invoice API response:", response.data);
      console.log("Response status:", response.status);

      // Handle the response structure with taxInvoice array
      let invoice: ApiInvoice | null = null;
      if (
        response.data &&
        response.data.taxInvoice &&
        Array.isArray(response.data.taxInvoice)
      ) {
        console.log("Found taxInvoice array with length:", response.data.taxInvoice.length);
        invoice = response.data.taxInvoice[0]; // Get the first invoice from the array
      } else if (response.data && !response.data.taxInvoice) {
        console.log("Using direct response data");
        // Fallback: if response.data is the invoice directly
        invoice = response.data;
      } else {
        console.log("Unexpected response structure:", response.data);
      }

      if (!invoice) {
        console.error("No invoice data found in response");
        toast({
          title: "Download Failed",
          description: "Invoice not found in API response",
          variant: "destructive"
        });
        return;
      }

      console.log("Invoice data found:", invoice);

      // Fetch member details for the invoice
      console.log("Fetching member for membershipId:", invoice.membershipId);
      const memberResponse = await axios.get(
        `${apiUrl}/api/member/get_member/${invoice.membershipId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      const member = memberResponse.data;
      console.log("Member API response:", member);

      console.log("Downloading invoice with data:", { invoice, member });
      
      // Convert API data to the format expected by generateInvoicePDF
      const convertedInvoice = {
        invoiceId: invoice.invoiceId,
        membershipId: invoice.membershipId,
        invoiceDate: invoice.invoiceDate,
        customerName: invoice.customerName || '',
        gstInNumber: invoice.gstInNumber || '',
        billingAddress: invoice.billingAddress || '',
        shippingAddress: invoice.shippingAddress || '',
        eWayNumber: invoice.eWayNumber || '',
        phoneNumber: invoice.phoneNumber || '',
        cGSTInPercent: invoice.cGSTInPercent,
        sGSTInPercent: invoice.sGSTInPercent,
        iGSTInPercent: invoice.iGSTInPercent,
        subTotal: parseFloat(invoice.subTotal),
        total: parseFloat(invoice.total),
        invoiceItems: invoice.invoiceItems ? invoice.invoiceItems.map(item => ({
          hsnCode: item.hsnCode,
          particulars: item.particular,
          noOfStones: item.stoneCount,
          unit: item.size,
          totalSqFeet: parseFloat(item.totalSqFeet),
          ratePerSqFt: parseFloat(item.ratePerSqFeet),
          amount: parseFloat(item.amount)
        })) : []
      };

      console.log("Converted invoice:", convertedInvoice);

      const convertedMember = {
        applicantName: member.applicantName,
        firmName: member.firmName,
        complianceDetails: {
          fullAddress: member.complianceDetails?.fullAddress || '',
          gstInNumber: member.complianceDetails?.gstInNumber || ''
        }
      };

      console.log("Converted member:", convertedMember);

      // Dynamic import to avoid SSR issues
      console.log("Importing PDF generator...");
      const { generateInvoicePDF } = await import("@/lib/generateInvoicePDF");
      console.log("PDF generator imported successfully");
      
      console.log("Generating PDF...");
      await generateInvoicePDF(convertedInvoice, convertedMember);
      console.log("PDF generated successfully");
      
      // Show success toast
      toast({
        title: "PDF Downloaded Successfully!",
        description: `Invoice ${convertedInvoice.invoiceId} has been downloaded.`,
        variant: "sucess"
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Show error toast with detailed message
      let errorMessage = "Failed to generate invoice. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "Invoice not found. Please refresh the page and try again.";
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content for API invoices
    const csvHeaders = [
      "Invoice ID",
      "Membership ID",
      "Date",
      "CGST %",
      "SGST %",
      "IGST %",
      "Sub Total",
      "Total",
    ];

    const csvContent = [
      csvHeaders.join(","),
      ...filteredInvoices.map((invoice) =>
        [
          invoice.invoiceId,
          invoice.membershipId,
          new Date(invoice.invoiceDate).toLocaleDateString(),
          invoice.cGSTInPercent,
          invoice.sGSTInPercent,
          invoice.iGSTInPercent,
          invoice.subTotal,
          invoice.total,
        ].join(",")
      ),
    ].join("\n");

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

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading invoice data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Invoices</CardTitle>
            <CardDescription>Manage all invoices</CardDescription>
          </div>
          {(session?.user?.role === "ADMIN" ||
            session?.user?.role === "TQMA_EDITOR" ||
            session?.user?.role === "TSMWA_EDITOR") &&
            <Button onClick={handleCreateInvoice}>
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          }
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
                    <SelectItem
                      key={member.membershipId}
                      value={member.membershipId}
                    >
                      {member.applicantName} - {member.firmName}
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
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range) {
                        setDateRange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
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
                  <TableHead>Membership ID</TableHead>
                  <TableHead>CGST %</TableHead>
                  <TableHead>SGST %</TableHead>
                  <TableHead>IGST %</TableHead>
                  <TableHead>Sub Total</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell 
                        className="font-medium"
                        onClick={() => handleViewInvoice(invoice.invoiceId)}
                      >
                        {invoice.invoiceId}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{invoice.membershipId}</TableCell>
                      <TableCell>{invoice.cGSTInPercent}%</TableCell>
                      <TableCell>{invoice.sGSTInPercent}%</TableCell>
                      <TableCell>{invoice.iGSTInPercent}%</TableCell>
                      <TableCell>
                        ₹{parseFloat(invoice.subTotal).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₹{parseFloat(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {invoice.status === "APPROVED" ? (
                          <Badge variant="default">Approved</Badge>
                        ) : invoice.status === "PENDING" ? (
                          <Badge variant="outline">Pending</Badge>
                        ) : (
                          <Badge variant="destructive">DECLINED</Badge>
                        )}
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
                                handleViewInvoice(invoice.invoiceId);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {(session?.user?.role === "ADMIN" ||
                              session?.user?.role === "TSMWA_EDITOR" ||
                              session?.user?.role === "TQMA_EDITOR") && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditInvoice(invoice.invoiceId);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(invoice.id);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                                                        {session?.user?.role === "ADMIN" && (
                              <>
                                {invoice.status === "PENDING" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(invoice.invoiceId, "APPROVED");
                                      }}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CircleCheck className="mr-2 h-4 w-4 text-green-500" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(invoice.invoiceId, "DECLINED");
                                      }}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                      Decline
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {invoice.status === "APPROVED" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(invoice.invoiceId, "PENDING");
                                      }}
                                      disabled={isUpdatingStatus}
                                    >
                                      <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                                      Pending
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(invoice.invoiceId, "DECLINED");
                                      }}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CircleX className="mr-2 h-4 w-4 text-red-500" />
                                      Declined
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {invoice.status === "DECLINED" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusUpdate(invoice.invoiceId, "APPROVED");
                                    }}
                                    disabled={isUpdatingStatus}
                                  >
                                    <CircleCheck className="mr-2 h-4 w-4 text-green-500" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <span className="text-destructive">
                                          ⚠️
                                        </span>
                                        Delete Invoice
                                      </DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete invoice{" "}
                                        <span className="font-semibold">
                                          {invoice.invoiceId}
                                        </span>
                                        ? This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2">
                                      <DialogClose asChild>
                                        <Button variant="outline">
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleDeleteInvoice(invoice.invoiceId)
                                          }
                                          disabled={isDeleting}
                                        >
                                          Delete
                                        </Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
