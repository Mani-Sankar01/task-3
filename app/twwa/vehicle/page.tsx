import React from "react";
import VehiclesList from "@/components/vehicles/vehicles-list";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col">
        <VehiclesList />
      </div>
    </SidebarInset>
  );
};

export default page;
