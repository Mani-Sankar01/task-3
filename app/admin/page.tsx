"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

function page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="">qqq</div>
          <div className="">www</div>
          <div className="">eee</div>
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
          rrr
        </div>
      </div>
    </SidebarInset>
  );
}

export default page;
