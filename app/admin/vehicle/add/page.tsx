"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import VehicleForm from "@/components/vehicles/vehicle-form";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add Vehicle" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <VehicleForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
};

export default page;
