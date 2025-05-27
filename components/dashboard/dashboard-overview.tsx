"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

import { getDashboardData } from "@/data/dashboard";
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

export default function DashboardOverview() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(() => getDashboardData());
  const [activeTab, setActiveTab] = useState("overview");

  // Health check state
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch health check data
  useEffect(() => {
    const getHealthData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHealthCheckData();
        setHealthData(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch system health data");
        console.error(err);
      } finally {
        setIsLoading(false);
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
      setIsLoading(true);
      const data = await fetchHealthCheckData();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch system health data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(getDashboardData());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const navigateToSection = (path: string) => {
    router.push(path);
  };

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
                  {dashboardData.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.activeMembers} active,{" "}
                  {dashboardData.inactiveMembers} inactive
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
                  {dashboardData.totalVehicles}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.activeVehicles} active,{" "}
                  {dashboardData.maintenanceVehicles} in maintenance
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
                  {dashboardData.totalLabour}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.activeLabour} active,{" "}
                  {dashboardData.benchLabour} on bench
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
                  ₹{dashboardData.pendingFees.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.pendingFeesCount} pending payments
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
                  {dashboardData.dueFeesThisMonth.length > 0 ? (
                    dashboardData.dueFeesThisMonth.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{fee.memberName}</span>
                          <span className="text-sm text-muted-foreground">
                            Due: {format(new Date(fee.dueDate), "MMM dd")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{fee.amount.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() =>
                              navigateToSection(
                                `/admin/membership-fees/${fee.id}`
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
                  {dashboardData.expiringLicenses.length > 0 ? (
                    dashboardData.expiringLicenses.map((license, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{license.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {license.memberName} • Expires:{" "}
                            {format(new Date(license.expiryDate), "MMM dd")}
                          </span>
                        </div>
                        <Badge
                          variant={
                            new Date(license.expiryDate) <
                            addDays(new Date(), 7)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {new Date(license.expiryDate) < addDays(new Date(), 7)
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

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Maintenance</CardTitle>
                <CardDescription>Vehicles due for maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.vehiclesDueForMaintenance.length > 0 ? (
                    dashboardData.vehiclesDueForMaintenance.map(
                      (vehicle, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center border-b pb-3 last:border-0"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {vehicle.vehicleNumber}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {vehicle.driverName} • Due:{" "}
                              {format(
                                new Date(vehicle.maintenanceDate),
                                "MMM dd"
                              )}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() =>
                              navigateToSection(`/admin/vehicles/${vehicle.id}`)
                            }
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No vehicles due for maintenance
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
          </div>
        </TabsContent>

        <TabsContent value="dues" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Dues
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ₹
                  {(
                    dashboardData.pendingFees + dashboardData.pendingVehicleDues
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all categories
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
                  ₹{dashboardData.pendingFees.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.pendingFeesCount} pending payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vehicle Dues
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{dashboardData.pendingVehicleDues.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.pendingVehicleDuesCount} pending payments
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
                  {dashboardData.collectionRate}%
                </div>
                <Progress
                  value={dashboardData.collectionRate}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Membership Fees Due Today</CardTitle>
                <CardDescription>
                  Fees that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.dueFeesToday.length > 0 ? (
                    dashboardData.dueFeesToday.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{fee.memberName}</span>
                          <span className="text-sm text-muted-foreground">
                            Period: {format(new Date(fee.periodFrom), "MMM dd")}{" "}
                            - {format(new Date(fee.periodTo), "MMM dd")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{fee.amount.toLocaleString()}
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

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Payments Due</CardTitle>
                <CardDescription>
                  Vehicle payments that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.dueVehiclePayments.length > 0 ? (
                    dashboardData.dueVehiclePayments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {payment.vehicleNumber}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {payment.driverName} • Due:{" "}
                            {format(new Date(payment.dueDate), "MMM dd")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            ₹{payment.amount.toLocaleString()}
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
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingMeetings.length > 0 ? (
                    dashboardData.upcomingMeetings.map((meeting, index) => (
                      <div
                        key={index}
                        className="flex flex-col space-y-1 border-b pb-3 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{meeting.title}</span>
                          <Badge
                            variant={
                              isToday(new Date(meeting.date))
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {isToday(new Date(meeting.date))
                              ? "Today"
                              : format(new Date(meeting.date), "MMM dd")}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" /> {meeting.time}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-1 h-3 w-3" />{" "}
                          {meeting.expectedAttendees} attendees
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No upcoming meetings
                    </p>
                  )}
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

            {/* <Card>
              <CardHeader>
                <CardTitle>GST Filings Due</CardTitle>
                <CardDescription>Upcoming GST filings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingGstFilings.length > 0 ? (
                    dashboardData.upcomingGstFilings.map((filing, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {filing.memberName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Period: {filing.filingPeriod} • Due:{" "}
                            {format(new Date(filing.dueDate), "MMM dd")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() =>
                            navigateToSection(`/admin/gst-filings/${filing.id}`)
                          }
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No upcoming GST filings
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateToSection("/admin/gst-filings")}
                >
                  View All GST Filings
                </Button>
              </CardFooter>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
                <CardDescription>
                  Licenses and documents due for renewal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.expiringLicenses.length > 0 ? (
                    dashboardData.expiringLicenses.map((license, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-3 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{license.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {license.memberName} • Expires:{" "}
                            {format(new Date(license.expiryDate), "MMM dd")}
                          </span>
                        </div>
                        <Badge
                          variant={
                            new Date(license.expiryDate) <
                            addDays(new Date(), 7)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {new Date(license.expiryDate) < addDays(new Date(), 7)
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
                disabled={isLoading}
                title="Refresh system status"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex items-center justify-center p-4 text-destructive">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              ) : isLoading ? (
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
