"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Phone,
  User,
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
  getAllLabour,
  deleteLabour,
  getMemberNameById,
  type Labour,
  type LabourStatus,
} from "@/data/labour";
import Link from "next/link";

export default function LabourList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Labour | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [labourList, setLabourList] = useState<Labour[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const itemsPerPage = 10;

  // Load labour list on component mount
  useEffect(() => {
    setLabourList(getAllLabour());
  }, []);

  // Apply all filters
  const applyFilters = () => {
    let filtered = labourList;

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (labour) => labour.status === (selectedStatus as LabourStatus)
      );
    }

    // Filter by member/industry
    if (selectedMember && selectedMember !== "all") {
      filtered = filtered.filter(
        (labour) => labour.currentMemberId === selectedMember
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (labour) =>
          labour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          labour.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          labour.aadharNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (labour.email &&
            labour.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
      case "name":
        valueA = a.name;
        valueB = b.name;
        break;
      case "phone":
        valueA = a.phone;
        valueB = b.phone;
        break;
      case "currentMemberId":
        valueA = getMemberNameById(a.currentMemberId || "");
        valueB = getMemberNameById(b.currentMemberId || "");
        break;
      case "status":
        valueA = a.status;
        valueB = b.status;
        break;
      case "dateOfBirth":
        valueA = a.dateOfBirth;
        valueB = b.dateOfBirth;
        break;
      case "employedFrom":
        valueA = a.employedFrom;
        valueB = b.employedFrom;
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
  const handleSort = (field: keyof Labour) => {
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
    router.push(`/admin/labour/${labourId}`);
  };

  // Navigate to add new labour
  const addNewLabour = () => {
    router.push("/admin/labour/add");
  };

  // Navigate to edit labour
  const editLabour = (labourId: string) => {
    router.push(`/admin/labour/${labourId}/edit/`);
  };

  // Delete a labour
  const handleDeleteLabour = (labourId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this labour record? This action cannot be undone."
      )
    ) {
      deleteLabour(labourId);
      setLabourList(getAllLabour());

      if (
        currentPage > 1 &&
        (currentPage - 1) * itemsPerPage >= sortedLabour.length - 1
      ) {
        setCurrentPage(currentPage - 1);
      }
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
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Labour Management</h1>
          <p className="text-muted-foreground">
            Manage all labour personnel records
          </p>
        </div>
        <Link href={"/admin/labour/add"}>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="bench">Bench</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {labourList
                .map((labour) => labour.currentMemberId)
                .filter(
                  (memberId, index, self) =>
                    memberId && self.indexOf(memberId) === index
                )
                .map((memberId) => (
                  <SelectItem key={memberId} value={memberId || ""}>
                    {getMemberNameById(memberId || "")}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="flex justify-end"></div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("phone")}
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
                    onClick={() => handleSort("currentMemberId")}
                    className="flex items-center p-0 h-auto font-medium"
                  >
                    Current Industry
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
              {paginatedLabour.length > 0 ? (
                paginatedLabour.map((labour) => (
                  <TableRow
                    key={labour.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewLabourDetails(labour.id)}
                  >
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={labour.photoUrl} alt={labour.name} />
                        <AvatarFallback>{labour.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{labour.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{labour.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {labour.aadharNumber}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {labour.currentMemberId
                        ? getMemberNameById(labour.currentMemberId)
                        : "Not Assigned"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          labour.status === "active"
                            ? "default"
                            : labour.status === "bench"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {labour.status.charAt(0).toUpperCase() +
                          labour.status.slice(1)}
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
                              viewLabourDetails(labour.id);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              editLabour(labour.id);
                            }}
                          >
                            Edit Labour
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLabour(labour.id);
                            }}
                          >
                            Delete Labour
                          </DropdownMenuItem>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedLabour.length} of {sortedLabour.length} records
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
