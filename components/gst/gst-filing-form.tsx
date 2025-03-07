"use client";

import { useState, useEffect } from "react";
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
  addGstFiling,
  updateGstFiling,
  getMemberOptions,
  type GstFiling,
} from "@/data/gst-filings";

const formSchema = z.object({
  membershipId: z.string().min(1, "Member is required"),
  filingPeriod: z.string().min(1, "Filing period is required"),
  filingDate: z.date().optional(),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  gstItems: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Item name is required"),
        taxableAmount: z.coerce.number().min(0, "Amount cannot be negative"),
      })
    )
    .min(1, "At least one GST item is required"),
  status: z.enum(["filled", "pending", "due"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GstFilingFormProps {
  filing?: GstFiling;
  isEditMode: boolean;
}

export default function GstFilingForm({
  filing,
  isEditMode,
}: GstFilingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberOptions = getMemberOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: filing
      ? {
          membershipId: filing.membershipId,
          filingPeriod: filing.filingPeriod,
          filingDate: filing.filingDate
            ? new Date(filing.filingDate)
            : undefined,
          dueDate: new Date(filing.dueDate),
          gstItems: filing.gstItems,
          status: filing.status,
          notes: filing.notes || "",
        }
      : {
          membershipId: "",
          filingPeriod: "",
          filingDate: undefined,
          dueDate: new Date(),
          gstItems: [{ name: "", taxableAmount: 0 }],
          status: "pending",
          notes: "",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "gstItems",
  });

  // Calculate total taxable amount and total amount (18% GST)
  const calculateTotals = () => {
    const gstItems = form.watch("gstItems");
    const totalTaxableAmount = gstItems.reduce(
      (sum, item) => sum + (item.taxableAmount || 0),
      0
    );
    const totalAmount = totalTaxableAmount * 0.18; // 18% GST
    return { totalTaxableAmount, totalAmount };
  };

  const { totalTaxableAmount, totalAmount } = calculateTotals();

  // Update totals when gstItems change
  useEffect(() => {
    form.watch("gstItems");
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { totalTaxableAmount, totalAmount } = calculateTotals();

      const filingData = {
        ...data,
        filingDate: data.filingDate
          ? format(data.filingDate, "yyyy-MM-dd")
          : "",
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        totalTaxableAmount,
        totalAmount,
      };

      if (isEditMode && filing) {
        const updatedFiling = updateGstFiling(filing.id, filingData);
        console.log("GST filing updated:", updatedFiling);
      } else {
        const newFiling = addGstFiling(filingData);
        console.log("New GST filing added:", newFiling);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin/gst-filings");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save GST filing. Please try again.");
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
      router.push("/admin/gst-filings");
    }
  };

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit GST Filing Details" : "New GST Filing"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the GST filing information below"
              : "Fill in the details to add a new GST filing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="membershipId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {memberOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                  name="filingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filing Period</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select filing period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Q1 2024">
                            Q1 2024 (Jan-Mar)
                          </SelectItem>
                          <SelectItem value="Q2 2024">
                            Q2 2024 (Apr-Jun)
                          </SelectItem>
                          <SelectItem value="Q3 2024">
                            Q3 2024 (Jul-Sep)
                          </SelectItem>
                          <SelectItem value="Q4 2024">
                            Q4 2024 (Oct-Dec)
                          </SelectItem>
                          <SelectItem value="Q1 2023">
                            Q1 2023 (Jan-Mar)
                          </SelectItem>
                          <SelectItem value="Q2 2023">
                            Q2 2023 (Apr-Jun)
                          </SelectItem>
                          <SelectItem value="Q3 2023">
                            Q3 2023 (Jul-Sep)
                          </SelectItem>
                          <SelectItem value="Q4 2023">
                            Q4 2023 (Oct-Dec)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Filing Date (Leave empty if not filed yet)
                      </FormLabel>
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
                                <span>Select filing date</span>
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
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
                                <span>Select due date</span>
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
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="due">Due</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">GST Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", taxableAmount: 0 })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`gstItems.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter item name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between">
                          <FormField
                            control={form.control}
                            name={`gstItems.${index}.taxableAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taxable Amount (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter taxable amount"
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
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-4 text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Taxable Amount:</span>
                  <span className="font-bold">
                    ₹{totalTaxableAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">GST Amount (18%):</span>
                  <span className="font-bold">
                    ₹{totalAmount.toLocaleString()}
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
                    <>{isEditMode ? "Update GST Filing" : "Add GST Filing"}</>
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
