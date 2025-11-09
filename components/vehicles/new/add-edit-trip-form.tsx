"use client";

import { Badge } from "@/components/ui/badge";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  addTrip,
  updateTrip,
  getVehicleById,
  type Trip,
  Vehicle,
} from "@/data/vehicles";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import PopupMessage from "@/components/ui/popup-message";
import { renderRoleBasedPath } from "@/lib/utils";

// Update the form schema
const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  totalRounds: z.coerce.number().min(1, "Total rounds must be at least 1"),
  pricePerRound: z.coerce.number().min(1, "Price per round must be at least 1"),
  totalAmountToPay: z.coerce.number().min(1, "Total amount must be at least 1"),
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative"),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
  notes: z.string().optional(),
});

// Update the form values type
type FormValues = z.infer<typeof formSchema>;

interface TripFormProps {
  vehicleId: string;
  trip?: Trip;
  isEditMode?: boolean;
  tripId?: string;
}

// Update the form component
export default function AddEditTripForm({
  vehicleId,
  trip,
  isEditMode,
  tripId,
}: TripFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  //   const vehicle = getVehicleById(vehicleId);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null); // or undefined
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const [popupMessage, setPopupMessage] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      totalRounds: 1,
      pricePerRound: 10, // Default price
      totalAmountToPay: 10  , // Default total amount
      amountPaid: 0,
      paymentStatus: "unpaid",
      notes: "",
    },
  });

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true); // Start loading

        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/vehicle/search_vehicle/${vehicleId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const reponseData = response.data;
        setVehicle(reponseData);
        // set form data here if needed
        if (isEditMode && tripId) {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL}/api/vehicle/get_trip_id/${tripId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          const tripData = response.data.trip;
          form.reset({
            date: new Date(tripData.tripDate),
            totalRounds: tripData.numberOfTrips,
            pricePerRound: tripData.amountPerTrip,
            totalAmountToPay: tripData.totalAmount,
            amountPaid: tripData.amountPaid,
            paymentStatus: tripData.paymentStatus.toLowerCase() as
              | "paid"
              | "partial"
              | "unpaid",
            notes: tripData.notes || "",
          });
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        const errorMessage = err.response?.data?.message || "Failed to load data";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        setPopupMessage({
          isOpen: true,
          type: "error",
          title: "Load Failed",
          message: errorMessage,
        });
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [status, session?.user?.token, vehicleId, isEditMode, tripId]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && tripId) {
        const updateData = {
          tripId: tripId,
          tripDate: new Date(data.date),
          amountPerTrip: data.pricePerRound,
          numberOfTrips: data.totalRounds,
          notes: data.notes ? data.notes : "",
          amountPaid: data.amountPaid,
        };

        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/vehicle/update_trip`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          toast({
            title: "Success",
            description: "Trip updated successfully!",
          });
          setPopupMessage({
            isOpen: true,
            type: "success",
            title: "Trip Updated Successfully!",
            message:
              "The trip has been updated successfully. You will be redirected back.",
          });
        } else {
          const errorMessage = response.data?.message || "Something went wrong. Trip not updated.";
          toast({
            title: "Update Failed",
            description: errorMessage,
            variant: "destructive"
          });
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Update Failed",
            message: errorMessage,
          });
        }
      } else {
        const newData = {
          vehicleId: vehicleId,
          tripDate: new Date(data.date),
          amountPerTrip: data.pricePerRound,
          numberOfTrips: data.totalRounds,
          notes: data.notes ? data.notes : "",
          amountPaid: data.amountPaid,
        };

        setIsSubmitting(true);

        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/vehicle/add_trip`,
          newData,
          {
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          toast({
            title: "Success",
            description: "Trip added successfully!",
          });
          setPopupMessage({
            isOpen: true,
            type: "success",
            title: "Trip Added Successfully!",
            message:
              "The trip has been added successfully. You will be redirected back.",
          });
        } else {
          const errorMessage = response.data?.message || "Something went wrong. Trip not added.";
          toast({
            title: "Add Failed",
            description: errorMessage,
            variant: "destructive"
          });
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Add Failed",
            message: errorMessage,
          });
        }
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const errorMessage = error.response?.data?.message || "Failed to save trip. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmountValue = Number(form.watch("totalAmountToPay")) || 0;
  const amountPaidValue = Number(form.watch("amountPaid")) || 0;

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All changes will be lost."
      )
    ) {
      router.back();
    }
  };

  const handlePopupClose = () => {
    setPopupMessage((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSuccessPopupClose = () => {
    setPopupMessage((prev) => ({ ...prev, isOpen: false }));
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/vehicle/${vehicleId}`
    );
    router.refresh();
  };

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

  if (!vehicle) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/admin/vehicle")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Trip" : "Add New Trip"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Trip Details" : "New Trip"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the trip information below"
              : "Fill in the details to add a new trip"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Vehicle Number</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle?.vehicleNumber}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Driver</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle?.driverName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle?.ownerName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge
                  variant={
                    vehicle?.status === "ACTIVE"
                      ? "default"
                      : vehicle?.status === "MAINTENANCE"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {vehicle?.status}
                </Badge>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel>Trip Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalRounds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Rounds</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter total rounds"
                        {...field}
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange("");
                            return;
                          }
                          const numericValue = Number(raw);
                          if (!Number.isNaN(numericValue)) {
                            field.onChange(numericValue);
                          }
                        }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerRound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Round (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter price per round"
                        {...field}
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange("");
                            return;
                          }
                          const numericValue = Number(raw);
                          if (!Number.isNaN(numericValue)) {
                            field.onChange(numericValue);
                          }
                        }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalAmountToPay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter total amount"
                        {...field}
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange("");
                            return;
                          }
                          const numericValue = Number(raw);
                          if (!Number.isNaN(numericValue)) {
                            field.onChange(numericValue);
                          }
                        }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter amount paid"
                        {...field}
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange("");
                            return;
                          }
                          const numericValue = Number(raw);
                          if (!Number.isNaN(numericValue)) {
                            field.onChange(numericValue);
                          }
                        }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">₹{totalAmountValue}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Amount Paid:</span>
                  <span>₹{amountPaidValue}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Balance:</span>
                  <span
                    className={
                      totalAmountValue - amountPaidValue >
                      0
                        ? "text-destructive font-bold"
                        : "text-green-600 font-bold"
                    }
                  >
                    ₹{totalAmountValue - amountPaidValue}
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      data-required="false"
                      data-tooltip="Optional: record any driver remarks or payment notes for this trip."
                    >
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{isEditMode ? "Update Trip" : "Add Trip"}</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Popup Message */}
      <PopupMessage
        isOpen={popupMessage.isOpen}
        onClose={handlePopupClose}
        type={popupMessage.type}
        title={popupMessage.title}
        message={popupMessage.message}
        primaryButton={
          popupMessage.type === "success"
            ? {
                text: "Go to Vehicle Details",
                onClick: handleSuccessPopupClose,
                variant: "default",
              }
            : {
                text: "OK",
                onClick: handlePopupClose,
                variant: "default",
              }
        }
        showCloseButton={false}
      />
    </div>
  );
}
