"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  getVehicleById,
  addVehicle,
  updateVehicle,
  Vehicle,
  vehicles,
} from "@/data/vehicles";
import { useSession } from "next-auth/react";
import PopupMessage from "@/components/ui/popup-message";

const formSchema = z.object({
  vehicleId: z.string().optional(),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  driverPhoneNumber: z
    .string()
    .min(10, "Valid phone number is required")
    .max(10, "Phone number must be 10 digits"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhoneNumber: z
    .string()
    .min(10, "Valid phone number is required")
    .max(10, "Phone number must be 10 digits"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleFormProps {
  isEditMode: boolean;
  vehicleId?: string; // ID needed to fetch
}

export default function EditVehicleForm({
  isEditMode,
  vehicleId,
}: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode); // only load if editing
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
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
      vehicleId: "",
      vehicleNumber: "",
      driverName: "",
      driverPhoneNumber: "",
      ownerName: "",
      ownerPhoneNumber: "",
      status: "INACTIVE",
    },
  });

  // ⛳ Fetch vehicle data when editing
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;
    if (isEditMode && vehicleId) {
      const fetchVehicle = async () => {
        console.log("before try");
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${process.env.BACKEND_API_URL}/api/vehicle/search_vehicle/${vehicleId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );

          const vehicleData = response.data;
          console.log(vehicleData);
          setVehicle(vehicleData);
          form.reset({
            vehicleId: vehicleData.vehicleId || "",
            vehicleNumber: vehicleData.vehicleNumber || "",
            driverName: vehicleData.driverName || "",
            driverPhoneNumber:
              vehicleData.driverPhoneNumber?.replace("+91", "") || "",
            ownerName: vehicleData.ownerName || "",
            ownerPhoneNumber: vehicleData.ownerPhoneNumber || "",
            status: vehicleData.status,
          });
        } catch (error) {
          console.error("Failed to load vehicle:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchVehicle();
    }
  }, [isEditMode, vehicleId, status, session?.user?.token]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && session?.user.token) {
        console.log(data);
        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/vehicle/update_vehicle`,
          data,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          setIsSubmitting(false);
          setPopupMessage({
            isOpen: true,
            type: "success",
            title: "Vehicle Updated Successfully!",
            message: "The vehicle has been updated successfully. You will be redirected to the vehicle list.",
          });
        } else {
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Update Failed",
            message: "Something went wrong. Vehicle not updated.",
          });
        }
      } else {
        console.log(JSON.stringify(data));
        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/vehicle/add_vehicle`,
          data,
          {
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          setIsSubmitting(false);
          setPopupMessage({
            isOpen: true,
            type: "success",
            title: "Vehicle Added Successfully!",
            message: "The vehicle has been added successfully. You will be redirected to the vehicle list.",
          });
        } else {
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Add Failed",
            message: "Something went wrong. Vehicle not added.",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to save vehicle. Please try again.",
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
      router.push("/admin/vehicle");
    }
  };

  const handlePopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
  };

  const handleSuccessPopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
    router.push("/admin/vehicle");
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

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Vehicle Details" : "New Vehicle"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the vehicle information below"
              : "Fill in the details to add a new vehicle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>Vehicle Id</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter vehicle id"
                          {...field}
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vehicle number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="MAINTENANCE">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter driver name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter driver phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter owner phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                    <>{isEditMode ? "Update Vehicle" : "Add Vehicle"}</>
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
                text: "Go to Vehicle List",
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
