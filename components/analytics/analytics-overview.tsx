"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  Car,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  Calendar,
} from "lucide-react";
import { format, subMonths, subYears, startOfMonth, startOfYear } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/vehicles/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Area,
  AreaChart,
} from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalCollectedAmount: number;
  collectionRate: number;
  totalDueAmount: number;
  members: {
    newMembersCont: number;
    membersJoinCountByMonth: Array<{
      month_year: string;
      count: string;
    }>;
    memberCountsByStatus: Array<{
      _count: {
        id: number;
      };
      membershipStatus: string;
    }>;
  };
  vehicles: {
    vehicleCountsByStatus: Array<{
      _count: {
        id: number;
      };
      status: string;
    }>;
    tripsTotalAmount: number;
    tripsAmountPaid: number;
    tripsBalanceAmount: number;
    monthlyStats: Array<{
      monthYear: string;
      numberOfTrips: number;
      totalAmount: number;
      amountPaid: number;
      balanceAmount: number;
    }>;
  };
  labours: {
    activeLaboursCount: number;
    inactiveLaboursCount: number;
    onBenchLaboursCount: number;
    monthlyStatusMap: Record<string, any>;
    memberCounts: Record<string, any>;
  };
}

export default function AnalyticsOverview() {
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });
  const [timeFrame, setTimeFrame] = useState("6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  // Fetch analytics data from API
  const fetchAnalyticsData = async (startDate: Date, endDate: Date) => {
    if (sessionStatus !== "authenticated" || !session?.user?.token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/analytics/get_analysis`,
        {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      setAnalyticsData(response.data);
      console.log("Analytics data:", response.data);
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data");
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and session change
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchAnalyticsData(dateRange.from, dateRange.to);
    }
  }, [sessionStatus, session?.user?.token]);

  // Update date range based on timeframe selection
  const updateTimeFrame = (value: string) => {
    setTimeFrame(value);
    let from = new Date();
    const to = new Date();

    switch (value) {
      case "30days":
        from = subMonths(new Date(), 1);
        break;
      case "3months":
        from = subMonths(new Date(), 3);
        break;
      case "6months":
        from = subMonths(new Date(), 6);
        break;
      case "1year":
        from = subYears(new Date(), 1);
        break;
      case "ytd":
        from = startOfYear(new Date());
        break;
      case "mtd":
        from = startOfMonth(new Date());
        break;
      default:
        from = subMonths(new Date(), 6);
    }

    setDateRange({ from, to });
    fetchAnalyticsData(from, to);
  };

  // Update analytics data when date range changes
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      fetchAnalyticsData(range.from, range.to);
      setTimeFrame("custom");
    }
  };

  // Prepare chart data from API response
  const prepareChartData = () => {
    if (!analyticsData) return {
      memberGrowthData: [],
      memberStatusData: [],
      vehicleStatusData: [],
      vehicleMonthlyData: [],
      labourStatusData: [],
    };

    // Member growth data
    const memberGrowthData = analyticsData.members.membersJoinCountByMonth.map(item => ({
      month: item.month_year,
      count: parseInt(item.count),
    }));

    // Member status data
    const memberStatusData = analyticsData.members.memberCountsByStatus.map(item => ({
      name: item.membershipStatus,
      value: item._count.id,
    }));

    // Vehicle status data
    const vehicleStatusData = analyticsData.vehicles.vehicleCountsByStatus.map(item => ({
      name: item.status,
      value: item._count.id,
    }));

    // Vehicle monthly stats
    const vehicleMonthlyData = analyticsData.vehicles.monthlyStats.map(item => ({
      month: item.monthYear,
      trips: item.numberOfTrips,
      revenue: item.totalAmount,
      collected: item.amountPaid,
      balance: item.balanceAmount,
    }));

    // Labour status data
    const labourStatusData = [
      { name: "Active", value: analyticsData.labours.activeLaboursCount },
      { name: "Inactive", value: analyticsData.labours.inactiveLaboursCount },
      { name: "On Bench", value: analyticsData.labours.onBenchLaboursCount },
    ].filter(item => item.value > 0);

    return {
      memberGrowthData,
      memberStatusData,
      vehicleStatusData,
      vehicleMonthlyData,
      labourStatusData,
    };
  };

  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading analytics data...</p>
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
            <Button onClick={() => fetchAnalyticsData(dateRange.from, dateRange.to)}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive data analysis and insights
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Select value={timeFrame} onValueChange={updateTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last 1 Year</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          date={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analyticsData.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center pt-1">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm">
                ₹{analyticsData.totalCollectedAmount.toLocaleString()} collected
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.collectionRate.toFixed(2)}%
            </div>
            <Progress value={analyticsData.collectionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              ₹{analyticsData.totalDueAmount.toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.members.newMembersCont}</div>
            <div className="flex items-center pt-1">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm">
                This period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labour</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.labours.activeLaboursCount}</div>
            <div className="flex items-center pt-1">
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {analyticsData.labours.onBenchLaboursCount} Bench
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {analyticsData.labours.inactiveLaboursCount} Inactive
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="labour">Labour</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Total vs Collected Revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Revenue",
                        total: analyticsData.totalRevenue,
                        collected: analyticsData.totalCollectedAmount,
                        due: analyticsData.totalDueAmount,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total Revenue" fill="#0088FE" />
                    <Bar dataKey="collected" name="Collected" fill="#00C49F" />
                    <Bar dataKey="due" name="Due" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Rate</CardTitle>
                <CardDescription>Payment collection efficiency</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#00C49F"
                        strokeWidth="3"
                        strokeDasharray={`${analyticsData.collectionRate}, 100`}
                      />
                    </svg>
                                         <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-2xl font-bold">{analyticsData.collectionRate.toFixed(2)}%</span>
                     </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Collection Rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Trip Revenue</CardTitle>
              <CardDescription>Monthly revenue from vehicle trips</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.vehicleMonthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#0088FE" />
                  <Bar dataKey="collected" name="Collected" fill="#00C49F" />
                  <Bar dataKey="balance" name="Balance" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
                <CardDescription>New members over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.memberGrowthData || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="New Members"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Status Distribution</CardTitle>
                <CardDescription>Members by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.memberStatusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(chartData.memberStatusData || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Status Distribution</CardTitle>
                <CardDescription>Vehicles by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.vehicleStatusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(chartData.vehicleStatusData || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Trip Statistics</CardTitle>
                <CardDescription>Monthly trip performance</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData.vehicleMonthlyData || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="trips"
                      name="Number of Trips"
                      stroke="#0088FE"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Revenue Summary</CardTitle>
              <CardDescription>Revenue breakdown for vehicle operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{analyticsData.vehicles.tripsTotalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{analyticsData.vehicles.tripsAmountPaid.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{analyticsData.vehicles.tripsBalanceAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Balance Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labour" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Labour Status Distribution</CardTitle>
                <CardDescription>Labour by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.labourStatusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(chartData.labourStatusData || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Labour Summary</CardTitle>
                <CardDescription>Labour workforce overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium">Active Labour</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.labours.activeLaboursCount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium">On Bench</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {analyticsData.labours.onBenchLaboursCount}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <UserX className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium">Inactive</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {analyticsData.labours.inactiveLaboursCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
