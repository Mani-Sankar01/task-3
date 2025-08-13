"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";

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
import { addVehicle, updateVehicle, type Vehicle } from "@/data/vehicles";
import { getAllRoutes } from "@/data/routes";
import { renderRoleBasedPath } from "@/lib/utils";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver name is required"),
  driverNumber: z
    .string()
    .min(10, "Valid phone number is required")
    .max(10, "Phone number must be 10 digits"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhoneNumber: z
    .string()
    .min(10, "Valid phone number is required")
    .max(10, "Phone number must be 10 digits"),
  status: z.enum(["active", "maintenance", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  isEditMode: boolean;
}

export default function VehicleForm({ vehicle, isEditMode }: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const routes = getAllRoutes();
  const session = useSession();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: vehicle
      ? {
          vehicleNumber: vehicle.vehicleNumber,
          driverName: vehicle.driverName,
          driverNumber: vehicle.driverNumber,
          ownerName: vehicle.ownerName,
          ownerPhoneNumber: vehicle.ownerPhoneNumber,
          status: vehicle.status,
        }
      : {
          vehicleNumber: "",
          driverName: "",
          driverNumber: "",
          ownerName: "",
          ownerPhoneNumber: "",
          status: "active",
        },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && vehicle) {
        const updatedVehicle = updateVehicle(vehicle.id, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
        console.log("Vehicle updated:", updatedVehicle);
      } else {
        const newVehicle = addVehicle({
          ...data,
        });
        console.log("New vehicle added:", newVehicle);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push(`/${renderRoleBasedPath(session?.data?.user.role)}/vehicles`);
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save vehicle. Please try again.");
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
      router.push(`/${renderRoleBasedPath(session?.data?.user.role)}/vehicle`);
    }
  };

  return (
    <div className="container mx-auto ">
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="maintenance">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
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
                  name="driverNumber"
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
    </div>
  );
}
