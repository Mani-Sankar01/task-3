"use client";

import React, { useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { useState } from "react";
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
// import { getAllMembers, type Member, deleteMember } from "@/data/members";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { memberApi, type Member } from "@/services/api";

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
  const session = useSession();

  // User role for role-based access control - get from localStorage for persistence
  useEffect(() => {
    console.log(session.status);
    if (session.status == "loading") {
      setIsLoading(true);
    }
    const role = session?.data?.user.role!;
    console.log(role);
    setUserRole(role);
  }, [session.status]);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const data = await memberApi.getAllMembers();
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load members. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [session.status]);

  // Filter members based on search term
  const filteredMembers = members.filter(
    (member) =>
      member.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Delete a member
  const handleDeleteMember = async (memberId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this member? This action cannot be undone."
      )
    ) {
      await memberApi.deleteMember(memberId);
      // Refresh the list
      const updatedMembers = await memberApi.getAllMembers();
      setMembers(updatedMembers);

      // If we're on a page that would now be empty, go back one page
      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedMembers.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }
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
              <div className="relative">
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
                              member.membershipStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(member.createdAt).toLocaleDateString()}
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
                              <DropdownMenuItem>
                                <Link
                                  href={`/admin/memberships/${member.membershipId}`}
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>

                              {/* Show Edit option only for Admin or Editor roles */}
                              {(session?.data?.user.role! === "ADMIN" ||
                                userRole === "TSMWA_EDITOR") && (
                                <DropdownMenuItem>
                                  <Link
                                    href={`/admin/memberships/${member.membershipId}/edit`}
                                  >
                                    Edit Member
                                  </Link>
                                </DropdownMenuItem>
                              )}

                              {/* Show Delete option only for Admin role */}
                              {session?.data?.user.role! === "ADMIN" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMember(member.membershipId);
                                  }}
                                >
                                  Delete Member
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
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
      </div>
    </SidebarInset>
  );
};

export default page;
