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
  Loader2,
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
import { useSession } from "next-auth/react";
import axios from "axios";

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
  const { data: session, status: sessionStatus } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fees, setFees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  // Set default date range: Jan 1st of current year to today
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    from: startOfYear,
    to: today,
  });
  const itemsPerPage = 10;
  const [memberOptions, setMemberOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  // Remove: const statistics = getMembershipFeeStatistics();
  // Add dynamic statistics calculation from fees:
  const totalFees = fees.length;
  const paidFees = fees.filter(fee => (fee.paymentStatus || '').toLowerCase() === 'paid').length;
  const dueFees = fees.filter(fee => (fee.paymentStatus || '').toLowerCase() === 'partial' || (fee.paymentStatus || '').toLowerCase() === 'due').length;
  const canceledFees = fees.filter(fee => (fee.paymentStatus || '').toLowerCase() === 'canceled').length;
  const totalAmount = fees.reduce((sum, fee) => sum + (parseFloat(fee.totalAmount) || 0), 0);
  const totalPaidAmount = fees.reduce((sum, fee) => sum + (parseFloat(fee.paidAmount) || 0), 0);
  const totalDueAmount = totalAmount - totalPaidAmount;
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  // Fetch all membership fees from API
  useEffect(() => {
    const fetchFees = async () => {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/bill/filterBills/null/null/null`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setFees(response.data);
        } catch (err) {
          setFees([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFees();
  }, [sessionStatus, session?.user?.token]);

  // Fetch member options from API
  useEffect(() => {
    if (fees.length > 0) {
      const uniqueMembers = Array.from(
        new Map(
          fees.map((fee) => [fee.membershipId, { membershipId: fee.membershipId, firmName: fee.firmName, applicantName: fee.applicantName }])
        ).values()
      );
      setMemberOptions(uniqueMembers);
      // Extract unique paymentStatus values
      const uniqueStatuses = Array.from(new Set(fees.map((fee) => (fee.paymentStatus || "").toLowerCase())));
      setStatusOptions(uniqueStatuses);
    }
  }, [fees]);

  // Fetch member names for each unique membershipId in fees
  useEffect(() => {
    const fetchMemberNames = async () => {
      if (fees.length > 0 && sessionStatus === "authenticated" && session?.user?.token) {
        const uniqueIds = Array.from(new Set(fees.map(fee => fee.membershipId)));
        const namesMap: Record<string, string> = {};
        await Promise.all(uniqueIds.map(async (id) => {
          try {
            const response = await axios.get(
              `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/member/get_member/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${session.user.token}`,
                },
              }
            );
            namesMap[id] = response.data.applicantName || "Unknown";
          } catch {
            namesMap[id] = "Unknown";
          }
        }));
        setMemberNames(namesMap);
      }
    };
    fetchMemberNames();
  }, [fees, sessionStatus, session?.user?.token]);

  // Apply all filters
  const applyFilters = () => {
    let filtered = fees;

    // Filter by member
    if (selectedMember && selectedMember !== "all") {
      filtered = filtered.filter((fee) => fee.membershipId === selectedMember);
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (fee) =>
          (fee.paymentStatus?.toLowerCase() || "") === selectedStatus
      );
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((fee) => {
        const feeDate = fee.fromDate ? new Date(fee.fromDate) : null;
        return (
          feeDate &&
          feeDate >= dateRange.from &&
          feeDate <= dateRange.to
        );
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (fee) =>
          (fee.billingId && fee.billingId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (fee.membershipId && fee.membershipId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (fee.notes && fee.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredFees = applyFilters();

  // Sort fees if a sort field is selected
  const sortedFees = [...filteredFees].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number = "";
    let valueB: string | number = "";

    switch (sortField) {
      case "membershipId":
        valueA = a.membershipId;
        valueB = b.membershipId;
        break;
      case "totalAmount":
        valueA = parseFloat(a.totalAmount);
        valueB = parseFloat(b.totalAmount);
        break;
      case "paidAmount":
        valueA = parseFloat(a.paidAmount);
        valueB = parseFloat(b.paidAmount);
        break;
      case "fromDate":
        valueA = a.fromDate;
        valueB = b.fromDate;
        break;
      case "toDate":
        valueA = a.toDate;
        valueB = b.toDate;
        break;
      case "paymentStatus":
        valueA = a.paymentStatus;
        valueB = b.paymentStatus;
        break;
      default:
        return 0;
    }

    if (valueA === undefined) valueA = typeof valueB === "number" ? 0 : "";
    if (valueB === undefined) valueB = typeof valueA === "number" ? 0 : "";

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
  const handleSort = (field: string) => {
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
      from: startOfYear,
      to: today,
    });
    setCurrentPage(1);
  };

  return (
    <div className="container">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <span className="text-muted-foreground">Fetching membership fees data...</span>
        </div>
      ) : (
      <>
        {/* Only show summary cards and filters when not loading */}
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
                ₹{totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalFees} fee records
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
                ₹{totalPaidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {paidFees} paid fees
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
                ₹{totalDueAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {dueFees} due fees
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
                {totalAmount > 0
                  ? `${(
                      (totalPaidAmount / totalAmount) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">
                {canceledFees} canceled fees
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
                  <SelectItem key={option.membershipId} value={option.membershipId}>
                    {memberNames[option.membershipId]
                      ? `${option.membershipId} - ${memberNames[option.membershipId]}`
                      : option.membershipId}
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
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
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
                    from: startOfYear,
                    to: today,
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
                      onClick={() => handleSort("fromDate")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Period
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("totalAmount")}
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
                      onClick={() => handleSort("paymentStatus")}
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
                      key={fee.billingId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewFeeDetails(fee.billingId)}
                    >
                      <TableCell>{fee.membershipId}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {fee.fromDate ? new Date(fee.fromDate).toLocaleDateString() : "-"} - {fee.toDate ? new Date(fee.toDate).toLocaleDateString() : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>₹{fee.totalAmount ? parseFloat(fee.totalAmount).toLocaleString() : "-"}</TableCell>
                      <TableCell>₹{fee.paidAmount ? parseFloat(fee.paidAmount).toLocaleString() : "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            fee.paymentStatus === "PAID"
                              ? "default"
                              : fee.paymentStatus === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {fee.paymentStatus
                            ? fee.paymentStatus.charAt(0).toUpperCase() + fee.paymentStatus.slice(1).toLowerCase()
                            : "-"}
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
                                viewFeeDetails(fee.billingId);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                editFee(fee.billingId);
                              }}
                            >
                              Edit Fee
                            </DropdownMenuItem>
                            {/* You may want to disable delete if not supported by API */}
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
      </>
      )}
    </div>
  );
}
