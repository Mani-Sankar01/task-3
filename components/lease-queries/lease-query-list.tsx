"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
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
import { renderRoleBasedPath } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ApiLeaseQuery | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [queries, setQueries] = useState<ApiLeaseQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<ApiLeaseQuery[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [members, setMembers] = useState<
    Array<{
      id: string;
      membershipId: string;
      applicantName: string;
      firmName: string;
    }>
  >([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedLease, setSelectedLease] = useState<ApiLeaseQuery | null>(null);
  const [transferForm, setTransferForm] = useState({
    membershipId: "",
    dateOfLease: "",
    expiryOfLease: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leaseToDelete, setLeaseToDelete] = useState<{ id: string; leaseQueryId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load lease queries from API on component mount
  useEffect(() => {
    const fetchLeaseQueries = async () => {
      console.log("Fetching lease queries...");
      console.log("Status:", status);
      console.log(
        "Session token:",
        session?.user?.token ? "Exists" : "Missing"
      );
      console.log("Session user:", session?.user.token);

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
          if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
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
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/lease-queries/${queryId}`
    );
  };

  // Navigate to add new query
  const addNewQuery = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/lease-queries/add`
    );
  };

  // Navigate to edit query - only available for admin or editor roles
  const editQuery = (queryId: string) => {
    router.push(
      `/${renderRoleBasedPath(
        session?.user?.role
      )}/lease-queries/${queryId}/edit`
    );
  };

  // Delete a query
  const openDeleteDialog = (queryId: string, leaseQueryId: string) => {
    setLeaseToDelete({ id: queryId, leaseQueryId });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setLeaseToDelete(null);
  };

  const confirmDelete = async () => {
    if (!leaseToDelete) return;

    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      closeDeleteDialog();
      return;
    }

    setIsDeleting(true);
    try {
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      const response = await axios.delete(
        `${apiUrl}/api/lease_query/delete_lease_query/${leaseToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log("Delete response:", response.data);
      toast({
        title: "Success",
        description: "Lease query deleted successfully!",
      });

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
      closeDeleteDialog();
    } catch (error: any) {
      console.error("Error deleting lease query:", error);
      toast({
        title: "Error",
        description: "Failed to delete lease query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshLeaseQueries = async () => {
    if (status !== "authenticated" || !session?.user?.token) return;
    const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
    const refreshResponse = await axios.get(
      `${apiUrl}/api/lease_query/get_all_lease_queries`,
      {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      }
    );
    const refreshed = Array.isArray(refreshResponse.data)
      ? refreshResponse.data
      : Array.isArray(refreshResponse.data?.data)
      ? refreshResponse.data.data
      : [];
    setQueries(refreshed);
    setFilteredQueries(refreshed);
  };

  const openTransferDialog = (query: ApiLeaseQuery) => {
    setSelectedLease(query);
    setTransferForm({
      membershipId: "",
      dateOfLease: "",
      expiryOfLease: "",
    });
    setShowTransferDialog(true);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!showTransferDialog || !session?.user?.token || status !== "authenticated") {
        return;
      }
      setIsLoadingMembers(true);
      try {
        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const response = await axios.get(`${apiUrl}/api/member/get_members`, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        });
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.members)
          ? response.data.members
          : [];
        setMembers(
          data.map((member: any) => ({
            id: member.id?.toString() || member.membershipId,
            membershipId: member.membershipId,
            applicantName: member.applicantName || member.memberName || "Unknown",
            firmName: member.firmName || "",
          }))
        );
      } catch (error) {
        console.error("Error fetching members for transfer:", error);
        toast({
          title: "Error",
          description: "Failed to load members. Please try again.",
          variant: "destructive",
        });
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [showTransferDialog, session?.user?.token, status, toast]);

  const closeTransferDialog = () => {
    setShowTransferDialog(false);
    setSelectedLease(null);
    setTransferForm({ membershipId: "", dateOfLease: "", expiryOfLease: "" });
  };

  const handleTransferSubmit = async () => {
    if (!selectedLease) return;
    if (!transferForm.membershipId || !transferForm.dateOfLease || !transferForm.expiryOfLease) {
      toast({
        title: "Missing Information",
        description: "Please select a member and provide both lease dates.",
        variant: "destructive",
      });
      return;
    }
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      const payload = {
        leaseQueryId: selectedLease.leaseQueryId,
        membershipId: transferForm.membershipId,
        dateOfLease: new Date(transferForm.dateOfLease).toISOString(),
        expiryOfLease: new Date(transferForm.expiryOfLease).toISOString(),
      };

      await axios.post(`${apiUrl}/api/lease_query/renew_lease_query`, payload, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      toast({
        title: "Lease Transferred",
        description: "The lease has been transferred successfully.",
      });

      closeTransferDialog();
      await refreshLeaseQueries();
    } catch (error: any) {
      console.error("Error transferring lease:", error);
      toast({
        title: "Transfer Failed",
        description:
          error?.response?.data?.message ||
          "Unable to transfer the lease. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleStatusUpdate = async (
    query: ApiLeaseQuery,
    nextStatus: "PENDING" | "PROCESSING" | "RESOLVED" | "REJECTED"
  ) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    if (query.status === nextStatus) return;

    setIsUpdatingStatus(query.leaseQueryId);
    try {
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      const payload = {
        leaseQueryId: query.leaseQueryId,
        membershipId: query.membershipId,
        presentLeaseHolder: query.presentLeaseHolder,
        dateOfLease: query.dateOfLease,
        expiryOfLease: query.expiryOfLease,
        status: nextStatus,
        newAttachments: [],
        updateAttachments: [],
        deleteAttachment: [],
      };

      await axios.post(`${apiUrl}/api/lease_query/update_lease_query`, payload, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      toast({
        title: "Status Updated",
        description: `Lease query has been marked as ${nextStatus}.`,
      });

      await refreshLeaseQueries();
    } catch (error: any) {
      console.error("Error updating lease status:", error);
      toast({
        title: "Update Failed",
        description:
          error?.response?.data?.message ||
          "Unable to update the status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const statusOptions: Array<{
    value: "PENDING" | "PROCESSING" | "RESOLVED" | "REJECTED";
    label: string;
    icon: JSX.Element;
  }> = [
    {
      value: "PENDING",
      label: "Mark as Pending",
      icon: <Clock className="mr-2 h-4 w-4" />,
    },
    {
      value: "PROCESSING",
      label: "Mark as Processing",
      icon: <Loader2 className="mr-2 h-4 w-4" />,
    },
    {
      value: "REJECTED",
      label: "Mark as Rejected",
      icon: <XCircle className="mr-2 h-4 w-4" />,
    },
    {
      value: "RESOLVED",
      label: "Mark as Resolved",
      icon: <CheckCircle className="mr-2 h-4 w-4" />,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Lease Queries</CardTitle>
            <CardDescription>
              Manage all lease agreements and queries
            </CardDescription>
          </div>
          {(session?.user?.role === "ADMIN" ||
            session?.user?.role === "TQMA_EDITOR" ||
            session?.user?.role === "TSMWA_EDITOR") &&  
          <div className="flex items-center gap-4">
              <Button onClick={addNewQuery}>
                <Plus className="mr-2 h-4 w-4" /> Add Query
              </Button>
            
          </div>}
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
                    Renewal Date
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
                      <TableCell className="font-medium">
                        {query.leaseQueryId}
                      </TableCell>
                      <TableCell>{query.membershipId}</TableCell>
                      <TableCell>{query.presentLeaseHolder}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.dateOfLease).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(query.expiryOfLease).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {query.dateOfRenewal ? new Date(query.dateOfRenewal).toLocaleDateString() : "N/A"}
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
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>

                            {(session?.user?.role === "ADMIN" ||
                              session?.user?.role === "TSMWA_EDITOR" ||
                              session?.user?.role === "TQMA_EDITOR")
                               && (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editQuery(query.leaseQueryId);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Query
                                  </DropdownMenuItem>

                                  {statusOptions
                                    .filter((option) => option.value !== query.status)
                                    .map((option) => (
                                      <DropdownMenuItem
                                        key={option.value}
                                        disabled={
                                          isUpdatingStatus === query.leaseQueryId
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusUpdate(query, option.value);
                                        }}
                                      >
                                        {option.icon}
                                        {option.label}
                                      </DropdownMenuItem>
                                    ))}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTransferDialog(query);
                                    }}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" /> Transfer
                                  </DropdownMenuItem>
                                </>
                              )}

                            {session?.user?.role === "ADMIN" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteDialog(query.leaseQueryId, query.leaseQueryId);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Query
                                  </DropdownMenuItem>
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
                      No lease queries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedQueries.length} of {sortedQueries.length} queries
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

      <Dialog open={showTransferDialog} onOpenChange={(open) => (!open ? closeTransferDialog() : setShowTransferDialog(open))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer Lease</DialogTitle>
            <DialogDescription>
              Choose a member and new lease dates to transfer the selected lease query.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Member</label>
              <Select
                value={transferForm.membershipId}
                onValueChange={(value) =>
                  setTransferForm((prev) => ({ ...prev, membershipId: value }))
                }
                disabled={isLoadingMembers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select member"} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.membershipId} value={member.membershipId}>
                      {member.membershipId} - {member.applicantName}
                      {member.firmName ? ` (${member.firmName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Lease</label>
                <Input
                  type="date"
                  value={transferForm.dateOfLease}
                  onChange={(event) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      dateOfLease: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry of Lease</label>
                <Input
                  type="date"
                  value={transferForm.expiryOfLease}
                  onChange={(event) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      expiryOfLease: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {selectedLease ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                Transferring lease <span className="font-semibold text-primary">{selectedLease.leaseQueryId}</span>
                {" "}
                (current membership <span className="font-semibold">{selectedLease.membershipId}</span>).
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTransferDialog}>
              Cancel
            </Button>
            <Button onClick={handleTransferSubmit} disabled={isSubmittingTransfer}>
              {isSubmittingTransfer ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lease Query</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{leaseToDelete?.leaseQueryId}</strong>? This action cannot be
              undone and will permanently remove the lease query record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Query"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
