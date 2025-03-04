import React from "react";
import { notFound } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import VehicleDetails from "@/components/vehicles/vehicle-details";
import { getVehicleById } from "@/data/vehicles";
const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const vehicleId = (await params).id;
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `Vehicle Details - ${vehicleId}` }]} />
      <div className="flex flex-1 flex-col">
        <VehicleDetails vehicle={vehicle} />
      </div>
    </SidebarInset>
  );
};

export default page;
