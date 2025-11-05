"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Vehicle {
  id?: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  ownerName?: string;
}

export default function AddTripPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    setSearchTerm(""); // Clear search term when vehicle is selected
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      router.push(`/admin/vehicle/${selectedVehicle}/add-trip`);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/vehicle/get_vehicles`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        setVehicles(response.data || []);
      } catch (err: any) {
        console.error("Error fetching vehicles:", err);
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [status, session?.user?.token]);

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.vehicleNumber.toLowerCase().includes(searchLower) ||
      vehicle.driverName.toLowerCase().includes(searchLower) ||
      (vehicle.ownerName && vehicle.ownerName.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading || status === "loading") {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Add a new trip" }]} />
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Loading vehicle data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add a new trip" }]} />
      <div className="flex flex-1 flex-col">
        <div className=" p-4">
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
                      <div className="px-2 pb-2">
                        <Input
                          placeholder="Search by vehicle number, driver, or owner..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredVehicles.length > 0 ? (
                          filteredVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.vehicleId} value={vehicle.vehicleId}>        
                              {vehicle.vehicleNumber} - {vehicle.driverName}
                              {vehicle.ownerName && ` (${vehicle.ownerName})`}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            No vehicles found
                          </div>
                        )}
                      </div>
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
