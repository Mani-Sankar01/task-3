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
  Phone,
  User,
  Loader2,
  XCircle,
  PauseCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getAllLabour,
  deleteLabour,
  getMemberNameById,
  type Labour,
  type LabourStatus,
} from "@/data/labour";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { renderRoleBasedPath } from "@/lib/utils";

export default function LabourList() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [labourList, setLabourList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [labourToDelete, setLabourToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];

  // Load labour list from API
  useEffect(() => {
    const fetchLabourList = async () => {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        setIsLoading(true);
        setError("");
        try {
          const response = await axios.get(
            `${
              process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/labour/get_all_labours`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setLabourList(response.data);
          setHasLoaded(true);
          console.log(response.data);
        } catch (err: any) {
          console.error("Error fetching labour list:", err);
          setError("Failed to load labour data");
          setLabourList([]);
          setHasLoaded(true);
        } finally {
          setIsLoading(false);
        }
      } else if (sessionStatus === "unauthenticated") {
        setError("Please login to view labour data");
        setHasLoaded(true);
        setIsLoading(false);
      }
    };
    fetchLabourList();
  }, [sessionStatus, session?.user?.token]);

  // Load all members for filter dropdown
  useEffect(() => {
    const fetchAllMembers = async () => {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        try {
          const response = await axios.get(
            `${
              process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/member/get_members`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setAllMembers(response.data);
        } catch (err: any) {
          console.error("Error fetching members:", err);
          setAllMembers([]);
        }
      }
    };
    fetchAllMembers();
  }, [sessionStatus, session?.user?.token]);

  // Apply all filters
  const applyFilters = () => {
    let filtered = labourList;

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (labour) => labour.labourStatus === selectedStatus.toUpperCase()
      );
    }

    // Filter by member/industry
    if (selectedMember && selectedMember !== "all") {
      filtered = filtered.filter(
        (labour) => labour.assignedTo === selectedMember
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (labour) =>
          (labour.fullName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (labour.phoneNumber?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (labour.aadharNumber?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (labour.emailId?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      );
    }

    return filtered;
  };

  const filteredLabour = applyFilters();

  // Sort labour if a sort field is selected
  const sortedLabour = [...filteredLabour].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number | undefined = "";
    let valueB: string | number | undefined = "";

    switch (sortField) {
      case "fullName":
        valueA = a.fullName || "";
        valueB = b.fullName || "";
        break;
      case "phoneNumber":
        valueA = a.phoneNumber || "";
        valueB = b.phoneNumber || "";
        break;
      case "assignedTo":
        valueA = a.labourAssignedTo?.firmName || "";
        valueB = b.labourAssignedTo?.firmName || "";
        break;
      case "labourStatus":
        valueA = a.labourStatus || "";
        valueB = b.labourStatus || "";
        break;
      case "dob":
        valueA = a.dob || "";
        valueB = b.dob || "";
        break;
      default:
        return 0;
    }

    if (!valueA) valueA = "";
    if (!valueB) valueB = "";

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Paginate the sorted labour
  const paginatedLabour = sortedLabour.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedLabour.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to labour details
  const viewLabourDetails = (labourId: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/labour/${labourId}`
    );
  };

  // Navigate to add new labour
  const addNewLabour = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/labour/add`);
  };

  // Navigate to edit labour
  const editLabour = (labourId: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/labour/${labourId}/edit/`
    );
  };

  // Delete a labour
  const handleDeleteLabour = async (labourId: string) => {
    if (!session?.user.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(labourId);
    try {
      const response = await axios.delete(
        `${
          process.env.BACKEND_API_URL || "https://tsmwa.online"
        }/api/labour/delete_labour/${labourId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast({
          title: "Success",
          description: "Labour deleted successfully.",
          variant: "default",
        });
        // Refresh the labour list
        const updatedResponse = await axios.get(
          `${
            process.env.BACKEND_API_URL || "https://tsmwa.online"
          }/api/labour/get_all_labours`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );
        setLabourList(updatedResponse.data);
      }
    } catch (err: any) {
      console.error("Error deleting labour:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete labour.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const openDeleteDialog = (labourId: string, labourName: string) => {
    setLabourToDelete({ id: labourId, name: labourName });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setLabourToDelete(null);
  };

  const confirmDelete = async () => {
    if (labourToDelete) {
      // Close dialog immediately to prevent blocking
      const labourId = labourToDelete.id;
      closeDeleteDialog();
      await handleDeleteLabour(labourId);
    }
  };

  // Update labour status
  const handleUpdateStatus = async (labourId: string, newStatus: "INACTIVE" | "ON_BENCH") => {
    if (!session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingStatus(labourId);
    try {
      const payload = {
        labourId: labourId,
        labourStatus: newStatus,
        assignedTo: null, // Clear assignment when making inactive or on bench
      };

      const response = await axios.post(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/labour/update_labour`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        description: `Labour status updated to ${newStatus === "INACTIVE" ? "Inactive" : "On Bench"} successfully.`,
      });

      // Refresh the labour list
      const refreshResponse = await axios.get(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/labour/get_all_labours`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (refreshResponse.data) {
        setLabourList(refreshResponse.data);
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update labour status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedMember("all");
    setCurrentPage(1);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Labour Management</h1>
          <p className="text-muted-foreground">
            Manage all labour personnel records
          </p>
        </div>
        <Link href={`/${renderRoleBasedPath(session?.user?.role)}/labour/add`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Labour
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, aadhar..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BENCH">Bench</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedMember}
            onValueChange={(value) => {
              setSelectedMember(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {allMembers.map((member) => (
                <SelectItem
                  key={member.membershipId}
                  value={member.membershipId}
                >
                  {(member.applicantName || "Unknown") +
                    " - " +
                    (member.firmName || "Unknown")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="flex justify-end"></div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading labour data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          hasLoaded && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("fullName")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("phoneNumber")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Phone
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Aadhar Number
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("assignedTo")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Assigned To
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("labourStatus")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLabour.length > 0 ? (
                    paginatedLabour.map((labour) => (
                      <TableRow
                        key={labour.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => viewLabourDetails(labour.labourId)}
                      >
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`${
                                process.env.BACKEND_API_URL ||
                                "https://tsmwa.online"
                              }${labour.photoPath}`}
                              alt={labour.fullName}
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <AvatarFallback>
                              {labour.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{labour.fullName || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{labour.phoneNumber || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {labour.aadharNumber || "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {labour.labourAssignedTo?.firmName || "Not Assigned"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              labour.labourStatus === "ACTIVE"
                                ? "default"
                                : labour.labourStatus === "BENCH"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {labour.labourStatus?.charAt(0).toUpperCase() +
                              labour.labourStatus?.slice(1).toLowerCase() ||
                              "Unknown"}
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
                              <DropdownMenuItem className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewLabourDetails(labour.labourId);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {(session?.user?.role === "ADMIN" ||
                                session?.user?.role === "TSMWA_EDITOR" ||
                                session?.user?.role === "TQMA_EDITOR") && (
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editLabour(labour.labourId);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Labour
                                </DropdownMenuItem>
                              )}

                              {(session?.user?.role === "ADMIN" ||
                                session?.user?.role === "TSMWA_EDITOR" ||
                                session?.user?.role === "TQMA_EDITOR") && 
                                labour.labourStatus?.toUpperCase() !== "INACTIVE" && (
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(labour.labourId, "INACTIVE");
                                  }}
                                  disabled={isUpdatingStatus === labour.labourId}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Mark as Inactive
                                </DropdownMenuItem>
                              )}

                              {(session?.user?.role === "ADMIN" ||
                                session?.user?.role === "TSMWA_EDITOR" ||
                                session?.user?.role === "TQMA_EDITOR") && 
                                labour.labourStatus?.toUpperCase() !== "ON_BENCH" && (
                                <DropdownMenuItem className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(labour.labourId, "ON_BENCH");
                                  }}
                                  disabled={isUpdatingStatus === labour.labourId}
                                >
                                  <PauseCircle className="h-4 w-4" />
                                  Mark as On Bench
                                </DropdownMenuItem>
                              )}

                              {session?.user?.role === "ADMIN" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(
                                      labour.labourId,
                                      labour.fullName || "Unknown Labour"
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Labour
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
                        No labour records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )
        )}

        {hasLoaded && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedLabour.length} of {sortedLabour.length} records
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
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Labour</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <strong>{labourToDelete?.name}</strong>? This action cannot be
                undone and will permanently remove the labour record.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting === labourToDelete?.id}
              >
                {isDeleting === labourToDelete?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Labour"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
