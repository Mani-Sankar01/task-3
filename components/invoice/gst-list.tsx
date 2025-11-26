"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
// Dynamic import for PDF generation to avoid SSR issues
import {
  CalendarIcon,
  CheckCircle2,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Edit,
  Eye,
  FileDown,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

// Define the invoice type based on API response
interface ApiInvoice {
  members: any;
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
  gstStatus: string;
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
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
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

export default function GSTList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ApiInvoice[]>([]);
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "lastMonth" | "custom">("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isSubmittingGST, setIsSubmittingGST] = useState(false);
  const [showGSTConfirmationDialog, setShowGSTConfirmationDialog] = useState(false);
  const [showGSTDialog, setShowGSTDialog] = useState(false);
  const [showMultipleMembersErrorDialog, setShowMultipleMembersErrorDialog] = useState(false);
  const [showApprovalErrorDialog, setShowApprovalErrorDialog] = useState(false);
  const [gstSubmissionStatus, setGstSubmissionStatus] = useState<"submitting" | "submitted" | null>(null);
  const [gstSubmissionMessage, setGstSubmissionMessage] = useState<string>("");
  
  // GST Verification states
  const [showGstVerificationDialog, setShowGstVerificationDialog] = useState(false);
  const [currentVerifyingInvoiceId, setCurrentVerifyingInvoiceId] = useState<string | null>(null);
  const [gstVerificationStep, setGstVerificationStep] = useState<"username" | "otp">("username");
  const [gstInUserName, setGstInUserName] = useState("");
  const [gstOtp, setGstOtp] = useState("");
  const [isVerifyingUsername, setIsVerifyingUsername] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [gstVerificationError, setGstVerificationError] = useState<string>("");
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

    // Filter by date range based on filter type
    if (dateFilterType === "today") {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= start && invoiceDate <= end;
      });
    } else if (dateFilterType === "lastMonth") {
      const lastMonth = subMonths(new Date(), 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= start && invoiceDate <= end;
      });
    } else if (dateFilterType === "custom" && dateRange.from && dateRange.to) {
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const start = startOfDay(dateRange.from!);
        const end = endOfDay(dateRange.to!);
        return invoiceDate >= start && invoiceDate <= end;
      });
    }

    // Filter by member
    if (selectedMemberId) {
      filtered = filtered.filter(
        (invoice) => invoice.membershipId === selectedMemberId
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (invoice) => invoice.gstStatus === statusFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.members?.firmName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateFilterType, dateRange, selectedMemberId, statusFilter, invoices]);

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
        membershipFirmName: invoice.members?.firmName,
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
      "Membership Firm Name",
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
          invoice.members.firmName,
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
    setDateFilterType("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const handleDateFilterTypeChange = (value: "all" | "today" | "lastMonth" | "custom") => {
    setDateFilterType(value);
    if (value === "today") {
      const today = new Date();
      setDateRange({ from: startOfDay(today), to: endOfDay(today) });
    } else if (value === "lastMonth") {
      const lastMonth = subMonths(new Date(), 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    } else if (value === "all") {
      setDateRange({ from: undefined, to: undefined });
    }
    // For "custom", don't change dateRange - let user select manually
  };

  const clearMemberFilter = () => {
    setSelectedMemberId("");
  };

  const clearStatusFilter = () => {
    setStatusFilter("all");
  };

  // Handle invoice selection
  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(paginatedInvoices.map((invoice) => invoice.invoiceId));
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  // Check if all current page invoices are selected
  const allSelected = paginatedInvoices.length > 0 &&
    paginatedInvoices.every((invoice) => selectedInvoiceIds.includes(invoice.invoiceId));

  // Check if some invoices are selected
  const someSelected = selectedInvoiceIds.length > 0 && !allSelected;

  // Handle GST submission - show confirmation first
  const handleSubmitGST = () => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No Invoices Selected",
        description: "Please select at least one invoice to submit for GST.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog first
    setShowGSTConfirmationDialog(true);
  };

  // Function to get client IP address
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "0.0.0.0";
    } catch (error) {
      console.error("Error fetching IP:", error);
      return "0.0.0.0";
    }
  };

  // Function to submit GST for invoices
  const submitGSTForInvoices = async (invoiceIds: string[]) => {
    if (invoiceIds.length === 0) {
      throw new Error("No invoices selected");
    }

    // Get selected invoices data
    const selectedInvoices = invoices.filter((inv) =>
      invoiceIds.includes(inv.invoiceId)
    );

    if (selectedInvoices.length === 0) {
      throw new Error("Selected invoices not found");
    }

    // Check if all invoices are approved
    const unapprovedInvoices = selectedInvoices.filter(
      (inv) => inv.status !== "APPROVED"
    );

    if (unapprovedInvoices.length > 0) {
      throw new Error(
        "Invoices must need to be approved for GST submission"
      );
    }

    // Check if all invoices are from the same member
    const uniqueMembershipIds = new Set(
      selectedInvoices.map((inv) => inv.membershipId).filter(Boolean)
    );

    if (uniqueMembershipIds.size > 1) {
      throw new Error(
        "Multiple Members are not allowed. Only single member's GST Invoices are allowed."
      );
    }

    // Get GST number from members.complianceDetails.gstInNumber
    const gstInNumber =
      selectedInvoices[0]?.members?.complianceDetails?.gstInNumber;
    if (!gstInNumber) {
      throw new Error("GST number not found in selected invoices");
    }

    // Get ret_period from invoice date (use first invoice's date or current date)
    const invoiceDate = selectedInvoices[0]?.invoiceDate
      ? new Date(selectedInvoices[0].invoiceDate)
      : new Date();
    const ret_period = format(invoiceDate, "yyyy-MM-dd");

    // Get client IP
    const ip = await getClientIP();

    // Prepare invoices array
    const invoicesPayload = selectedInvoices.map((inv) => ({
      invoiceNumber: inv.invoiceId,
    }));

    // Prepare payload
    const payload = {
      gstInNumber,
      ret_period,
      ip,
      invoices: invoicesPayload,
    };

    console.log("Submitting GST with payload:", payload);

    // Call GST API
    const gstApiUrl = "https://gst.tsmwa.online/api/ret_save";
    const response = await axios.post(gstApiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  };

  // Confirm and proceed with GST submission
  const confirmSubmitGST = async () => {
    setShowGSTConfirmationDialog(false);

    // Open dialog and start submission process
    setShowGSTDialog(true);
    setGstSubmissionStatus("submitting");
    setIsSubmittingGST(true);
    setGstSubmissionMessage("");

    try {
      // Submit to GST API
      const response = await submitGSTForInvoices(selectedInvoiceIds);

      // Get success message from API response or use default
      const successMessage =
        response?.message ||
        `${selectedInvoiceIds.length} invoice(s) have been submitted for GST.`;

      setGstSubmissionStatus("submitted");
      setGstSubmissionMessage(successMessage);
      setIsSubmittingGST(false);

      // Clear selection after showing success
      setSelectedInvoiceIds([]);
    } catch (error: any) {
      console.error("Error submitting GST:", error);
      setIsSubmittingGST(false);
      setShowGSTDialog(false);
      setGstSubmissionStatus(null);
      setGstSubmissionMessage("");

      // Check if it's a multiple members error
      if (
        error.message &&
        error.message.includes("Multiple Members are not allowed")
      ) {
        setShowMultipleMembersErrorDialog(true);
      } else if (
        error.message &&
        error.message.includes("Invoices must need to be approved")
      ) {
        setShowApprovalErrorDialog(true);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to submit GST. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle GST username verification
  const handleGstUsernameVerification = async () => {
    if (!currentVerifyingInvoiceId || !gstInUserName || gstInUserName.length < 3) {
      setGstVerificationError("Username must be at least 3 characters");
      return;
    }

    try {
      setIsVerifyingUsername(true);
      setGstVerificationError("");

      // Get the invoice to find GST number
      const invoice = invoices.find((inv) => inv.invoiceId === currentVerifyingInvoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const gstInNumber = invoice.members?.complianceDetails?.gstInNumber;
      if (!gstInNumber) {
        throw new Error("GST number not found");
      }

      // Get client IP
      const clientIP = await getClientIP();

      // Check if session has token
      if (!session?.user?.token) {
        throw new Error("Not authenticated");
      }

      // Call verify_username API
      const verifyUrl = `${process.env.NEXT_PUBLIC_GST_BACKEND_URL}/api/verify_username`;
      const response = await axios.post(
        verifyUrl,
        {
          gstInNumber,
          gstInUserName,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
            "x-client-ip": clientIP,
          },
        }
      );

      if (response.data.success) {
        // Move to OTP step
        setGstVerificationStep("otp");
        setGstVerificationError("");
      } else {
        throw new Error(response.data.message || "Failed to verify username");
      }
    } catch (error: any) {
      console.error("Error verifying GST username:", error);
      setGstVerificationError(
        error.response?.data?.message || error.message || "Failed to verify username. Please try again."
      );
    } finally {
      setIsVerifyingUsername(false);
    }
  };

  // Handle GST OTP verification
  const handleGstOtpVerification = async () => {
    if (!gstOtp || gstOtp.length !== 6 || !/^\d{6}$/.test(gstOtp)) {
      setGstVerificationError("OTP must be exactly 6 digits");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setGstVerificationError("");

      // Get client IP
      const clientIP = await getClientIP();

      // Check if session has token
      if (!session?.user?.token) {
        throw new Error("Not authenticated");
      }

      // Call verify_username_otp API
      const verifyOtpUrl = "https://gst.tsmwa.online/api/verify_username_otp";
      const response = await axios.post(
        verifyOtpUrl,
        {
          gstInUserName,
          otp: gstOtp,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
            "x-client-ip": clientIP,
          },
        }
      );

      if (response.data.success) {
        // Close verification dialog
        setShowGstVerificationDialog(false);
        setGstVerificationStep("username");
        setGstInUserName("");
        setGstOtp("");
        setGstVerificationError("");

        // Show success message
        toast({
          title: "Success",
          description: response.data.message || "GST verified successfully",
        });

        // Proceed with GST submission
        if (currentVerifyingInvoiceId) {
          handleSingleInvoiceGSTSubmit(currentVerifyingInvoiceId);
        }

        setCurrentVerifyingInvoiceId(null);
      } else {
        throw new Error(response.data.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Error verifying GST OTP:", error);
      setGstVerificationError(
        error.response?.data?.message || error.message || "Failed to verify OTP. Please try again."
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle single invoice GST submission from dropdown
  const handleSingleInvoiceGSTSubmit = async (invoiceId: string) => {
    try {
      setIsSubmittingGST(true);
      setShowGSTDialog(true);
      setGstSubmissionStatus("submitting");
      setGstSubmissionMessage("");

      // Submit single invoice
      const response = await submitGSTForInvoices([invoiceId]);

      // Get success message from API response or use default
      const successMessage =
        response?.message ||
        `Invoice ${invoiceId} has been submitted for GST.`;

      setGstSubmissionStatus("submitted");
      setGstSubmissionMessage(successMessage);
      setIsSubmittingGST(false);
    } catch (error: any) {
      console.error("Error submitting GST:", error);
      setIsSubmittingGST(false);
      setShowGSTDialog(false);
      setGstSubmissionStatus(null);
      setGstSubmissionMessage("");

      // Check if it's a multiple members error
      if (
        error.message &&
        error.message.includes("Multiple Members are not allowed")
      ) {
        setShowMultipleMembersErrorDialog(true);
      } else if (
        error.message &&
        error.message.includes("Invoices must need to be approved")
      ) {
        setShowApprovalErrorDialog(true);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to submit GST. Please try again.",
          variant: "destructive",
        });
      }
    }
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
            <CardTitle className="text-2xl">GST Filling</CardTitle>
            <CardDescription>Manage all GST filling</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedInvoiceIds.length > 0 && (session?.user?.role === "ADMIN" || session?.user?.role === "TQMA_EDITOR" || session?.user?.role === "TSMWA_EDITOR") && (
              <Button
                onClick={handleSubmitGST}
                disabled={isSubmittingGST}
                variant="default"
              >
                {isSubmittingGST ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit GST ({selectedInvoiceIds.length})
                  </>
                )}
              </Button>
            )}
          </div>
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
                <Button variant="outline" size="sm" onClick={clearMemberFilter}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={dateFilterType}
                onValueChange={(value) => handleDateFilterTypeChange(value as "all" | "today" | "lastMonth" | "custom")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {dateFilterType === "custom" && (
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
              )}

              {dateFilterType !== "all" && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="READY_TO_FILE">Ready to File</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="FILED">Filed</SelectItem>
                </SelectContent>
              </Select>

              {statusFilter !== "all" && (
                <Button variant="ghost" size="sm" onClick={clearStatusFilter}>
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
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected || someSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Membership Firm Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>CGST %</TableHead>
                  <TableHead>SGST %</TableHead>
                  <TableHead>IGST %</TableHead>
                  <TableHead>Sub Total</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>GST Status</TableHead>
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
                        className="w-[50px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedInvoiceIds.includes(invoice.invoiceId)}
                          onCheckedChange={(checked) =>
                            handleSelectInvoice(invoice.invoiceId, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select invoice ${invoice.invoiceId}`}
                        />
                      </TableCell>
                      <TableCell
                        className="font-medium"
                        onClick={() => handleViewInvoice(invoice.invoiceId)}
                      >
                        {invoice.invoiceId}
                      </TableCell>
                      <TableCell>{invoice.members?.firmName}</TableCell>
                      <TableCell>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>

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
                        {invoice.gstStatus === "FILED" ? (
                          <Badge variant="outline">Filed</Badge>
                        ) : invoice.gstStatus === "READY_TO_FILE" ? (
                          <Badge variant="secondary">Ready to File</Badge>
                        ) : invoice.gstStatus === "SUBMITTED" ? (
                          <Badge variant="default">Submitted</Badge>
                        ) : invoice.gstStatus === "DECLINED" ? (
                          <Badge variant="destructive">Declined</Badge>
                        ) : (
                          <Badge variant="destructive">Pending</Badge>
                        )}
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
                        <Button variant="ghost" className="h-8 w-8 p-0"  onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(invoice.invoiceId);
                              }}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
                                <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditInvoice(invoice.invoiceId);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>

                                {invoice.status === "APPROVED" && (
                                  <>
                                    {invoice.members?.complianceDetails?.isGstVerified === "TRUE" ? (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSingleInvoiceGSTSubmit(invoice.invoiceId);
                                        }}
                                        disabled={isSubmittingGST}
                                      >
                                        <CircleCheck className="mr-2 h-4 w-4 text-green-500" />
                                        Submit GST
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentVerifyingInvoiceId(invoice.invoiceId);
                                          setShowGstVerificationDialog(true);
                                          setGstVerificationStep("username");
                                          setGstInUserName("");
                                          setGstOtp("");
                                          setGstVerificationError("");
                                        }}
                                        disabled={isSubmittingGST || isVerifyingUsername || isVerifyingOtp}
                                      >
                                        <CircleCheck className="mr-2 h-4 w-4 text-blue-500" />
                                        Verify GST
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                                </>

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
                                    {/* <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(invoice.invoiceId, "PENDING");
                                      }}
                                      disabled={isUpdatingStatus}
                                    >
                                      <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                                      Pending
                                    </DropdownMenuItem> */}
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

      {/* GST Confirmation Dialog */}
      <Dialog open={showGSTConfirmationDialog} onOpenChange={setShowGSTConfirmationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm GST Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit {selectedInvoiceIds.length} invoice(s) for GST?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will submit the selected invoices to the GST portal. Please ensure all information is correct before proceeding.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGSTConfirmationDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSubmitGST}>
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GST Submission Dialog */}
      <Dialog
        open={showGSTDialog}
        onOpenChange={(open) => {
          // Prevent closing during submission process
          if (!open && gstSubmissionStatus === "submitting") {
            return;
          }
          setShowGSTDialog(open);
          if (!open) {
            setGstSubmissionStatus(null);
            setGstSubmissionMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submitting GST</DialogTitle>
            <DialogDescription>
              {gstSubmissionStatus === "submitting"
                ? "Please wait while we process your GST submission."
                : gstSubmissionStatus === "submitted"
                ? "GST submission completed."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {gstSubmissionStatus === "submitting" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Submitting...</p>
              </>
            )}
            {gstSubmissionStatus === "submitted" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium text-green-600">Submitted</p>
              </>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {gstSubmissionStatus === "submitting" &&
                `Submitting ${selectedInvoiceIds.length} invoice(s)...`}
              {gstSubmissionStatus === "submitted" &&
                (gstSubmissionMessage ||
                  "Your invoices have been successfully submitted for GST.")}
            </p>
          </div>
          {gstSubmissionStatus === "submitted" && (
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setShowGSTDialog(false);
                    setGstSubmissionStatus(null);
                    setGstSubmissionMessage("");
                  }}
                >
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Multiple Members Error Dialog */}
      <Dialog
        open={showMultipleMembersErrorDialog}
        onOpenChange={setShowMultipleMembersErrorDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <CircleX className="h-5 w-5" />
              Multiple Members Not Allowed
            </DialogTitle>
            <DialogDescription>
              Multiple Members are not allowed. Only single member's GST Invoices
              are allowed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowMultipleMembersErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Error Dialog */}
      <Dialog
        open={showApprovalErrorDialog}
        onOpenChange={setShowApprovalErrorDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <CircleX className="h-5 w-5" />
              Invoices Not Approved
            </DialogTitle>
            <DialogDescription>
              Invoices must need to be approved for GST submission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowApprovalErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GST Verification Dialog */}
      <Dialog
        open={showGstVerificationDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowGstVerificationDialog(false);
            setGstVerificationStep("username");
            setGstInUserName("");
            setGstOtp("");
            setGstVerificationError("");
            setCurrentVerifyingInvoiceId(null);
          } else {
            setShowGstVerificationDialog(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify GST</DialogTitle>
            <DialogDescription>
              {gstVerificationStep === "username"
                ? "Enter your GST username to receive an OTP"
                : "Enter the OTP sent to your registered mobile number"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {gstVerificationStep === "username" ? (
              <div className="space-y-2">
                <Label htmlFor="gst-username">GST Username</Label>
                <Input
                  id="gst-username"
                  placeholder="Enter GST username"
                  value={gstInUserName}
                  onChange={(e) => {
                    setGstInUserName(e.target.value);
                    setGstVerificationError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && gstInUserName.length >= 3) {
                      handleGstUsernameVerification();
                    }
                  }}
                  disabled={isVerifyingUsername}
                />
                {gstVerificationError && (
                  <p className="text-sm text-destructive">{gstVerificationError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="gst-otp">OTP</Label>
                <Input
                  id="gst-otp"
                  placeholder="Enter 6-digit OTP"
                  value={gstOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setGstOtp(value);
                    setGstVerificationError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && gstOtp.length === 6) {
                      handleGstOtpVerification();
                    }
                  }}
                  disabled={isVerifyingOtp}
                  maxLength={6}
                />
                {gstVerificationError && (
                  <p className="text-sm text-destructive">{gstVerificationError}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {gstVerificationStep === "otp" && (
              <Button
                variant="outline"
                onClick={() => {
                  setGstVerificationStep("username");
                  setGstOtp("");
                  setGstVerificationError("");
                }}
                disabled={isVerifyingOtp}
              >
                Back
              </Button>
            )}
            <Button
              onClick={() => {
                if (gstVerificationStep === "username") {
                  handleGstUsernameVerification();
                } else {
                  handleGstOtpVerification();
                }
              }}
              disabled={
                gstVerificationStep === "username"
                  ? isVerifyingUsername || gstInUserName.length < 3
                  : isVerifyingOtp || gstOtp.length !== 6
              }
            >
              {isVerifyingUsername || isVerifyingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {gstVerificationStep === "username" ? "Verifying..." : "Verifying OTP..."}
                </>
              ) : gstVerificationStep === "username" ? (
                "Send OTP"
              ) : (
                "Verify OTP"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
