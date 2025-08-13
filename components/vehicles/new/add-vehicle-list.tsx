"use client";

import { useEffect, useState } from "react";
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
import { getAllVehicles, getAllActiveVehicles, Vehicle } from "@/data/vehicles";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { useSession } from "next-auth/react";
import axios from "axios";
import { renderRoleBasedPath } from "@/lib/utils";

export default function AddVehicleList() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  // const vehicles = getAllActiveVehicles();

  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      router.push(
        `/${renderRoleBasedPath(
          session?.user?.role
        )}/vehicle/${selectedVehicle}/add-trip`
      );
    }
  };

  const handleCancel = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/vehicle/trips`);
  };

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/vehicle/get_vehicles`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const reponseData = response.data;
        setVehicles(reponseData);
        console.log(JSON.stringify(reponseData));
        // set form data here if needed
      } catch (err: any) {
        console.error("Error fetching member data:", err);
        alert("Failed to load member data");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [status, session?.user?.token]);

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading vehicle data...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
