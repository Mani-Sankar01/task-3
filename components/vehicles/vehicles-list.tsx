"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MoreHorizontal, Plus, Search, Truck, Eye, Edit, Trash2 } from "lucide-react";

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
import { getAllVehicles, type Vehicle } from "@/data/vehicles";
import { getRouteById } from "@/data/routes";
import { useSession } from "next-auth/react";
import axios from "axios";
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
import { useToast } from "@/hooks/use-toast";
import { renderRoleBasedPath } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VehiclesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Vehicle | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [vehicles, setVehicles] = useState(() => getAllVehicles());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/vehicle/get_vehicles`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const reponseData = response.data;
        setVehicles(reponseData);
        console.log(JSON.stringify(reponseData));
        // set form data here if needed
      } catch (err: any) {
        console.error("Error fetching member data:", err);
        alert("Failed to load member data");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [status, session?.user?.token]);

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
    router.push(
      `/${renderRoleBasedPath(session?.user.role)}/vehicle/${vehicleId}`
    );
  };

  // Navigate to add new vehicle
  const addNewVehicle = () => {
    router.push(`/${renderRoleBasedPath(session?.user.role)}/vehicle/add`);
  };

  // Navigate to edit vehicle
  const editVehicle = (vehicleId: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user.role)}/vehicle/${vehicleId}/edit`
    );
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = async (
    vehicleId: string,
    vehicleNumber: string
  ) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete vehicles",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      const response = await axios.delete(
        `${process.env.BACKEND_API_URL}/api/vehicle/delete_vehicle/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Remove the vehicle from the local state
        setVehicles((prevVehicles) =>
          prevVehicles.filter((vehicle) => vehicle.vehicleId !== vehicleId)
        );

        // Show success toast
        toast({
          title: "Vehicle Deleted",
          description: `Vehicle ${vehicleNumber} has been deleted successfully.`,
        });

        // Adjust pagination if needed
        if (
          currentPage > 1 &&
          (currentPage - 1) * itemsPerPage >= sortedVehicles.length - 1
        ) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete vehicle. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Failed to delete vehicle. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Vehicle not found or already deleted";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get route name by ID
  const getRouteName = (routeId: string) => {
    const route = getRouteById(routeId);
    return route ? route.name : "Unknown Route";
  };

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

  return (
    <div className="p-6">
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
                      className="hover:bg-muted/50"
                    >
                      <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => viewVehicleDetails(vehicle.vehicleId)}
                      >
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
                                viewVehicleDetails(vehicle.vehicleId);
                              }}
                            >
                              <Eye className="mr-1 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {(session?.user?.role === "TSMWA_EDITOR" ||
                              session?.user?.role === "TQMA_EDITOR" ||
                              session?.user?.role === "ADMIN") && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editVehicle(vehicle.vehicleId);
                                  }}
                                >
                                  <Edit className="mr-1 h-4 w-4" /> Edit Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/admin/vehicle/${vehicle.vehicleId}/add-trip`
                                    );
                                  }}
                                >
                                  <Plus className="mr-1 h-4 w-4" /> Add Trip
                                </DropdownMenuItem>
                              </>
                            )}
                            {session?.user?.role === "ADMIN" && (
                              <>
                                <DropdownMenuSeparator />
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="mr-1 h-4 w-4" /> Delete Vehicle
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <span className="text-destructive">
                                          ⚠️
                                        </span>
                                        Delete Vehicle
                                      </DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete vehicle{" "}
                                        <span className="font-semibold">
                                          {vehicle.vehicleNumber}
                                        </span>
                                        ? This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2">
                                      <DialogClose asChild>
                                        <Button variant="outline">
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleDeleteVehicle(vehicle.vehicleId, vehicle.vehicleNumber)
                                          }
                                          disabled={isDeleting}
                                        >
                                          Delete
                                        </Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedVehicles.length} of {sortedVehicles.length} vehicles
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
