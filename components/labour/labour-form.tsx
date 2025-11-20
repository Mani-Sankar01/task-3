"use client";

import { useState, useEffect, useRef } from "react";
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
import { useSession } from "next-auth/react";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";
import PopupMessage from "@/components/ui/popup-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadFile, downloadFile } from "@/lib/client-file-upload";
import { renderRoleBasedPath } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  dob: z.date({
    required_error: "Date of birth is required",
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  emailId: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  aadharNumber: z
    .string()
    .min(12, "Aadhar number must be exactly 12 digits")
    .max(12, "Aadhar number must be exactly 12 digits")
    .regex(/^\d{12}$/, "Aadhar number must contain only digits"),
  permanentAddress: z.string().min(1, "Permanent address is required"),
  presentAddress: z.string().min(1, "Present address is required"),
  photoPath: z.string().min(1, "Photo upload is required"),
  aadharPath: z.string().min(1, "Aadhar card upload is required"),
  panNumber: z
    .string()
    .max(12, "PAN number must be at most 12 characters")
    .optional()
    .or(z.literal("")),
  esiNumber: z.string().optional().or(z.literal("")),
  eShramId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
  labourStatus: z.enum(["ACTIVE", "INACTIVE", "ON_BENCH"], {
    required_error: "Labour status is required",
  }),
  additionalDocs: z
    .array(
      z.object({
        id: z.number().optional(),
        docName: z.string().min(1, "Document name is required"),
        docFilePath: z.string().min(1, "Document upload is required"),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LabourFormProps {
  labour?: any;
  isEditMode: boolean;
}

export default function LabourForm({ labour, isEditMode }: LabourFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPath, setPhotoPath] = useState<string>("");
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharPath, setAadharPath] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [aadharError, setAadharError] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const originalDataRef = useRef<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: labour
      ? {
          fullName: labour.fullName || "",
          phoneNumber: labour.phoneNumber || "",
          emailId: labour.emailId || "",
          fatherName: labour.fatherName || "",
          dob: labour.dob ? new Date(labour.dob) : new Date(1990, 0, 1),
          aadharNumber: labour.aadharNumber || "",
          aadharPath: labour.aadharPath || "",
          photoPath: labour.photoPath || "",
          permanentAddress: labour.permanentAddress || "",
          presentAddress: labour.presentAddress || "",
          panNumber: labour.panNumber || "",
          esiNumber: labour.esiNumber || "",
          eShramId: labour.eShramId || "",
          assignedTo: labour.assignedToMemberId || labour.assignedTo || "",
          branchId: labour.assignedToBranchId ? String(labour.assignedToBranchId) : (labour.branchId || ""),
          labourStatus: (labour.labourStatus || "ACTIVE") as "ACTIVE" | "INACTIVE" | "ON_BENCH",
          additionalDocs:
            labour.laboursAdditionalDocs?.map((doc: any) => ({
              id: doc.id,
              docName: doc.documentName || doc.docName || "",
              docFilePath: doc.documentPath || doc.docFilePath || "",
            })) || [],
        }
      : {
          fullName: "",
          phoneNumber: "",
          emailId: "",
          fatherName: "",
          dob: new Date(1990, 0, 1),
          aadharNumber: "",
          aadharPath: "",
          photoPath: "",
          permanentAddress: "",
          presentAddress: "",
          panNumber: "",
          esiNumber: "",
          eShramId: "",
          assignedTo: "",
          branchId: "",
          labourStatus: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ON_BENCH",
          additionalDocs: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalDocs",
  });

  // Set initial file paths when labour data is loaded
  useEffect(() => {
    if (labour) {
      console.log("Labour data loaded:", labour);
      console.log("Additional documents:", labour.laboursAdditionalDocs);

      setPhotoPath(labour.photoPath || "");
      setAadharPath(labour.aadharPath || "");

      // Reset form with labour data including additional documents
      const formData = {
        fullName: labour.fullName || "",
        phoneNumber: labour.phoneNumber || "",
        emailId: labour.emailId || "",
        fatherName: labour.fatherName || "",
        dob: labour.dob ? new Date(labour.dob) : new Date(1990, 0, 1),
        aadharNumber: labour.aadharNumber || "",
        aadharPath: labour.aadharPath || "",
        photoPath: labour.photoPath || "",
        permanentAddress: labour.permanentAddress || "",
        presentAddress: labour.presentAddress || "",
        panNumber: labour.panNumber || "",
        esiNumber: labour.esiNumber || "",
        eShramId: labour.eShramId || "",
        assignedTo: labour.assignedToMemberId || labour.assignedTo || "",
        branchId: labour.assignedToBranchId ? String(labour.assignedToBranchId) : (labour.branchId || ""),
        labourStatus: (labour.labourStatus || "ACTIVE") as "ACTIVE" | "INACTIVE" | "ON_BENCH",
        additionalDocs:
          labour.laboursAdditionalDocs?.map((doc: any) => ({
            id: doc.id,
            docName: doc.documentName || doc.docName || "",
            docFilePath: doc.documentPath || doc.docFilePath || "",
          })) || [],
      };
      
      form.reset(formData);
      // Store original data for change detection
      originalDataRef.current = formData;
      
      // If assignedToMemberId exists and status is ACTIVE, trigger branch fetch
      if (labour.assignedToMemberId && labour.labourStatus === "ACTIVE") {
        // Trigger branch fetch by setting the assignedTo field
        form.setValue("assignedTo", labour.assignedToMemberId || labour.assignedTo || "");
      }

      console.log("Form values after reset:", form.getValues());
    }
  }, [labour, form]);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        try {
          const response = await axios.get(
            `${
              process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/member/get_members`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setMembers(response.data);
          setFilteredMembers(response.data);
        } catch (err) {
          setMembers([]);
          setFilteredMembers([]);
        }
      }
    };
    fetchMembers();
  }, [sessionStatus, session?.user?.token]);

  // Filter members based on search term
  useEffect(() => {
    if (memberSearchTerm) {
      const filtered = members.filter(
        (member) =>
          member.applicantName
            ?.toLowerCase()
            .includes(memberSearchTerm.toLowerCase()) ||
          member.firmName
            ?.toLowerCase()
            .includes(memberSearchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [memberSearchTerm, members]);

  // Fetch branches when a member is selected
  useEffect(() => {
    const selectedMemberId = form.watch("assignedTo");
    if (
      selectedMemberId &&
      sessionStatus === "authenticated" &&
      session?.user?.token
    ) {
      setIsLoadingBranches(true);
      axios
        .get(
          `${
            process.env.BACKEND_API_URL || "https://tsmwa.online"
          }/api/member/get_member/${selectedMemberId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        )
        .then((response) => {
          const memberData = response.data;
          const fetchedBranches = memberData.branches || [];
          setBranches(fetchedBranches);
          
          // If we're in edit mode and have a branchId, ensure it's set correctly
          if (isEditMode && labour?.assignedToBranchId) {
            const branchIdStr = String(labour.assignedToBranchId);
            const currentBranchId = form.getValues("branchId");
            // If branchId doesn't match or is empty, set it
            if (currentBranchId !== branchIdStr) {
              // Check if the branch exists in the fetched branches
              const branchExists = fetchedBranches.some(
                (b: any) => String(b.id) === branchIdStr
              );
              if (branchExists) {
                form.setValue("branchId", branchIdStr);
              }
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching branches:", err);
          setBranches([]);
        })
        .finally(() => setIsLoadingBranches(false));
    } else {
      setBranches([]);
    }
  }, [form.watch("assignedTo"), sessionStatus, session?.user?.token, isEditMode, labour]);

  const onSubmit = async (data: FormValues) => {
    console.log("onSubmit function called!");
    console.log("Form data:", data);
    setIsSubmitting(true);
    try {
      if (sessionStatus !== "authenticated" || !session?.user?.token) {
        setPopupMessage({
          isOpen: true,
          type: "error",
          title: "Authentication Required",
          message: "Please log in to continue.",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload photo if present
      let uploadedPhotoPath = photoPath;
      if (photoFile) {
        const upload = await uploadFile(photoFile, "photos");
        if (!upload.success || !upload.filePath) {
          setPhotoError(upload.error || "Photo upload failed");
          setIsSubmitting(false);
          return;
        }
        uploadedPhotoPath = upload.filePath;
      }

      // Upload aadhar if present
      let uploadedAadharPath = aadharPath;
      if (aadharFile) {
        const upload = await uploadFile(aadharFile, "documents");
        if (!upload.success || !upload.filePath) {
          setAadharError(upload.error || "Aadhar upload failed");
          setIsSubmitting(false);
          return;
        }
        uploadedAadharPath = upload.filePath;
      }

      // Validate required files
      const missingFiles = [];
      if (!uploadedPhotoPath && !photoFile) {
        missingFiles.push("Photo");
      }
      if (!uploadedAadharPath && !aadharFile) {
        missingFiles.push("Aadhar Card");
      }

      if (missingFiles.length > 0) {
        setPopupMessage({
          isOpen: true,
          type: "error",
          title: "Missing Required Files",
          message: `Please upload the following required files:\n${missingFiles.join(
            "\n"
          )}`,
        });
        setIsSubmitting(false);
        return;
      }

      // For edit mode, check for changes and only send updated fields
      if (isEditMode) {
        const original = originalDataRef.current;
        if (!original) {
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Original data not loaded. Please refresh the page.",
          });
          setIsSubmitting(false);
          return;
        }

        // Helper function to check if a value changed
        const changed = (key: keyof FormValues) => {
          const currentValue = data[key];
          const originalValue = original[key];

          // Handle date comparison
          if (key === "dob") {
            const currentDate = currentValue ? format(currentValue as Date, "yyyy-MM-dd") : "";
            const originalDate = originalValue ? format(originalValue as Date, "yyyy-MM-dd") : "";
            return currentDate !== originalDate;
          }

          // Handle array comparison (additionalDocs)
          if (key === "additionalDocs") {
            const current = currentValue as any[] || [];
            const orig = originalValue as any[] || [];
            if (current.length !== orig.length) return true;
            return JSON.stringify(current) !== JSON.stringify(orig);
          }

          // Handle string comparison (normalize empty strings)
          if (typeof currentValue === "string" && typeof originalValue === "string") {
            return (currentValue || "") !== (originalValue || "");
          }

          return currentValue !== originalValue;
        };

        // Check if photo or aadhar files were uploaded
        const photoChanged = photoFile !== null || uploadedPhotoPath !== original.photoPath;
        const aadharChanged = aadharFile !== null || uploadedAadharPath !== original.aadharPath;

        // Build payload with only changed fields
        const payload: any = {
          labourId: labour?.labourId || "",
        };

        // Check each field and add to payload if changed
        if (changed("fullName")) payload.fullName = data.fullName;
        if (changed("fatherName")) payload.fatherName = data.fatherName;
        if (changed("dob")) payload.dob = format(data.dob, "yyyy-MM-dd");
        if (changed("phoneNumber")) payload.phoneNumber = data.phoneNumber;
        if (changed("aadharNumber")) payload.aadharNumber = data.aadharNumber;
        if (changed("permanentAddress")) payload.permanentAddress = data.permanentAddress;
        if (changed("presentAddress")) payload.presentAddress = data.presentAddress;
        if (photoChanged) payload.photoPath = uploadedPhotoPath;
        if (aadharChanged) payload.aadharPath = uploadedAadharPath;
        
        // Handle optional fields - only include if they have values and changed
        if (changed("emailId")) {
          if (data.emailId && data.emailId.trim() !== "") {
            payload.emailId = data.emailId;
          }
          // If changed to empty, we can optionally exclude it or set it explicitly
          // For now, we'll exclude it when empty
        }
        if (changed("panNumber")) {
          if (data.panNumber && data.panNumber.trim() !== "") {
            payload.panNumber = data.panNumber;
          }
        }
        if (changed("esiNumber")) {
          if (data.esiNumber && data.esiNumber.trim() !== "") {
            payload.esiNumber = data.esiNumber;
          }
        }
        if (changed("eShramId")) {
          if (data.eShramId && data.eShramId.trim() !== "") {
            payload.eShramId = data.eShramId;
          }
        }
        
        // Handle assignedToMemberId and assignedToBranchId - only include if changed
        if (changed("assignedTo")) {
          // If assignedTo has changed, include it in payload
          // Use null instead of empty string for foreign key constraint
          payload.assignedToMemberId = data.assignedTo && data.assignedTo.trim() !== "" ? data.assignedTo : null;
        }
        
        if (changed("branchId")) {
          // If branchId has changed, include it in payload
          // Convert branchId string to number, or null if empty
          payload.assignedToBranchId = data.branchId && data.branchId.trim() !== "" ? Number(data.branchId) : null;
        }
        if (changed("labourStatus")) payload.labourStatus = data.labourStatus;

        // Handle additional documents - only if they changed
        if (changed("additionalDocs")) {
          const originalDocs = original.additionalDocs || [];
          const currentDocs = data.additionalDocs || [];
          
          // Find new documents (no id) and updated documents (has id but changed)
          const newDocs: Array<{ docName: string; docFilePath: string }> = [];
          const updateDocs: Array<{
            id: number;
            docName: string;
            docFilePath: string;
          }> = [];

          currentDocs.forEach((doc) => {
            if (doc.id) {
              // Check if this document actually changed
              const originalDoc = originalDocs.find((od: any) => od.id === doc.id);
              if (originalDoc && (
                originalDoc.docName !== doc.docName ||
                originalDoc.docFilePath !== doc.docFilePath
              )) {
                updateDocs.push({
                  id: doc.id,
                  docName: doc.docName,
                  docFilePath: doc.docFilePath,
                });
              }
            } else {
              // New document
              newDocs.push({
                docName: doc.docName,
                docFilePath: doc.docFilePath,
              });
            }
          });

          // Check for deleted documents (documents in original but not in current)
          const deletedDocIds: number[] = [];
          originalDocs.forEach((origDoc: any) => {
            if (origDoc.id && !currentDocs.find((cd: any) => cd.id === origDoc.id)) {
              deletedDocIds.push(origDoc.id);
            }
          });

          if (newDocs.length > 0) {
            payload.newAdditionalDocs = newDocs;
          }
          if (updateDocs.length > 0) {
            payload.updateAdditionalDocs = updateDocs;
          }
          if (deletedDocIds.length > 0) {
            payload.deleteAdditionalDocs = deletedDocIds;
          }
        }

        // Check if there are any changes (after processing all fields including additional docs)
        const hasChanges = Object.keys(payload).length > 1; // More than just labourId

        if (!hasChanges) {
          toast({
            title: "No Changes Detected",
            description: "No changes have been made to the labour data. Please make some changes before submitting.",
            variant: "default",
          });
          setIsSubmitting(false);
          return;
        }

        console.log("API payload (edit mode - only changes):", JSON.stringify(payload));

        // Call API
        const apiEndpoint = `${
          process.env.BACKEND_API_URL || "https://tsmwa.online"
        }/api/labour/update_labour`;

        console.log("Making API call to:", apiEndpoint);
        const response = await axios.post(apiEndpoint, payload, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API response:", JSON.stringify(response.data));

        toast({
          title: "Success",
          description: "Labour updated successfully!",
        });
        
        // Redirect to labour list
        router.push(`/${renderRoleBasedPath(session?.user?.role)}/labour`);
        setIsSubmitting(false);
        return;
      }

      // For add mode, send all required fields and only optional fields that have values
      const payload: any = {
        labourId: labour?.labourId || "",
        fullName: data.fullName,
        fatherName: data.fatherName,
        dob: format(data.dob, "yyyy-MM-dd"),
        phoneNumber: data.phoneNumber,
        aadharNumber: data.aadharNumber,
        permanentAddress: data.permanentAddress,
        presentAddress: data.presentAddress,
        photoPath: uploadedPhotoPath,
        aadharPath: uploadedAadharPath,
        labourStatus: data.labourStatus,
        assignedToMemberId: data.assignedTo && data.assignedTo.trim() !== "" ? data.assignedTo : "",
        assignedToBranchId: data.branchId && data.branchId.trim() !== "" ? Number(data.branchId) : null,
      };

      // Add optional fields only if they have values
      if (data.emailId && data.emailId.trim() !== "") {
        payload.emailId = data.emailId;
      }
      if (data.panNumber && data.panNumber.trim() !== "") {
        payload.panNumber = data.panNumber;
      }
      if (data.esiNumber && data.esiNumber.trim() !== "") {
        payload.esiNumber = data.esiNumber;
      }
      if (data.eShramId && data.eShramId.trim() !== "") {
        payload.eShramId = data.eShramId;
      }

      // Handle additional documents for add mode
      if (data.additionalDocs && data.additionalDocs.length > 0) {
        // For add mode: put all documents directly in additionalDocs
        payload.additionalDocs = data.additionalDocs.map((doc) => ({
          docName: doc.docName,
          docFilePath: doc.docFilePath,
        }));
      }

      console.log("API payload (add mode):", JSON.stringify(payload));

      // Call API for add mode
      const apiEndpoint = `${
        process.env.BACKEND_API_URL || "https://tsmwa.online"
      }/api/labour/add_labour`;

      console.log("Making API call to:", apiEndpoint);
      const response = await axios.post(apiEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API response:", JSON.stringify(response.data));

      toast({
        title: "Success",
        description: "Labour added successfully!",
      });
      
      // Redirect to labour list
      router.push(`/${renderRoleBasedPath(session?.user?.role)}/labour`);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: isEditMode ? "Failed to Update Labour" : "Failed to Add Labour",
        message:
          error?.response?.data?.message ||
          error.message ||
          "Failed to save labour record. Please try again.",
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

  const handlePopupClose = () => {
    setPopupMessage((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSuccessPopupClose = () => {
    setPopupMessage((prev) => ({ ...prev, isOpen: false }));
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/labour`);
    router.refresh();
  };

  // Download function
  const handleDownloadFile = async (filePath: string) => {
    try {
      // Extract filename from path
      const filename = filePath.split("/").pop() || "document";
      console.log("Downloading file:", filename, "from path:", filePath);

      const blob = await downloadFile(filename);
      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Download failed: Could not get file blob");
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <div className="">
      <Card>
        <CardHeader>
          <div className="flex  gap-2">
          <Button 
                variant="outline" 
                onClick={handleCancel} 
                type="button"
                className=""
              >
                <ArrowLeft className=" h-4 w-4" />
              </Button>
              <div>
              <CardTitle>
            {isEditMode ? "Edit Labour Details" : "New Labour"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the labour information below"
              : "Fill in the details to add a new labour record"}
          </CardDescription>
              </div>
          </div>
          
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("Form validation errors:", errors);

                // Show popup for validation errors
                const errorMessages = Object.values(errors)
                  .map((error) => error?.message)
                  .filter(Boolean);
                if (errorMessages.length > 0) {
                  setPopupMessage({
                    isOpen: true,
                    type: "error",
                    title: "Validation Error",
                    message: `Please fix the following errors:\n${errorMessages.join(
                      "\n"
                    )}`,
                  });
                }
              })}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Assignment Information</h3>
                <div className={`grid grid-cols-1 ${isEditMode ? 'md:grid-cols-3' : 'md:grid-cols-3'} gap-6`}>
                  {isEditMode && (
                    <FormField
                      control={form.control}
                      name="labourStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-tooltip="Mandatory: select the current engagement status of the labour.">
                            Labour Status
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear assignment fields when status is not ACTIVE
                              if (value !== "ACTIVE") {
                                form.setValue("assignedTo", "");
                                form.setValue("branchId", "");
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select labour status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="ON_BENCH">On Bench</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(!isEditMode || form.watch("labourStatus") === "ACTIVE") && (
                    <>
                      <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              data-required="false"
                              data-tooltip="Optional: assign this labour to a member. Leave empty if the worker is not currently assigned."
                            >
                              Assign to Member
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear branch selection when member changes
                                form.setValue("branchId", "");
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a member" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <Input
                                  placeholder="Search by name or firm..."
                                  value={memberSearchTerm}
                                  onChange={(e) =>
                                    setMemberSearchTerm(e.target.value)
                                  }
                                  className="w-full mb-2"
                                />
                                {filteredMembers.map((member) => (
                                  <SelectItem
                                    key={member.membershipId}
                                    value={member.membershipId}
                                  >
                                    {(member.applicantName || "Unknown") +
                                      " - " +
                                      (member.firmName || "Unknown")}
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
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              data-required="false"
                              data-tooltip="Optional: choose a branch for the selected member. Required only when a member is assigned."
                            >
                              Branch
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              disabled={
                                !form.watch("assignedTo") || isLoadingBranches
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      isLoadingBranches
                                        ? "Loading branches..."
                                        : "Select a branch"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map((branch) => (
                                  <SelectItem
                                    key={branch.id}
                                    value={String(branch.id)}
                                  >
                                    {branch.placeOfBusiness ||
                                      `Branch ${branch.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            {!form.watch("assignedTo") && (
                              <p className="text-xs text-muted-foreground">
                                Please select a member first to see available
                                branches.
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {!isEditMode && (
                    <FormField
                      control={form.control}
                      name="labourStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-tooltip="Mandatory: select the current engagement status of the labour.">
                            Labour Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select labour status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="ON_BENCH">On Bench</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-tooltip="Mandatory: enter the labour's legal full name as per official documents.">
                          Full Name
                        </FormLabel>
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
                        <FormLabel data-tooltip="Mandatory: provide the father's name for identification purposes.">
                          Father's Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter father's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel data-tooltip="Mandatory: select the labour's date of birth. Future dates are disabled.">
                          Date of Birth
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
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-tooltip="Mandatory: enter a 10-digit contact number. WhatsApp-enabled number preferred.">
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          data-required="false"
                          data-tooltip="Optional: provide email to receive communication updates."
                        >
                          Email
                        </FormLabel>
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
                        <FormLabel data-tooltip="Mandatory: enter the 12-digit Aadhar number. Digits only.">
                          Aadhar Number
                        </FormLabel>
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
                        <FormLabel data-tooltip="Mandatory: enter the permanent residential address as per ID proof.">
                          Permanent Address
                        </FormLabel>
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
                        <FormLabel data-tooltip="Mandatory: enter the current address where the labour resides.">
                          Present Address
                        </FormLabel>
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
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          data-required="false"
                          data-tooltip="Optional: provide if PAN is available for the labour."
                        >
                          PAN Number
                        </FormLabel>
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
                        <FormLabel
                          data-required="false"
                          data-tooltip="Optional: enter Employee State Insurance number, if applicable."
                        >
                          ESI Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ESI number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eShramId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          data-required="false"
                          data-tooltip="Optional: enter the e-Shram ID issued by the government."
                        >
                          E-Shram ID
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter E-Shram ID" {...field} />
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
                  <div>
                    <FormLabel data-tooltip="Mandatory: upload a recent photograph of the labour (JPG or PNG, up to 5MB).">
                      Photo
                    </FormLabel>
                    <FileUpload
                      onFileSelect={setPhotoFile}
                      onUploadComplete={(path) => {
                        setPhotoPath(path);
                        form.setValue("photoPath", path);
                      }}
                      onUploadError={setPhotoError}
                      onDownload={handleDownloadFile}
                      onRemoveFile={() => {
                        setPhotoFile(null);
                        setPhotoPath("");
                        form.setValue("photoPath", "");
                      }}
                      accept=".jpg,.jpeg,.png"
                      maxSize={5 * 1024 * 1024}
                      subfolder="photos"
                      existingFilePath={photoPath}
                    />
                    {photoError && (
                      <p className="text-sm text-destructive">{photoError}</p>
                    )}
                  </div>

                  <div>
                    <FormLabel data-tooltip="Mandatory: upload a clear scan of the labour's Aadhar card (PDF/JPG/PNG, up to 10MB).">
                      Aadhar Card
                    </FormLabel>
                    <FileUpload
                      onFileSelect={setAadharFile}
                      onUploadComplete={(path) => {
                        setAadharPath(path);
                        form.setValue("aadharPath", path);
                      }}
                      onUploadError={setAadharError}
                      onDownload={handleDownloadFile}
                      onRemoveFile={() => {
                        setAadharFile(null);
                        setAadharPath("");
                        form.setValue("aadharPath", "");
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10 * 1024 * 1024}
                      subfolder="documents"
                      existingFilePath={aadharPath}
                    />
                    {aadharError && (
                      <p className="text-sm text-destructive">{aadharError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Additional Documents</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ docName: "", docFilePath: "" })}
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
                          name={`additionalDocs.${index}.docName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-tooltip="Mandatory: provide a descriptive name for this document.">
                                Document Name
                              </FormLabel>
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

                        <div>
                          <FormLabel data-tooltip="Mandatory: upload the selected document file (PDF/JPG/PNG).">
                            Document Upload
                          </FormLabel>
                          <FileUpload
                            onFileSelect={(file) => {
                              // Handle file upload for additional documents
                              if (file) {
                                // You would need to implement file upload logic here
                                // For now, we'll just update the form field
                                form.setValue(
                                  `additionalDocs.${index}.docFilePath`,
                                  file.name
                                );
                              }
                            }}
                            onUploadComplete={(path) => {
                              form.setValue(
                                `additionalDocs.${index}.docFilePath`,
                                path
                              );
                            }}
                            onUploadError={(error) => {
                              console.error("Upload error:", error);
                            }}
                            onDownload={handleDownloadFile}
                            onRemoveFile={() => {
                              form.setValue(
                                `additionalDocs.${index}.docFilePath`,
                                ""
                              );
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={10 * 1024 * 1024}
                            subfolder="documents"
                            existingFilePath={form.watch(
                              `additionalDocs.${index}.docFilePath`
                            )}
                          />
                        </div>
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

      {/* Popup Message */}
      <PopupMessage
        isOpen={popupMessage.isOpen}
        onClose={handlePopupClose}
        type={popupMessage.type}
        title={popupMessage.title}
        message={popupMessage.message}
        primaryButton={{
          text: "OK",
          onClick: handlePopupClose,
          variant: "default",
        }}
        showCloseButton={false}
      />

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
