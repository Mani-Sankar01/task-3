"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSafeSearchParams } from "@/hooks/use-safe-search-params";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
// Dynamic import for PDF generation to avoid SSR issues
import {
  CalendarIcon,
  CheckCircle2,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Edit,
  Eye,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function GSTList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSafeSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ApiInvoice[]>([]);
  const [dateFilterType, setDateFilterType] = useState<"lastMonth" | "thisYear" | "custom">("lastMonth");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isSubmittingGST, setIsSubmittingGST] = useState(false);
  const [showGSTConfirmationDialog, setShowGSTConfirmationDialog] = useState(false);
  const [showGSTDialog, setShowGSTDialog] = useState(false);
  const [showMultipleMembersErrorDialog, setShowMultipleMembersErrorDialog] = useState(false);
  const [showApprovalErrorDialog, setShowApprovalErrorDialog] = useState(false);
  const [showPendingInvoicesErrorDialog, setShowPendingInvoicesErrorDialog] = useState(false);
  const [pendingInvoiceErrorType, setPendingInvoiceErrorType] = useState<"pending" | "filed" | null>(null);
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

  // Auth OTP states (for pre-submission auth check)
  const [showAuthOtpDialog, setShowAuthOtpDialog] = useState(false);
  const [authOtp, setAuthOtp] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isVerifyingAuthOtp, setIsVerifyingAuthOtp] = useState(false);
  const [authOtpError, setAuthOtpError] = useState<string>("");
  const [pendingInvoiceIds, setPendingInvoiceIds] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];

  // Update URL with current filter parameters
  const updateURL = (memberId: string, dateType: string, dateFrom?: Date, dateTo?: Date) => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams();
    if (memberId) {
      params.set("memberId", memberId);
    }
    if (dateType) {
      params.set("dateType", dateType);
    }
    if (dateFrom) {
      params.set("dateFrom", dateFrom.toISOString());
    }
    if (dateTo) {
      params.set("dateTo", dateTo.toISOString());
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  };

  // Read filters from URL parameters
  const readFiltersFromURL = () => {
    if (typeof window === "undefined") return false;
    
    // Read directly from window.location.search to ensure we get current params
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get("memberId") || "";
    const dateType = urlParams.get("dateType") || "";
    const dateFromParam = urlParams.get("dateFrom");
    const dateToParam = urlParams.get("dateTo");

    if (memberId) {
      setSelectedMemberId(memberId);
    }
    
    if (dateType && ["lastMonth", "thisYear", "custom"].includes(dateType)) {
      setDateFilterType(dateType as "lastMonth" | "thisYear" | "custom");
      
      // Set date range based on filter type
      if (dateType === "lastMonth") {
        const lastMonth = subMonths(new Date(), 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
      } else if (dateType === "thisYear") {
        const now = new Date();
        setDateRange({
          from: startOfYear(now),
          to: endOfYear(now),
        });
      } else if (dateType === "custom") {
        if (dateFromParam && dateToParam) {
          setDateRange({
            from: new Date(dateFromParam),
            to: new Date(dateToParam),
          });
        }
      }
    }

    // Return true if we have filters to auto-search
    return !!(memberId && dateType);
  };

  // Re-read filters when pathname changes (e.g., when navigating back)
  useEffect(() => {
    if (typeof window !== "undefined" && members.length > 0) {
      readFiltersFromURL();
    }
  }, [pathname, members.length]);

  // Fetch invoices function (called on search)
  const fetchInvoices = async (skipValidation: boolean = false) => {
    if (status !== "authenticated" || !session?.user?.token) {
      return;
    }

    // Check if filters are in URL - if so, skip validation errors
    const hasUrlFilters = searchParams.get("memberId") && searchParams.get("dateType");

    // Only show validation errors if:
    // 1. Not skipping validation (user manually clicked search)
    // 2. Filters are not in URL (fresh page load without filters)
    if (!skipValidation && !hasUrlFilters) {
      if (!selectedMemberId) {
        toast({
          title: "Member Required",
          description: "Please select a member to search",
          variant: "destructive"
        });
        return;
      }

      if (dateFilterType === "custom" && (!dateRange.from || !dateRange.to)) {
        toast({
          title: "Date Range Required",
          description: "Please select a date range for custom filter",
          variant: "destructive"
        });
        return;
      }
    }

    // Double-check we have the required data - silently return if missing
    if (!selectedMemberId) {
      return;
    }

    if (dateFilterType === "custom" && (!dateRange.from || !dateRange.to)) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      const fullUrl = `${apiUrl}/api/tax_invoice/get_tax_invoice`;

      const response = await axios.get(fullUrl, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

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

      console.log("Invoice data:", responseData);
      
      // Update URL with filter parameters after successful search
      updateURL(selectedMemberId, dateFilterType, dateRange.from, dateRange.to);
    } catch (err: unknown) {
      console.error("Error fetching invoice data:", err);
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

  // Load members from API and restore filter state
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
        
        // After members are loaded, read filters from URL and auto-search if present
        const hasFilters = readFiltersFromURL();
        if (hasFilters && !isInitialized) {
          setIsInitialized(true);
          // Auto-fetch after a brief delay to ensure state is set
          // Skip validation since filters are from URL
          setTimeout(() => {
            fetchInvoices(true); // Pass true to skip validation
          }, 400);
        }
      } catch (err: unknown) {
        console.error("Error fetching members:", err);
        setMembers([]);
      }
    };

    fetchMembers();
  }, [status, session?.user?.token]);

  // Auto-search when URL has filters and component is ready
  useEffect(() => {
    if (
      isInitialized &&
      selectedMemberId &&
      members.length > 0 &&
      status === "authenticated" &&
      session?.user?.token &&
      !isLoading &&
      !hasSearched
    ) {
      // Check if date range is ready
      const isDateRangeReady = 
        dateFilterType === "custom" 
          ? (dateRange.from && dateRange.to)
          : (dateFilterType === "lastMonth" || dateFilterType === "thisYear")
            ? (dateRange.from && dateRange.to)
            : true;

      if (isDateRangeReady) {
        const timer = setTimeout(() => {
          fetchInvoices(true); // Pass true to skip validation when auto-fetching from URL
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isInitialized, selectedMemberId, members.length, status, session?.user?.token, hasSearched, dateFilterType, dateRange.from, dateRange.to, isLoading]);

  // Set default date range based on filter type (also after restoration)
  useEffect(() => {
    if (dateFilterType === "lastMonth" && (!dateRange.from || !dateRange.to)) {
      const lastMonth = subMonths(new Date(), 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    } else if (dateFilterType === "thisYear" && (!dateRange.from || !dateRange.to)) {
      const now = new Date();
      setDateRange({ from: startOfYear(now), to: endOfYear(now) });
    }
  }, [dateFilterType]);

  useEffect(() => {
    let filtered = invoices;

    // Filter by member (required, already applied via search)
    if (selectedMemberId) {
      filtered = filtered.filter(
        (invoice) => invoice.membershipId === selectedMemberId
      );
    }

    // Filter by date range based on filter type
    if (dateFilterType === "lastMonth") {
      const lastMonth = subMonths(new Date(), 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= start && invoiceDate <= end;
      });
    } else if (dateFilterType === "thisYear") {
      const now = new Date();
      const start = startOfYear(now);
      const end = endOfYear(now);
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
  }, [searchTerm, dateFilterType, dateRange, selectedMemberId, invoices]);

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

      const response = await axios.post(
        `${apiUrl}/api/tax_invoice/update_tax_invoice`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Fetch updated invoice data to get the latest GST status
      try {
        const updatedInvoiceResponse = await axios.get(
          `${apiUrl}/api/tax_invoice/get_tax_invoice_id/${invoiceId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        // Handle response structure
        let updatedInvoice: ApiInvoice | null = null;
        if (
          updatedInvoiceResponse.data &&
          updatedInvoiceResponse.data.taxInvoice &&
          Array.isArray(updatedInvoiceResponse.data.taxInvoice)
        ) {
          updatedInvoice = updatedInvoiceResponse.data.taxInvoice[0];
        } else if (updatedInvoiceResponse.data && !updatedInvoiceResponse.data.taxInvoice) {
          updatedInvoice = updatedInvoiceResponse.data;
        }

        if (updatedInvoice) {
          // Update local state with the complete updated invoice data
          setInvoices((prevInvoices) =>
            prevInvoices.map((inv) =>
              inv.invoiceId === invoiceId ? { ...inv, ...updatedInvoice, status: newStatus } : inv
            )
          );
          setFilteredInvoices((prevInvoices) =>
            prevInvoices.map((inv) =>
              inv.invoiceId === invoiceId ? { ...inv, ...updatedInvoice, status: newStatus } : inv
            )
          );
        } else {
          // Fallback: Update only status if we can't fetch updated data
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
        }
      } catch (fetchError) {
        console.error("Error fetching updated invoice:", fetchError);
        // Fallback: Update only status if fetch fails
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
      }

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


  const handleDateFilterTypeChange = (value: "lastMonth" | "thisYear" | "custom") => {
    setDateFilterType(value);
    let newDateRange = { from: undefined as Date | undefined, to: undefined as Date | undefined };
    
    if (value === "lastMonth") {
      const lastMonth = subMonths(new Date(), 1);
      newDateRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      setDateRange(newDateRange);
    } else if (value === "thisYear") {
      const now = new Date();
      newDateRange = { from: startOfYear(now), to: endOfYear(now) };
      setDateRange(newDateRange);
    }
    // For "custom", don't change dateRange - let user select manually
    
    // Update URL immediately when date filter type changes
    if (selectedMemberId) {
      updateURL(selectedMemberId, value, newDateRange.from, newDateRange.to);
    }
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

  // Check if selected invoices need GST verification
  const needsGstVerification = () => {
    if (selectedInvoiceIds.length === 0) return false;
    
    const selectedInvoices = invoices.filter((inv) =>
      selectedInvoiceIds.includes(inv.invoiceId)
    );
    
    if (selectedInvoices.length === 0) return false;
    
    // Check if all selected invoices are from the same member and need verification
    const firstInvoice = selectedInvoices[0];
    const isGstVerified = firstInvoice?.members?.complianceDetails?.isGstVerified;
    
    return isGstVerified !== "TRUE";
  };

  // Handle GST verification for selected invoices (member-level verification)
  const handleGstVerification = () => {
    if (selectedInvoiceIds.length === 0) {
      toast({
        title: "No Invoices Selected",
        description: "Please select at least one invoice to verify GST.",
        variant: "destructive",
      });
      return;
    }

    // Get the first invoice for verification (all should be from same member)
    // Verification is at member level, so we only need one invoice ID
    const firstInvoiceId = selectedInvoiceIds[0];
    setCurrentVerifyingInvoiceId(firstInvoiceId);
    setShowGstVerificationDialog(true);
    setGstVerificationStep("username");
    setGstInUserName("");
    setGstOtp("");
    setGstVerificationError("");
  };

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
  // Check authentication before GST submission
  const checkAuthBeforeSubmission = async (membershipId: string): Promise<boolean> => {
    try {
      setIsCheckingAuth(true);
      setAuthOtpError("");

      // Get client IP
      const clientIP = await getClientIP();

      // Check if session has token
      if (!session?.user?.token) {
        throw new Error("Not authenticated");
      }

      // Call auth API
      const authUrl = `${process.env.NEXT_PUBLIC_GST_BACKEND_URL}/api/auth?membershipId=${membershipId}`;
      const response = await axios.get(authUrl, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "x-client-ip": clientIP,
        },
      });

      // Get the response data (axios wraps it in response.data)
      const responseData = response.data;
      
      console.log("Auth API Response:", responseData);
      console.log("Response data type:", typeof responseData);
      console.log("isAuthenticated value:", responseData?.isAuthenticated);
      console.log("isAuthenticated type:", typeof responseData?.isAuthenticated);

      // Check response type - check for isAuthenticated first (handle both boolean true and string "true")
      const isAuthenticatedValue = responseData?.isAuthenticated;
      
      // Check if already authenticated
      if (isAuthenticatedValue === true || isAuthenticatedValue === "true" || isAuthenticatedValue === 1 || String(isAuthenticatedValue).toLowerCase() === "true") {
        // Already authenticated, proceed directly
        console.log("User is authenticated (isAuthenticated:", isAuthenticatedValue, "), proceeding with submission");
        setIsCheckingAuth(false);
        return true;
      }
      
      // Check if OTP is required
      if (responseData?.success === true && responseData?.message === "OTP requested successfully") {
        // OTP required, show OTP dialog
        console.log("OTP required, showing OTP dialog");
        setIsCheckingAuth(false);
        return false; // Return false to indicate OTP needed
      }
      
      // If we get here, the response format is unexpected
      console.error("Unexpected auth response format:", responseData);
      console.error("Full response object:", response);
      console.error("Response structure:", JSON.stringify(responseData, null, 2));
      
      // Default to requiring OTP if we can't determine auth status
      console.warn("Could not determine authentication status, defaulting to OTP flow");
      setIsCheckingAuth(false);
      return false;
    } catch (error: any) {
      console.error("Error checking auth:", error);
      setIsCheckingAuth(false);
      throw new Error(
        error.response?.data?.message || error.message || "Failed to check authentication. Please try again."
      );
    }
  };

  // Verify auth OTP
  const handleAuthOtpVerification = async () => {
    if (!authOtp || authOtp.length !== 6 || !/^\d{6}$/.test(authOtp)) {
      setAuthOtpError("OTP must be exactly 6 digits");
      return;
    }

    try {
      setIsVerifyingAuthOtp(true);
      setAuthOtpError("");

      // Get membershipId from pending invoices
      if (pendingInvoiceIds.length === 0) {
        throw new Error("No pending invoices found");
      }

      const pendingInvoices = invoices.filter((inv) =>
        pendingInvoiceIds.includes(inv.invoiceId)
      );

      if (pendingInvoices.length === 0) {
        throw new Error("Pending invoices not found");
      }

      const membershipId = pendingInvoices[0]?.membershipId;
      if (!membershipId) {
        throw new Error("Membership ID not found in pending invoices");
      }

      // Get client IP
      const clientIP = await getClientIP();

      // Check if session has token
      if (!session?.user?.token) {
        throw new Error("Not authenticated");
      }

      // Call Verify_otp API
      const verifyOtpUrl = `${process.env.NEXT_PUBLIC_GST_BACKEND_URL}/api/Verify_otp`;
      console.log("Calling Verify_otp API with payload:", {
        membershipId: membershipId,
        otp: authOtp,
      });
      
      const response = await axios.post(
        verifyOtpUrl,
        {
          membershipId: membershipId,
          otp: authOtp,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
            "x-client-ip": clientIP,
          },
        }
      );

      console.log("Verify_otp API Response:", response.data);
      console.log("Response status:", response.status);
      console.log("Response success value:", response.data?.success);
      console.log("Response isAuthenticated value:", response.data?.isAuthenticated);

      // Check for both response formats:
      // 1. {success: true, message: "..."} format
      // 2. {isAuthenticated: true, sessionTTL: ...} format (this is what the API actually returns)
      const isSuccess = response.data?.success === true;
      const isAuthenticated = response.data?.isAuthenticated === true || response.data?.isAuthenticated === "true" || response.data?.isAuthenticated === 1;

      if (isSuccess || isAuthenticated) {
        // OTP verified successfully, close OTP dialog
        console.log("OTP verified successfully! isSuccess:", isSuccess, ", isAuthenticated:", isAuthenticated);
        setShowAuthOtpDialog(false);
        setAuthOtp("");
        setIsVerifyingAuthOtp(false);

        // Show loading dialog and proceed with GST submission
        if (pendingInvoiceIds.length > 0) {
          setShowGSTDialog(true);
          setGstSubmissionStatus("submitting");
          setIsSubmittingGST(true);
          setGstSubmissionMessage("Connecting to GST portal...");
          await proceedWithGSTSubmission(pendingInvoiceIds);
        }
      } else {
        // Log the full response for debugging
        console.error("OTP verification failed. Full response:", response.data);
        const errorMessage = response.data?.message || response.data?.error || "Failed to verify OTP";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error verifying auth OTP:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Get the actual error message from the API response
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message || 
        "Failed to verify OTP. Please try again.";
      
      setAuthOtpError(errorMessage);
      setIsVerifyingAuthOtp(false);
    }
  };

  // Proceed with GST submission (after auth check)
  const proceedWithGSTSubmission = async (invoiceIds: string[]) => {
    // Dialog should already be open from caller, just update message
    if (!showGSTDialog) {
      setShowGSTDialog(true);
    }
    setGstSubmissionStatus("submitting");
    setIsSubmittingGST(true);
    setGstSubmissionMessage("Connecting to GST portal...");

    try {
      // Update message before submitting
      setGstSubmissionMessage("Submitting invoices to GST portal...");
      
      // Submit to GST API
      const response = await submitGSTForInvoices(invoiceIds);

      // Get success message from API response or use default
      const successMessage =
        response?.message ||
        `${invoiceIds.length} invoice(s) have been submitted for GST.`;

      setGstSubmissionStatus("submitted");
      setGstSubmissionMessage(successMessage);
      setIsSubmittingGST(false);

      // Refresh invoice data to get updated GST status
      // Add a small delay to ensure backend has processed the submission
      setTimeout(async () => {
        try {
          console.log("Refreshing invoice data to get updated GST status...");
          setGstSubmissionMessage("Refreshing invoice data...");
          
          const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
          const fullUrl = `${apiUrl}/api/tax_invoice/get_tax_invoice`;

          const updatedResponse = await axios.get(fullUrl, {
            headers: {
              Authorization: `Bearer ${session?.user?.token}`,
            },
          });

          // Handle different possible response structures
          let updatedInvoiceData;
          if (updatedResponse.data && Array.isArray(updatedResponse.data)) {
            updatedInvoiceData = updatedResponse.data;
          } else if (updatedResponse.data && updatedResponse.data.taxInvoice && Array.isArray(updatedResponse.data.taxInvoice)) {
            updatedInvoiceData = updatedResponse.data.taxInvoice;
          } else if (updatedResponse.data && updatedResponse.data.taxInvoices && Array.isArray(updatedResponse.data.taxInvoices)) {
            updatedInvoiceData = updatedResponse.data.taxInvoices;
          } else if (updatedResponse.data && updatedResponse.data.data && Array.isArray(updatedResponse.data.data)) {
            updatedInvoiceData = updatedResponse.data.data;
          } else {
            updatedInvoiceData = [];
          }

          console.log("Updated invoice data received:", updatedInvoiceData.length, "invoices");
          setInvoices(updatedInvoiceData);
          
          // Update success message to indicate data has been refreshed
          
          // The useEffect hook will automatically update filteredInvoices based on the new invoices data
          // and current filters (selectedMemberId, dateFilterType, etc.)
        } catch (refreshError) {
          console.error("Error refreshing invoice data:", refreshError);
          // Show a toast to inform user, but don't fail the submission
          toast({
            title: "Warning",
            description: "GST submitted successfully, but failed to refresh the invoice list. Please refresh the page to see updated status.",
            variant: "default",
          });
        }
      }, 1000); // Wait 1 second before refreshing to ensure backend has processed

      // Clear selection after showing success
      setSelectedInvoiceIds([]);
      setPendingInvoiceIds([]);
    } catch (error: any) {
      console.error("Error submitting GST:", error);
      setIsSubmittingGST(false);
      setShowGSTDialog(false);
      setGstSubmissionStatus(null);
      setGstSubmissionMessage("");
      setPendingInvoiceIds([]);

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
      } else if (
        error.message &&
        (error.message.includes("READY_TO_FILE") || error.message === "ALREADY_FILED" || error.message === "PENDING_INVOICES")
      ) {
        if (error.message === "ALREADY_FILED") {
          setPendingInvoiceErrorType("filed");
        } else {
          setPendingInvoiceErrorType("pending");
        }
        setShowPendingInvoicesErrorDialog(true);
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

    // Check if any invoices are already filed
    const filedInvoices = selectedInvoices.filter(
      (inv) => inv.gstStatus === "FILED"
    );

    if (filedInvoices.length > 0) {
      throw new Error("ALREADY_FILED");
    }

    // Check if all invoices have gstStatus READY_TO_FILE
    const pendingInvoices = selectedInvoices.filter(
      (inv) => inv.gstStatus !== "READY_TO_FILE"
    );

    if (pendingInvoices.length > 0) {
      throw new Error("PENDING_INVOICES");
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

    // Get membershipId from the first selected invoice
    const membershipId = selectedInvoices[0]?.membershipId;
    if (!membershipId) {
      throw new Error("Membership ID not found in selected invoices");
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
      invoiceId: inv.invoiceId,
    }));

    // Prepare payload
    const payload = {
      membershipId,
      ret_period,
      invoices: invoicesPayload,
    };

    console.log("Submitting GST with payload:", payload);

    // Check if session has token
    if (!session?.user?.token) {
      throw new Error("Not authenticated");
    }

    // Call GST API
    const gstApiUrl = `${process.env.NEXT_PUBLIC_GST_BACKEND_URL}/api/ret_save`;
    const response = await axios.post(gstApiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.user.token}`,
        "x-client-ip": ip,
      },
    });

    return response.data;
  };

  // Confirm and proceed with GST submission
  const confirmSubmitGST = async () => {
    setShowGSTConfirmationDialog(false);

    try {
      // Get selected invoices data to get membershipId
      const selectedInvoices = invoices.filter((inv) =>
        selectedInvoiceIds.includes(inv.invoiceId)
      );

      if (selectedInvoices.length === 0) {
        throw new Error("Selected invoices not found");
      }

      // Check if all invoices are approved
      const unapprovedInvoices = selectedInvoices.filter(
        (inv) => inv.status !== "APPROVED"
      );

      if (unapprovedInvoices.length > 0) {
        setShowApprovalErrorDialog(true);
        return;
      }

      // Check if any invoices are already filed
      const filedInvoices = selectedInvoices.filter(
        (inv) => inv.gstStatus === "FILED"
      );

      if (filedInvoices.length > 0) {
        setPendingInvoiceErrorType("filed");
        setShowPendingInvoicesErrorDialog(true);
        return;
      }

      // Check if all invoices have gstStatus READY_TO_FILE
      const pendingInvoices = selectedInvoices.filter(
        (inv) => inv.gstStatus !== "READY_TO_FILE"
      );

      if (pendingInvoices.length > 0) {
        setPendingInvoiceErrorType("pending");
        setShowPendingInvoicesErrorDialog(true);
        return;
      }

      // Check if all invoices are from the same member
      const uniqueMembershipIds = new Set(
        selectedInvoices.map((inv) => inv.membershipId).filter(Boolean)
      );

      if (uniqueMembershipIds.size > 1) {
        setShowMultipleMembersErrorDialog(true);
        return;
      }

      // Get membershipId from the first selected invoice
      const membershipId = selectedInvoices[0]?.membershipId;
      if (!membershipId) {
        throw new Error("Membership ID not found in selected invoices");
      }

      // Store pending invoice IDs
      setPendingInvoiceIds(selectedInvoiceIds);

      // Show loading dialog immediately while checking auth
      setShowGSTDialog(true);
      setGstSubmissionStatus("submitting");
      setIsSubmittingGST(true);
      setGstSubmissionMessage("Connecting to GST portal...");

      // Check authentication first
      let isAuthenticated: boolean;
      try {
        isAuthenticated = await checkAuthBeforeSubmission(membershipId);
        console.log("Auth check result:", isAuthenticated);
      } catch (authError: any) {
        console.error("Error during auth check:", authError);
        // If auth check fails, close dialog and show error
        setShowGSTDialog(false);
        setIsSubmittingGST(false);
        setGstSubmissionStatus(null);
        throw authError; // Re-throw to be caught by outer catch
      }

      // Handle based on auth result
      if (isAuthenticated === true) {
        // Already authenticated, update message and proceed with submission
        console.log("User is authenticated, proceeding with GST submission");
        setGstSubmissionMessage("Submitting invoices to GST portal...");
        await proceedWithGSTSubmission(selectedInvoiceIds);
      } else {
        // OTP required, close GST dialog and show OTP dialog
        console.log("OTP required, showing OTP dialog");
        setShowGSTDialog(false);
        setIsSubmittingGST(false);
        setGstSubmissionStatus(null);
        setShowAuthOtpDialog(true);
      }
    } catch (error: any) {
      console.error("Error in confirmSubmitGST:", error);
      
      // Close GST dialog if it's open
      setShowGSTDialog(false);
      setIsSubmittingGST(false);
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
      } else if (
        error.message &&
        (error.message.includes("READY_TO_FILE") || error.message === "ALREADY_FILED" || error.message === "PENDING_INVOICES")
      ) {
        if (error.message === "ALREADY_FILED") {
          setPendingInvoiceErrorType("filed");
        } else {
          setPendingInvoiceErrorType("pending");
        }
        setShowPendingInvoicesErrorDialog(true);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to proceed with GST submission. Please try again.",
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
      const verifyOtpUrl = `${process.env.NEXT_PUBLIC_GST_BACKEND_URL}/api/verify_username_otp`;
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

        // After successful verification, refresh invoice data to get updated verification status
        // Verification is at member level, so all invoices from that member will be updated
        const verifyingInvoiceId = currentVerifyingInvoiceId;
        setCurrentVerifyingInvoiceId(null);
        
        // Refresh invoice data to reflect updated verification status
        const refreshInvoices = async () => {
          try {
            if (status === "authenticated" && session?.user?.token) {
              const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
              const fullUrl = `${apiUrl}/api/tax_invoice/get_tax_invoice`;
              const updatedResponse = await axios.get(fullUrl, {
                headers: {
                  Authorization: `Bearer ${session.user.token}`,
                },
              });
              
              let responseData;
              if (updatedResponse.data && Array.isArray(updatedResponse.data)) {
                responseData = updatedResponse.data;
              } else if (updatedResponse.data && updatedResponse.data.taxInvoices && Array.isArray(updatedResponse.data.taxInvoices)) {
                responseData = updatedResponse.data.taxInvoices;
              } else if (updatedResponse.data && updatedResponse.data.data && Array.isArray(updatedResponse.data.data)) {
                responseData = updatedResponse.data.data;
              } else {
                responseData = [];
              }
              
              setInvoices(responseData);
            }
          } catch (error) {
            console.error("Error refreshing invoices:", error);
          }
        };
        
        refreshInvoices();
        
        // If this was for a single invoice from dropdown, proceed with submission
        if (verifyingInvoiceId && !selectedInvoiceIds.includes(verifyingInvoiceId)) {
          handleSingleInvoiceGSTSubmit(verifyingInvoiceId);
        }
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
      // Get invoice to find membershipId
      const invoice = invoices.find((inv) => inv.invoiceId === invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Check if invoice is approved
      if (invoice.status !== "APPROVED") {
        setShowApprovalErrorDialog(true);
        return;
      }

      // Check if invoice is already filed
      if (invoice.gstStatus === "FILED") {
        setPendingInvoiceErrorType("filed");
        setShowPendingInvoicesErrorDialog(true);
        return;
      }

      // Check if invoice has gstStatus READY_TO_FILE
      if (invoice.gstStatus !== "READY_TO_FILE") {
        setPendingInvoiceErrorType("pending");
        setShowPendingInvoicesErrorDialog(true);
        return;
      }

      const membershipId = invoice.membershipId;
      if (!membershipId) {
        throw new Error("Membership ID not found in invoice");
      }

      // Store pending invoice IDs
      setPendingInvoiceIds([invoiceId]);

      // Check authentication first
      const isAuthenticated = await checkAuthBeforeSubmission(membershipId);

      if (isAuthenticated) {
        // Already authenticated, proceed directly with submission
        await proceedWithGSTSubmission([invoiceId]);
      } else {
        // OTP required, show OTP dialog
        setShowAuthOtpDialog(true);
      }
    } catch (error: any) {
      console.error("Error in handleSingleInvoiceGSTSubmit:", error);
      
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
      } else if (
        error.message &&
        (error.message.includes("READY_TO_FILE") || error.message === "ALREADY_FILED" || error.message === "PENDING_INVOICES")
      ) {
        if (error.message === "ALREADY_FILED") {
          setPendingInvoiceErrorType("filed");
        } else {
          setPendingInvoiceErrorType("pending");
        }
        setShowPendingInvoicesErrorDialog(true);
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            error.message ||
            "Failed to proceed with GST submission. Please try again.",
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
      <Card className="m-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Search GST Invoices</CardTitle>
                <CardDescription>
                  Select a member and date range to search for invoices
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {selectedInvoiceIds.length > 0 && (session?.user?.role === "ADMIN" || session?.user?.role === "TQMA_EDITOR" || session?.user?.role === "TSMWA_EDITOR") && (
                  <>
                    {needsGstVerification() ? (
                      <Button
                        onClick={handleGstVerification}
                        disabled={isSubmittingGST || isVerifyingUsername || isVerifyingOtp}
                        variant="default"
                      >
                        {isVerifyingUsername || isVerifyingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <CircleCheck className="mr-2 h-4 w-4" />
                            Verify GST ({selectedInvoiceIds.length})
                          </>
                        )}
                      </Button>
                    ) : (
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
                  </>
                )}
              </div>

            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="member-select" className="mb-2 block">
                    Select Member *
                  </Label>
                  <Popover open={memberDropdownOpen} onOpenChange={setMemberDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="member-select"
                        variant="outline"
                        role="combobox"
                        aria-expanded={memberDropdownOpen}
                        className="w-full justify-between"
                      >
                        {selectedMemberId
                          ? (() => {
                              const selectedMember = members.find(
                                (member) => member.membershipId === selectedMemberId
                              );
                              return selectedMember
                                ? `${selectedMember.applicantName} - ${selectedMember.firmName}`
                                : "Select a member";
                            })()
                          : "Select a member"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No members found.</CommandEmpty>
                          <CommandGroup>
                            {members.map((member) => (
                              <CommandItem
                                key={member.membershipId}
                                value={`${member.applicantName} ${member.firmName} ${member.membershipId}`}
                                onSelect={() => {
                                  setSelectedMemberId(member.membershipId);
                                  setMemberDropdownOpen(false);
                                  // Update URL immediately when member changes
                                  updateURL(member.membershipId, dateFilterType, dateRange.from, dateRange.to);
                                }}
                              >
                                {member.applicantName} - {member.firmName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1">
                  <Label htmlFor="date-select" className="mb-2 block">
                    Select Date *
                  </Label>
                  <Select
                    value={dateFilterType}
                    onValueChange={(value) => handleDateFilterTypeChange(value as "lastMonth" | "thisYear" | "custom")}
                  >
                    <SelectTrigger id="date-select">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateFilterType === "custom" && (
                  <div className="flex-1">
                    <Label htmlFor="date-range" className="mb-2 block">
                      Date Range *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-range"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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
                              const newRange = {
                                from: range.from,
                                to: range.to,
                              };
                              setDateRange(newRange);
                              // Update URL immediately when date range changes
                              if (selectedMemberId && range.from && range.to) {
                                updateURL(selectedMemberId, dateFilterType, range.from, range.to);
                              }
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="flex items-end">
                  <Button
                    onClick={() => fetchInvoices(false)}
                    disabled={isLoading || !selectedMemberId || (dateFilterType === "custom" && (!dateRange.from || !dateRange.to))}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        <CardContent>
          {/* Search Card */}
         

         

          {/* Results Table */}
          {hasSearched ? (
            <>
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading invoices...</p>
                  </div>
                </div>
              ) : (
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
                                <Badge variant="destructive">Approval Pending</Badge>
                              )}
                            </TableCell>

                            <TableCell>
                              <Button variant="outline" className="h-8 w-8 p-0 mr-1" onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(invoice.invoiceId);
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="default" className="h-8 w-8 p-0" onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(invoice.id);
                              }}>
                                <Download className="h-4 w-4" />
                              </Button>
                            
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
              )}

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
            </>
          ) : (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Please select a member and date range to search for invoices
                </p>
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
                ? "Please wait while we connect and submit to the GST portal."
                : gstSubmissionStatus === "submitted"
                  ? "GST submission completed."
                  : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {gstSubmissionStatus === "submitting" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">
                  {gstSubmissionMessage || "Processing..."}
                </p>
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
                (gstSubmissionMessage ||
                  `Processing ${pendingInvoiceIds.length > 0 ? pendingInvoiceIds.length : selectedInvoiceIds.length} invoice(s)...`)}
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

      {/* Pending Invoices Error Dialog */}
      <Dialog
        open={showPendingInvoicesErrorDialog}
        onOpenChange={(open) => {
          setShowPendingInvoicesErrorDialog(open);
          if (!open) {
            setPendingInvoiceErrorType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <CircleX className="h-5 w-5" />
              {pendingInvoiceErrorType === "filed" 
                ? "Already Filed" 
                : "Can't Proceed with Pending Invoices"}
            </DialogTitle>
            <DialogDescription>
              {pendingInvoiceErrorType === "filed"
                ? "These invoices have already been filed for GST. You cannot submit them again."
                : "Can't proceed with Pending Invoices. Only invoices with status READY_TO_FILE can be submitted for GST."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setShowPendingInvoicesErrorDialog(false);
              setPendingInvoiceErrorType(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth OTP Dialog (for pre-submission authentication) */}
      <Dialog
        open={showAuthOtpDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAuthOtpDialog(false);
            setAuthOtp("");
            setAuthOtpError("");
            setPendingInvoiceIds([]);
          } else {
            setShowAuthOtpDialog(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCheckingAuth || isVerifyingAuthOtp ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Clock className="h-5 w-5 text-primary" />
              )}
              Authentication Required
            </DialogTitle>
            <DialogDescription>
              {isCheckingAuth
                ? "Checking authentication status..."
                : isVerifyingAuthOtp
                  ? "Verifying OTP..."
                  : "An OTP has been sent to your registered mobile number. Please enter it to continue with GST submission."}
            </DialogDescription>
          </DialogHeader>
          {!isCheckingAuth && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="auth-otp">OTP</Label>
                <Input
                  id="auth-otp"
                  placeholder="Enter 6-digit OTP"
                  value={authOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setAuthOtp(value);
                    setAuthOtpError("");
                  }}
                  maxLength={6}
                  disabled={isVerifyingAuthOtp}
                  className={authOtpError ? "border-destructive" : ""}
                />
                {authOtpError && (
                  <p className="text-sm text-destructive">{authOtpError}</p>
                )}
              </div>
            </div>
          )}
          {isCheckingAuth ? (
            <DialogFooter>
              <Button variant="outline" disabled>
                Please wait...
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAuthOtpDialog(false);
                  setAuthOtp("");
                  setAuthOtpError("");
                  setPendingInvoiceIds([]);
                }}
                disabled={isVerifyingAuthOtp}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAuthOtpVerification}
                disabled={!authOtp || authOtp.length !== 6 || isVerifyingAuthOtp}
              >
                {isVerifyingAuthOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Submit"
                )}
              </Button>
            </DialogFooter>
          )}
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
