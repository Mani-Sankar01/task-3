"use client";
import { notFound } from "next/navigation";
import TripDetails from "@/components/vehicles/trip-details";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function TripDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const tripId = params.id;

  if (!tripId) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `${tripId} - Details` }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <TripDetails tripId={tripId} />
      </div>
    </SidebarInset>
  );
}

