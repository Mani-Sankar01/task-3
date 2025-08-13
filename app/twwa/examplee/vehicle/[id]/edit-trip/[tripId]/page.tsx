import AddEditTripForm from "@/components/vehicles/new/add-edit-trip-form";
import React from "react";

const page = async ({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>;
}) => {
  const vehicleId = (await params).id;
  const tripId = (await params).tripId;
  return (
    <AddEditTripForm vehicleId={vehicleId} isEditMode={true} tripId={tripId} />
  );
};

export default page;
