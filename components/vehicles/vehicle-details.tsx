"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Truck,
  Edit,
  ArrowLeft,
  Plus,
  DollarSign,
  BarChart,
  CircleCheckBig,
  Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Vehicle } from "@/data/vehicles";
import {
  getTripsByVehicleId,
  deleteTrip,
  getTripStatistics,
  getTripsByDateRange,
} from "@/data/vehicles";
import { getRouteById } from "@/data/routes";
import { DateRangePicker } from "@/components/vehicles/date-range-picker";
import { format, subDays } from "date-fns";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { VehicleOverviewPaymentStatusCard } from "./vehicleOverviewPaymentStatusCard";
import { MonthlyTripStatusChart } from "./monthlyTripStatusChart";

interface VehicleDetailsProps {
  vehicle: Vehicle;
}

export default function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const router = useRouter();
  const [trips, setTrips] = useState(() => getTripsByVehicleId(vehicle.id));
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [filteredTrips, setFilteredTrips] = useState(trips);
  const [statistics, setStatistics] = useState(() =>
    getTripStatistics(vehicle.id)
  );

  // Update filtered trips when date range changes
  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const filtered = getTripsByDateRange(fromDate, toDate, vehicle.id);
      setFilteredTrips(filtered);
    }
  }, [dateRange, vehicle.id]);

  const handleEdit = () => {
    router.push(`/admin/vehicle/${vehicle.id}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/vehicle");
  };

  const handleAddTrip = () => {
    router.push(`/admin/vehicle/${vehicle.id}/add-trip`);
  };

  const handleEditTrip = (tripId: string) => {
    router.push(`/admin/vehicle/${vehicle.id}/edit-trip/${tripId}`);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this trip? This action cannot be undone."
      )
    ) {
      deleteTrip(tripId);
      const updatedTrips = getTripsByVehicleId(vehicle.id);
      setTrips(updatedTrips);
      setFilteredTrips(updatedTrips);
      setStatistics(getTripStatistics(vehicle.id));
    }
  };

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#FFBB28", "#FF8042"];

  return (
    <div className="container mx-auto p-6">
      {/* <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Vehicle Details</h1>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit Vehicle
        </Button>
      </div> */}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Truck className="mr-2 h-5 w-5" /> {vehicle.vehicleNumber}
                </CardTitle>
                <CardDescription>Driver: {vehicle.driverName}</CardDescription>
              </div>
              <Badge
                variant={
                  vehicle.status === "active"
                    ? "default"
                    : vehicle.status === "maintenance"
                    ? "secondary"
                    : "destructive"
                }
              >
                {vehicle.status.charAt(0).toUpperCase() +
                  vehicle.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Driver Phone: {vehicle.driverNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Owner: {vehicle.ownerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Added on: {new Date(vehicle.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Owner Phone: {vehicle.ownerPhoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Last Updated:{" "}
                    {new Date(vehicle.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Trips
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalTrips}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.todayTrips} today, {statistics.yesterdayTrips}{" "}
                    yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Amount
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{statistics.totalAmountToPay}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lifetime earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Amount Paid
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{statistics.totalAmountPaid}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (statistics.totalAmountPaid /
                        statistics.totalAmountToPay) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Outstanding Dues
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    ₹{statistics.totalDues}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (statistics.totalDues / statistics.totalAmountToPay) *
                      100
                    ).toFixed(1)}
                    % of total
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4">
              <MonthlyTripStatusChart />
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trip History (Last 7 Days)</CardTitle>
                  <CardDescription>Number of trips per day</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={statistics.tripsByDate}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Number of Trips"
                        fill="#8884d8"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <VehicleOverviewPaymentStatusCard
                totalAmountPaid={statistics.totalAmountPaid}
                totalAmountToPay={statistics.totalAmountToPay}
                totalDues={statistics.totalDues}
              />
            </div>
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trip History</CardTitle>
                  <CardDescription>
                    All trips made by this vehicle
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <DateRangePicker
                    date={dateRange || { from: undefined, to: undefined }}
                    onDateChange={(newRange: any) => {
                      if (newRange?.from && newRange?.to) {
                        setDateRange(newRange);
                      } else if (newRange?.from) {
                        setDateRange({
                          from: newRange.from,
                          to: newRange.from,
                        });
                      } else {
                        setDateRange({
                          from: subDays(new Date(), 30),
                          to: new Date(),
                        });
                      }
                    }}
                  />
                  <Button onClick={handleAddTrip}>
                    <Plus className="mr-2 h-4 w-4" /> Add Trip
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTrips.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rounds</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">
                            {trip.id}
                          </TableCell>
                          <TableCell>
                            {new Date(trip.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{trip.totalRounds}</TableCell>
                          <TableCell>₹{trip.totalAmountToPay}</TableCell>
                          <TableCell>₹{trip.amountPaid}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trip.paymentStatus === "paid"
                                  ? "default"
                                  : trip.paymentStatus === "partial"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {trip.paymentStatus.charAt(0).toUpperCase() +
                                trip.paymentStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTrip(trip.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteTrip(trip.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No trips found for the selected date range.
                    </p>
                    <Button onClick={handleAddTrip} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Add Trip
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTrips.length} trips
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
                <CardDescription>
                  Record of all maintenance activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No maintenance records available.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
