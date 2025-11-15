"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Calendar,
  DollarSign,
  Users,
  Truck,
  FileText,
  AlertTriangle,
  Clock,
  CreditCard,
  TrendingUp,
  Bell,
  CheckCircle2,
  ArrowRight,
  Plus,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  Server,
  XCircle,
  RefreshCw,
  Loader2,
  Eye,
  Check,
  X,
  Filter,
  User,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { format, isToday, addDays } from "date-fns";
import {
  fetchHealthCheckData,
  formatBytes,
  formatUptime,
  calculateDiskUsagePercentage,
  calculateMemoryUsagePercentage,
  type HealthCheckResponse,
} from "@/services/health-check";
import { Skeleton } from "../ui/skeleton";
import { renderRoleBasedPath } from "@/lib/utils";

interface DashboardData {
  members: {
    total: number;
    active: number;
    inactive: number;
    cancelled: number;
  };
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    vehiclePaymentsDue: Array<{
      id: number;
      tripId: string;
      vehicleId: string;
      tripDate: string;
      amountPerTrip: number;
      numberOfTrips: number;
      totalAmount: number;
      amountPaid: number;
      balanceAmount: number;
      paymentStatus: string;
      notes: string;
      receiptPath: string | null;
      createdAt: string;
      modifiedAt: string;
      createdBy: number;
      modifiedBy: number;
    }>;
  };
  labour: {
    total: number;
    active: number;
    onBench: number;
    inactive: number;
  };
  membershipFeesDue: any[]; // Will be implemented later
  expiringLisences: Array<{
    id: number;
    documentName: string;
    documentPath: string;
    expiredAt: string;
    members: {
      membershipId: string;
      firmName: string;
      applicantName: string;
    };
  }>;
}

// Pending approval interfaces
interface PendingMemberChange {
  membershipId: string;
  approvalStatus: "APPROVED" | "PENDING" | "DECLINED";
  membershipStatus: "ACTIVE" | "INACTIVE" | "CANCELLED";
  applicantName: string;
  firmName: string;
  phoneNumber1: string;
  phoneNumber2: string;
  createdAt: string;
  updatedAt: string;
  // Add other member fields as needed
}

interface PendingInvoiceChange {
  id: string;
  invoiceId: string;
  membershipId: string;
  invoiceDate: string;
  customerName: string;
  gstInNumber: string;
  billingAddress: string;
  shippingAddress: string;
  eWayNumber: string;
  phoneNumber: string;
  cGSTInPercent: number;
  sGSTInPercent: number;
  iGSTInPercent: number;
  subTotal: string;
  total: string;
  approvalStatus: "APPROVED" | "PENDING" | "DECLINED";
  status: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number | null;
}

export default function DashboardOverview() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pending approvals state
  const [pendingMembers, setPendingMembers] = useState<PendingMemberChange[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoiceChange[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Dialog states
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [showVehicleDuesDialog, setShowVehicleDuesDialog] = useState(false);
  const [showMembershipFeesDialog, setShowMembershipFeesDialog] = useState(false);
  const [showLicensesDialog, setShowLicensesDialog] = useState(false);

  // Approval states
  const [selectedMember, setSelectedMember] = useState<PendingMemberChange | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoiceChange | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineError, setDeclineError] = useState("");

  // Health check state
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(
    null
  );
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    if (sessionStatus !== "authenticated" || !session?.user?.token) {
      return;
    }

    console.log("Session token:", session.user.token);

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/dashboard/get_over_view`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      setDashboardData(response.data);
      console.log("Dashboard data:", response.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    if (sessionStatus !== "authenticated" || !session?.user?.token) {
      return;
    }

    setIsLoadingPending(true);
    try {
      // Fetch all members and filter for pending approvals
      const membersResponse = await axios.get(
        `${process.env.BACKEND_API_URL}/api/member/get_members`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );
      console.log("Members response:", membersResponse.data);

      // Handle different response structures for members
      let allMembers = [];
      if (membersResponse.data && Array.isArray(membersResponse.data)) {
        allMembers = membersResponse.data;
      } else if (membersResponse.data && Array.isArray(membersResponse.data.data)) {
        allMembers = membersResponse.data.data;
      } else if (membersResponse.data && Array.isArray(membersResponse.data.members)) {
        allMembers = membersResponse.data.members;
      }

      // Filter members with pending approval status
      const pendingMembersList = allMembers.filter(
        (member: any) => member.approvalStatus === "PENDING"
      );
      setPendingMembers(pendingMembersList);

      // Fetch all invoices and filter for pending approvals
      const invoicesResponse = await axios.get(
        `${process.env.BACKEND_API_URL}/api/tax_invoice/get_tax_invoice`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      // Handle different response structures for invoices
      let allInvoices = [];
      if (invoicesResponse.data && Array.isArray(invoicesResponse.data)) {
        allInvoices = invoicesResponse.data;
      } else if (invoicesResponse.data && Array.isArray(invoicesResponse.data.taxInvoices)) {
        allInvoices = invoicesResponse.data.taxInvoices;
      } else if (invoicesResponse.data && Array.isArray(invoicesResponse.data.data)) {
        allInvoices = invoicesResponse.data.data;
      }

      // Filter invoices with pending approval status
      const pendingInvoicesList = allInvoices.filter(
        (invoice: any) => invoice.status === "PENDING"
      );
      setPendingInvoices(pendingInvoicesList);

      console.log("Pending members:", pendingMembersList.length);
      console.log("Pending invoices:", pendingInvoicesList.length);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  // Load dashboard data on component mount and session change
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchDashboardData();
      fetchPendingApprovals();
    }
  }, [sessionStatus, session?.user?.token]);

  // Fetch health check data
  useEffect(() => {
    const getHealthData = async () => {
      try {
        setIsHealthLoading(true);
        const data = await fetchHealthCheckData();
        setHealthData(data);
        setHealthError(null);
      } catch (err) {
        setHealthError("Failed to fetch system health data");
        console.error(err);
      } finally {
        setIsHealthLoading(false);
      }
    };

    getHealthData();
  }, []);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    if (status === "Due Today") return "destructive";
    if (status === "Due This Week") return "warning";
    return "secondary";
  };

  // Helper function to render status indicator
  const renderStatusIndicator = (isOk: boolean) => {
    return isOk ? (
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        <span className="text-green-600 font-medium">Operational</span>
      </div>
    ) : (
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
        <span className="text-red-600 font-medium">Issue Detected</span>
      </div>
    );
  };

  // Approval/Decline functions
  const handleMemberApproved = async (memberId: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/approve_decline_member`,
        {
          membershipId: memberId,
          action: "APPROVED"
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Member approved successfully",
        });
        fetchPendingApprovals(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error approving member:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve member",
        variant: "destructive",
      });
    }
  };

  const handleMemberDeclined = async (memberId: string, declineReason: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/approve_decline_member`,
        {
          membershipId: memberId,
          action: "DECLINED",
          declineReason
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Member declined successfully",
        });
        fetchPendingApprovals(); // Refresh the list
        return true;
      }
    } catch (error: any) {
      console.error("Error declining member:", error);
      setDeclineError(error.response?.data?.message || "Failed to decline member");
      return false;
    }
    return false;
  };

  const handleInvoiceApproved = async (invoiceId: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
        {
          id: invoiceId,
          action: "APPROVED",
          note: "Approved by admin"
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Invoice approved successfully",
        });
        fetchPendingApprovals(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error approving invoice:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve invoice",
        variant: "destructive",
      });
    }
  };

  const handleInvoiceDeclined = async (invoiceId: string, declineNote: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
        {
          id: invoiceId,
          action: "DECLINED",
          note: declineNote
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Invoice declined successfully",
        });
        fetchPendingApprovals(); // Refresh the list
        return true;
      }
    } catch (error: any) {
      console.error("Error declining invoice:", error);
      setDeclineError(error.response?.data?.message || "Failed to decline invoice");
      return false;
    }
    return false;
  };

  const handleDeclineSubmit = async () => {
    setIsProcessing(true);
    setDeclineError("");

    let success = false;
    if (selectedMember) {
      success = await handleMemberDeclined(selectedMember.membershipId, declineReason);
    } else if (selectedInvoice) {
      success = await handleInvoiceDeclined(selectedInvoice.id, declineReason);
    }

    if (success) {
      setShowDeclineDialog(false);
      setDeclineReason("");
      setSelectedMember(null);
      setSelectedInvoice(null);
    }

    setIsProcessing(false);
  };

  // Function to refresh health data
  const refreshHealthData = async () => {
    try {
      setIsHealthLoading(true);
      const data = await fetchHealthCheckData();
      setHealthData(data);
      setHealthError(null);
    } catch (err) {
      setHealthError("Failed to fetch system health data");
      console.error(err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  // Refresh dashboard data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStatus === "authenticated") {
        fetchDashboardData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [sessionStatus]);

  const navigateToSection = (path: string) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">No dashboard data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name?.split(" ")[0]}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={() => navigateToSection(`/${renderRoleBasedPath(session?.user?.role)}/analytics`)}>
            <TrendingUp className="mr-2 h-4 w-4" /> View Analytics
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dues">Dues & Payments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.members.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.members.active} active,{" "}
                  {dashboardData.members.inactive} inactive
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vehicles
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.vehicles.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.vehicles.active} active,{" "}
                  {dashboardData.vehicles.maintenance} in maintenance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Labour
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.labour.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.labour.active} active,{" "}
                  {dashboardData.labour.onBench} on bench
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Fees
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ₹{dashboardData.membershipFeesDue.reduce((sum, fee) => {
                    const dueAmt = parseFloat(fee.dueAmount || "0");
                    return sum + dueAmt;
                  }, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.membershipFeesDue.length} pending payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Membership Fees Due</CardTitle>
                <CardDescription>Fees due this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.membershipFeesDue.length > 0 ? (
                    dashboardData.membershipFeesDue.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{fee.members?.firmName || fee.members?.applicantName || "Unknown Member"}</span>
                          <span className="text-sm text-muted-foreground">
                            Due: {fee.toDate && !isNaN(new Date(fee.toDate).getTime()) 
                              ? format(new Date(fee.toDate), "MMM dd, yyyy")
                              : fee.fromDate && !isNaN(new Date(fee.fromDate).getTime())
                              ? format(new Date(fee.fromDate), "MMM dd, yyyy")
                              : "Date not available"
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{(fee.dueAmount || fee.totalAmount || 0).toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() =>
                              navigateToSection(
                                `/${renderRoleBasedPath(session?.user?.role)}/membership-fees/${fee.billingId}/edit`
                              )
                            }
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No fees due this month
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowMembershipFeesDialog(true)}
                >
                  View All Fees
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Licenses Expiring Soon</CardTitle>
                <CardDescription>Expiring in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.expiringLisences.length > 0 ? (
                    dashboardData.expiringLisences.map((license, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{license.documentName}</span>
                          <span className="text-sm text-muted-foreground">
                            {license.members.applicantName} • Expires:{" "}
                            {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) 
                              ? format(new Date(license.expiredAt), "MMM dd")
                              : "Invalid Date"
                            }
                          </span>
                        </div>
                        <Badge
                          variant={
                            license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                            new Date(license.expiredAt) < addDays(new Date(), 7)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                           new Date(license.expiredAt) < addDays(new Date(), 7)
                            ? "Urgent"
                            : "Soon"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No licenses expiring soon
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLicensesDialog(true)}
                >
                  View All Licenses
                </Button>
              </CardFooter>
            </Card>

            {/* Pending Approvals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pending Member Approvals
                </CardTitle>
                <CardDescription>
                  {pendingMembers.length} members waiting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingPending ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : pendingMembers.length > 0 ? (
                    pendingMembers.slice(0, 5).map((member, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.applicantName || member.membershipId}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {member.firmName} •{" "}
                            {format(new Date(member.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {session?.user?.role === "ADMIN" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleMemberApproved(member.membershipId)}
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowDeclineDialog(true);
                              }}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No pending member approvals
                    </p>
                  )}
                </div>
              </CardContent>
              {pendingMembers.length > 5 && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowMembersDialog(true)}
                  >
                    View All ({pendingMembers.length})
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-500" />
                  Pending Invoice Approvals
                </CardTitle>
                <CardDescription>
                  {pendingInvoices.length} invoices waiting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingPending ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : pendingInvoices.length > 0 ? (
                    pendingInvoices.slice(0, 5).map((invoice, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Invoice #{invoice.invoiceId}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Customer: {invoice.customerName || "Unknown"} •{" "}
                            {format(new Date(invoice.modifiedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {session?.user?.role === "ADMIN" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleInvoiceApproved(invoice.id)}
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDeclineDialog(true);
                              }}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No pending invoice approvals
                    </p>
                  )}
                </div>
              </CardContent>
              {pendingInvoices.length > 5 && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowInvoicesDialog(true)}
                  >
                    View All ({pendingInvoices.length})
                  </Button>
                </CardFooter>
              )}
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="dues" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vehicle Dues
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ₹{dashboardData.vehicles.vehiclePaymentsDue.reduce((sum, payment) => sum + payment.balanceAmount, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all vehicles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vehicle Payments
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{dashboardData.vehicles.vehiclePaymentsDue.reduce((sum, payment) => sum + payment.balanceAmount, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.vehicles.vehiclePaymentsDue.length} pending payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Membership Fees
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{dashboardData && dashboardData.membershipFeesDue && dashboardData.membershipFeesDue.length > 0
                    ? dashboardData.membershipFeesDue.reduce((sum, fee) => {
                        const dueAmt = parseFloat(fee.dueAmount || "0");
                        return sum + dueAmt;
                      }, 0).toLocaleString()
                    : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.membershipFeesDue.length} pending payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Payments Due</CardTitle>
                <CardDescription>
                  Vehicle payments that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.vehicles.vehiclePaymentsDue.length > 0 ? (
                    dashboardData.vehicles.vehiclePaymentsDue.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {payment.tripId}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {payment.vehicleId} • Due:{" "}
                            {payment.tripDate && !isNaN(new Date(payment.tripDate).getTime()) 
                              ? format(new Date(payment.tripDate), "MMM dd")
                              : "Invalid Date"
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{payment.balanceAmount.toLocaleString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() =>
                              navigateToSection(
                                `/${renderRoleBasedPath(session?.user?.role)}/vehicle/${payment.vehicleId}`
                              )
                            }
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No vehicle payments due
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowVehicleDuesDialog(true)}
                >
                  View All Vehicle Dues
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Fees Due</CardTitle>
                <CardDescription>
                  Fees that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.membershipFeesDue.length > 0 ? (
                    dashboardData.membershipFeesDue.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {fee.members?.firmName || fee.members?.applicantName || fee.memberName || "Unknown Member"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Period: {fee.fromDate && !isNaN(new Date(fee.fromDate).getTime()) 
                              ? format(new Date(fee.fromDate), "MMM dd, yyyy")
                              : fee.toDate && !isNaN(new Date(fee.toDate).getTime())
                              ? format(new Date(fee.toDate), "MMM dd, yyyy")
                              : "Date not available"
                            }{" "}
                            - {fee.toDate && !isNaN(new Date(fee.toDate).getTime()) 
                              ? format(new Date(fee.toDate), "MMM dd, yyyy")
                              : fee.fromDate && !isNaN(new Date(fee.fromDate).getTime())
                              ? format(new Date(fee.fromDate), "MMM dd, yyyy")
                              : "Date not available"
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{parseFloat(fee.dueAmount || "0").toLocaleString()}
                          </span>
                          {(session?.user?.role === "ADMIN" ||
                            session?.user?.role === "TSMWA_EDITOR" ||
                            session?.user?.role === "TQMA_EDITOR") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              onClick={() =>
                                router.push(
                                  `/${renderRoleBasedPath(session?.user?.role)}/membership-fees/${fee.billingId}/edit`
                                )
                              }
                            >
                              Collect
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No fees due today
                    </p>
                  )}
                </div>
              </CardContent>
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "TSMWA_EDITOR" ||
                session?.user?.role === "TQMA_EDITOR") && (
                <CardFooter>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/${renderRoleBasedPath(session?.user?.role)}/membership-fees/add`
                      )
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add New Fee
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
                <CardDescription>
                  Licenses and documents due for renewal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.expiringLisences.length > 0 ? (
                    dashboardData.expiringLisences.map((license, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{license.documentName}</span>
                          <span className="text-sm text-muted-foreground">
                            {license.members.applicantName} • Expires:{" "}
                            {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) 
                              ? format(new Date(license.expiredAt), "MMM dd")
                              : "Invalid Date"
                            }
                          </span>
                        </div>
                        <Badge
                          variant={
                            license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                            new Date(license.expiredAt) < addDays(new Date(), 7)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                           new Date(license.expiredAt) < addDays(new Date(), 7)
                            ? "Urgent"
                            : "Soon"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No upcoming renewals
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLicensesDialog(true)}
                >
                  View All Licenses
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground py-4">
                    No upcoming meetings
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigateToSection(`/${renderRoleBasedPath(session?.user?.role)}/meetings/add`)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshHealthData}
                disabled={isHealthLoading}
                title="Refresh system status"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isHealthLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </CardHeader>
            <CardContent>
              {healthError ? (
                <div className="flex items-center justify-center p-4 text-destructive">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span>{healthError}</span>
                </div>
              ) : isHealthLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : healthData ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">API Status</span>
                    </div>
                    <Badge
                      variant={
                        healthData.status === "OK" ? "outline" : "destructive"
                      }
                      className={
                        healthData.status === "OK" ? "bg-green-50" : ""
                      }
                    >
                      {healthData.status}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connection</span>
                      {renderStatusIndicator(healthData.db.ok)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {healthData.db.message}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Redis</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connection</span>
                      {renderStatusIndicator(healthData.redis.ok)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {healthData.redis.message}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Disk Usage</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Status</span>
                      {renderStatusIndicator(healthData.disk.ok)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Free</span>
                        <span>{formatBytes(healthData.disk.free)}</span>
                      </div>
                      <Progress
                        value={calculateDiskUsagePercentage(
                          healthData.disk.total - healthData.disk.free,
                          healthData.disk.total
                        )}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total</span>
                        <span>{formatBytes(healthData.disk.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MemoryStick className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Heap Used</span>
                        <span>
                          {formatBytes(healthData.memoryUsage.heapUsed)}
                        </span>
                      </div>
                      <Progress
                        value={calculateMemoryUsagePercentage(
                          healthData.memoryUsage.heapUsed,
                          healthData.memoryUsage.heapTotal
                        )}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Heap Total
                        </span>
                        <span>
                          {formatBytes(healthData.memoryUsage.heapTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <div className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">
                          Load Average
                        </span>
                        <span>{healthData.cpuUsage.loadavg.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU Count</span>
                        <span>{healthData.cpuUsage.cpus.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Environment</span>
                      <Badge variant="outline">{healthData.environment}</Badge>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-muted-foreground">Uptime</span>
                      <span>{formatUptime(healthData.uptime)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-muted-foreground">
                        Last Updated
                      </span>
                      <span>
                        {format(
                          new Date(healthData.timestamp),
                          "dd MMM yyyy HH:mm:ss"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  No system health data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View All Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Pending Member Approvals</DialogTitle>
            <DialogDescription>
              {pendingMembers.length} members waiting for approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingMembers.map((member, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-3 last:border-0"
              >
                                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {member.applicantName || member.membershipId}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {member.firmName} •{" "}
                                    {format(new Date(member.createdAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                                            {session?.user?.role === "ADMIN" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleMemberApproved(member.membershipId)}
                                  disabled={isProcessing}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowDeclineDialog(true);
                                    setShowMembersDialog(false);
                                  }}
                                  disabled={isProcessing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Invoices Dialog */}
      <Dialog open={showInvoicesDialog} onOpenChange={setShowInvoicesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Pending Invoice Approvals</DialogTitle>
            <DialogDescription>
              {pendingInvoices.length} invoices waiting for approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingInvoices.map((invoice, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-3 last:border-0"
              >
                                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    Invoice #{invoice.invoiceId}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    Customer: {invoice.customerName || "Unknown"} •{" "}
                                    {format(new Date(invoice.modifiedAt), "MMM dd, yyyy")}
                                  </span>
                                </div>
                                            {session?.user?.role === "ADMIN" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleInvoiceApproved(invoice.id)}
                                  disabled={isProcessing}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowDeclineDialog(true);
                                    setShowInvoicesDialog(false);
                                  }}
                                  disabled={isProcessing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Vehicle Dues Dialog */}
      <Dialog open={showVehicleDuesDialog} onOpenChange={setShowVehicleDuesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Vehicle Payment Dues</DialogTitle>
            <DialogDescription>
              {dashboardData?.vehicles.vehiclePaymentsDue.length || 0} vehicle payments due
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dashboardData?.vehicles.vehiclePaymentsDue.map((payment, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-3 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {payment.tripId}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {payment.vehicleId} • Due:{" "}
                    {payment.tripDate && !isNaN(new Date(payment.tripDate).getTime()) 
                      ? format(new Date(payment.tripDate), "MMM dd, yyyy")
                      : "Invalid Date"
                    }
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-destructive">
                    ₹{payment.balanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Membership Fees Dialog */}
      <Dialog open={showMembershipFeesDialog} onOpenChange={setShowMembershipFeesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Membership Fees Due</DialogTitle>
            <DialogDescription>
              {dashboardData?.membershipFeesDue.length || 0} membership fees due
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dashboardData?.membershipFeesDue.map((fee, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-3 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {fee.members?.firmName || fee.members?.applicantName || "Unknown Member"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Due: {fee.toDate && !isNaN(new Date(fee.toDate).getTime()) 
                      ? format(new Date(fee.toDate), "MMM dd, yyyy")
                      : fee.fromDate && !isNaN(new Date(fee.fromDate).getTime())
                      ? format(new Date(fee.fromDate), "MMM dd, yyyy")
                      : "Date not available"
                    }
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-destructive">
                    ₹{(fee.dueAmount || fee.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Licenses Dialog */}
      <Dialog open={showLicensesDialog} onOpenChange={setShowLicensesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Expiring Licenses</DialogTitle>
            <DialogDescription>
              {dashboardData?.expiringLisences.length || 0} licenses expiring soon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dashboardData?.expiringLisences.map((license, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-3 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {license.documentName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {license.members.applicantName} • Expires:{" "}
                    {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) 
                      ? format(new Date(license.expiredAt), "MMM dd, yyyy")
                      : "Invalid Date"
                    }
                  </span>
                </div>
                <Badge
                  variant={
                    license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                    new Date(license.expiredAt) < addDays(new Date(), 7)
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {license.expiredAt && !isNaN(new Date(license.expiredAt).getTime()) &&
                   new Date(license.expiredAt) < addDays(new Date(), 7)
                    ? "Urgent"
                    : "Soon"}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter decline reason..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
            {declineError && (
              <p className="text-sm text-destructive">{declineError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setDeclineReason("");
                setSelectedMember(null);
                setSelectedInvoice(null);
                setDeclineError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineSubmit}
              disabled={isProcessing || !declineReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Decline"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
