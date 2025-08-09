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

export default function DashboardOverview() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load dashboard data on component mount and session change
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchDashboardData();
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
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={() => navigateToSection("/admin/analytics")}>
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
                  ₹{dashboardData.membershipFeesDue.reduce((sum, fee) => sum + (fee.amount || 0), 0).toLocaleString()}
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
                                `/admin/membership-fees/${fee.billingId}/edit`
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
                  onClick={() => navigateToSection("/admin/membership-fees")}
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
                  onClick={() => navigateToSection("/admin/licenses")}
                >
                  View All Licenses
                </Button>
              </CardFooter>
            </Card>


          </div>
        </TabsContent>

        <TabsContent value="dues" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  ₹0
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.membershipFeesDue.length} pending payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Collection Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  0%
                </div>
                <Progress
                  value={0}
                  className="mt-2"
                />
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
                                `/admin/vehicles/${payment.vehicleId}`
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
                  onClick={() => navigateToSection("/admin/vehicles")}
                >
                  View All Vehicles
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
                          <span className="font-medium">{fee.memberName}</span>
                          <span className="text-sm text-muted-foreground">
                            Period: {fee.periodFrom && !isNaN(new Date(fee.periodFrom).getTime()) 
                              ? format(new Date(fee.periodFrom), "MMM dd")
                              : "Invalid Date"
                            }{" "}
                            - {fee.periodTo && !isNaN(new Date(fee.periodTo).getTime()) 
                              ? format(new Date(fee.periodTo), "MMM dd")
                              : "Invalid Date"
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{(fee.amount || 0).toLocaleString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() =>
                              navigateToSection(
                                `/admin/membership-fees/edit/${fee.id}`
                              )
                            }
                          >
                            Collect
                          </Button>
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
              <CardFooter>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    navigateToSection("/admin/membership-fees/add")
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add New Fee
                </Button>
              </CardFooter>
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
                  onClick={() => navigateToSection("/admin/licenses")}
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
                  onClick={() => navigateToSection("/admin/meetings/add")}
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
    </div>
  );
}
