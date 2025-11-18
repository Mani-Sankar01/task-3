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
  Trash2,
  Eye,
  Edit,
  XCircle,
  Bell,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { renderRoleBasedPath } from "@/lib/utils";

// Types for the API response
interface MemberAttendeePayload {
  id?: number;
  meetId?: string;
  all?: boolean;
  allExecutives?: boolean;
  zones?: Array<{ zone: string }> | string[];
  mandals?: Array<{ mandal: string }> | string[];
  customMembers?: Array<{ membershipId: string }> | string[];
}

interface VehicleAttendeePayload {
  id?: number;
  meetId?: string;
  owner?: boolean;
  driver?: boolean;
  all?: boolean;
  customVehicle?: Array<{
    vehicleId: string;
    owner?: boolean;
    driver?: boolean;
  }>;
}

interface LabourAttendeePayload {
  id?: number;
  meetId?: string;
  all?: boolean;
  membershipID?: string[];
  customLabours?: Array<{
    id?: number;
    labourId: string;
  }> | string[];
}

interface Meeting {
  id: number;
  meetId: string;
  title: string;
  agenda: string;
  notes?: string;
  startTime: string;
  location: string;
  memberAttendees?: MemberAttendeePayload[] | MemberAttendeePayload | null;
  vehicleAttendees?: VehicleAttendeePayload[] | VehicleAttendeePayload | null;
  labourAttendees?: LabourAttendeePayload[] | LabourAttendeePayload | null;
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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200];
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<{ id: string; title: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSendingReminder, setIsSendingReminder] = useState<string | null>(null);

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
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/meetings/${meetingId}`);
  };

  // Navigate to add new meeting
  const addNewMeeting = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/meetings/add`);
  };

  // Navigate to edit meeting
  const editMeeting = (meetingId: string) => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/meetings/${meetingId}/edit`);
  };

  // Delete a meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete meetings",
        variant: "destructive"
      });
      return;
    }

    const meeting = meetings.find((item) => item.meetId === meetingId);
    if (!meeting) {
      toast({
        title: "Meeting Not Found",
        description: "Unable to find meeting details. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    if (meeting.status !== "CANCELLED") {
      toast({
        title: "Action Required",
        description: "Cancel the meeting first in order to delete it.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.BACKEND_API_URL}/api/meeting/delete_meet/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      toast({
        title: "Meeting Deleted",
        description: "Meeting has been deleted successfully."
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
    } catch (error: any) {
      console.error("Error deleting meeting:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Failed to delete meeting. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Meeting not found or already deleted";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open cancel dialog
  const openCancelDialog = (meetingId: string, meetingTitle: string) => {
    setMeetingToCancel({ id: meetingId, title: meetingTitle });
    setCancelReason("");
    setShowCancelDialog(true);
  };

  // Close cancel dialog
  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setMeetingToCancel(null);
    setCancelReason("");
  };

  // Cancel a meeting with reason
  const handleCancelMeeting = async () => {
    if (!session?.user?.token || !meetingToCancel) {
      return;
    }

    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancelling the meeting.",
        variant: "destructive"
      });
      return;
    }

    setIsCancelling(true);
    try {
      const payload = {
        meetId: meetingToCancel.id,
        status: "CANCELLED",
        notes: cancelReason,
      };

      await axios.post(
        `${process.env.BACKEND_API_URL}/api/meeting/update_meeting`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      toast({
        title: "Meeting Cancelled",
        description: "Meeting has been cancelled successfully."
      });

      // Refresh the meetings list
      await fetchMeetings();
      
      // Close dialog
      closeCancelDialog();
    } catch (error: any) {
      console.error("Error cancelling meeting:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to cancel meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Send meeting reminder
  const handleSendReminder = async (meetingId: string) => {
    if (!session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive"
      });
      return;
    }

    setIsSendingReminder(meetingId);
    try {
      const response = await axios.get(
        `${process.env.BACKEND_API_URL}/api/meeting/meeting_reminder?meetId=${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.data.Success) {
        toast({
          title: "Reminder Sent",
          description: "Meeting reminder has been sent successfully."
        });
      } else {
        throw new Error("Failed to send reminder");
      }
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingReminder(null);
    }
  };

  const normalizeAttendee = <T,>(value: T | T[] | null | undefined): T | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const getAttendeeTypeLabel = (meeting: Meeting): string => {
    const types: string[] = [];

    const memberAttendee = normalizeAttendee(meeting.memberAttendees);
    const vehicleAttendee = normalizeAttendee(meeting.vehicleAttendees);
    const labourAttendee = normalizeAttendee(meeting.labourAttendees);

    if (memberAttendee) {
      if (memberAttendee.all) {
        types.push("All Members");
      } else if (memberAttendee.allExecutives) {
        types.push("All Executives");
      } else if (memberAttendee.zones && memberAttendee.zones.length > 0) {
        const zoneCount = Array.isArray(memberAttendee.zones) ? memberAttendee.zones.length : 0;
        types.push(`Selected Zones (${zoneCount} zone(s))`);
      } else if (memberAttendee.mandals && memberAttendee.mandals.length > 0) {
        const mandalCount = Array.isArray(memberAttendee.mandals) ? memberAttendee.mandals.length : 0;
        types.push(`Selected Mandals (${mandalCount} mandal(s))`);
      } else if (memberAttendee.customMembers && memberAttendee.customMembers.length > 0) {
        const memberCount = Array.isArray(memberAttendee.customMembers) ? memberAttendee.customMembers.length : 0;
        types.push(`Selected Members (${memberCount} member(s))`);
      } else if (memberAttendee.zones || memberAttendee.mandals || memberAttendee.customMembers) {
        // Show type even if arrays are empty (when switching types)
        if (memberAttendee.zones !== undefined) {
          types.push("Selected Zones");
        } else if (memberAttendee.mandals !== undefined) {
          types.push("Selected Mandals");
        } else if (memberAttendee.customMembers !== undefined) {
          types.push("Selected Members");
        }
      }
    }

    if (vehicleAttendee) {
      if (vehicleAttendee.all) {
        // All vehicles
        if (vehicleAttendee.owner && vehicleAttendee.driver) {
          types.push("All Vehicle Owners & Drivers");
        } else if (vehicleAttendee.owner) {
          types.push("All Vehicle Owners");
        } else if (vehicleAttendee.driver) {
          types.push("All Vehicle Drivers");
        }
      } else {
        // Selected vehicles
        const vehicleLabels = [];
        if (vehicleAttendee.owner) vehicleLabels.push("Owners");
        if (vehicleAttendee.driver) vehicleLabels.push("Drivers");
        if (vehicleLabels.length > 0) {
          const customCount = vehicleAttendee.customVehicle?.length || 0;
          if (customCount > 0) {
            types.push(`Selected Vehicle ${vehicleLabels.join(" & ")} (${customCount} vehicle(s))`);
          } else {
            types.push(`Selected Vehicle ${vehicleLabels.join(" & ")}`);
          }
        } else if (vehicleAttendee.customVehicle && vehicleAttendee.customVehicle.length > 0) {
          types.push("Selected Vehicles");
        }
      }
    }

    if (labourAttendee) {
      if (labourAttendee.all) {
        types.push("All Labour");
      } else if (labourAttendee.membershipID && labourAttendee.membershipID.length > 0) {
        types.push("Selected Labour");
      } else if (labourAttendee.customLabours && labourAttendee.customLabours.length > 0) {
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
    <div className="">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">Meetings</CardTitle>
            <CardDescription>Schedule and manage all meetings</CardDescription>
          </div>
          {(session?.user?.role === "ADMIN" ||
            session?.user?.role === "TQMA_EDITOR" ||
            session?.user?.role === "TSMWA_EDITOR") &&
          <Button onClick={addNewMeeting}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
          </Button>
          }
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
                  <TableHead className="w-[140px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("meetId")}
                      className="flex items-center p-0 h-auto font-medium"
                    >
                      ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
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
                      className="hover:bg-muted/50"
                    >
                      <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => viewMeetingDetails(meeting.meetId)}
                      >
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
                              <Eye className="mr-1 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {(session?.user?.role === "ADMIN" || session?.user?.role === "TSMWA_EDITOR" || session?.user?.role === "TQMA_EDITOR") && (<>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                editMeeting(meeting.meetId);
                              }}
                            >
                              <Edit className="mr-1 h-4 w-4" /> Edit Meeting
                            </DropdownMenuItem>

                            {meeting.status?.toUpperCase() === "SCHEDULED" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendReminder(meeting.meetId);
                                }}
                                disabled={isSendingReminder === meeting.meetId}
                              >
                                <Bell className="mr-1 h-4 w-4" /> Send Reminder
                              </DropdownMenuItem>
                            )}
                            
                            {meeting.status?.toUpperCase() !== "CANCELLED" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCancelDialog(meeting.meetId, meeting.title);
                                }}
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Cancel Meeting
                              </DropdownMenuItem>
                            )}
                            </>)}
                            <DropdownMenuSeparator />
                            {session?.user?.role === "ADMIN" && (<>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-1 h-4 w-4" /> Delete Meeting
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <span className="text-destructive">
                                      ⚠️
                                    </span>
                                    Delete Meeting
                                  </DialogTitle>
                                  <DialogDescription>
                                  {meeting.status?.toUpperCase() !== "CANCELLED" ? "Cancel the meeting first in order to delete it." : 
                                   <> Are you sure you want to delete meeting{" "}
                                    <span className="font-semibold">
                                      {meeting.meetId}
                                    </span>
                                    ? This action cannot be undone.</>}
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
                                        handleDeleteMeeting(meeting.meetId)
                                      }
                                      disabled={isDeleting || meeting.status?.toUpperCase() !== "CANCELLED"}
                                    >
                                      Delete
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog></>)}
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedMeetings.length} of {sortedMeetings.length} meetings
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

      {/* Cancel Meeting Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel meeting{" "}
              <span className="font-semibold">{meetingToCancel?.title}</span>?
              Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter reason for cancelling this meeting..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeCancelDialog}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelMeeting}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Meeting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
