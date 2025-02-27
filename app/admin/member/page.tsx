"use client";

import React from "react";
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
import { getAllMembers, type Member, deleteMember } from "@/data/members";
import Link from "next/link";

const page = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Member | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [members, setMembers] = useState(() => getAllMembers());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items to show per page

  // Filter members based on search term
  const filteredMembers = members.filter(
    (member) =>
      member.memberDetails.applicantName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.firmDetails.firmName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort members if a sort field is selected
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortField) return 0;

    let valueA, valueB;

    if (sortField === "id") {
      valueA = a.id;
      valueB = b.id;
    } else if (sortField === "memberDetails") {
      valueA = a.memberDetails.applicantName;
      valueB = b.memberDetails.applicantName;
    } else if (sortField === "firmDetails") {
      valueA = a.firmDetails.firmName;
      valueB = b.firmDetails.firmName;
    } else if (sortField === "status") {
      valueA = a.status;
      valueB = b.status;
    } else if (sortField === "joinDate") {
      valueA = new Date(a.joinDate).getTime();
      valueB = new Date(b.joinDate).getTime();
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
    router.push(`/membership-details?id=${memberId}`);
  };

  // Navigate to add new member
  const addNewMember = () => {
    router.push("/add-member");
  };

  // Navigate to edit member
  const editMember = (memberId: string) => {
    router.push(`/add-member?id=${memberId}&edit=true`);
  };

  // Delete a member
  const handleDeleteMember = (memberId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this member? This action cannot be undone."
      )
    ) {
      deleteMember(memberId);
      setMembers(getAllMembers());

      // If we're on a page that would now be empty, go back one page
      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedMembers.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    }
  };
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
            <Link href={"/admin/add-member"}>
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
                        onClick={() => handleSort("joinDate")}
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
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => viewMemberDetails(member.id)}
                      >
                        <TableCell className="font-medium">
                          {member.id}
                        </TableCell>
                        <TableCell>
                          {member.memberDetails.applicantName}
                        </TableCell>
                        <TableCell>{member.firmDetails.firmName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : member.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {member.status.charAt(0).toUpperCase() +
                              member.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(member.joinDate).toLocaleDateString()}
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
                                  viewMemberDetails(member.id);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editMember(member.id);
                                }}
                              >
                                Edit Member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMember(member.id);
                                }}
                              >
                                Delete Member
                              </DropdownMenuItem>
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
