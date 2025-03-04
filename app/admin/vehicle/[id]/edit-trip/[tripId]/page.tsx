import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import TripForm from "@/components/vehicles/trip-form";
import { getTripById } from "@/data/vehicles";

const page = async ({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>;
}) => {
  const vehicleId = (await params).id;
  const tripId = (await params).tripId;
  const trip = getTripById(tripId);

  if (!trip || trip.vehicleId !== vehicleId) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Vehicle Trip" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <TripForm vehicleId={vehicleId} trip={trip} isEditMode={true} />
      </div>
    </SidebarInset>
  );
};

export default page;
