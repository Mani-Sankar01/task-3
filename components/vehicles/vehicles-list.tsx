"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MoreHorizontal, Plus, Search, Truck } from "lucide-react";

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
import { getAllVehicles, deleteVehicle, type Vehicle } from "@/data/vehicles";
import { getRouteById } from "@/data/routes";

export default function VehiclesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Vehicle | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [vehicles, setVehicles] = useState(() => getAllVehicles());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort vehicles if a sort field is selected
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number = "";
    let valueB: string | number = "";

    switch (sortField) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "vehicleNumber":
        valueA = a.vehicleNumber;
        valueB = b.vehicleNumber;
        break;
      case "driverName":
        valueA = a.driverName;
        valueB = b.driverName;
        break;
      case "status":
        valueA = a.status;
        valueB = b.status;
        break;
      case "pricePerRound":
        valueA = a.pricePerRound;
        valueB = b.pricePerRound;
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

  // Paginate the sorted vehicles
  const paginatedVehicles = sortedVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedVehicles.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof Vehicle) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to vehicle details
  const viewVehicleDetails = (vehicleId: string) => {
    router.push(`/admin/vehicle/${vehicleId}`);
  };

  // Navigate to add new vehicle
  const addNewVehicle = () => {
    router.push("/admin/vehicle/add");
  };

  // Navigate to edit vehicle
  const editVehicle = (vehicleId: string) => {
    router.push(`/admin/vehicle/${vehicleId}/edit`);
  };

  // Delete a vehicle
  const handleDeleteVehicle = (vehicleId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this vehicle? This action cannot be undone."
      )
    ) {
      deleteVehicle(vehicleId);
      setVehicles(getAllVehicles());

      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedVehicles.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Get route name by ID
  const getRouteName = (routeId: string) => {
    const route = getRouteById(routeId);
    return route ? route.name : "Unknown Route";
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Vehicles</CardTitle>
            <CardDescription>
              Manage all vehicles and their details
            </CardDescription>
          </div>
          <Button onClick={addNewVehicle}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
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
                      onClick={() => handleSort("vehicleNumber")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Vehicle Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("driverName")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Driver
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Route</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pricePerRound")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Price/Round
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
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
                {paginatedVehicles.length > 0 ? (
                  paginatedVehicles.map((vehicle) => (
                    <TableRow
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewVehicleDetails(vehicle.id)}
                    >
                      <TableCell className="font-medium">
                        {vehicle.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{vehicle.vehicleNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vehicle.driverName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getRouteName(vehicle.route)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ₹{vehicle.pricePerRound}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                      </TableCell>
                      <TableCell>
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
                                viewVehicleDetails(vehicle.id);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                editVehicle(vehicle.id);
                              }}
                            >
                              Edit Vehicle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/admin/vehicle/${vehicle.id}/add-trip`
                                );
                              }}
                            >
                              Add Trip
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVehicle(vehicle.id);
                              }}
                            >
                              Delete Vehicle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedVehicles.length} of {sortedVehicles.length}{" "}
              vehicles
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
