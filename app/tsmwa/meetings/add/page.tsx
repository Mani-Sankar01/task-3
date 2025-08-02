"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import MeetingForm from "@/components/meetings/meeting-form";

function page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add Meeting" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MeetingForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
}

export default page;
