"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import MeetingForm from "@/components/meetings/meeting-form";

async function page({ params }: { params: Promise<{ id: string }> }) {
  const meetingId = (await params).id;

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Meeting" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MeetingForm meetingId={meetingId} isEditMode={true} />
      </div>
    </SidebarInset>
  );
}

export default page;
