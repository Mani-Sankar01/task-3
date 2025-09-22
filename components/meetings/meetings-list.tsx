"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  ArrowUpDown,
  Calendar,
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types for the API response
interface Meeting {
  id: number;
  meetId: string;
  title: string;
  agenda: string;
  notes?: string;
  startTime: string;
  location: string;
  memberAttendees: Array<{
    id: number;
    meetId: string;
    all: boolean;
    allExecutives: boolean;
    zones: string[];
    mandals: string[];
    customMembers: string[];
  }>;
  vehicleAttendees: Array<{
    id: number;
    meetId: string;
    owner: boolean;
    driver: boolean;
    all: boolean;
    customVehicle: Array<{
      vehicleId: string;
      owner: boolean;
      driver: boolean;
    }>;
  }>;
  labourAttendees: Array<{
    id: number;
    meetId: string;
    all: boolean;
    membershipID: string[];
    custom: string[];
  }>;
  status: string;
  followUpMeeting?: Array<{
    dateTime: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  modifiedBy?: number | null;
}

export default function MeetingsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Meeting | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch meetings from API
  const fetchMeetings = async () => {
    if (status === "loading" || !session?.user?.token) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.BACKEND_API_URL}/api/meeting/get_all_meet`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      
      const meetingsData = Array.isArray(response.data) ? response.data : response.data.meetings || response.data.data || [];
      setMeetings(meetingsData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load meetings on component mount and session change
  useEffect(() => {
    fetchMeetings();
  }, [status, session?.user?.token]);

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.meetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort meetings if a sort field is selected
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number = "";
    let valueB: string | number = "";

    switch (sortField) {
      case "meetId":
        valueA = a.meetId;
        valueB = b.meetId;
        break;
      case "title":
        valueA = a.title;
        valueB = b.title;
        break;
      case "startTime":
        valueA = new Date(a.startTime).getTime();
        valueB = new Date(b.startTime).getTime();
        break;
      case "status":
        valueA = a.status;
        valueB = b.status;
        break;
      case "createdAt":
        valueA = new Date(a.createdAt || "").getTime();
        valueB = new Date(b.createdAt || "").getTime();
        break;
      case "updatedAt":
        valueA = new Date(a.updatedAt || "").getTime();
        valueB = new Date(b.updatedAt || "").getTime();
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

  // Paginate the sorted meetings
  const paginatedMeetings = sortedMeetings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedMeetings.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof Meeting) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navigate to meeting details
  const viewMeetingDetails = (meetingId: string) => {
    router.push(`/admin/meetings/${meetingId}`);
  };

  // Navigate to add new meeting
  const addNewMeeting = () => {
    router.push("/admin/meetings/add");
  };

  // Navigate to edit meeting
  const editMeeting = (meetingId: string) => {
    router.push(`/admin/meetings/${meetingId}/edit`);
  };

  // Delete a meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this meeting? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`${process.env.BACKEND_API_URL}/api/meeting/delete_meet/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${session?.user?.token}`,
          },
        });

        toast({
          title: "Success",
          description: "Meeting deleted successfully.",
        });

        // Refresh the meetings list
        await fetchMeetings();

        // Adjust pagination if needed
        if (
          currentPage > 1 &&
          (currentPage - 1) * itemsPerPage >= sortedMeetings.length - 1
        ) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error("Error deleting meeting:", error);
        toast({
          title: "Error",
          description: "Failed to delete meeting. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getAttendeeTypeLabel = (meeting: Meeting) => {
    const types = [];
    
    // Check member attendees
    if (meeting.memberAttendees && meeting.memberAttendees.length > 0) {
      const memberAttendee = meeting.memberAttendees[0];
      if (memberAttendee.all) {
        types.push("All Members");
      } else if (memberAttendee.allExecutives) {
        types.push("All Executives");
      } else if (memberAttendee.zones && memberAttendee.zones.length > 0) {
        types.push("Selected Zones");
      } else if (memberAttendee.mandals && memberAttendee.mandals.length > 0) {
        types.push("Selected Mandals");
      } else if (memberAttendee.customMembers && memberAttendee.customMembers.length > 0) {
        types.push("Selected Members");
      }
    }
    
    // Check vehicle attendees
    if (meeting.vehicleAttendees && meeting.vehicleAttendees.length > 0) {
      const vehicleAttendee = meeting.vehicleAttendees[0];
      if (vehicleAttendee.owner && vehicleAttendee.driver) {
        types.push("All Vehicle Owners & Drivers");
      } else if (vehicleAttendee.owner) {
        types.push("All Vehicle Owners");
      } else if (vehicleAttendee.driver) {
        types.push("All Vehicle Drivers");
      } else if (vehicleAttendee.customVehicle && vehicleAttendee.customVehicle.length > 0) {
        types.push("Selected Vehicles");
      }
    }
    
    // Check labour attendees
    if (meeting.labourAttendees && meeting.labourAttendees.length > 0) {
      const labourAttendee = meeting.labourAttendees[0];
      if (labourAttendee.all) {
        types.push("All Labour");
      } else if (labourAttendee.membershipID && labourAttendee.membershipID.length > 0) {
        types.push("Selected Labour");
      } else if (labourAttendee.custom && labourAttendee.custom.length > 0) {
        types.push("Selected Labour");
      }
    }
    
    return types.join(", ") || "No attendees";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading meetings...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground">Authentication required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Meetings</CardTitle>
            <CardDescription>Schedule and manage all meetings</CardDescription>
          </div>
          <Button onClick={addNewMeeting}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
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
                      onClick={() => handleSort("meetId")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("startTime")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      Date & Time
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
                  <TableHead className="hidden md:table-cell">
                    Attendees
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMeetings.length > 0 ? (
                  paginatedMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.meetId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewMeetingDetails(meeting.meetId)}
                    >
                      <TableCell className="font-medium">
                        {meeting.meetId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {meeting.agenda}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {meeting.startTime && !isNaN(new Date(meeting.startTime).getTime()) 
                              ? format(new Date(meeting.startTime), "MMM dd, yyyy 'at' HH:mm")
                              : "Invalid Date"
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            meeting.status === "COMPLETED"
                              ? "default"
                              : meeting.status === "SCHEDULED"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {meeting.status.charAt(0).toUpperCase() +
                            meeting.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {getAttendeeTypeLabel(meeting)}
                        </span>
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
                                viewMeetingDetails(meeting.meetId);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                editMeeting(meeting.meetId);
                              }}
                            >
                              Edit Meeting
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeeting(meeting.meetId);
                              }}
                            >
                              Cancel Meeting
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? "No meetings found matching your search." : "No meetings found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {paginatedMeetings.length} of {sortedMeetings.length}{" "}
              meetings
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
