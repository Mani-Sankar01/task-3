import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import AllTripsList from "@/components/vehicles/all-trips-list";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Trips" }]} />
      <div className="flex flex-1 flex-col">
        <AllTripsList />
      </div>
    </SidebarInset>
  );
};

export default page;
