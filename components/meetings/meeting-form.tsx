"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { SearchableDropdown } from "./searchable-dropdown";
import {
  addMeeting,
  updateMeeting,
  type Meeting,
  type AttendeeType,
  type AttendeeScope,
  getAttendeeOptions,
} from "@/data/meetings";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  agenda: z.string().min(1, "Agenda is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  time: z.string().min(1, "Time is required"),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  notes: z.string().optional(),
  meetingPoint: z.string().min(1, "Meeting point is required"),
  expectedAttendees: z.number().min(1, "Expected attendees must be at least 1"),
  actualAttendees: z.number().optional(),
  attendees: z.array(
    z.object({
      type: z.enum(["member", "vehicle", "labour", "route"]),
      scope: z.enum(["all", "selected"]),
      selectedIds: z.array(z.string()).optional(),
    })
  ),
  followUps: z
    .array(
      z.object({
        date: z.date({
          required_error: "Follow-up date is required",
        }),
        time: z.string().min(1, "Follow-up time is required"),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MeetingFormProps {
  meeting?: Meeting;
  isEditMode: boolean;
}

export default function MeetingForm({ meeting, isEditMode }: MeetingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeeOptions, setAttendeeOptions] = useState<
    Record<AttendeeType, { value: string; label: string }[]>
  >({
    member: [],
    vehicle: [],
    labour: [],
    route: [],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: meeting
      ? {
          ...meeting,
          date: new Date(meeting.date),
          followUps:
            meeting.followUps?.map((f) => ({
              date: new Date(f.date),
              time: f.time,
            })) || [],
        }
      : {
          title: "",
          agenda: "",
          date: new Date(),
          time: "09:00",
          status: "scheduled",
          notes: "",
          meetingPoint: "",
          expectedAttendees: 0,
          attendees: [],
          followUps: [],
        },
  });

  useEffect(() => {
    const loadAttendeeOptions = async () => {
      const types: AttendeeType[] = ["member", "vehicle", "labour", "route"];
      const options: Record<AttendeeType, { value: string; label: string }[]> =
        {
          member: [],
          vehicle: [],
          labour: [],
          route: [],
        };

      for (const type of types) {
        const items = await getAttendeeOptions(type);
        options[type] = items.map((item: any) => ({
          value: item.id,
          label:
            item.name ||
            item.registrationNumber ||
            item.firmName ||
            `${item.startPoint} - ${item.endPoint}`,
        }));
      }

      setAttendeeOptions(options);
    };

    loadAttendeeOptions();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && meeting) {
        const updatedMeeting = updateMeeting(meeting.id, {
          ...data,
          date: data.date.toISOString().split("T")[0],
          updatedAt: new Date().toISOString(),
        });
        console.log("Meeting updated:", updatedMeeting);
      } else {
        const newMeeting = addMeeting({
          ...data,
          date: data.date.toISOString().split("T")[0],
          updatedAt: new Date().toISOString(),
        });
        console.log("New meeting added:", newMeeting);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin/meetings");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save meeting. Please try again.");
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
      router.push("/admin/meetings");
    }
  };

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Meeting Details" : "New Meeting"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the meeting information below"
              : "Fill in the details to schedule a new meeting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meeting title" {...field} />
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
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Point</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter meeting location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedAttendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Attendees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="agenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agenda</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter meeting agenda"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Attendees</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="attendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add Attendee</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const [type, scope] = value.split("-") as [
                              AttendeeType,
                              AttendeeScope
                            ];
                            const currentAttendees =
                              form.getValues("attendees") || [];
                            const newAttendee = {
                              type,
                              scope,
                              selectedIds:
                                scope === "selected" ? [] : undefined,
                            };
                            form.setValue("attendees", [
                              ...currentAttendees,
                              newAttendee,
                            ]);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select attendee type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member-all">
                              All Members
                            </SelectItem>
                            <SelectItem value="member-selected">
                              Selected Members
                            </SelectItem>
                            <SelectItem value="vehicle-all">
                              All Vehicles
                            </SelectItem>
                            <SelectItem value="vehicle-selected">
                              Selected Vehicles
                            </SelectItem>
                            <SelectItem value="labour-all">
                              All Labour
                            </SelectItem>
                            <SelectItem value="labour-selected">
                              Selected Labour
                            </SelectItem>
                            <SelectItem value="route-all">
                              All Routes
                            </SelectItem>
                            <SelectItem value="route-selected">
                              Selected Routes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Display selected attendees */}
                  <div className="space-y-2">
                    {form.watch("attendees")?.map((attendee, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {attendee.scope === "all" ? "All" : "Selected"}{" "}
                            {attendee.type}s
                          </p>
                        </div>

                        {attendee.scope === "selected" && (
                          <div className="flex-1">
                            <SearchableDropdown
                              options={attendeeOptions[attendee.type]}
                              selectedValues={attendee.selectedIds || []}
                              onSelectionChange={(selectedIds) => {
                                const currentAttendees =
                                  form.getValues("attendees");
                                currentAttendees[index].selectedIds =
                                  selectedIds;
                                form.setValue("attendees", currentAttendees);
                              }}
                              placeholder={`Select ${attendee.type}s`}
                            />
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            const currentAttendees =
                              form.getValues("attendees");
                            currentAttendees.splice(index, 1);
                            form.setValue("attendees", currentAttendees);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Follow-up Meetings</h3>
                <div className="space-y-4">
                  {form.watch("followUps")?.map((_, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <FormField
                              control={form.control}
                              name={`followUps.${index}.date`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Follow-up Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={`w-full pl-3 text-left font-normal ${
                                            !field.value &&
                                            "text-muted-foreground"
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
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date <
                                          new Date(
                                            new Date().setHours(0, 0, 0, 0)
                                          )
                                        }
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
                              name={`followUps.${index}.time`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Follow-up Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              const followUps =
                                form.getValues("followUps") || [];
                              followUps.splice(index, 1);
                              form.setValue("followUps", followUps);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove follow-up</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const followUps = form.getValues("followUps") || [];
                      form.setValue("followUps", [
                        ...followUps,
                        { date: new Date(), time: "09:00" },
                      ]);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Follow-up Meeting
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Scheduling..."}
                    </>
                  ) : (
                    <>{isEditMode ? "Update Meeting" : "Schedule Meeting"}</>
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
