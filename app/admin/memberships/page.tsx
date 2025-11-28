"use client";

import React, { useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  BananaIcon,
  BanIcon,
  CheckCheck,
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  Plus,
  Search,
  Trash2,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Define the Member type based on API response
interface Member {
  membershipId: string;
  approvalStatus: "APPROVED" | "PENDING" | "DECLINED";
  membershipStatus: "ACTIVE" | "INACTIVE" | "CANCELLED";
  nextDueDate: string | null;
  isPaymentDue: "TRUE" | "FALSE";
  electricalUscNumber: string;
  scNumber: string;
  applicantName: string;
  relation: string;
  relativeName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  firmName: string;
  proprietorName: string;
  proprietorStatus: string;
  proprietorType: string;
  sanctionedHP: string;
  phoneNumber1: string;
  phoneNumber2: string;
  surveyNumber: number;
  village: string;
  zone: string;
  mandal: string;
  district: string;
  state: string;
  pinCode: string;
  estimatedMaleWorker: number;
  estimatedFemaleWorker: number;
  membershipType?: "TSMWA" | "TQMWA";
  modifiedBy: number | null;
  approvedOrDeclinedBy: number | null;
  approvedOrDeclinedAt: string | null;
  declineReason: string | null;
  createdAt: string;
  modifiedAt: string;
}

const page = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Member | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items to show per page
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineError, setDeclineError] = useState("");
  const [showCancelMembershipDialog, setShowCancelMembershipDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [memberToCancel, setMemberToCancel] = useState<Member | null>(null);

  const { data: session, status } = useSession();
  const { toast } = useToast();

  // User role for role-based access control - get from localStorage for persistence
  useEffect(() => {
    console.log(status);
    if (status == "loading") {
      setIsLoading(true);
    }
    const role = session?.user?.role!;
    console.log(role);
    setUserRole(role);
  }, [status, session?.user?.role]);

  // Fetch members from API
  const fetchMembers = async (showLoading = true) => {
    if (status !== "authenticated" || !session?.user?.token) return;
    console.log(session?.user?.token);
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      const response = await axios.get(`${apiUrl}/api/member/get_members`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      console.log("Members API response:", response.data);

      // Handle the response structure
      let membersData: Member[] = [];
      if (response.data && Array.isArray(response.data)) {
        membersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        membersData = response.data.data;
      } else if (response.data && Array.isArray(response.data.members)) {
        membersData = response.data.members;
      }

      console.log("Processed members data:", membersData);
      console.log("Setting members state with:", membersData.length, "members");
      setMembers(membersData);
      setError(null);
      console.log("Members state updated successfully");
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setError("Failed to load members. Please try again later.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [status, session?.user?.token]);

  // Filter members based on search term and status filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || member.membershipStatus === statusFilter;

    const matchesApproval =
      approvalFilter === "all" || member.approvalStatus === approvalFilter;

    return matchesSearch && matchesStatus && matchesApproval;
  });

  // Sort members if a sort field is selected
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortField) return 0;

    let valueA, valueB;

    if (sortField === "membershipId") {
      valueA = a.membershipId;
      valueB = b.membershipId;
    } else if (sortField === "applicantName") {
      valueA = a.applicantName;
      valueB = b.applicantName;
    } else if (sortField === "firmName") {
      valueA = a.firmName;
      valueB = b.firmName;
    } else if (sortField === "approvalStatus") {
      valueA = a.approvalStatus;
      valueB = b.approvalStatus;
    } else if (sortField === "createdAt") {
      valueA = new Date(a.createdAt).getTime();
      valueB = new Date(b.createdAt).getTime();
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

  // Paginate the sorted members
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Navigate to member details
  const viewMemberDetails = (memberId: string) => {
    router.push(`/admin/memberships/${memberId}`);
  };

  // Navigate to edit member
  const editMember = (memberId: string) => {
    router.push(`/admin/memberships/add?id=${memberId}&edit=true`);
  };

  // Update member status (Active/Inactive/Cancelled)
  const handleUpdateMemberStatus = async (memberId: string, newStatus: "ACTIVE" | "INACTIVE" | "CANCELLED", note?: string) => {
    if (!session?.user?.token) {
      console.log("Token" + session?.user?.token);
      toast({
        title: "Authentication Error",
        description: "Authentication required to update member status.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";

      const payload: any = {
        membershipId: memberId,
        membershipStatus: newStatus
      };

      // Include note if provided (for cancellation)
      if (note) {
        payload.note = note;
      }

      const response = await axios.post(
        `${apiUrl}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Refresh the data to get the latest information
        await fetchMembers(false); // Don't show loading state for refresh

        toast({
          title: "Status Updated",
          description: `Member status updated to ${newStatus.toLowerCase()} successfully.`,
        });
      }
    } catch (error: any) {
      console.error("Error updating member status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update member status. Please try again.";

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel membership with reason
  const handleCancelMembership = () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for canceling the membership.");
      return;
    }

    if (!memberToCancel) {
      setCancelError("Member information not found.");
      return;
    }

    setCancelError("");
    handleUpdateMemberStatus(memberToCancel.membershipId, "CANCELLED", cancelReason.trim());
    setShowCancelMembershipDialog(false);
    setCancelReason("");
    setMemberToCancel(null);
  };

  // Handle member approval
  const handleMemberApproved = async (memberId: string) => {
    if (!session?.user?.token) {
      console.log("Token: " + session?.user?.token);
      toast({
        title: "Authentication Error",
        description: "Authentication required to approve member.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";

      const payload = {
        membershipId: memberId,
        action: "APPROVED"
      };

      console.log("Making APPROVED request for member:", memberId, payload);

      const response = await axios.post(
        `${apiUrl}/api/member/approve_decline_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("response:", response);
      console.log("APPROVED response status:", response.status);

      console.log("APPROVED response:", response.data);
      console.log("APPROVED response status:", response.status);

      if (response.status === 200) {
        console.log("Approve API call successful, showing toast...");

        // Show toast first
        toast({
          title: "Action Completed",
          description: "Member approved successfully.",
        });

        // Then refresh the data to get the latest information
        console.log("Refreshing members data after approve...");
        await fetchMembers(false); // Don't show loading state for refresh
        console.log("Members data refreshed successfully after approve");

        return true;
      } else {
        console.log("Approve API call failed - status not 200:", response.status);
        toast({
          title: "Action Failed",
          description: "Failed to approve member. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error approving member:", error);
      const errorMessage = error.response?.data?.message || "Failed to approve member. Please try again.";

      toast({
        title: "Action Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle member decline
  const handleMemberDeclined = async (memberId: string, declineReason: string) => {
    if (!session?.user?.token) {
      console.log("Token: " + session?.user?.token);
      toast({
        title: "Authentication Error",
        description: "Authentication required to decline member.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";

      const payload = {
        membershipId: memberId,
        action: "DECLINED",
        declineReason: declineReason
      };

      console.log("Making DECLINED request for member:", memberId, payload);

      const response = await axios.post(
        `${apiUrl}/api/member/approve_decline_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("response:", response);

      console.log("DECLINED response:", response.data);
      console.log("DECLINED response status:", response.status);

      if (response.status === 200) {
        console.log("Decline API call successful, showing toast...");

        // Show toast first
        toast({
          title: "Action Completed",
          description: "Member declined successfully.",
        });

        // Then refresh the data to get the latest information
        console.log("Refreshing members data after decline...");
        await fetchMembers(false); // Don't show loading state for refresh
        console.log("Members data refreshed successfully after decline");

        return true;
      } else {
        console.log("Decline API call failed - status not 200:", response.status);
        setDeclineError("Failed to decline member. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Error declining member:", error);
      const errorMessage = error.response?.data?.message || "Failed to decline member. Please try again.";

      setDeclineError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline submission
  const handleDeclineSubmit = async () => {
    console.log("handleDeclineSubmit called");
    console.log("selectedMember:", selectedMember);
    console.log("declineReason:", declineReason);

    if (!selectedMember || !declineReason.trim()) {
      console.log("Validation failed - missing member or reason");
      return;
    }

    // Clear any previous errors
    setDeclineError("");

    // Use the new handleMemberDeclined function
    const success = await handleMemberDeclined(selectedMember.membershipId, declineReason.trim());

    if (success) {
      // Close the dialog and reset state after successful decline
      setShowDeclineDialog(false);
      setDeclineReason("");
      setDeclineError("");
      setSelectedMember(null);
      console.log("Decline process completed successfully");
    } else {
      console.log("Decline process failed, dialog remains open");
    }
  };

  // Delete a member
  const handleDeleteMember = async (
    memberId: string,
    closeDialog?: () => void
  ) => {
    // Close dialog if provided
    if (closeDialog) {
      closeDialog();
    }

    try {
      if (status !== "authenticated" || !session?.user?.token) {
        toast({
          title: "Authentication Error",
          description: "Authentication required to delete member.",
          variant: "destructive",
        });
        return;
      }

      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
      await axios.post(
        `${apiUrl}/api/member/delete_members`,
        {
          membershipIds: [memberId],
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh the data to get the latest information
      await fetchMembers(false); // Don't show loading state for refresh

      // If we're on a page that would now be empty, go back one page
      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedMembers.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }

      // Show toast notification
      toast({
        title: "Member Deleted",
        description: "The member has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting member:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to delete member. Please try again.";

      // Show toast notification
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading memberships...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Error</p>
                <p className="text-muted-foreground">{error}</p>
                <Button
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Memberships" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-2xl">Memberships</CardTitle>
              <CardDescription>
                Manage all organization memberships
              </CardDescription>
            </div>
            <Link href={"/admin/memberships/add"}>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, firm or ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when search changes
                    }}
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="flex gap-4">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={approvalFilter}
                    onValueChange={(value) => {
                      setApprovalFilter(value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Approvals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Approvals</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="DECLINED">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("membershipId")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Member Name
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Firm Name
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Membership Type
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Status
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Join Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Approval
                    </TableHead>

                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.length > 0 ? (
                    paginatedMembers.map((member) => (
                      <TableRow
                        key={member.membershipId}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell
                          className="font-medium"
                          onClick={() => viewMemberDetails(member.membershipId)}
                        >
                          {member.membershipId}
                        </TableCell>
                        <TableCell>{member.applicantName}</TableCell>
                        <TableCell>{member.firmName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {member.membershipType === "TSMWA"
                              ? "Tandur Stone Merchant"
                              : member.membershipType === "TQMWA"
                                ? "Tandur Query Mandal"
                                : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              member.membershipStatus === "ACTIVE"
                                ? "default"
                                : member.membershipStatus === "INACTIVE"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {member.membershipStatus.charAt(0).toUpperCase() +
                              member.membershipStatus.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              member.approvalStatus === "APPROVED"
                                ? "default"
                                : member.approvalStatus === "DECLINED"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {member.approvalStatus.charAt(0).toUpperCase() +
                              member.approvalStatus.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="default" className="h-8 w-8 p-0 cursor-pointer mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewMemberDetails(member.membershipId);
                            }}
                          >
                            <EyeIcon className=" h-4 w-4" />

                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" className="h-8 w-8 p-0 cursor-pointer">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Link
                                  href={`/admin/memberships/${member.membershipId}`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <EyeIcon className=" h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>

                              {/* Show Edit option only for Admin or Editor roles */}
                              {session?.user.role! === "ADMIN" && (
                                <DropdownMenuItem>
                                  <Link
                                    href={`/admin/memberships/${member.membershipId}/edit`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                    Edit Member
                                  </Link>
                                </DropdownMenuItem>
                              )}

                              {/* Show Delete option only for Admin role */}
                              {session?.user.role! === "ADMIN" && (
                                <>
                                  {member.membershipStatus === "ACTIVE" && (
                                    <>
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => handleUpdateMemberStatus(member.membershipId, "INACTIVE")}
                                        disabled={isProcessing}
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                        Make Inactive
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => {
                                          setMemberToCancel(member);
                                          setCancelReason("");
                                          setCancelError("");
                                          setShowCancelMembershipDialog(true);
                                        }}
                                        disabled={isProcessing}
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                        Cancel Membership
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {member.membershipStatus === "INACTIVE" && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handleUpdateMemberStatus(member.membershipId, "ACTIVE")}
                                      disabled={isProcessing}
                                    >
                                      <CheckCheck className="h-4 w-4 text-green-600" />
                                      Make Active
                                    </DropdownMenuItem>
                                  )}

                                  {member.membershipStatus === "CANCELLED" && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handleUpdateMemberStatus(member.membershipId, "ACTIVE")}
                                      disabled={isProcessing}
                                    >
                                      <CheckCheck className="h-4 w-4 text-green-600" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}

                                  {member.approvalStatus === "PENDING" && (
                                    <>
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => handleMemberApproved(member.membershipId)}
                                        disabled={isProcessing}
                                      >
                                        <CheckCheck className="h-4 w-4 text-green-600" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setShowDeclineDialog(true);
                                          setDeclineError("");
                                        }}
                                        disabled={isProcessing}
                                      >
                                        <BanIcon className="h-4 w-4 text-red-600" />
                                        Decline
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {member.approvalStatus === "APPROVED" && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setShowDeclineDialog(true);
                                        setDeclineError("");
                                      }}
                                      disabled={isProcessing}
                                    >
                                      <BanIcon className="h-4 w-4 text-red-600" />
                                      Decline
                                    </DropdownMenuItem>
                                  )}

                                  {member.approvalStatus === "DECLINED" && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handleMemberApproved(member.membershipId)}
                                      disabled={isProcessing}
                                    >
                                      <CheckCheck className="h-4 w-4 text-green-600" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}

                                  {/* <Dialog>
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                        Delete Member
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <span className="text-destructive">
                                            ⚠️
                                          </span>
                                          Confirm Delete
                                        </DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete{" "}
                                          <span className="font-semibold">
                                            {member.applicantName}
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
                                              handleDeleteMember(
                                                member.membershipId
                                              )
                                            }
                                          >
                                            Delete Member
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog> */}
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
                        No members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedMembers.length} of {sortedMembers.length}{" "}
                members
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
          </CardContent>
        </Card>

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BanIcon className="h-5 w-5 text-red-500" />
                Decline Member
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for declining {selectedMember?.applicantName} ({selectedMember?.membershipId})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
              {declineError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {declineError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineReason("");
                  setDeclineError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={isProcessing || !declineReason.trim()}
              >
                <BanIcon className="h-4 w-4 mr-2" />
                Decline Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Membership Dialog */}
        <Dialog open={showCancelMembershipDialog} onOpenChange={setShowCancelMembershipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                Cancel Membership
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for canceling membership for {memberToCancel?.applicantName} ({memberToCancel?.membershipId})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Enter reason for canceling membership..."
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelError("");
                  }}
                  rows={4}
                />
              </div>
              {cancelError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {cancelError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelMembershipDialog(false);
                  setCancelReason("");
                  setCancelError("");
                  setMemberToCancel(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelMembership}
                disabled={isProcessing || !cancelReason.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Membership
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
};

export default page;
