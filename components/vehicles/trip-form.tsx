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
} from "@/data/vehicles";
import PopupMessage from "@/components/ui/popup-message";

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
}

// Update the form component
export default function TripForm({
  vehicleId,
  trip,
  isEditMode,
}: TripFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const vehicle = getVehicleById(vehicleId);
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
    defaultValues: trip
      ? {
          date: new Date(trip.date),
          totalRounds: trip.totalRounds,
          pricePerRound: trip.pricePerRound,
          totalAmountToPay: trip.totalAmountToPay,
          amountPaid: trip.amountPaid,
          paymentStatus: trip.paymentStatus,
          notes: trip.notes || "",
        }
      : {
          date: new Date(),
          totalRounds: 1,
          pricePerRound: 500, // Default price
          totalAmountToPay: 500, // Default total amount
          amountPaid: 0,
          paymentStatus: "unpaid",
          notes: "",
        },
  });

  // Watch for changes to calculate total
  const totalRounds = form.watch("totalRounds");
  const pricePerRound = form.watch("pricePerRound");

  // Update total amount when rounds or price changes
  useEffect(() => {
    const calculatedTotal = totalRounds * pricePerRound;
    form.setValue("totalAmountToPay", calculatedTotal);
  }, [totalRounds, pricePerRound, form]);

  if (!vehicle) {
    return (
      <div className="container mx-auto ">
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && trip) {
        const updatedTrip = updateTrip(trip.id, {
          ...data,
          vehicleId,
          date: data.date.toISOString().split("T")[0],
          updatedAt: new Date().toISOString(),
        });
        console.log("Trip updated:", updatedTrip);
      } else {
        const newTrip = addTrip({
          ...data,
          vehicleId,
          date: data.date.toISOString().split("T")[0],
        });
        console.log("New trip added:", newTrip);
      }

      setPopupMessage({
        isOpen: true,
        type: "success",
        title: isEditMode ? "Trip Updated Successfully!" : "Trip Added Successfully!",
        message: isEditMode 
          ? "The trip has been updated successfully. You will be redirected to the vehicle details."
          : "The trip has been added successfully. You will be redirected to the vehicle details.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to save trip. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All changes will be lost."
      )
    ) {
      router.push(`/admin/vehicle/${vehicleId}`);
    }
  };

  const handlePopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
  };

  const handleSuccessPopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
    router.push(`/admin/vehicle/${vehicleId}`);
    router.refresh();
  };

  return (
    <div className="container mx-auto">
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
                  {vehicle?.status.charAt(0).toUpperCase() +
                    vehicle?.status.slice(1)}
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
                    <FormItem className="flex flex-col">
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                  <span className="font-bold">
                    ₹{form.watch("totalAmountToPay")}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Amount Paid:</span>
                  <span>₹{form.watch("amountPaid")}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Balance:</span>
                  <span
                    className={
                      form.watch("totalAmountToPay") -
                        form.watch("amountPaid") >
                      0
                        ? "text-destructive font-bold"
                        : "text-green-600 font-bold"
                    }
                  >
                    ₹{form.watch("totalAmountToPay") - form.watch("amountPaid")}
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
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
