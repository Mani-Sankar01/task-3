"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "../ui/badge";
import { renderRoleBasedPath } from "@/lib/utils";

// API Trip interface
interface ApiTrip {
  id: number;
  tripId: string;
  vehicleId: string;
  tripDate: string;
  amountPerTrip: number;
  numberOfTrips: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  paymentStatus: string;
  notes: string;
  receiptPath: string | null;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number | null;
}

// Vehicle interface
interface Vehicle {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  status?: string;
}

interface TripDetailsProps {
  tripId: string;
}

export default function TripDetails({ tripId }: TripDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [trip, setTrip] = useState<ApiTrip | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trip details from API
  useEffect(() => {
    // Don't fetch data if still loading session
    if (status === "loading") {
      return;
    }

    // Show error if not authenticated
    if (status !== "authenticated" || !session?.user?.token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    const fetchTripDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
        const response = await axios.get(
          `${apiUrl}/api/vehicle/get_trip_id/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log("Trip API response:", response.data);

        // Handle the response structure - the trip is in response.data.trip
        const tripData: ApiTrip = response.data.trip || response.data;
        setTrip(tripData);

        // Fetch vehicle details
        const vehicleResponse = await axios.get(
          `${apiUrl}/api/vehicle/search_vehicle/${tripData.vehicleId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log("Vehicle API response:", vehicleResponse.data);
        setVehicle(vehicleResponse.data);
      } catch (err: unknown) {
        console.error("Error fetching trip details:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load trip details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, status, session?.user?.token]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (!trip) return;
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/vehicle/${trip.vehicleId}/edit-trip/${tripId}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">
            {error || "Trip not found"}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="container mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Authentication required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Trip Details</h1>
      </div>

      {/* Trip Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Trip Information</CardTitle>
            </div>
            <div className="flex gap-2">
              {(session?.user?.role === "TSMWA_EDITOR" ||
                session?.user?.role === "TQMA_EDITOR" ||
                session?.user?.role === "ADMIN") && (
                <Button onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Trip
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trip ID</p>
              <p className="font-mono">{trip.tripId}</p>
            </div>
            {vehicle && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vehicle</p>
                <p>{vehicle.vehicleNumber}</p>
              </div>
            )}
            {vehicle && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Driver</p>
                <p>{vehicle.driverName}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trip Date</p>
              <p>
                {format(new Date(trip.tripDate), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Number of Trips</p>
              <p>{trip.numberOfTrips}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Per Trip</p>
              <p>₹{trip.amountPerTrip.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-lg">₹{trip.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
              <p>₹{trip.amountPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance Amount</p>
              <p className={`font-semibold ${trip.balanceAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ₹{trip.balanceAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
              <Badge
                variant={
                  trip.paymentStatus === "PAID"
                    ? "default"
                    : trip.paymentStatus === "PARTIAL"
                    ? "secondary"
                    : "destructive"
                }
              >
                {trip.paymentStatus.charAt(0).toUpperCase() +
                  trip.paymentStatus.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {trip.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{trip.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Receipt */}
      {trip.receiptPath && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receipt available at: <span className="font-mono">{trip.receiptPath}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {trip.createdAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">
                  {format(new Date(trip.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
            )}
            {trip.modifiedAt && (
              <div className="md:text-right text-start">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {format(new Date(trip.modifiedAt), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

