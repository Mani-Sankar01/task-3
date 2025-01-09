"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Component1 } from "@/components/chart1";
import { Component4 } from "@/components/chart4";
import { Component3 } from "@/components/chart3";
import { Component2 } from "@/components/component2";

function page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="">
            <Component1 />
          </div>
          <div className="">
            <Component2 />
          </div>
          <div className="">
            <Component3 />
          </div>
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
          <Component4 />
        </div>
      </div>
    </SidebarInset>
  );
}

export default page;
