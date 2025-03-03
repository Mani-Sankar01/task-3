"use client";

import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Meeting } from "@/data/meetings";
import Link from "next/link";

interface MeetingDetailsProps {
  meeting: Meeting;
}

export default function MeetingDetails({ meeting }: MeetingDetailsProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/meetings/add/${meeting.id}`);
  };

  const handleBack = () => {
    router.push("/admin/meetings");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/admin/meetings/`}>
            <Button variant="outline" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Meeting Details</h1>
        </div>{" "}
        <Link href={`/admin/meetings/${meeting.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Edit Meeting
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                <CardDescription>{meeting.agenda}</CardDescription>
              </div>
              <Badge
                variant={
                  meeting.status === "completed"
                    ? "default"
                    : meeting.status === "scheduled"
                    ? "secondary"
                    : "destructive"
                }
              >
                {meeting.status.charAt(0).toUpperCase() +
                  meeting.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Date: {new Date(meeting.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time: {meeting.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Location: {meeting.meetingPoint}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Attendees:{" "}
                    {meeting.actualAttendees ?? meeting.expectedAttendees}{" "}
                    expected
                  </span>
                </div>
              </div>
              {meeting.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-muted-foreground">{meeting.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendees</CardTitle>
            <CardDescription>
              Meeting participants and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meeting.attendees.map((attendee, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    {attendee.type.charAt(0).toUpperCase() +
                      attendee.type.slice(1)}
                    s
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Scope: {attendee.scope === "all" ? "All" : "Selected"}{" "}
                    {attendee.type.charAt(0).toUpperCase() +
                      attendee.type.slice(1)}
                    s
                  </p>
                  {attendee.selectedIds && (
                    <p className="text-sm text-muted-foreground">
                      Selected IDs: {attendee.selectedIds.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Timeline</CardTitle>
            <CardDescription>Important dates and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(meeting.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(meeting.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {meeting.followUps && meeting.followUps.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Follow-up Meetings</CardTitle>
              <CardDescription>Scheduled follow-up meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meeting.followUps.map((followUp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(followUp.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {followUp.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
