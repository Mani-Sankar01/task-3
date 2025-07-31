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
import { useSession } from "next-auth/react";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";
import PopupMessage from "@/components/ui/popup-message";
import { uploadFile, downloadFile } from "@/lib/client-file-upload";

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  dob: z.date({
    required_error: "Date of birth is required",
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  emailId: z.string().email("Invalid email address").optional().or(z.literal("")),
  aadharNumber: z.string()
    .min(12, "Aadhar number must be exactly 12 digits")
    .max(12, "Aadhar number must be exactly 12 digits")
    .regex(/^\d{12}$/, "Aadhar number must contain only digits"),
  permanentAddress: z.string().min(1, "Permanent address is required"),
  presentAddress: z.string().min(1, "Present address is required"),
  photoPath: z.string().min(1, "Photo upload is required"),
  aadharPath: z.string().min(1, "Aadhar card upload is required"),
  panNumber: z.string()
    .max(12, "PAN number must be at most 12 characters")
    .optional()
    .or(z.literal("")),
  esiNumber: z.string().optional().or(z.literal("")),
  eShramId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
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
          assignedTo: labour.assignedTo || "",
          branchId: "",
          additionalDocs: labour.laboursAdditionalDocs?.map((doc: any) => ({
            id: doc.id,
            docName: doc.documentName || doc.docName || "",
            docFilePath: doc.documentPath || doc.docFilePath || ""
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
      form.reset({
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
        assignedTo: labour.assignedTo || "",
        branchId: "",
        additionalDocs: labour.laboursAdditionalDocs?.map((doc: any) => ({
          id: doc.id,
          docName: doc.documentName || doc.docName || "",
          docFilePath: doc.documentPath || doc.docFilePath || ""
        })) || [],
      });
      
      console.log("Form values after reset:", form.getValues());
    }
  }, [labour, form]);

  // Fetch members from API
  useEffect(() => {
    const fetchMembers = async () => {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        try {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/member/get_members`,
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
          member.applicantName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          member.firmName?.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [memberSearchTerm, members]);

  // Fetch branches when a member is selected
  useEffect(() => {
    const selectedMemberId = form.watch("assignedTo");
    if (selectedMemberId && sessionStatus === "authenticated" && session?.user?.token) {
      setIsLoadingBranches(true);
      axios.get(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/member/get_member/${selectedMemberId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      )
        .then((response) => {
          const memberData = response.data;
          setBranches(memberData.branches || []);
        })
        .catch((err) => {
          console.error("Error fetching branches:", err);
          setBranches([]);
        })
        .finally(() => setIsLoadingBranches(false));
    } else {
      setBranches([]);
    }
  }, [form.watch("assignedTo"), sessionStatus, session?.user?.token]);

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
          message: `Please upload the following required files:\n${missingFiles.join('\n')}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare API payload
      const payload: any = {
        labourId: labour?.labourId || "",
        fullName: data.fullName,
        fatherName: data.fatherName,
        dob: format(data.dob, "yyyy-MM-dd"),
        phoneNumber: data.phoneNumber,
        emailId: data.emailId || "",
        aadharNumber: data.aadharNumber,
        permanentAddress: data.permanentAddress,
        presentAddress: data.presentAddress,
        photoPath: uploadedPhotoPath,
        aadharPath: uploadedAadharPath,
        panNumber: data.panNumber || "",
        esiNumber: data.esiNumber || "",
        eShramId: data.eShramId || "",
        assignedTo: data.assignedTo || "",
        branchId: data.branchId || "",
      };

      // Handle additional documents
      if (data.additionalDocs && data.additionalDocs.length > 0) {
        if (isEditMode) {
          // For edit mode: separate new and existing documents
          const newDocs: Array<{docName: string, docFilePath: string}> = [];
          const updateDocs: Array<{id: number, docName: string, docFilePath: string}> = [];
          
          data.additionalDocs.forEach(doc => {
            // Check if this is an existing document (has an ID)
            if (doc.id) {
              // This is an existing document being updated
              updateDocs.push({
                id: doc.id,
                docName: doc.docName,
                docFilePath: doc.docFilePath
              });
            } else {
              // This is a new document
              newDocs.push({
                docName: doc.docName,
                docFilePath: doc.docFilePath
              });
            }
          });
          
          if (newDocs.length > 0) {
            payload.newAdditionalDocs = newDocs;
          }
          
          if (updateDocs.length > 0) {
            payload.updateAdditionalDocs = updateDocs;
          }
        } else {
          // For add mode: put all documents directly in additionalDocs
          payload.additionalDocs = data.additionalDocs.map(doc => ({
            docName: doc.docName,
            docFilePath: doc.docFilePath
          }));
        }
      }
      
      console.log("API payload:", JSON.stringify(payload));

      // Call API
      const apiEndpoint = isEditMode 
        ? `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/labour/update_labour`
        : `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/labour/add_labour`;
      
      console.log("Making API call to:", apiEndpoint);
      const response = await axios.post(
        apiEndpoint,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("API response:", JSON.stringify(response.data));

      setPopupMessage({
        isOpen: true,
        type: "success",
        title: isEditMode ? "Labour Updated Successfully!" : "Labour Added Successfully!",
        message: isEditMode 
          ? "The labour record has been updated successfully. You will be redirected to the labour list."
          : "The labour record has been added successfully. You will be redirected to the labour list.",
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: isEditMode ? "Failed to Update Labour" : "Failed to Add Labour",
        message: error?.response?.data?.message || error.message || "Failed to save labour record. Please try again.",
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
      router.push("/admin/labour");
    }
  };

  const handlePopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
  };

  const handleSuccessPopupClose = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
    router.push("/admin/labour");
    router.refresh();
  };

  // Download function
  const handleDownloadFile = async (filePath: string) => {
    try {
      // Extract filename from path
      const filename = filePath.split('/').pop() || 'document';
      console.log('Downloading file:', filename, 'from path:', filePath);
      
      const blob = await downloadFile(filename);
      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed: Could not get file blob');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="container">
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
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form validation errors:", errors);
              
              // Show popup for validation errors
              const errorMessages = Object.values(errors).map(error => error?.message).filter(Boolean);
              if (errorMessages.length > 0) {
                setPopupMessage({
                  isOpen: true,
                  type: "error",
                  title: "Validation Error",
                  message: `Please fix the following errors:\n${errorMessages.join('\n')}`,
                });
              }
            })} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Assignment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Member</FormLabel>
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
                              onChange={(e) => setMemberSearchTerm(e.target.value)}
                              className="w-full mb-2"
                            />
                            {filteredMembers.map((member) => (
                              <SelectItem key={member.membershipId} value={member.membershipId}>
                                {(member.applicantName || "Unknown") + " - " + (member.firmName || "Unknown")}
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
                        <FormLabel>Branch</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!form.watch("assignedTo") || isLoadingBranches}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select a branch"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={String(branch.id)}>
                                {branch.placeOfBusiness || `Branch ${branch.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {!form.watch("assignedTo") && (
                          <p className="text-xs text-muted-foreground">Please select a member first to see available branches.</p>
                        )}
                      </FormItem>
                    )}
                  />
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
                    name="dob"
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
                    name="phoneNumber"
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
                    name="emailId"
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
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={form.control}
                    name="eShramId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Shram ID (Optional)</FormLabel>
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
                    <FormLabel>Photo</FormLabel>
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
                    {photoError && <p className="text-sm text-destructive">{photoError}</p>}
                  </div>

                  <div>
                    <FormLabel>Aadhar Card</FormLabel>
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
                    {aadharError && <p className="text-sm text-destructive">{aadharError}</p>}
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
                    onClick={() =>
                      append({ docName: "", docFilePath: "" })
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
                          name={`additionalDocs.${index}.docName`}
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

                        <div>
                          <FormLabel>Document Upload</FormLabel>
                          <FileUpload
                            onFileSelect={(file) => {
                              // Handle file upload for additional documents
                              if (file) {
                                // You would need to implement file upload logic here
                                // For now, we'll just update the form field
                                form.setValue(`additionalDocs.${index}.docFilePath`, file.name);
                              }
                            }}
                            onUploadComplete={(path) => {
                              form.setValue(`additionalDocs.${index}.docFilePath`, path);
                            }}
                            onUploadError={(error) => {
                              console.error("Upload error:", error);
                            }}
                            onDownload={handleDownloadFile}
                            onRemoveFile={() => {
                              form.setValue(`additionalDocs.${index}.docFilePath`, "");
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                            maxSize={10 * 1024 * 1024}
                            subfolder="documents"
                            existingFilePath={form.watch(`additionalDocs.${index}.docFilePath`)}
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
        primaryButton={
          popupMessage.type === "success"
            ? {
                text: "Go to Labour List",
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
