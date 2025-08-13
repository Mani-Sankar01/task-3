import AddEditTripForm from "@/components/vehicles/new/add-edit-trip-form";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const vehicleId = (await params).id;
  return <AddEditTripForm vehicleId={vehicleId} isEditMode={false} />;
};

export default page;
