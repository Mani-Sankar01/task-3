"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  getAllLeaseQueries,
  deleteLeaseQuery,
  type LeaseQuery,
  getMemberNameByMembershipId,
} from "@/data/lease-queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeaseQueryList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof LeaseQuery | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [queries, setQueries] = useState<LeaseQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<LeaseQuery[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items to show per page

  // User role for role-based access control - get from localStorage for persistence
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("userRole");
      if (savedRole && ["admin", "editor", "viewer"].includes(savedRole)) {
        return savedRole;
      }
    }
    return "admin"; // Default role
  });

  useEffect(() => {
    // Load queries
    setQueries(getAllLeaseQueries());
  }, []);

  // Filter queries based on search term
  useEffect(() => {
    const filtered = queries.filter(
      (query) =>
        query.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.presentLeaseHolder
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getMemberNameByMembershipId(query.membershipId)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredQueries(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, queries]);

  // Sort queries if a sort field is selected
  const sortedQueries = [...filteredQueries].sort((a, b) => {
    if (!sortField) return 0;

    let valueA, valueB;

    if (sortField === "id") {
      valueA = a.id;
      valueB = b.id;
    } else if (sortField === "membershipId") {
      valueA = a.membershipId;
      valueB = b.membershipId;
    } else if (sortField === "presentLeaseHolder") {
      valueA = a.presentLeaseHolder;
      valueB = b.presentLeaseHolder;
    } else if (sortField === "leaseDate") {
      valueA = new Date(a.leaseDate).getTime();
      valueB = new Date(b.leaseDate).getTime();
    } else if (sortField === "expiryDate") {
      valueA = new Date(a.expiryDate).getTime();
      valueB = new Date(b.expiryDate).getTime();
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
  const handleSort = (field: keyof LeaseQuery) => {
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
    router.push(`/admin/lease-queries/${queryId}?role=${userRole}`);
  };

  // Navigate to add new query
  const addNewQuery = () => {
    router.push(`/admin/lease-queries/add?role=${userRole}`);
  };

  // Navigate to edit query - only available for admin or editor roles
  const editQuery = (queryId: string) => {
    router.push(`/admin/lease-queries/edit/${queryId}?role=${userRole}`);
  };

  // Delete a query
  const handleDeleteQuery = (queryId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this lease query? This action cannot be undone."
      )
    ) {
      deleteLeaseQuery(queryId);
      // Refresh the list
      setQueries(getAllLeaseQueries());
    }
  };

  // Change user role (for demo purposes)
  const handleRoleChange = (role: string) => {
    setUserRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
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
            {/* Role selector for demo purposes */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Role:</span>
              <Select value={userRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                      onClick={() => handleSort("leaseDate")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Lease Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("expiryDate")}
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
                {paginatedQueries.length > 0 ? (
                  paginatedQueries.map((query) => (
                    <TableRow
                      key={query.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewQueryDetails(query.id)}
                    >
                      <TableCell className="font-medium">{query.id}</TableCell>
                      <TableCell>{query.membershipId}</TableCell>
                      <TableCell>{query.presentLeaseHolder}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.leaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            query.status === "resolved"
                              ? "default"
                              : query.status === "pending"
                              ? "secondary"
                              : query.status === "processing"
                              ? "secondary"
                              : query.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {query.status.charAt(0).toUpperCase() +
                            query.status.slice(1)}
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
                                viewQueryDetails(query.id);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>

                            {/* Show Edit option only for Admin or Editor roles */}
                            {(userRole === "admin" ||
                              userRole === "editor") && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editQuery(query.id);
                                }}
                              >
                                Edit Query
                              </DropdownMenuItem>
                            )}

                            {/* Show Delete option only for Admin role */}
                            {userRole === "admin" && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuery(query.id);
                                }}
                              >
                                Delete Query
                              </DropdownMenuItem>
                            )}
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
