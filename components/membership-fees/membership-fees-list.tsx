"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
  DollarSign,
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
import { DateRangePicker } from "@/components/vehicles/date-range-picker";
import { format, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getAllMembershipFees,
  deleteMembershipFee,
  getMemberNameById,
  getMemberOptions,
  getMembershipFeeStatistics,
  type MembershipFee,
  type MembershipFeeStatus,
} from "@/data/membership-fees";

export default function MembershipFeesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof MembershipFee | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fees, setFees] = useState<MembershipFee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const itemsPerPage = 10;
  const memberOptions = getMemberOptions();
  const statistics = getMembershipFeeStatistics();

  // Load membership fees on component mount
  useEffect(() => {
    setFees(getAllMembershipFees());
  }, []);

  // Apply all filters
  const applyFilters = () => {
    let filtered = fees;

    // Filter by member
    if (selectedMember && selectedMember !== "all") {
      filtered = filtered.filter((fee) => fee.memberId === selectedMember);
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (fee) => fee.status === (selectedStatus as MembershipFeeStatus)
      );
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      filtered = filtered.filter((fee) => {
        return fee.periodFrom >= fromDate && fee.periodFrom <= toDate;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (fee) =>
          fee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getMemberNameById(fee.memberId)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (fee.receiptNumber &&
            fee.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredFees = applyFilters();

  // Sort fees if a sort field is selected
  const sortedFees = [...filteredFees].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number | undefined = "";
    let valueB: string | number | undefined = "";

    switch (sortField) {
      case "memberId":
        valueA = getMemberNameById(a.memberId);
        valueB = getMemberNameById(b.memberId);
        break;
      case "amount":
        valueA = a.amount;
        valueB = b.amount;
        break;
      case "paidAmount":
        valueA = a.paidAmount;
        valueB = b.paidAmount;
        break;
      case "paidDate":
        valueA = a.paidDate || "";
        valueB = b.paidDate || "";
        break;
      case "periodFrom":
        valueA = a.periodFrom;
        valueB = b.periodFrom;
        break;
      case "periodTo":
        valueA = a.periodTo;
        valueB = b.periodTo;
        break;
      case "status":
        valueA = a.status;
        valueB = b.status;
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

  // Paginate the sorted fees
  const paginatedFees = sortedFees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedFees.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof MembershipFee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to fee details
  const viewFeeDetails = (feeId: string) => {
    router.push(`/admin/membership-fees/${feeId}`);
  };

  // Navigate to add new fee
  const addNewFee = () => {
    router.push("/admin/membership-fees/add");
  };

  // Navigate to edit fee
  const editFee = (feeId: string) => {
    router.push(`/admin/membership-fees/${feeId}/edit`);
  };

  // Delete a fee
  const handleDeleteFee = (feeId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this membership fee? This action cannot be undone."
      )
    ) {
      deleteMembershipFee(feeId);
      setFees(getAllMembershipFees());

      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedFees.length - 1
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Membership Fees</h1>
          <p className="text-muted-foreground">
            Manage all membership fee payments
          </p>
        </div>
        <Button onClick={addNewFee}>
          <Plus className="mr-2 h-4 w-4" /> Add Fee
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{statistics.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalFees} fee records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{statistics.totalPaidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.paidFees} paid fees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₹{statistics.totalDueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.dueFees} due fees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collection Rate
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalAmount > 0
                ? `${(
                    (statistics.totalPaidAmount / statistics.totalAmount) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.canceledFees} canceled fees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, member, receipt..."
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
              <SelectValue placeholder="All Members" />
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
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="due">Due</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <DateRangePicker
            date={dateRange}
            onDateChange={(newRange: any) => {
              if (newRange?.from && newRange?.to) {
                setDateRange(newRange);
              } else if (newRange?.from) {
                setDateRange({ from: newRange.from, to: newRange.from });
              } else {
                setDateRange({
                  from: subMonths(new Date(), 3),
                  to: new Date(),
                });
              }
              setCurrentPage(1);
            }}
          />
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("memberId")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Member
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("periodFrom")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Period
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amount")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("paidAmount")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Paid
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("paidDate")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Paid Date
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFees.length > 0 ? (
                paginatedFees.map((fee) => (
                  <TableRow
                    key={fee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewFeeDetails(fee.id)}
                  >
                    <TableCell>{getMemberNameById(fee.memberId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(fee.periodFrom).toLocaleDateString()} -{" "}
                          {new Date(fee.periodTo).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                    <TableCell>₹{fee.paidAmount.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {fee.paidDate
                        ? new Date(fee.paidDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          fee.status === "paid"
                            ? "default"
                            : fee.status === "due"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {fee.status.charAt(0).toUpperCase() +
                          fee.status.slice(1)}
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
                              viewFeeDetails(fee.id);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              editFee(fee.id);
                            }}
                          >
                            Edit Fee
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFee(fee.id);
                            }}
                          >
                            Delete Fee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No membership fees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedFees.length} of {sortedFees.length} fees
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
      </div>
    </div>
  );
}
