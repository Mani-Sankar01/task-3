"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAllVehicles, getAllActiveVehicles } from "@/data/vehicles";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function AddTripPage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const vehicles = getAllActiveVehicles();

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      router.push(`/admin/vehicle/${selectedVehicle}/add-trip`);
    }
  };

  const handleCancel = () => {
    router.push("/admin/vehicle/trips");
  };

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add a new trip" }]} />
      <div className="flex flex-1 flex-col">
        <div className="container mx-auto p-4">
          <div className="mb-6 flex items-center">
            <Button variant="outline" onClick={handleCancel} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <h1 className="text-2xl font-bold">Add New Trip</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Vehicle</CardTitle>
              <CardDescription>
                Choose a vehicle to add a trip for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Select
                    onValueChange={handleVehicleSelect}
                    value={selectedVehicle}
                  >
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber} - {vehicle.driverName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleContinue} disabled={!selectedVehicle}>
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
