import React from "react";
import TripForm from "@/components/vehicles/trip-form";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import AddEditTripForm from "@/components/vehicles/new/add-edit-trip-form";
const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const vehicleId = (await params).id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add Vehicle Trip" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <AddEditTripForm vehicleId={vehicleId} isEditMode={false} />
      </div>
    </SidebarInset>
  );
};

export default page;
