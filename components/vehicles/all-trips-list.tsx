"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
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
import { Badge } from "@/components/ui/badge";
import { getVehicleById } from "@/data/vehicles";
import { renderRoleBasedPath } from "@/lib/utils";

// Define the trip type based on API response
interface ApiTrip {
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
  modifiedBy: number | null;
}

export default function AllTripsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ApiTrip | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Fetch trips from API
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
        const fullUrl = `${apiUrl}/api/vehicle/get_all_trip`;

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
        if (
          response.data &&
          response.data.trips &&
          Array.isArray(response.data.trips)
        ) {
          responseData = response.data.trips;
        } else if (response.data && Array.isArray(response.data)) {
          responseData = response.data;
        } else {
          responseData = [];
        }

        setTrips(responseData);
        console.log("Trips data:", responseData);
        console.log("Number of trips:", responseData.length);
      } catch (err: unknown) {
        console.error("Error fetching trip data:", err);
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        alert("Failed to load trip data");
        setTrips([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session?.user?.token]);

  // Filter trips based on search term
  const filteredTrips = trips.filter(
    (trip) =>
      trip.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleById(trip.vehicleId)
        ?.vehicleNumber.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getVehicleById(trip.vehicleId)
        ?.driverName.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Sort trips if a sort field is selected
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number | Date = "";
    let valueB: string | number | Date = "";

    switch (sortField) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "tripId":
        valueA = a.tripId;
        valueB = b.tripId;
        break;
      case "tripDate":
        valueA = new Date(a.tripDate);
        valueB = new Date(b.tripDate);
        break;
      case "numberOfTrips":
        valueA = a.numberOfTrips;
        valueB = b.numberOfTrips;
        break;
      case "amountPerTrip":
        valueA = a.amountPerTrip;
        valueB = b.amountPerTrip;
        break;
      case "totalAmount":
        valueA = a.totalAmount;
        valueB = b.totalAmount;
        break;
      case "amountPaid":
        valueA = a.amountPaid;
        valueB = b.amountPaid;
        break;
      case "paymentStatus":
        valueA = a.paymentStatus;
        valueB = b.paymentStatus;
        break;
      case "createdAt":
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Paginate the sorted trips
  const paginatedTrips = sortedTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedTrips.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof ApiTrip) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to trip details
  const viewVehicleDetails = (vehicleId: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/vehicle/${vehicleId}`
    );
  };

  // Navigate to add new trip
  const addNewTrip = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/vehicle/trips/add`
    );
  };

  // Navigate to edit trip
  const editTrip = (vehicleId: string, tripId: string) => {
    router.push(
      `/${renderRoleBasedPath(
        session?.user?.role
      )}/vehicle/${vehicleId}/edit-trip/${tripId}`
    );
  };

  // Get vehicle details
  const getVehicleDetails = (vehicleId: string) => {
    const vehicle = getVehicleById(vehicleId);
    return vehicle ? vehicle : null;
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">All Trips</CardTitle>
            <CardDescription>Manage all trips across vehicles</CardDescription>
          </div>
          <Button onClick={addNewTrip}>
            <Plus className="mr-2 h-4 w-4" /> Add Trip
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || status === "loading" ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading trip data...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("tripId")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Trip ID
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("tripDate")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("numberOfTrips")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Trips
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("amountPerTrip")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Amount/Trip
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("totalAmount")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Total
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("paymentStatus")}
                          className="flex items-center p-0 h-auto font-medium"
                        >
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrips.length > 0 ? (
                      paginatedTrips.map((trip) => {
                        const vehicle = getVehicleDetails(trip.vehicleId);
                        return (
                          <TableRow key={trip.id}>
                            <TableCell className="font-medium">
                              {trip.tripId}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(trip.tripDate).toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {vehicle?.vehicleNumber || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {vehicle?.driverName || "Unknown"}
                            </TableCell>
                            <TableCell>{trip.numberOfTrips}</TableCell>
                            <TableCell>₹{trip.amountPerTrip}</TableCell>
                            <TableCell>₹{trip.totalAmount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  trip.paymentStatus === "PAID"
                                    ? "default"
                                    : trip.paymentStatus === "PARTIAL"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {trip.paymentStatus.charAt(0).toUpperCase() +
                                  trip.paymentStatus.slice(1).toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      viewVehicleDetails(trip.vehicleId)
                                    }
                                  >
                                    Vehicle Details
                                  </DropdownMenuItem>
                                  {(session?.user?.role === "TSMWA_EDITOR" ||
                                    session?.user?.role === "TQMA_EDITOR" ||
                                    session?.user?.role === "ADMIN") && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          editTrip(trip.vehicleId, trip.tripId)
                                        }
                                      >
                                        Edit Trip
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {session?.user?.role === "ADMIN" && (
                                    <>
                                      <DropdownMenuItem>
                                        Delete Trip
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No trips found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedTrips.length} of {sortedTrips.length} trips
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
