"use client";
import { notFound } from "next/navigation";
import MeetingDetails from "@/components/meetings/meeting-details";
import { getMeetingById } from "@/data/meetings";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function MeetingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const meetingId = params.id;
  const meeting = getMeetingById(meetingId);

  if (!meeting) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `${meetingId} - Details` }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MeetingDetails meeting={meeting} />
      </div>
    </SidebarInset>
  );
}
