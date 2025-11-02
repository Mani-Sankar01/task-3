"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Calendar, Clock, MapPin, Users, Edit, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";

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
    zones: Array<{
      id: number;
      zone: string;
      memberAttendeesId: number;
    }>;
    mandals: Array<{
      id: number;
      mandal: string;
      memberAttendeesId: number;
    }>;
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
    membershipID?: string[];
    customLabours?: Array<{
      id?: number;
      labourId: string;
    }>;
  }>;
  status: string;
  followUpMeetings?: Array<{
    dateTime: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  modifiedBy?: number | null;
}

interface MeetingDetailsProps {
  meetingId: string;
}

export default function MeetingDetails({ meetingId }: MeetingDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch meeting details from API
  const fetchMeetingDetails = async () => {
    if (status === "loading" || !session?.user?.token) {
      return;
    }

    if (status !== "authenticated" || !session?.user?.token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.BACKEND_API_URL}/api/meeting/get_meet_id/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });

      console.log("Response:", response.data);
      
      // Extract the first meeting from the array
      const meetingData = Array.isArray(response.data) ? response.data[0] : response.data.data?.[0] || response.data;
      
      // Ensure the meeting object has the required arrays even if API doesn't return them
      const processedMeetingData = {
        ...meetingData,
        memberAttendees: meetingData.memberAttendees || [],
        vehicleAttendees: meetingData.vehicleAttendees || [],
        labourAttendees: meetingData.labourAttendees || [],
      };
      
      setMeeting(processedMeetingData);
      console.log("Meeting data:", processedMeetingData);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      setError("Failed to load meeting details");
      toast({
        title: "Error",
        description: "Failed to fetch meeting details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load meeting details on component mount and session change
  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId, status, session?.user?.token]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/admin/meetings/${meetingId}/edit`);
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
      } else {
        const memberDetails = [];
        if (memberAttendee.zones?.length) {
          const zoneNames = memberAttendee.zones.map(z => z.zone).join(", ");
          memberDetails.push(`Zones: ${zoneNames}`);
        }
        if (memberAttendee.mandals?.length) {
          const mandalNames = memberAttendee.mandals.map(m => m.mandal).join(", ");
          memberDetails.push(`Mandals: ${mandalNames}`);
        }
        if (memberAttendee.customMembers?.length) {
          memberDetails.push(`${memberAttendee.customMembers.length} Custom Member(s)`);
        }
        types.push(`Selected Members (${memberDetails.join(", ")})`);
      }
    }
    
    // Check vehicle attendees
    if (meeting.vehicleAttendees && meeting.vehicleAttendees.length > 0) {
      const vehicleAttendee = meeting.vehicleAttendees[0];
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
        const vehicleDetails = [];
        if (vehicleAttendee.owner) vehicleDetails.push("Owners");
        if (vehicleAttendee.driver) vehicleDetails.push("Drivers");
        if (vehicleAttendee.customVehicle?.length) {
          vehicleDetails.push(`${vehicleAttendee.customVehicle.length} Custom Vehicle(s)`);
        }
        if (vehicleDetails.length > 0) {
          types.push(`Selected Vehicles (${vehicleDetails.join(", ")})`);
        }
      }
    }
    
    // Check labour attendees
    if (meeting.labourAttendees && meeting.labourAttendees.length > 0) {
      const labourAttendee = meeting.labourAttendees[0];
      if (labourAttendee.all) {
        types.push("All Labour");
      } else {
        const labourDetails = [];
        if (labourAttendee.membershipID?.length) {
          labourDetails.push(`${labourAttendee.membershipID.length} Membership(s)`);
        }
        if (labourAttendee.customLabours?.length) {
          labourDetails.push(`${labourAttendee.customLabours.length} Custom Labour(s)`);
        }
        if (labourDetails.length > 0) {
          types.push(`Selected Labour (${labourDetails.join(", ")})`);
        } else {
          types.push("Selected Labour");
        }
      }
    }
    
    return types.join(", ") || "No attendees";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading meeting details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || "Meeting not found"}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-6">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetings
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{meeting.title}</h1>
            <p className="text-muted-foreground mt-2">{meeting.agenda}</p>
          </div>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Meeting
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meeting Information */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.startTime && !isNaN(new Date(meeting.startTime).getTime()) 
                    ? format(new Date(meeting.startTime), "EEEE, MMMM dd, yyyy 'at' HH:mm")
                    : "Invalid Date"
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{meeting.location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge
                variant={
                  meeting.status === "COMPLETED"
                    ? "default"
                    : meeting.status === "SCHEDULED"
                    ? "secondary"
                    : "destructive"
                }
              >
                {meeting.status ? 
                  meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1).toLowerCase() 
                  : "Unknown"
                }
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attendees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {getAttendeeTypeLabel(meeting)}
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        {meeting.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {meeting.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Follow-up Meetings */}
        {meeting.followUpMeetings && meeting.followUpMeetings.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Follow-up Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meeting.followUpMeetings.map((followUp: { dateTime: string }, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Follow-up {index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        {followUp.dateTime && !isNaN(new Date(followUp.dateTime).getTime()) 
                          ? format(new Date(followUp.dateTime), "EEEE, MMMM dd, yyyy 'at' HH:mm")
                          : "Invalid Date"
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meeting Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meeting ID</p>
                <p className="font-mono">{meeting.meetId}</p>
              </div>
              {meeting.createdAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {format(new Date(meeting.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
              {meeting.updatedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {format(new Date(meeting.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
