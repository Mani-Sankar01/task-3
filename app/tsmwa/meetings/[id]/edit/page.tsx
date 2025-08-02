"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import MeetingForm from "@/components/meetings/meeting-form";
import { getMeetingById } from "@/data/meetings";

async function page({ params }: { params: Promise<{ id: string }> }) {
  const meetingId = (await params).id;
  const meeting = getMeetingById(meetingId);

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add Meeting" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MeetingForm meeting={meeting} isEditMode={true} />
      </div>
    </SidebarInset>
  );
}

export default page;
