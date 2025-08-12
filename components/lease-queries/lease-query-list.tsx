"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowUpDown, MoreHorizontal, Plus, Search } from "lucide-react";

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


// Define the lease query type based on API response
interface ApiLeaseQuery {
  id: number;
  leaseQueryId: string;
  membershipId: string;
  presentLeaseHolder: string;
  dateOfLease: string;
  expiryOfLease: string;
  dateOfRenewal: string | null;
  status: string;
  createdAt: string;
  createdBy: number;
  modifiedAt: string;
  modifiedBy: number | null;
}

export default function LeaseQueryList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ApiLeaseQuery | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [queries, setQueries] = useState<ApiLeaseQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<ApiLeaseQuery[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Load lease queries from API on component mount
  useEffect(() => {
    const fetchLeaseQueries = async () => {
      console.log("Fetching lease queries...");
      console.log("Status:", status);
      console.log("Session token:", session?.user?.token ? "Exists" : "Missing");
      
      if (status === "authenticated" && session?.user?.token) {
        try {
          setIsLoading(true);
          const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
          const fullUrl = `${apiUrl}/api/lease_query/get_all_lease_queries`;
          console.log("API URL:", fullUrl);
          
          const response = await axios.get(fullUrl, {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          });
          
          console.log("Lease queries API response:", response.data);
          
          // Handle the response structure
          let queriesData: ApiLeaseQuery[] = [];
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            queriesData = response.data.data;
          } else if (Array.isArray(response.data)) {
            queriesData = response.data;
          }
          
          console.log("Processed lease queries data:", queriesData);
          setQueries(queriesData);
          setFilteredQueries(queriesData);
        } catch (err) {
          console.error("Error fetching lease queries:", err);
          if (err instanceof Error) {
            console.error("Error message:", err.message);
          }
          setQueries([]);
          setFilteredQueries([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("Not authenticated or no token");
        setIsLoading(false);
      }
    };
    fetchLeaseQueries();
  }, [status, session?.user?.token]);



  // Filter queries based on search term
  useEffect(() => {
    const filtered = queries.filter(
      (query) =>
        query.leaseQueryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.presentLeaseHolder
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        query.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQueries(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, queries]);

  // Sort queries if a sort field is selected
  const sortedQueries = [...filteredQueries].sort((a, b) => {
    if (!sortField) return 0;

    let valueA, valueB;

    if (sortField === "leaseQueryId") {
      valueA = a.leaseQueryId;
      valueB = b.leaseQueryId;
    } else if (sortField === "membershipId") {
      valueA = a.membershipId;
      valueB = b.membershipId;
    } else if (sortField === "presentLeaseHolder") {
      valueA = a.presentLeaseHolder;
      valueB = b.presentLeaseHolder;
    } else if (sortField === "dateOfLease") {
      valueA = new Date(a.dateOfLease).getTime();
      valueB = new Date(b.dateOfLease).getTime();
    } else if (sortField === "expiryOfLease") {
      valueA = new Date(a.expiryOfLease).getTime();
      valueB = new Date(b.expiryOfLease).getTime();
    } else if (sortField === "status") {
      valueA = a.status;
      valueB = b.status;
    } else {
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

  // Paginate the sorted queries
  const paginatedQueries = sortedQueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedQueries.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof ApiLeaseQuery) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Navigate to query details
  const viewQueryDetails = (queryId: string) => {
    router.push(`/admin/lease-queries/${queryId}`);
  };

  // Navigate to add new query
  const addNewQuery = () => {
    router.push(`/admin/lease-queries/add`);
  };

  // Navigate to edit query - only available for admin or editor roles
  const editQuery = (queryId: string) => {
    router.push(`/admin/lease-queries/edit/${queryId}`);
  };

  // Delete a query
  const handleDeleteQuery = async (queryId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this lease query? This action cannot be undone."
      )
    ) {
      try {
        if (status !== "authenticated" || !session?.user?.token) {
          alert("Authentication required");
          return;
        }

        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const response = await axios.delete(
          `${apiUrl}/api/lease_query/delete_lease_query/${queryId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log("Delete response:", response.data);
        alert("Lease query deleted successfully!");
        
        // Refresh the list
        const refreshResponse = await axios.get(
          `${apiUrl}/api/lease_query/get_all_lease_queries`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );
        
        if (refreshResponse.data && refreshResponse.data.data) {
          setQueries(refreshResponse.data.data);
          setFilteredQueries(refreshResponse.data.data);
        }
      } catch (error: any) {
        console.error("Error deleting lease query:", error);
        alert("Failed to delete lease query. Please try again.");
      }
    }
  };



  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Lease Queries</CardTitle>
            <CardDescription>
              Manage all lease agreements and queries
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={addNewQuery}>
              <Plus className="mr-2 h-4 w-4" /> Add Query
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, membership, lease holder..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when search changes
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
                      onClick={() => handleSort("leaseQueryId")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Query ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("membershipId")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Membership ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("presentLeaseHolder")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Present Lease Holder
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dateOfLease")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Lease Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("expiryOfLease")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Expiry Date
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading lease queries...
                    </TableCell>
                  </TableRow>
                ) : paginatedQueries.length > 0 ? (
                  paginatedQueries.map((query) => (
                    <TableRow
                      key={query.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewQueryDetails(query.leaseQueryId)}
                    >
                      <TableCell className="font-medium">{query.leaseQueryId}</TableCell>
                      <TableCell>{query.membershipId}</TableCell>
                      <TableCell>{query.presentLeaseHolder}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.dateOfLease).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.expiryOfLease).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            query.status === "RESOLVED"
                              ? "default"
                              : query.status === "PENDING"
                              ? "secondary"
                              : query.status === "PROCESSING"
                              ? "secondary"
                              : query.status === "REJECTED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {query.status.charAt(0).toUpperCase() +
                            query.status.slice(1).toLowerCase()}
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
                                viewQueryDetails(query.leaseQueryId);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>

                            {/* Show Edit option only for Admin or Editor roles */}
                            {/* Removed role-based UI */}
                            <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editQuery(query.leaseQueryId);
                                }}
                              >
                                Edit Query
                              </DropdownMenuItem>

                            {/* Show Delete option only for Admin role */}
                            {/* Removed role-based UI */}
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuery(query.leaseQueryId);
                                }}
                              >
                                Delete Query
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No lease queries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedQueries.length} of {sortedQueries.length}{" "}
              queries
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
