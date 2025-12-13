"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { renderRoleBasedPath } from "@/lib/utils";

type MemberAttendeeResponse = {
  id?: number;
  meetId?: string;
  all?: boolean;
  allExecutives?: boolean;
  zones?: Array<{ id?: number; zone: string; memberAttendeesId?: number }> | string[];
  mandals?: Array<{ id?: number; mandal: string; memberAttendeesId?: number }> | string[];
  customMembers?: Array<{ membershipId: string }> | string[];
};

type VehicleAttendeeResponse = {
  id?: number;
  meetId?: string;
  owner?: boolean;
  driver?: boolean;
  all?: boolean;
  customVehicle?: Array<{
    vehicleId: string;
    owner?: boolean;
    driver?: boolean;
  }>;
};

type LabourAttendeeResponse = {
  id?: number;
  meetId?: string;
  all?: boolean;
  membershipID?: string[];
  customLabours?: Array<{ labourId: string }> | string[];
};

// Types for the API
interface Meeting {
  id?: number;
  meetId?: string;
  title: string;
  agenda?: string;
  notes?: string;
  startTime: string;
  location: string;
  memberAttendees?: MemberAttendeeResponse[] | MemberAttendeeResponse | null;
  vehicleAttendees?: VehicleAttendeeResponse[] | VehicleAttendeeResponse | null;
  labourAttendees?: LabourAttendeeResponse[] | LabourAttendeeResponse | null;
  status: string;
  followUpMeetings?: Array<{
    dateTime: string;
  }>;
}

// Types for fetched data
interface Member {
  id: string;
  membershipId: string;
  fullName: string;
  applicantName: string;
  firmName: string;
  zone: string;
  mandal: string;
  phoneNumber: string;
}

interface Vehicle {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  ownerName: string;
}

interface Labour {
  id: string;
  labourId: string;
  fullName: string;
  phoneNumber: string;
  aadharNumber: string;
  labourStatus: string;
  labourAssignedTo?: {
    firmName: string;
  };
  photoPath?: string;
}



const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  agenda: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  time: z.string().min(1, "Time is required"),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  memberAttendees: z.object({
    type: z.enum(["all", "allExecutives", "selectedZone", "selectedMandal", "selectedMembers"]).optional(),
    zone: z.array(z.string()).optional(),
    mandal: z.array(z.string()).optional(),
    all: z.boolean().optional(),
    allExecutives: z.boolean().optional(),
    custom: z.array(z.string()).optional(),
  }).optional(),
  vehicleAttendees: z.object({
    type: z.enum(["allOwners", "allDrivers", "allDriversAndOwners", "selectedOwners", "selectedDrivers"]).optional(),
    owner: z.boolean().optional(),
    driver: z.boolean().optional(),
    custom: z.array(z.object({
      vehicleId: z.string(),
      owner: z.boolean(),
      driver: z.boolean(),
    })).optional(),
  }).optional(),
  labourAttendees: z.object({
    type: z.enum(["all", "selectedLabour"]).optional(),
    all: z.boolean().optional(),
    custom: z.array(z.string()).optional(),
  }).optional(),
  followUpMeeting: z.array(z.object({
    date: z.date({
      required_error: "Follow-up date is required",
    }),
    time: z.string().min(1, "Follow-up time is required"),
  })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MeetingFormProps {
  meetingId?: string;
  isEditMode: boolean;
}

export default function MeetingForm({ meetingId, isEditMode }: MeetingFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  // Data for dropdowns
  const [members, setMembers] = useState<Member[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [labour, setLabour] = useState<Labour[]>([]);
  const [zones, setZones] = useState<{ value: string; label: string }[]>([]);
  const [mandals, setMandals] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      agenda: "",
      date: new Date(),
      time: "09:00",
      status: "SCHEDULED",
      notes: "",
      location: "",
      memberAttendees: {},
      vehicleAttendees: {},
      labourAttendees: {
        type: undefined,
        all: false,
        custom: [],
      },
      followUpMeeting: [],
    },
  });

  const { fields: followUpFields, append: appendFollowUp, remove: removeFollowUp } = useFieldArray({
    control: form.control,
    name: "followUpMeeting",
  });

  // Fetch data for dropdowns
  const fetchDropdownData = async () => {
    if (!session?.user?.token) return;

    setIsLoadingData(true);
    try {
      // Fetch members
      const membersResponse = await axios.get(`${process.env.BACKEND_API_URL}/api/member/get_members`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      const membersData = Array.isArray(membersResponse.data) ? membersResponse.data : membersResponse.data.data || membersResponse.data.members || [];
      setMembers(membersData);

      // Fetch vehicles
      const vehiclesResponse = await axios.get(`${process.env.BACKEND_API_URL}/api/vehicle/get_vehicles`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      const vehiclesData = vehiclesResponse.data;
      setVehicles(vehiclesData);

      // Fetch labour
      const labourResponse = await axios.get(`${process.env.BACKEND_API_URL}/api/labour/get_all_labours`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      const labourData = labourResponse.data;
      setLabour(labourData);

      // Fetch Zones
      try {
        const zonesResponse = await axios.get(`${process.env.BACKEND_API_URL}/api/referenceData/getZone`, {
          headers: { Authorization: `Bearer ${session.user.token}` },
        });
        if (zonesResponse.data?.success && Array.isArray(zonesResponse.data?.result)) {
          setZones(zonesResponse.data.result.map((z: any) => ({ value: z.name, label: z.name })));
        }
      } catch (err) {
        console.error("Error fetching zones:", err);
      }

      // Fetch Mandals
      try {
        const mandalsResponse = await axios.get(`${process.env.BACKEND_API_URL}/api/referenceData/getMandal`, {
          headers: { Authorization: `Bearer ${session.user.token}` },
        });
        if (mandalsResponse.data?.success && Array.isArray(mandalsResponse.data?.result)) {
          setMandals(mandalsResponse.data.result.map((m: any) => ({ value: m.name, label: m.name })));
        }
      } catch (err) {
        console.error("Error fetching mandals:", err);
      }

    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data for dropdowns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch meeting data for edit mode
  const fetchMeeting = async () => {
    if (!isEditMode || !meetingId || !session?.user?.token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${process.env.BACKEND_API_URL}/api/meeting/get_meet_id/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      console.log("Token", session.user.token);
      console.log("Meeting data:", JSON.stringify(response.data));

      // Extract meeting from array response
      const meetingData = Array.isArray(response.data)
        ? response.data[0]
        : response.data.data?.[0] || response.data;
      setMeeting(meetingData);

      // Set form values
      const startDate = new Date(meetingData.startTime);
      const startTime = format(startDate, "HH:mm");

      // Extract attendee data from the new structure
      const memberAttendeeRaw = meetingData.memberAttendees;
      const vehicleAttendeeRaw = meetingData.vehicleAttendees;
      const labourAttendeeRaw = meetingData.labourAttendees;

      const memberAttendee = Array.isArray(memberAttendeeRaw)
        ? memberAttendeeRaw[0] || {}
        : memberAttendeeRaw || {};
      const vehicleAttendee = Array.isArray(vehicleAttendeeRaw)
        ? vehicleAttendeeRaw[0] || {}
        : vehicleAttendeeRaw || {};
      const labourAttendee = Array.isArray(labourAttendeeRaw)
        ? labourAttendeeRaw[0] || {}
        : labourAttendeeRaw || {};

      // Debug labour attendee structure
      console.log("=== FETCH MEETING LABOUR DEBUG ===");
      console.log("Labour attendee:", labourAttendee);

      console.log("customLabours:", labourAttendee.customLabours);
      console.log("Mapped custom labours:", labourAttendee.customLabours?.map((lab: any) => lab.labourId));

      // Debug member attendee structure
      console.log("=== FETCH MEETING MEMBER DEBUG ===");
      console.log("Member attendee:", memberAttendee);
      console.log("all:", memberAttendee.all);
      console.log("allExecutives:", memberAttendee.allExecutives);
      console.log("zones:", memberAttendee.zones);
      console.log("mandals:", memberAttendee.mandals);
      console.log("customMembers:", memberAttendee.customMembers);

      // Calculate member type
      const memberType = memberAttendee.all
        ? "all"
        : memberAttendee.allExecutives
          ? "allExecutives"
          : memberAttendee.zones?.length
            ? "selectedZone"
            : memberAttendee.mandals?.length
              ? "selectedMandal"
              : memberAttendee.customMembers?.length
                ? "selectedMembers"
                : undefined;
      console.log("Calculated member type:", memberType);

      form.reset({
        title: meetingData.title,
        agenda: meetingData.agenda,
        date: startDate,
        time: startTime,
        status: meetingData.status,
        notes: meetingData.notes || "",
        location: meetingData.location,
        memberAttendees: {
          type: memberAttendee.all
            ? "all"
            : memberAttendee.allExecutives
              ? "allExecutives"
              : memberAttendee.zones?.length
                ? "selectedZone"
                : memberAttendee.mandals?.length
                  ? "selectedMandal"
                  : memberAttendee.customMembers?.length
                    ? "selectedMembers"
                    : undefined,
          zone: (memberAttendee.zones || []).map((z: any) => z.zone ?? z),
          mandal: (memberAttendee.mandals || []).map((m: any) => m.mandal ?? m),
          all: memberAttendee.all || false,
          allExecutives: memberAttendee.allExecutives || false,
          custom:
            (memberAttendee.customMembers || []).map(
              (m: any) => m.membershipId || m
            ) || [],
        },
        vehicleAttendees: {
          type: vehicleAttendee.all
            ? vehicleAttendee.owner && vehicleAttendee.driver
              ? "allDriversAndOwners"
              : vehicleAttendee.owner
                ? "allOwners"
                : "allDrivers"
            : vehicleAttendee.customVehicle?.length
              ? vehicleAttendee.owner
                ? "selectedOwners"
                : "selectedDrivers"
              : vehicleAttendee.owner || vehicleAttendee.driver
                ? vehicleAttendee.owner && vehicleAttendee.driver
                  ? "selectedOwners" // If both are true but all is false and no customVehicle, default to selectedOwners
                  : vehicleAttendee.owner
                    ? "selectedOwners"
                    : "selectedDrivers"
                : undefined,
          owner: vehicleAttendee.owner || false,
          driver: vehicleAttendee.driver || false,
          custom:
            (vehicleAttendee.customVehicle || []).map((v: any) => ({
              vehicleId: v.vehicleId,
              owner: v.owner ?? vehicleAttendee.owner,
              driver: v.driver ?? vehicleAttendee.driver,
            })) || [],
        },
        labourAttendees: {
          type: labourAttendee.all
            ? "all"
            : labourAttendee.customLabours?.length
              ? "selectedLabour"
              : undefined,
          all: labourAttendee.all || false,
          custom:
            (labourAttendee.customLabours || []).map(
              (lab: any) => lab.labourId || lab
            ) || [],
        },
        followUpMeeting: meetingData.followUpMeetings?.map((followUp: any) => ({
          date: new Date(followUp.dateTime),
          time: format(new Date(followUp.dateTime), "HH:mm"),
        })) || [],
      });


    } catch (error) {
      console.error("Error fetching meeting:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meeting details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchDropdownData();
      fetchMeeting();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status, session?.user?.token, meetingId, isEditMode]);

  const onSubmit = async (data: FormValues) => {
    if (!session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time
      const dateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Process attendee data based on selection type
      const processMemberAttendees = () => {
        if (!data.memberAttendees?.type) return {};

        const memberAttendees: any = {
          zone: [],
          mandal: [],
          all: false,
          allExecutives: false,
          custom: []
        };

        if (data.memberAttendees?.type === "all") {
          memberAttendees.all = true;
        } else if (data.memberAttendees?.type === "allExecutives") {
          memberAttendees.allExecutives = true;
        } else if (data.memberAttendees?.type === "selectedZone" && data.memberAttendees.zone && data.memberAttendees.zone.length > 0) {
          memberAttendees.zone = data.memberAttendees.zone;
        } else if (data.memberAttendees?.type === "selectedMandal" && data.memberAttendees.mandal && data.memberAttendees.mandal.length > 0) {
          memberAttendees.mandal = data.memberAttendees.mandal;
        } else if (data.memberAttendees?.type === "selectedMembers" && data.memberAttendees.custom && data.memberAttendees.custom.length > 0) {
          // Use "custom" for create/add operation (not "customMembers")
          memberAttendees.custom = data.memberAttendees.custom;
        }

        return memberAttendees;
      };

      const processVehicleAttendees = () => {
        const vehicleAttendees: any = {};

        if (data.vehicleAttendees?.type === "allOwners") {
          vehicleAttendees.owner = true;
          vehicleAttendees.driver = false;
          vehicleAttendees.all = true;
        } else if (data.vehicleAttendees?.type === "allDrivers") {
          vehicleAttendees.owner = false;
          vehicleAttendees.driver = true;
          vehicleAttendees.all = true;
        } else if (data.vehicleAttendees?.type === "allDriversAndOwners") {
          vehicleAttendees.owner = true;
          vehicleAttendees.driver = true;
          vehicleAttendees.all = true;
        } else if ((data.vehicleAttendees?.type === "selectedOwners" || data.vehicleAttendees?.type === "selectedDrivers") && data.vehicleAttendees.custom && data.vehicleAttendees.custom.length > 0) {
          // Determine owner/driver flags from the selected type and vehicle flags
          const isOwnerType = data.vehicleAttendees?.type === "selectedOwners";
          const customVehicles = data.vehicleAttendees.custom.map((v: any) => ({
            vehicleId: v.vehicleId,
            owner: v.owner ?? isOwnerType,
            driver: v.driver ?? !isOwnerType,
          }));

          // Set top-level flags: true if any vehicle has that flag
          vehicleAttendees.owner = customVehicles.some((v: any) => v.owner) || isOwnerType;
          vehicleAttendees.driver = customVehicles.some((v: any) => v.driver) || !isOwnerType;
          vehicleAttendees.all = false;
          // Use "custom" for create/add operation (not "customVehicle")
          vehicleAttendees.custom = customVehicles;
        }

        return vehicleAttendees;
      };

      const processLabourAttendees = () => {
        const labourAttendees: any = {};

        if (data.labourAttendees?.type === "all") {
          // 1. All Labour
          labourAttendees.all = true;
        } else if (data.labourAttendees?.type === "selectedLabour" && data.labourAttendees.custom && data.labourAttendees.custom.length > 0) {
          // 3. Selected Labour
          labourAttendees.all = false;
          // Use "custom" for create/add operation (not "customLabours")
          labourAttendees.custom = data.labourAttendees.custom;
        }

        return labourAttendees;
      };

      // Validate meeting time is in the future
      if (dateTime <= new Date()) {
        console.log("Meeting time validation failed - time is in the past");
        toast({
          title: "Error",
          description: "Meeting start time must be in the future.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Process attendees and only include non-empty objects
      const memberAttendees = processMemberAttendees();
      const vehicleAttendees = processVehicleAttendees();
      const labourAttendees = processLabourAttendees();

      // Build attendees object - only include sections that have data
      const attendees: any = {};

      if (Object.keys(memberAttendees).length > 0) {
        attendees.memberAttendees = memberAttendees;
      }

      if (Object.keys(vehicleAttendees).length > 0) {
        attendees.vehicleAttendees = vehicleAttendees;
      }

      if (Object.keys(labourAttendees).length > 0) {
        attendees.labourAttendees = labourAttendees;
      }

      // Validate that at least one attendee type is selected
      if (Object.keys(attendees).length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one attendee type (Members, Vehicles, or Labour).",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const meetingData = {
        title: data.title,
        agenda: data.agenda,
        notes: data.notes,
        startTime: dateTime.toISOString(),
        location: data.location,
        attendees,
        status: data.status,
        followUpMeeting: data.followUpMeeting?.map((followUp) => {
          // Combine date and time for follow-up meetings
          const followUpDateTime = new Date(followUp.date);
          const [hours, minutes] = followUp.time.split(':');
          followUpDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          return {
            dateTime: followUpDateTime.toISOString(),
          };
        }),
      };

      console.log("Final meetingData payload:", JSON.stringify(meetingData, null, 2));

      if (isEditMode && meetingId) {
        // Update existing meeting - only send changed fields
        const updateData: any = {
          meetId: meetingId,
        };

        // Only include basic fields if they've changed
        if (data.title !== meeting?.title) updateData.title = data.title;
        if (data.agenda !== meeting?.agenda) updateData.agenda = data.agenda;
        if (data.notes !== meeting?.notes) updateData.notes = data.notes;
        if (dateTime.toISOString() !== meeting?.startTime) updateData.startTime = dateTime.toISOString();
        if (data.location !== meeting?.location) updateData.location = data.location;
        if (data.status !== meeting?.status) updateData.status = data.status;

        // Check for attendee changes
        const getOriginalAttendee = <T,>(raw: T | T[] | null | undefined, fallback: any = {}) => {
          if (!raw) return fallback;
          return Array.isArray(raw) ? raw[0] || fallback : raw || fallback;
        };

        const originalMemberAttendee = getOriginalAttendee(meeting?.memberAttendees, {
          all: false,
          allExecutives: false,
          zones: [],
          mandals: [],
          customMembers: [],
        });
        const originalVehicleAttendee = getOriginalAttendee(meeting?.vehicleAttendees, {
          owner: false,
          driver: false,
          customVehicle: [],
        });
        const originalLabourAttendee = getOriginalAttendee(meeting?.labourAttendees, {
          all: false,
          customLabours: [],
        }) as any;

        // Check if member attendees changed
        const originalCustomMembers = (originalMemberAttendee.customMembers || []).map((m: any) => m.membershipId || m);
        const newCustomMembers = data.memberAttendees?.custom || [];
        const originalZones = (originalMemberAttendee.zones || []).map((z: any) => z.zone || z);
        const newZones = data.memberAttendees?.zone || [];
        const originalMandals = (originalMemberAttendee.mandals || []).map((m: any) => m.mandal || m);
        const newMandals = data.memberAttendees?.mandal || [];

        // Determine original type based on original data
        const originalType = originalMemberAttendee.all ? "all" :
          originalMemberAttendee.allExecutives ? "allExecutives" :
            originalZones.length > 0 ? "selectedZone" :
              originalMandals.length > 0 ? "selectedMandal" :
                originalCustomMembers.length > 0 ? "selectedMembers" : undefined;
        const newType = data.memberAttendees?.type;

        // Debug original structure
        console.log("=== ORIGINAL DATA STRUCTURE DEBUG ===");
        console.log("Original member attendee:", originalMemberAttendee);
        console.log("Original type:", originalType);
        console.log("New type:", newType);
        console.log("Original custom members:", originalMemberAttendee.customMembers);
        console.log("Original zones:", originalMemberAttendee.zones);
        console.log("Original mandals:", originalMemberAttendee.mandals);

        // Check if type changed or if values within the same type changed
        const typeChanged = originalType !== newType;
        const memberChanged =
          typeChanged ||
          (newType === "selectedZone" && JSON.stringify(newZones) !== JSON.stringify(originalZones)) ||
          (newType === "selectedMandal" && JSON.stringify(newMandals) !== JSON.stringify(originalMandals)) ||
          (newType === "selectedMembers" && JSON.stringify(newCustomMembers) !== JSON.stringify(originalCustomMembers));

        if (memberChanged) {
          updateData.attendees = updateData.attendees || {};

          // Handle member attendee changes with proper add/delete logic
          // Determine all and allExecutives based on the current type selection
          const memberType = data.memberAttendees?.type;
          const memberUpdates: any = {
            all: memberType === "all" ? true : false,
            allExecutives: memberType === "allExecutives" ? true : false,
          };

          // If type changed, delete old selections
          if (typeChanged) {
            // Delete old zones if switching away from selectedZone
            if (originalType === "selectedZone" && originalZones.length > 0) {
              const deletedZoneIds = originalMemberAttendee.zones
                ?.map((z: any) => z.id)
                ?.filter(Boolean) || [];
              if (deletedZoneIds.length > 0) {
                memberUpdates.deleteZone = deletedZoneIds;
              }
            }

            // Delete old mandals if switching away from selectedMandal
            if (originalType === "selectedMandal" && originalMandals.length > 0) {
              const deletedMandalIds = originalMemberAttendee.mandals
                ?.map((m: any) => m.id)
                ?.filter(Boolean) || [];
              if (deletedMandalIds.length > 0) {
                memberUpdates.deleteMandal = deletedMandalIds;
              }
            }

            // Delete old custom members if switching away from selectedMembers
            if (originalType === "selectedMembers" && originalCustomMembers.length > 0) {
              const deletedMemberIds = originalMemberAttendee.customMembers
                ?.map((m: any) => m.id)
                ?.filter(Boolean) || [];
              if (deletedMemberIds.length > 0) {
                // Use "deleteCustom" for edit/update operation (array of IDs)
                memberUpdates.deleteCustom = deletedMemberIds;
              }
            }
          }

          // Handle zone changes (only if type is selectedZone)
          if (memberType === "selectedZone") {
            if (typeChanged || JSON.stringify(newZones) !== JSON.stringify(originalZones)) {
              if (typeChanged) {
                // If switching to selectedZone, add all new zones
                if (newZones.length > 0) {
                  memberUpdates.newZone = newZones;
                }
              } else {
                // If staying in selectedZone, handle additions and deletions
                const addedZones = newZones.filter((zone: string) => !originalZones.includes(zone));
                const deletedZones = originalZones.filter((zone: string) => !newZones.includes(zone));

                if (addedZones.length > 0) {
                  memberUpdates.newZone = addedZones;
                }
                if (deletedZones.length > 0) {
                  const deletedZoneIds = originalMemberAttendee.zones
                    ?.filter((z: any) => deletedZones.includes(z.zone))
                    ?.map((z: any) => z.id)
                    ?.filter(Boolean) || [];
                  if (deletedZoneIds.length > 0) {
                    memberUpdates.deleteZone = deletedZoneIds;
                  }
                }
              }
            }
          }

          // Handle mandal changes (only if type is selectedMandal)
          if (memberType === "selectedMandal") {
            if (typeChanged || JSON.stringify(newMandals) !== JSON.stringify(originalMandals)) {
              if (typeChanged) {
                // If switching to selectedMandal, add all new mandals
                if (newMandals.length > 0) {
                  memberUpdates.newMandal = newMandals;
                }
              } else {
                // If staying in selectedMandal, handle additions and deletions
                const addedMandals = newMandals.filter((mandal: string) => !originalMandals.includes(mandal));
                const deletedMandals = originalMandals.filter((mandal: string) => !newMandals.includes(mandal));

                if (addedMandals.length > 0) {
                  memberUpdates.newMandal = addedMandals;
                }
                if (deletedMandals.length > 0) {
                  const deletedMandalIds = originalMemberAttendee.mandals
                    ?.filter((m: any) => deletedMandals.includes(m.mandal))
                    ?.map((m: any) => m.id)
                    ?.filter(Boolean) || [];
                  if (deletedMandalIds.length > 0) {
                    memberUpdates.deleteMandal = deletedMandalIds;
                  }
                }
              }
            }
          }

          // Handle custom member changes (only if type is selectedMembers)
          if (memberType === "selectedMembers") {
            if (typeChanged || JSON.stringify(newCustomMembers) !== JSON.stringify(originalCustomMembers)) {
              if (typeChanged) {
                // If switching to selectedMembers, add all new members
                if (newCustomMembers.length > 0) {
                  // Use "newCustom" for edit/update operation (array of membership IDs)
                  memberUpdates.newCustom = newCustomMembers;
                }
              } else {
                // If staying in selectedMembers, handle additions and deletions
                const addedMembers = newCustomMembers.filter((member: string) => !originalCustomMembers.includes(member));
                const deletedMembers = originalCustomMembers.filter((member: string) => !newCustomMembers.includes(member));

                if (addedMembers.length > 0) {
                  // Use "newCustom" for edit/update operation (array of membership IDs)
                  memberUpdates.newCustom = addedMembers;
                }
                if (deletedMembers.length > 0) {
                  // Get the IDs of deleted members - use "deleteCustom" for edit/update (array of IDs)
                  const deletedMemberIds = originalMemberAttendee.customMembers
                    ?.filter((m: any) => deletedMembers.includes(m.membershipId || m))
                    ?.map((m: any) => m.id)
                    ?.filter(Boolean) || [];
                  if (deletedMemberIds.length > 0) {
                    memberUpdates.deleteCustom = deletedMemberIds;
                  }
                }
              }
            }
          }

          updateData.attendees.memberAttendees = memberUpdates;

          // Debug member change detection
          console.log("=== MEMBER CHANGE DEBUG ===");
          console.log("Original all:", originalMemberAttendee.all);
          console.log("New all:", data.memberAttendees?.all);
          console.log("Original custom members:", originalCustomMembers);
          console.log("New custom members:", newCustomMembers);
          console.log("Original zones:", originalZones);
          console.log("New zones:", newZones);
          console.log("Original mandals:", originalMandals);
          console.log("New mandals:", newMandals);
          console.log("Member updates:", updateData.attendees.memberAttendees);
        }

        // Check if vehicle attendees changed
        const originalCustomVehicles = (originalVehicleAttendee.customVehicle || []).map((v: any) => ({
          vehicleId: v.vehicleId,
          owner: v.owner,
          driver: v.driver
        })) || [];
        const newCustomVehicles = data.vehicleAttendees?.custom || [];

        const vehicleChanged =
          data.vehicleAttendees?.owner !== originalVehicleAttendee.owner ||
          data.vehicleAttendees?.driver !== originalVehicleAttendee.driver ||
          JSON.stringify(newCustomVehicles) !== JSON.stringify(originalCustomVehicles);

        if (vehicleChanged) {
          updateData.attendees = updateData.attendees || {};

          // Determine if it's "all" based on type
          const isAllType = data.vehicleAttendees?.type === "allOwners" || data.vehicleAttendees?.type === "allDrivers" || data.vehicleAttendees?.type === "allDriversAndOwners";

          const vehicleUpdates: any = {
            owner: data.vehicleAttendees?.owner || false,
            driver: data.vehicleAttendees?.driver || false,
            all: isAllType,
          };

          // Handle custom vehicle changes
          if (JSON.stringify(newCustomVehicles) !== JSON.stringify(originalCustomVehicles)) {
            const addedVehicles = newCustomVehicles.filter((vehicle: any) =>
              !originalCustomVehicles.some((orig: any) => orig.vehicleId === vehicle.vehicleId)
            );
            const deletedVehicles = originalCustomVehicles.filter((vehicle: any) =>
              !newCustomVehicles.some((newV: any) => newV.vehicleId === vehicle.vehicleId)
            );

            if (addedVehicles.length > 0) {
              // Use "newCustom" for edit/update operation
              vehicleUpdates.newCustom = addedVehicles.map((v: any) => ({
                vehicleId: v.vehicleId,
                owner: v.owner,
                driver: v.driver,
              }));
            }
            if (deletedVehicles.length > 0) {
              // Get the IDs of deleted vehicles - use "deleteCustom" for edit/update
              const deletedVehicleIds = (originalVehicleAttendee.customVehicle || [])
                ?.filter((v: any) => deletedVehicles.some((delV: any) => delV.vehicleId === v.vehicleId))
                ?.map((v: any) => v.id)
                ?.filter(Boolean) || [];
              if (deletedVehicleIds.length > 0) {
                vehicleUpdates.deleteCustom = deletedVehicleIds;
              }
            }
          }

          updateData.attendees.vehicleAttendees = vehicleUpdates;

          // Debug vehicle change detection
          console.log("=== VEHICLE CHANGE DEBUG ===");
          console.log("Original owner:", originalVehicleAttendee.owner);
          console.log("New owner:", data.vehicleAttendees?.owner);
          console.log("Original driver:", originalVehicleAttendee.driver);
          console.log("New driver:", data.vehicleAttendees?.driver);
          console.log("Original custom vehicles:", originalCustomVehicles);
          console.log("New custom vehicles:", newCustomVehicles);
          console.log("Vehicle updates:", updateData.attendees.vehicleAttendees);
        }

        // Check if labour attendees changed
        const originalCustomLabours = (originalLabourAttendee.customLabours || []).map((lab: any) => lab.labourId || lab);
        const newCustomLabours = data.labourAttendees?.custom || [];

        // Debug labour change detection
        console.log("=== LABOUR CHANGE DETECTION DEBUG ===");
        console.log("Original labour attendee:", originalLabourAttendee);
        console.log("Form labour attendees:", data.labourAttendees);
        console.log("Form labour type:", data.labourAttendees?.type);
        console.log("Original custom labours:", originalCustomLabours);
        console.log("New custom labours:", newCustomLabours);

        const labourChanged =
          data.labourAttendees?.all !== originalLabourAttendee.all ||
          JSON.stringify(newCustomLabours) !== JSON.stringify(originalCustomLabours);

        if (labourChanged) {
          updateData.attendees = updateData.attendees || {};

          const labourUpdates: any = {
            all: data.labourAttendees?.all || false,
          };

          // Handle custom labour changes
          if (JSON.stringify(newCustomLabours) !== JSON.stringify(originalCustomLabours)) {
            console.log("Custom labour change detected");
            const addedCustomLabours = newCustomLabours.filter((labour: string) => !originalCustomLabours.includes(labour));
            const deletedCustomLabours = originalCustomLabours.filter((labour: string) => !newCustomLabours.includes(labour));

            console.log("Added custom labours:", addedCustomLabours);
            console.log("Deleted custom labours:", deletedCustomLabours);

            if (addedCustomLabours.length > 0) {
              // Use "newCustom" for edit/update operation (array of labour IDs)
              labourUpdates.newCustom = addedCustomLabours;
            }
            if (deletedCustomLabours.length > 0) {
              // Get the IDs of deleted custom labours - use "deleteCustom" for edit/update (array of IDs)
              const deletedCustomLabourIds = (originalLabourAttendee.customLabours || [])
                ?.filter((l: any) => deletedCustomLabours.includes(l.labourId || l))
                ?.map((l: any) => l.id)
                ?.filter(Boolean) || [];
              console.log("Deleted custom labour IDs:", deletedCustomLabourIds);
              if (deletedCustomLabourIds.length > 0) {
                labourUpdates.deleteCustom = deletedCustomLabourIds;
              }
            }
          }

          updateData.attendees.labourAttendees = labourUpdates;

          // Debug labour change detection
          console.log("=== LABOUR CHANGE DEBUG ===");
          console.log("Original all:", originalLabourAttendee.all);
          console.log("New all:", data.labourAttendees?.all);
          console.log("Original custom labours:", originalCustomLabours);
          console.log("New custom labours:", newCustomLabours);
          console.log("Labour updates:", updateData.attendees.labourAttendees);
        }

        // Check if follow-up meetings changed
        const originalFollowUp = meeting?.followUpMeetings || [];
        const newFollowUp = data.followUpMeeting?.map((followUp) => {
          const followUpDateTime = new Date(followUp.date);
          const [hours, minutes] = followUp.time.split(':');
          followUpDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return followUpDateTime.toISOString();
        }) || [];

        const followUpChanged = JSON.stringify(originalFollowUp.map((f: any) => f.dateTime)) !== JSON.stringify(newFollowUp);

        if (followUpChanged) {
          const originalFollowUpIds = originalFollowUp.map((f: any) => f.id).filter(Boolean);
          const newFollowUpData = data.followUpMeeting?.map((followUp) => {
            const followUpDateTime = new Date(followUp.date);
            const [hours, minutes] = followUp.time.split(':');
            followUpDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return {
              dateTime: followUpDateTime.toISOString(),
            };
          }) || [];

          // If we have new follow-up meetings, add them
          if (newFollowUpData.length > 0) {
            updateData.newFollowUpMeeting = newFollowUpData;
          }

          // If we had original follow-up meetings but now have none, delete them
          if (originalFollowUpIds.length > 0 && newFollowUpData.length === 0) {
            updateData.deleteFollowUpMeeting = originalFollowUpIds;
          }
        }

        // Only include attendees if there are actual changes
        if (updateData.attendees) {
          const hasAttendeeChanges =
            updateData.attendees.memberAttendees ||
            updateData.attendees.vehicleAttendees ||
            updateData.attendees.labourAttendees;

          if (!hasAttendeeChanges) {
            delete updateData.attendees;
          }
        }

        console.log("=== EDIT MEETING PAYLOAD ===");
        console.log(JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.post(`${process.env.BACKEND_API_URL}/api/meeting/update_meeting`, updateData, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            'Content-Type': 'application/json',
          },
        });



        toast({
          title: "Success",
          description: "Meeting updated successfully.",
        });
      } else {
        // Create new meeting
        const scheduleResponse = await axios.post(`${process.env.BACKEND_API_URL}/api/meeting/schedule_meeting`, meetingData, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            'Content-Type': 'application/json',
          },
        });

        toast({
          title: "Success",
          description: "Meeting scheduled successfully.",
        });
      }

      router.push(`/${renderRoleBasedPath(session?.user?.role)}/meetings`);
    } catch (error) {
      console.error("Meeting form error:", error);

      toast({
        title: "Error",
        description: "Failed to save meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    router.back();
  };

  const addFollowUpMeeting = () => {
    appendFollowUp({
      date: new Date(),
      time: "09:00",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isEditMode ? "Loading meeting details..." : "Loading..."}
            </p>
          </div>
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
        <Button variant="outline" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Meeting" : "Schedule New Meeting"}
        </h1>
      </div>

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          {
                            isEditMode && (
                              <>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </>
                            )
                          }
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
                    <FormItem className="">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meeting location" {...field} />
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
                    <FormLabel
                      data-required="false"
                      data-tooltip="Optional: capture the meeting agenda."
                    >
                      Agenda
                    </FormLabel>
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
                    <FormLabel
                      data-required="false"
                      data-tooltip="Optional: capture any additional context or reminders for this meeting."
                    >
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional notes"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attendees Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendees</CardTitle>
                  <CardDescription>
                    Select who should attend this meeting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Unified Attendee Selection */}
                  <div className="space-y-4">
                    {isEditMode && (
                      <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Attendee editing disabled</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>To change attendees, please cancel this meeting and schedule a new one.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <FormLabel
                      data-tooltip="Please choose carefully the attendees as you won't be able to edit the Attendeed."
                    >
                      Attendees
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isEditMode}
                        >
                          <span>Select attendees...</span>
                          <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search attendee types..." />
                          <CommandList>
                            <CommandEmpty>No attendee type found.</CommandEmpty>

                            <CommandGroup heading="Member Attendees">
                              {[
                                { value: "all", label: "All Members" },
                                { value: "allExecutives", label: "All Executives" },
                                { value: "selectedZone", label: "Selected Zone" },
                                { value: "selectedMandal", label: "Selected Mandal" },
                                { value: "selectedMembers", label: "Selected Members" },
                              ].map((option) => {
                                const isSelected = form.watch("memberAttendees.type") === option.value;
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      if (isSelected) {
                                        form.setValue("memberAttendees.type", undefined);
                                        // Clear dependent fields
                                        form.setValue("memberAttendees.zone", []);
                                        form.setValue("memberAttendees.mandal", []);
                                        form.setValue("memberAttendees.custom", []);
                                      } else {
                                        form.setValue("memberAttendees.type", option.value as any);
                                        // Clear Dependent fields when switching type
                                        form.setValue("memberAttendees.zone", []);
                                        form.setValue("memberAttendees.mandal", []);
                                        form.setValue("memberAttendees.custom", []);
                                      }
                                    }}
                                  >
                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                      <Plus className="h-4 w-4" />
                                    </div>
                                    {option.label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>

                            <CommandGroup heading="Vehicle Attendees">
                              {[
                                { value: "allOwners", label: "All Vehicle Owners" },
                                { value: "allDrivers", label: "All Vehicle Drivers" },
                                { value: "allDriversAndOwners", label: "All Driver & Owners" },
                                { value: "selectedOwners", label: "Selected Vehicle Owners" },
                                { value: "selectedDrivers", label: "Selected Vehicle Drivers" },
                              ].map((option) => {
                                const isSelected = form.watch("vehicleAttendees.type") === option.value;
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      if (isSelected) {
                                        form.setValue("vehicleAttendees.type", undefined);
                                        form.setValue("vehicleAttendees.custom", []);
                                      } else {
                                        form.setValue("vehicleAttendees.type", option.value as any);

                                        // Update owner/driver flags based on selection
                                        if (option.value === "allOwners") {
                                          form.setValue("vehicleAttendees.owner", true);
                                          form.setValue("vehicleAttendees.driver", false);
                                        } else if (option.value === "allDrivers") {
                                          form.setValue("vehicleAttendees.owner", false);
                                          form.setValue("vehicleAttendees.driver", true);
                                        } else if (option.value === "allDriversAndOwners") {
                                          form.setValue("vehicleAttendees.owner", true);
                                          form.setValue("vehicleAttendees.driver", true);
                                        } else if (option.value === "selectedOwners") {
                                          form.setValue("vehicleAttendees.owner", true);
                                          form.setValue("vehicleAttendees.driver", false);
                                        } else if (option.value === "selectedDrivers") {
                                          form.setValue("vehicleAttendees.owner", false);
                                          form.setValue("vehicleAttendees.driver", true);
                                        }

                                        // Clear dependent fields
                                        form.setValue("vehicleAttendees.custom", []);
                                      }
                                    }}
                                  >
                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                      <Plus className="h-4 w-4" />
                                    </div>
                                    {option.label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>

                            <CommandGroup heading="Labour Attendees">
                              {[
                                { value: "all", label: "All Labour" },
                                { value: "selectedLabour", label: "Selected Labour" },
                              ].map((option) => {
                                const isSelected = form.watch("labourAttendees.type") === option.value;
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      if (isSelected) {
                                        form.setValue("labourAttendees.type", undefined);
                                        form.setValue("labourAttendees.custom", []);
                                      } else {
                                        form.setValue("labourAttendees.type", option.value as any);
                                        form.setValue("labourAttendees.all", option.value === "all");
                                        form.setValue("labourAttendees.custom", []);
                                      }
                                    }}
                                  >
                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                      <Plus className="h-4 w-4" />
                                    </div>
                                    {option.label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Active Selections display tags */}
                    <div className="flex flex-wrap gap-2" {...(isEditMode && { disabled: true })}>
                      {/* Member Tag */}
                      {form.watch("memberAttendees.type") && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm border border-primary/20">
                          <span className="font-medium">Members:</span>
                          <span>
                            {form.watch("memberAttendees.type") === "all" && "All Members"}
                            {form.watch("memberAttendees.type") === "allExecutives" && "All Executives"}
                            {form.watch("memberAttendees.type") === "selectedZone" && "Selected Zone"}
                            {form.watch("memberAttendees.type") === "selectedMandal" && "Selected Mandal"}
                            {form.watch("memberAttendees.type") === "selectedMembers" && "Selected Members"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue("memberAttendees.type", undefined);
                              form.setValue("memberAttendees.zone", []);
                              form.setValue("memberAttendees.mandal", []);
                              form.setValue("memberAttendees.custom", []);
                            }}
                            className="ml-1 hover:text-destructive"
                            disabled={isEditMode}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Vehicle Tag */}
                      {form.watch("vehicleAttendees.type") && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm border border-primary/20">
                          <span className="font-medium">Vehicles:</span>
                          <span>
                            {form.watch("vehicleAttendees.type") === "allOwners" && "All Owners"}
                            {form.watch("vehicleAttendees.type") === "allDrivers" && "All Drivers"}
                            {form.watch("vehicleAttendees.type") === "allDriversAndOwners" && "All Drivers & Owners"}
                            {form.watch("vehicleAttendees.type") === "selectedOwners" && "Selected Owners"}
                            {form.watch("vehicleAttendees.type") === "selectedDrivers" && "Selected Drivers"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue("vehicleAttendees.type", undefined);
                              form.setValue("vehicleAttendees.custom", []);
                            }}
                            className="ml-1 hover:text-destructive"
                            disabled={isEditMode}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Labour Tag */}
                      {form.watch("labourAttendees.type") && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm border border-primary/20">
                          <span className="font-medium">Labour:</span>
                          <span>
                            {form.watch("labourAttendees.type") === "all" && "All Labour"}
                            {form.watch("labourAttendees.type") === "selectedLabour" && "Selected Labour"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              form.setValue("labourAttendees.type", undefined);
                              form.setValue("labourAttendees.custom", []);
                            }}
                            className="ml-1 hover:text-destructive"
                            disabled={isEditMode}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Attendees Sub-selection */}
                  <div className="space-y-4">
                    {/* Zone Selection */}
                    {form.watch("memberAttendees.type") === "selectedZone" && (
                      <FormField
                        control={form.control}
                        name="memberAttendees.zone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-required="false">Select Zones</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild disabled={isEditMode}>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {field.value && field.value.length > 0
                                      ? `${field.value.length} zone(s) selected`
                                      : "Select zones..."}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search zones..." />
                                  <CommandList>
                                    <CommandEmpty>No zones found.</CommandEmpty>
                                    <CommandGroup>
                                      {zones.map((zone) => (
                                        <CommandItem
                                          key={zone.value}
                                          value={zone.label}
                                          onSelect={() => {
                                            const currentZones = field.value || [];
                                            if (!currentZones.includes(zone.value)) {
                                              field.onChange([...currentZones, zone.value]);
                                            }
                                          }}
                                        >
                                          {zone.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((zone) => (
                                  <div key={zone} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    <span>{zones.find(z => z.value === zone)?.label}</span>
                                    <button
                                      disabled={isEditMode}
                                      type="button"
                                      onClick={() => field.onChange(field.value?.filter(z => z !== zone))}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Mandal Selection */}
                    {form.watch("memberAttendees.type") === "selectedMandal" && (
                      <FormField
                        control={form.control}
                        name="memberAttendees.mandal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-required="false">Select Mandals</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild disabled={isEditMode}>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {field.value && field.value.length > 0
                                      ? `${field.value.length} mandal(s) selected`
                                      : "Select mandals..."}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search mandals..." />
                                  <CommandList>
                                    <CommandEmpty>No mandals found.</CommandEmpty>
                                    <CommandGroup>
                                      {mandals.map((mandal) => (
                                        <CommandItem
                                          key={mandal.value}
                                          value={mandal.label}
                                          onSelect={() => {
                                            const currentMandal = field.value || [];
                                            if (!currentMandal.includes(mandal.value)) {
                                              field.onChange([...currentMandal, mandal.value]);
                                            }
                                          }}
                                        >
                                          {mandal.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((mandal) => (
                                  <div key={mandal} className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                    <span>{mandals.find(m => m.value === mandal)?.label}</span>
                                    <button
                                      disabled={isEditMode}
                                      type="button"
                                      onClick={() => field.onChange(field.value?.filter(m => m !== mandal))}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Individual Member Selection */}
                    {form.watch("memberAttendees.type") === "selectedMembers" && (
                      <FormField
                        control={form.control}
                        name="memberAttendees.custom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-required="false">Select Members</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild disabled={isEditMode}>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {field.value && field.value.length > 0
                                      ? `${field.value.length} member(s) selected`
                                      : "Select members..."}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search members..." />
                                  <CommandList>
                                    <CommandEmpty>No members found.</CommandEmpty>
                                    <CommandGroup>
                                      {members.map((member) => (
                                        <CommandItem
                                          key={member.membershipId}
                                          value={`${member.applicantName} ${member.firmName} ${member.membershipId}`}
                                          onSelect={() => {
                                            const currentMembers = field.value || [];
                                            if (!currentMembers.includes(member.membershipId)) {
                                              field.onChange([...currentMembers, member.membershipId]);
                                            }
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{member.applicantName}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {member.firmName} - {member.membershipId}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((memberId) => {
                                  const member = members.find(m => m.membershipId === memberId);
                                  return (
                                    <div key={memberId} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                                      <span>{member?.applicantName}</span>
                                      <button
                                        disabled={isEditMode}
                                        type="button"
                                        onClick={() => field.onChange(field.value?.filter(m => m !== memberId))}
                                        className="text-purple-600 hover:text-purple-800"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Vehicle Attendees Sub-selection */}
                  <div className="space-y-4">
                    {/* Individual Vehicle Selection */}
                    {(form.watch("vehicleAttendees.type") === "selectedOwners" ||
                      form.watch("vehicleAttendees.type") === "selectedDrivers") && (
                        <div className="space-y-2">
                          <FormLabel data-required="false">
                            {form.watch("vehicleAttendees.type") === "selectedOwners" && "Select Vehicle Owners"}
                            {form.watch("vehicleAttendees.type") === "selectedDrivers" && "Select Vehicle Drivers"}
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="vehicleAttendees.custom"
                            render={({ field }) => (
                              <FormItem>
                                <Popover>
                                  <PopoverTrigger asChild disabled={isEditMode}>
                                    <FormControl>
                                      <Button
                                        disabled={isEditMode}
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                      >
                                        {field.value && field.value.length > 0
                                          ? `${field.value.length} vehicle(s) selected`
                                          : "Select vehicles..."}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search vehicles..." />
                                      <CommandList>
                                        <CommandEmpty>No vehicles found.</CommandEmpty>
                                        <CommandGroup>
                                          {vehicles.map((vehicle) => (
                                            <CommandItem
                                              key={vehicle.id}
                                              value={`${vehicle.vehicleNumber} ${vehicle.driverName} ${vehicle.ownerName}`}
                                              onSelect={() => {
                                                const currentVehicles = field.value || [];
                                                if (!currentVehicles.find(v => v.vehicleId === vehicle.vehicleId)) {
                                                  const isOwner = form.watch("vehicleAttendees.type") === "selectedOwners";
                                                  const isDriver = form.watch("vehicleAttendees.type") === "selectedDrivers";
                                                  field.onChange([
                                                    ...currentVehicles,
                                                    { vehicleId: vehicle.vehicleId, owner: isOwner, driver: isDriver }
                                                  ]);
                                                }
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{vehicle.vehicleNumber}</span>
                                                <span className="text-sm text-muted-foreground">
                                                  Driver: {vehicle.driverName} | Owner: {vehicle.ownerName}
                                                </span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                {field.value && field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {field.value.map((vehicle) => {
                                      const vehicleData = vehicles.find(v => v.vehicleId === vehicle.vehicleId);
                                      return (
                                        <div key={vehicle.vehicleId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                          <span>{vehicleData?.vehicleNumber || `Vehicle ${vehicle.vehicleId}`}</span>
                                          <button
                                            disabled={isEditMode}
                                            type="button"
                                            onClick={() => field.onChange(field.value?.filter(v => v.vehicleId !== vehicle.vehicleId))}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                  </div>

                  {/* Labour Attendees Sub-selection */}
                  <div className="space-y-4">
                    {/* Selected Labour Selection */}
                    {form.watch("labourAttendees.type") === "selectedLabour" && (
                      <FormField
                        control={form.control}
                        name="labourAttendees.custom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-required="false">Select Labour</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild disabled={isEditMode}>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {field.value && field.value.length > 0
                                      ? `${field.value.length} labour(s) selected`
                                      : "Select labour..."}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search labour..." />
                                  <CommandList>
                                    <CommandEmpty>No labour found.</CommandEmpty>
                                    <CommandGroup>
                                      {labour.map((lab) => (
                                        <CommandItem
                                          key={lab.id}
                                          value={`${lab.fullName} ${lab.labourId} ${lab.phoneNumber}`}
                                          onSelect={() => {
                                            const currentLabour = field.value || [];
                                            if (!currentLabour.includes(lab.labourId)) {
                                              field.onChange([...currentLabour, lab.labourId]);
                                            }
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{lab.fullName}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {lab.labourId} - {lab.phoneNumber}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((labourId) => {
                                  const lab = labour.find(l => l.labourId === labourId);
                                  return (
                                    <div key={labourId} className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                                      <span>{lab?.fullName}</span>
                                      <button
                                        disabled={isEditMode}
                                        type="button"
                                        onClick={() => field.onChange(field.value?.filter(l => l !== labourId))}
                                        className="text-orange-600 hover:text-orange-800"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Follow-up Meetings */}
              <Card>
                <CardHeader>
                  <CardTitle>Follow-up Meetings (Optional)</CardTitle>
                  <CardDescription>
                    Schedule follow-up meetings if needed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {followUpFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                              <FormField
                                control={form.control}
                                name={`followUpMeeting.${index}.date`}
                                render={({ field }) => (
                                  <FormItem className="">
                                    <FormLabel>Follow-up Date</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant={"outline"}
                                            className={"w-full pl-3 text-left font-normal"}
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
                                name={`followUpMeeting.${index}.time`}
                                render={({ field }) => (
                                  <FormItem>
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
                              variant="ghost"
                              size="sm"
                              className="mt-8"
                              onClick={() => removeFollowUp(index)}
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
                      onClick={addFollowUpMeeting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Follow-up Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Update Meeting" : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
