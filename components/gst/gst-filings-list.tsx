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
import { DateRangePicker } from "@/components/vehicles/date-range-picker";
import { format, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getAllGstFilings,
  deleteGstFiling,
  getMemberNameById,
  getGstFilingsByDateRange,
  type GstFiling,
  type GstFilingStatus,
} from "@/data/gst-filings";
import { getMemberOptions } from "@/data/gst-filings";
import Link from "next/link";

export default function GstFilingsList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof GstFiling | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filings, setFilings] = useState(() => getAllGstFilings());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const memberOptions = getMemberOptions();

  // Apply all filters
  const applyFilters = () => {
    let filtered = getAllGstFilings();

    // Filter by member
    if (selectedMember && selectedMember !== "all") {
      filtered = filtered.filter(
        (filing) => filing.membershipId === selectedMember
      );
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (filing) => filing.status === (selectedStatus as GstFilingStatus)
      );
    }

    // // Filter by date range
    // if (dateRange.from && dateRange.to) {
    //   const fromDate = format(dateRange.from, "yyyy-MM-dd");
    //   const toDate = format(dateRange.to, "yyyy-MM-dd");
    //   filtered = getGstFilingsByDateRange(fromDate, toDate);
    // }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (filing) =>
          filing.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          filing.filingPeriod
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getMemberNameById(filing.membershipId)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredFilings = applyFilters();

  // Sort filings if a sort field is selected
  const sortedFilings = [...filteredFilings].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number = "";
    let valueB: string | number = "";

    switch (sortField) {
      case "id":
        valueA = a.id;
        valueB = b.id;
        break;
      case "membershipId":
        valueA = getMemberNameById(a.membershipId);
        valueB = getMemberNameById(b.membershipId);
        break;
      case "filingPeriod":
        valueA = a.filingPeriod;
        valueB = b.filingPeriod;
        break;
      case "filingDate":
        valueA = a.filingDate || "9999-99-99"; // Sort empty dates last
        valueB = b.filingDate || "9999-99-99";
        break;
      case "dueDate":
        valueA = a.dueDate;
        valueB = b.dueDate;
        break;
      case "totalAmount":
        valueA = a.totalAmount;
        valueB = b.totalAmount;
        break;
      case "totalTaxableAmount":
        valueA = a.totalTaxableAmount;
        valueB = b.totalTaxableAmount;
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

  // Paginate the sorted filings
  const paginatedFilings = sortedFilings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedFilings.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof GstFiling) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to filing details
  const viewFilingDetails = (filingId: string) => {
    router.push(`/admin/gst-filings/${filingId}`);
  };

  // Navigate to add new filing
  const addNewFiling = () => {
    router.push("/admin/gst-filings/add");
  };

  // Navigate to edit filing
  const editFiling = (filingId: string) => {
    router.push(`/admin/gst-filings/${filingId}/edit`);
  };

  // Delete a filing
  const handleDeleteFiling = (filingId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this GST filing? This action cannot be undone."
      )
    ) {
      deleteGstFiling(filingId);
      setFilings(getAllGstFilings());

      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedFilings.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMember("all");
    setSelectedStatus("all");
    setDateRange({
      from: subMonths(new Date(), 3),
      to: new Date(),
    });
    setCurrentPage(1);
  };

  return (
    <div className="container">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">GST Filings</CardTitle>
            <CardDescription>
              Manage all GST filings for memberships
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href={"/admin/gst-filings/add"}>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add GST Filing
              </Button>
            </Link>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search filings..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select
                value={selectedMember}
                onValueChange={(value) => {
                  setSelectedMember(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {memberOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                </SelectContent>
              </Select>
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
                      Member
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("filingPeriod")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Period
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dueDate")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Due Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalTaxableAmount")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Taxable Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalAmount")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Tax Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
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
                {paginatedFilings.length > 0 ? (
                  paginatedFilings.map((filing) => (
                    <TableRow
                      key={filing.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewFilingDetails(filing.id)}
                    >
                      <TableCell className="font-medium">{filing.id}</TableCell>
                      <TableCell>
                        {getMemberNameById(filing.membershipId)}
                      </TableCell>
                      <TableCell>{filing.filingPeriod}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(filing.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ₹{filing.totalTaxableAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ₹{filing.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            filing.status === "filled"
                              ? "default"
                              : filing.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {filing.status.charAt(0).toUpperCase() +
                            filing.status.slice(1)}
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
                                viewFilingDetails(filing.id);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                editFiling(filing.id);
                              }}
                            >
                              Edit Filing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFiling(filing.id);
                              }}
                            >
                              Delete Filing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No GST filings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedFilings.length} of {sortedFilings.length} filings
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
