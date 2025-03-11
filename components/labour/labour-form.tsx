"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
  addLabour,
  updateLabour,
  getMemberOptions,
  type Labour,
} from "@/data/labour";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  fatherName: z.string().min(1, "Father's name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  aadharNumber: z.string().min(12, "Aadhar number must be at least 12 digits"),
  aadharCardUrl: z.string().min(1, "Aadhar card upload is required"),
  photoUrl: z.string().min(1, "Photo upload is required"),
  permanentAddress: z.string().min(1, "Permanent address is required"),
  presentAddress: z.string().min(1, "Present address is required"),
  panNumber: z.string().optional().or(z.literal("")),
  esiNumber: z.string().optional().or(z.literal("")),
  currentMemberId: z.string().optional().or(z.literal("")),
  employedFrom: z.string().optional().or(z.literal("")),
  employedTo: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "bench", "inactive"]),
  additionalDocuments: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Document name is required"),
        documentUrl: z.string().min(1, "Document upload is required"),
        uploadDate: z.string().optional(),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LabourFormProps {
  labour?: Labour;
  isEditMode: boolean;
}

export default function LabourForm({ labour, isEditMode }: LabourFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberOptions = getMemberOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: labour
      ? {
          name: labour.name,
          phone: labour.phone,
          email: labour.email || "",
          fatherName: labour.fatherName,
          dateOfBirth: new Date(labour.dateOfBirth),
          aadharNumber: labour.aadharNumber,
          aadharCardUrl: labour.aadharCardUrl,
          photoUrl: labour.photoUrl,
          permanentAddress: labour.permanentAddress,
          presentAddress: labour.presentAddress,
          panNumber: labour.panNumber || "",
          esiNumber: labour.esiNumber || "",
          currentMemberId: labour.currentMemberId || "",
          employedFrom: labour.employedFrom || "",
          employedTo: labour.employedTo || "",
          status: labour.status,
          additionalDocuments: labour.additionalDocuments || [],
        }
      : {
          name: "",
          phone: "",
          email: "",
          fatherName: "",
          dateOfBirth: new Date(1990, 0, 1),
          aadharNumber: "",
          aadharCardUrl: "",
          photoUrl: "",
          permanentAddress: "",
          presentAddress: "",
          panNumber: "",
          esiNumber: "",
          currentMemberId: "",
          employedFrom: "",
          employedTo: "",
          status: "active",
          additionalDocuments: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalDocuments",
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Format dates and ensure each document has a valid ID
      const formattedData = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
        additionalDocuments:
          data.additionalDocuments?.map((doc) => ({
            id: doc.id || `DOC${Math.random().toString(36).substring(2, 10)}`, // Generate a random ID if none exists
            name: doc.name,
            documentUrl: doc.documentUrl,
            uploadDate:
              doc.uploadDate || new Date().toISOString().split("T")[0],
          })) || [],
      };

      let result;
      if (isEditMode && labour) {
        result = updateLabour(labour.id, formattedData);
        console.log("Labour updated:", result);
      } else {
        result = addLabour(formattedData);
        console.log("New labour added:", result);
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin/labour");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save labour record. Please try again.");
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
      router.push("/admin/labour");
    }
  };

  return (
    <div className="container">
      {/* <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Labour" : "Add New Labour"}
        </h1>
      </div> */}

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Labour Details" : "New Labour"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the labour information below"
              : "Fill in the details to add a new labour record"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter father's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                              disabled={(date) => date > new Date()}
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aadharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Aadhar number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Address Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="permanentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permanent Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter permanent address"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Present Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter present address"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="currentMemberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Industry</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_assigned">
                              Not Assigned
                            </SelectItem>
                            {memberOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="bench">Bench</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employedFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employed From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Employed To (Leave empty if currently employed)
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PAN number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="esiNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ESI Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ESI number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Document Uploads</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              // In a real app, this would upload the file to a server
                              // and set the URL. For now, we'll use a placeholder
                              field.onChange(
                                e.target.files?.[0] ? "/placeholder.svg" : ""
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aadharCardUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Card</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              // In a real app, this would upload the file to a server
                              // and set the URL. For now, we'll use a placeholder
                              field.onChange(
                                e.target.files?.[0] ? "/placeholder.svg" : ""
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Additional Documents</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ name: "", documentUrl: "", uploadDate: "" })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Document
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`additionalDocuments.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter document name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDocuments.${index}.documentUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Upload</FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    // In a real app, this would upload the file to a server
                                    // and set the URL. For now, we'll use a placeholder
                                    field.onChange(
                                      e.target.files?.[0]
                                        ? "/placeholder.svg"
                                        : ""
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Document
                      </Button>
                    </CardContent>
                  </Card>
                ))}
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
                    <>{isEditMode ? "Update Labour" : "Add Labour"}</>
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
