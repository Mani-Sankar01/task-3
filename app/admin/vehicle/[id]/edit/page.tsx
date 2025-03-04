import React from "react";
import { notFound } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { getVehicleById } from "@/data/vehicles";
import VehicleForm from "@/components/vehicles/vehicle-form";
const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const vehicleId = (await params).id;
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Vehicle" }]} />
      <div className="flex flex-1 flex-col  gap-4 p-4 pt-4">
        <VehicleForm vehicle={vehicle} isEditMode={true} />
      </div>
    </SidebarInset>
  );
};

export default page;
