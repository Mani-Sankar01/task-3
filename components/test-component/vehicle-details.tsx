"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ArrowLeft,
  BarChart,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Phone,
  Plus,
  Truck,
  User,
  UserCog2,
} from "lucide-react";
import { type Vehicle } from "@/data/vehicles";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { Button } from "../ui/button";
import { DateRangePicker } from "../vehicles/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useRouter } from "next/navigation";
import { renderRoleBasedPath } from "@/lib/utils";

export default function VehicleDetailsWithID({ id }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const router = useRouter();

  const vehicleId = id;

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/vehicle/search_vehicle/${vehicleId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const vehicleData = response.data;
        setVehicle(vehicleData);

        // Process statistics here
        const trips = vehicleData.tripRecords || [];

        const totalTrips = trips.length;
        const todayTrips = trips.filter((trip: any) =>
          isToday(new Date(trip.tripDate))
        ).length;
        const yesterdayTrips = trips.filter((trip: any) =>
          isYesterday(new Date(trip.tripDate))
        ).length;

        const totalAmountToPay = trips.reduce(
          (sum: any, trip: any) => sum + (trip.totalAmount || 0),
          0
        );
        const totalAmountPaid = trips.reduce(
          (sum: any, trip: any) => sum + (trip.amountPaid || 0),
          0
        );
        const totalDues = trips.reduce(
          (sum: any, trip: any) => sum + (trip.balanceAmount || 0),
          0
        );

        setStatistics({
          totalTrips,
          todayTrips,
          yesterdayTrips,
          totalAmountToPay,
          totalAmountPaid,
          totalDues,
        });

        setFilteredTrips(trips);
        setTrips(trips);
      } catch (err: any) {
        console.error("Error fetching vehicle data:", err);
        alert("Failed to load vehicle data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session?.user?.token, vehicleId]);

  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const filtered = getTripsByDateRange(fromDate, toDate, vehicleId);
      console.log(filtered);
      setFilteredTrips(filtered);
    }
  }, [dateRange, vehicleId]);

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading vehicle data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6">
        <p>No vehicle found.</p>
      </div>
    );
  }

  function getTripsByDateRange(
    startDate: string,
    endDate: string,
    vehicleId?: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set end date to the end of the day
    end.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const tripDate = new Date(trip.tripDate); // ensure tripDate is a Date object
      const matchesVehicle = vehicleId ? trip.vehicleId === vehicleId : true;

      return matchesVehicle && tripDate >= start && tripDate <= end;
    });
  }

  const handleEdit = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user.role)}/vehicle/${vehicleId}/edit`
    );
  };

  const handleBack = () => {
    router.push(`/${renderRoleBasedPath(session?.user.role)}/vehicle`);
  };

  const handleAddTrip = () => {
    router.push(
      `/${renderRoleBasedPath(
        session?.user.role
      )}/vehicle/${vehicleId}/add-trip`
    );
  };

  const handleEditTrip = (tripId: string) => {
    router.push(
      `/${renderRoleBasedPath(
        session?.user.role
      )}/vehicle/${vehicleId}/edit-trip/${tripId}`
    );
  };

  const handleDeleteTrip = (tripId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this trip? This action cannot be undone."
      )
    ) {
      console.log("delete trip");
    }
  };

  return (
    <div className=" p-6">
      <div className="grid gap-6">
        {/* Vehicle Information Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="outline" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Vehicle Details</h1>
          </div>
          {(session?.user?.role === "ADMIN" ||
            session?.user?.role === "TQMA_EDITOR" ||
            session?.user?.role === "TSMWA_EDITOR") &&
            <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit Vehicle
          </Button>
          }
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Truck className="mr-2 h-5 w-5" /> {vehicle.vehicleNumber}
                </CardTitle>
                <CardDescription>
                  Vehicle ID: {vehicle.vehicleId}
                </CardDescription>
              </div>
              <Badge
                variant={
                  vehicle.status === "ACTIVE"
                    ? "default"
                    : vehicle.status === "MAINTENANCE"
                    ? "secondary"
                    : "destructive"
                }
              >
                {vehicle.status.charAt(0).toUpperCase() +
                  vehicle.status.slice(1).toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCog2 className="h-4 w-4 text-muted-foreground" />
                  <span>Driver Name: {vehicle.driverName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Driver Phone: {vehicle.driverPhoneNumber}</span>
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
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Owner Name: {vehicle.ownerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Owner Phone: {vehicle.ownerPhoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Last Updated:{" "}
                    {new Date(vehicle.modifiedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trips">Trips Record</TabsTrigger>
            {/* <TabsTrigger value="maintenance">Maintenance History</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Trips
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics?.totalTrips || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics?.todayTrips || 0} today,{" "}
                    {statistics?.yesterdayTrips || 0} yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Amount to Pay
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{statistics?.totalAmountToPay || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Amount Paid
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{statistics?.totalAmountPaid || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dues</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{statistics?.totalDues || 0}
                  </div>
                </CardContent>
              </Card>
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
                  {(session?.user?.role === "ADMIN" ||
                    session?.user?.role === "TQMA_EDITOR" ||
                    session?.user?.role === "TSMWA_EDITOR") &&  
                    <Button onClick={handleAddTrip}>
                    <Plus className="mr-2 h-4 w-4" /> Add Trip
                  </Button>
                  }
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
                        {(session?.user?.role === "ADMIN" ||
                          session?.user?.role === "TQMA_EDITOR" ||
                          session?.user?.role === "TSMWA_EDITOR") &&
                          <TableHead>Actions</TableHead>
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">
                            {trip.id}
                          </TableCell>
                          <TableCell>
                            {new Date(trip.tripDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{trip.numberOfTrips}</TableCell>
                          <TableCell>₹{trip.totalAmount}</TableCell>
                          <TableCell>₹{trip.amountPaid}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trip.paymentStatus === "PAID"
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
                          {(session?.user?.role === "ADMIN" ||
                            session?.user?.role === "TQMA_EDITOR" ||
                            session?.user?.role === "TSMWA_EDITOR") &&
                            <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleEditTrip(trip.tripId);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                            </TableCell>
                          }
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No trips found for the selected date range.
                    </p>
                    {(session?.user?.role === "ADMIN" ||
                      session?.user?.role === "TQMA_EDITOR" ||
                      session?.user?.role === "TSMWA_EDITOR") &&
                      <Button onClick={handleAddTrip} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Add Trip
                    </Button>
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <div>Maintenance records coming soon...</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
