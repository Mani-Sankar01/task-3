"use client";
import React from "react";
import { notFound } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import VehicleDetails from "@/components/vehicles/vehicle-details";
import { getVehicleById } from "@/data/vehicles";
import VehicleDetailsWithID from "@/components/test-component/vehicle-details";
const Page = ({ params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  // const vehicle = getVehicleById(vehicleId);
  // if (!vehicle) {
  //   notFound();
  // }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `Vehicle Details - ${vehicleId}` }]} />
      <div className="flex flex-1 flex-col">
        {/* <VehicleDetails vehicle={vehicle} />  */}
        <VehicleDetailsWithID id={vehicleId} />
      </div>
    </SidebarInset>
  );
};

export default Page;
