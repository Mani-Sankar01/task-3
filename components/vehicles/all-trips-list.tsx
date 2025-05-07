"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { getAllTrips, getVehicleById, type Trip } from "@/data/vehicles";

export default function AllTripsList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Trip | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [trips, setTrips] = useState(() => getAllTrips());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter trips based on search term
  const filteredTrips = trips.filter(
    (trip) =>
      trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      case "date":
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case "totalRounds":
        valueA = a.totalRounds;
        valueB = b.totalRounds;
        break;
      case "pricePerRound":
        valueA = a.pricePerRound;
        valueB = b.pricePerRound;
        break;
      case "totalAmountToPay":
        valueA = a.totalAmountToPay;
        valueB = b.totalAmountToPay;
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
  const handleSort = (field: keyof Trip) => {
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
    router.push(`/admin/vehicle/${vehicleId}`);
  };

  // Navigate to add new trip
  const addNewTrip = () => {
    router.push("/admin/vehicle/trips/add");
  };

  // Navigate to edit trip
  const editTrip = (vehicleId: string, tripId: string) => {
    router.push(`/admin/vehicle/${vehicleId}/edit-trip/${tripId}`);
  };

  // Get vehicle details
  const getVehicleDetails = (vehicleId: string) => {
    const vehicle = getVehicleById(vehicleId);
    return vehicle ? vehicle : null;
  };

  return (
    <div className="container mx-auto p-6">
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
                      onClick={() => handleSort("id")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
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
                      onClick={() => handleSort("totalRounds")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Rounds
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pricePerRound")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Price/Round
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalAmountToPay")}
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
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(trip.date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vehicle?.vehicleNumber || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {vehicle?.driverName || "Unknown"}
                        </TableCell>
                        <TableCell>{trip.totalRounds}</TableCell>
                        <TableCell>₹{trip.pricePerRound}</TableCell>
                        <TableCell>₹{trip.totalAmountToPay}</TableCell>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  viewVehicleDetails(trip.vehicleId)
                                }
                              >
                                Vehicle Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  editTrip(trip.vehicleId, trip.id)
                                }
                              >
                                Edit Trip
                              </DropdownMenuItem>
                              <DropdownMenuItem>Delete Trip</DropdownMenuItem>
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
        </CardContent>
      </Card>
    </div>
  );
}
