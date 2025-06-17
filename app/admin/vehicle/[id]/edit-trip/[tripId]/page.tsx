import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import TripForm from "@/components/vehicles/trip-form";
import { getTripById } from "@/data/vehicles";
import AddEditTripForm from "@/components/vehicles/new/add-edit-trip-form";

const page = async ({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>;
}) => {
  const vehicleId = (await params).id;
  const tripId = (await params).tripId;
  const trip = getTripById(tripId);

  if (!tripId || !vehicleId) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Vehicle Trip" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <AddEditTripForm
          vehicleId={vehicleId}
          isEditMode={true}
          tripId={tripId}
        />
      </div>
    </SidebarInset>
  );
};

export default page;
