"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { renderRoleBasedPath } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadFile, downloadFile } from "@/lib/client-file-upload";

// Form schema
const leaseQueryAttachmentSchema = z.object({
  documentName: z.string().min(1, { message: "Document name is required" }),
  documentPath: z.string().optional(),
  file: z.any().optional(), // For file upload
  existingPath: z.string().optional(), // For existing files
});

const leaseQuerySchema = z.object({
  membershipId: z.string().min(1, { message: "Membership ID is required" }),
  presentLeaseHolder: z
    .string()
    .min(1, { message: "Present lease holder name is required" }),
  dateOfLease: z.string().min(1, { message: "Date of lease is required" }),
  expiryOfLease: z.string().min(1, { message: "Expiry of lease is required" }),
  dateOfRenewal: z.string().optional(),
  status: z.enum(["PENDING", "PROCESSING", "RESOLVED", "REJECTED"]),
  leaseQueryAttachments: z.array(leaseQueryAttachmentSchema),
});

type LeaseQueryFormValues = z.infer<typeof leaseQuerySchema>;

interface LeaseQueryFormProps {
  id?: string;
}

export default function LeaseQueryForm({ id }: LeaseQueryFormProps) {
  const [members, setMembers] = useState<
    Array<{
      id: string;
      membershipId: string;
      applicantName: string;
      firmName: string;
    }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<
    Array<{
      id: string;
      membershipId: string;
      applicantName: string;
      firmName: string;
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<
    Array<{
      id: number;
      documentName: string;
      documentPath: string;
    }>
  >([]);
  const [deletedAttachments, setDeletedAttachments] = useState<
    Array<{ id: number }>
  >([]);
  const [formPopulated, setFormPopulated] = useState(false);
  const [leaseQueryData, setLeaseQueryData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  const form = useForm<LeaseQueryFormValues>({
    resolver: zodResolver(leaseQuerySchema),
    defaultValues: {
      membershipId: "",
      presentLeaseHolder: "",
      dateOfLease: "",
      expiryOfLease: "",
      dateOfRenewal: "",
      leaseQueryAttachments: [],
      status: "PENDING",
    },
  });

  const attachmentFields = useFieldArray({
    control: form.control,
    name: "leaseQueryAttachments",
  });

  // Load members from API on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      console.log("Fetching members...");
      console.log("Status:", status);
      console.log(
        "Session token:",
        session?.user?.token ? "Exists" : "Missing"
      );

      if (status === "authenticated" && session?.user?.token) {
        try {
          setIsLoading(true);
          const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
          const fullUrl = `${apiUrl}/api/member/get_members`;
          console.log("API URL:", fullUrl);

          const response = await axios.get(fullUrl, {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          });

          console.log("Members API response:", response.data);
          console.log(
            "Number of members:",
            Array.isArray(response.data) ? response.data.length : "Not an array"
          );

          // Handle different possible response structures
          let membersData;
          if (Array.isArray(response.data)) {
            membersData = response.data;
          } else if (response.data && Array.isArray(response.data.members)) {
            membersData = response.data.members;
          } else if (response.data && Array.isArray(response.data.data)) {
            membersData = response.data.data;
          } else {
            membersData = [];
          }

          console.log("Processed members data:", membersData);
          if (membersData.length > 0) {
            console.log("First member structure:", membersData[0]);
          }
          setMembers(membersData);
          setFilteredMembers(membersData);
        } catch (err) {
          console.error("Error fetching members:", err);
          if (err instanceof Error) {
            console.error("Error message:", err.message);
          }
          setMembers([]);
          setFilteredMembers([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("Not authenticated or no token");
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [status, session?.user?.token]);

  // Load existing lease query data when editing
  useEffect(() => {
    const fetchLeaseQuery = async () => {
      if (id && status === "authenticated" && session?.user?.token) {
        try {
          setIsLoadingDetails(true);
          const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
          const response = await axios.get(
            `${apiUrl}/api/lease_query/get_lease_query/${id}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );

          console.log("Lease query data:", response.data);

          const leaseQueryData = response.data.data || response.data;
          console.log("Processed lease query data:", leaseQueryData);
          console.log("Lease query ID:", leaseQueryData.leaseQueryId);
          console.log("Membership ID:", leaseQueryData.membershipId);
          console.log("Status:", leaseQueryData.status);

          // Store the lease query data
          setLeaseQueryData(leaseQueryData);

          // Set existing attachments - handle case where attachments might not exist in response
          if (
            leaseQueryData.leaseQueryAttachments &&
            Array.isArray(leaseQueryData.leaseQueryAttachments)
          ) {
            setExistingAttachments(leaseQueryData.leaseQueryAttachments);
          } else {
            // If no attachments in response, set empty array
            setExistingAttachments([]);
            console.log("No attachments found in lease query response");
          }
        } catch (error) {
          console.error("Error fetching lease query:", error);
          setError("Failed to load lease query data");
        } finally {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchLeaseQuery();
  }, [id, status, session?.user?.token, form]);

  // Populate form when both lease query data and members are available
  useEffect(() => {
    if (id && leaseQueryData && members.length > 0) {
      console.log(
        "Both lease query data and members available, populating form"
      );
      console.log("Lease query membershipId:", leaseQueryData.membershipId);
      console.log(
        "Available members:",
        members.map((m) => m.membershipId)
      );

      // Check if the membershipId exists in the loaded members
      const memberExists = members.some(
        (member) => member.membershipId === leaseQueryData.membershipId
      );
      console.log("Member exists in loaded members:", memberExists);

      if (memberExists) {
        // Populate form with existing data
        form.reset({
          membershipId: leaseQueryData.membershipId || "",
          presentLeaseHolder: leaseQueryData.presentLeaseHolder || "",
          dateOfLease: leaseQueryData.dateOfLease
            ? new Date(leaseQueryData.dateOfLease).toISOString().split("T")[0]
            : "",
          expiryOfLease: leaseQueryData.expiryOfLease
            ? new Date(leaseQueryData.expiryOfLease).toISOString().split("T")[0]
            : "",
          dateOfRenewal: leaseQueryData.dateOfRenewal
            ? new Date(leaseQueryData.dateOfRenewal).toISOString().split("T")[0]
            : "",
          status: leaseQueryData.status || "PENDING",
          leaseQueryAttachments: existingAttachments.map((attachment) => ({
            documentName: attachment.documentName,
            documentPath: attachment.documentPath,
            existingPath: attachment.documentPath,
          })),
        });

        console.log(
          "Form populated with membershipId:",
          leaseQueryData.membershipId
        );
        setFormPopulated(true);
      } else {
        console.log("Member not found in loaded members, cannot populate form");
      }
    }
  }, [id, leaseQueryData, members, form]);

  // Update form when members are loaded (for edit mode)
  useEffect(() => {
    if (id && members.length > 0 && form.getValues("membershipId")) {
      const currentMembershipId = form.getValues("membershipId");
      console.log(
        "Members loaded, checking membershipId:",
        currentMembershipId
      );
      console.log(
        "Available members:",
        members.map((m) => m.membershipId)
      );

      // Check if the current membershipId exists in the loaded members
      const memberExists = members.some(
        (member) => member.membershipId === currentMembershipId
      );
      console.log("Member exists in loaded members:", memberExists);

      // If the member exists, ensure the form field is properly set
      if (memberExists) {
        form.setValue("membershipId", currentMembershipId);
        console.log("Form membershipId updated to:", currentMembershipId);
      }
    }
  }, [members, id, form]);

  useEffect(() => {
    // Filter members based on search term
    if (searchTerm) {
      const filtered = members.filter(
        (member) =>
          member.membershipId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.applicantName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.firmName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const onSubmit = async (data: LeaseQueryFormValues) => {
    setIsSubmitting(true);

    try {
      if (status !== "authenticated" || !session?.user?.token) {
        alert("Authentication required");
        setIsSubmitting(false);
        return;
      }

      const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";

      if (id) {
        // Edit mode - Update existing lease query
        const updatePayload = {
          leaseQueryId: id,
          membershipId: data.membershipId,
          presentLeaseHolder: data.presentLeaseHolder,
          dateOfLease: data.dateOfLease,
          expiryOfLease: data.expiryOfLease,
          dateOfRenewal: data.dateOfRenewal || undefined,
          status: data.status,
          newAttachments: data.leaseQueryAttachments
            .filter((attachment) => attachment.file || attachment.documentPath)
            .map((attachment) => ({
              documentName: attachment.documentName,
              documentPath: attachment.documentPath || "",
            })),
          updateAttachments: existingAttachments.map((attachment) => ({
            id: attachment.id,
            documentName: attachment.documentName,
          })),
          deleteAttachment: deletedAttachments,
        };

        console.log("Update API Payload:", JSON.stringify(updatePayload));

        const response = await axios.post(
          `${apiUrl}/api/lease_query/update_lease_query`,
          updatePayload,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Update API Response:", response.data);
        alert("Lease query updated successfully!");
      } else {
        // Add mode - Create new lease query
        const addPayload = {
          membershipId: data.membershipId,
          presentLeaseHolder: data.presentLeaseHolder,
          dateOfLease: data.dateOfLease,
          expiryOfLease: data.expiryOfLease,
          dateOfRenewal: data.dateOfRenewal || undefined,
          status: data.status,
          leaseQueryAttachments: data.leaseQueryAttachments
            .filter((attachment) => attachment.file || attachment.documentPath)
            .map((attachment) => ({
              documentName: attachment.documentName,
              documentPath: attachment.documentPath || "",
            })),
        };

        console.log("Add API Payload:", JSON.stringify(addPayload));

        const response = await axios.post(
          `${apiUrl}/api/lease_query/add_lease_query`,
          addPayload,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Add API Response:", response.data);
        alert("Lease query added successfully!");
      }

      // Redirect back to list
      router.push(`/${renderRoleBasedPath(session?.user?.role)}/lease-queries`);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      console.error("Error response:", error.response?.data);
      alert(
        id
          ? "Failed to update lease query. Please try again."
          : "Failed to add lease query. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberLabel = (member: {
    id: string;
    membershipId: string;
    applicantName: string;
    firmName: string;
  }) => {
    return `${member.membershipId || "No ID"} - ${member.applicantName} (${
      member.firmName
    })`;
  };

  const addAttachment = () => {
    attachmentFields.append({ 
      documentName: "", 
      documentPath: "",
      file: null,
      existingPath: ""
    });
  };


  const deleteExistingAttachment = (attachmentId: number) => {
    setDeletedAttachments((prev) => [...prev, { id: attachmentId }]);
    setExistingAttachments((prev) =>
      prev.filter((att) => att.id !== attachmentId)
    );
  };

  const removeDeletedAttachment = (attachmentId: number) => {
    setDeletedAttachments((prev) =>
      prev.filter((att) => att.id !== attachmentId)
    );
    // Restore the attachment to existing attachments
    const deletedAtt = deletedAttachments.find(
      (att) => att.id === attachmentId
    );
    if (deletedAtt) {
      // This would need to be handled based on your data structure
      // For now, we'll just remove it from deleted list
    }
  };

  // Handle document download
  const handleDownloadDocument = async (filePath: string) => {
    try {
      const blob = await downloadFile(filePath);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All changes will be lost."
      )
    ) {
      router.back();
    }
  };

  return (
    <div className="p-6">
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
            {id ? "Edit Lease Query" : "Add New Lease Query"}
          </CardTitle>
          <CardDescription>
          {id
              ? "Update the details of an existing lease query"
              : "Create a new lease query record"}
          </CardDescription>
              </div>
          </div>
          
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Membership ID */}
                <FormField
                  control={form.control}
                  name="membershipId"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Membership ID</FormLabel>
                      <div className="space-y-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoading
                                    ? "Loading members..."
                                    : formPopulated &&
                                      form.getValues("membershipId")
                                    ? "Loading selected member..."
                                    : "Select a membership"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <Input
                              placeholder="Search by ID, name, or firm..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="mb-2"
                            />
                            {isLoading ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Loading members...
                              </div>
                            ) : filteredMembers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                No members found
                              </div>
                            ) : (
                              filteredMembers.map((member) => (
                                <SelectItem
                                  key={member.membershipId}
                                  value={member.membershipId}
                                >
                                  {getMemberLabel(member)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Present Lease Holder */}
                <FormField
                  control={form.control}
                  name="presentLeaseHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Present Lease Holder</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter name of present lease holder"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lease Date */}
                <FormField
                  control={form.control}
                  name="dateOfLease"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Lease</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                <FormField
                  control={form.control}
                  name="expiryOfLease"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry of Lease</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Renewal Date */}
                <FormField
                  control={form.control}
                  name="dateOfRenewal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Renewal (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Existing Documents Section (Edit Mode Only) */}
              {id && existingAttachments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Existing Documents</h3>
                  </div>
                  <div className="space-y-4">
                    {existingAttachments.map((attachment) => (
                      <Card key={attachment.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {attachment.documentName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {attachment.documentPath}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteExistingAttachment(attachment.id)
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Documents Section (Edit Mode Only) */}
              {id && deletedAttachments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Deleted Documents
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {deletedAttachments.map((attachment) => (
                      <Card key={attachment.id} className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                Document ID: {attachment.id}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeDeletedAttachment(attachment.id)
                              }
                              className="text-green-600"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Upload Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Documents</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAttachment}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Document
                  </Button>
                </div>

                {attachmentFields.fields.length === 0 ? (
                  <div className="text-center py-4 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">
                      No documents added yet.
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={addAttachment}
                    >
                      Add a document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attachmentFields.fields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">
                              Document #{index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => attachmentFields.remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Document Name */}
                            <FormField
                              control={form.control}
                              name={`leaseQueryAttachments.${index}.documentName`}
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

                            {/* Document File Upload */}
                            <FormField
                              control={form.control}
                              name={`leaseQueryAttachments.${index}.file`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Upload Document</FormLabel>
                                  <FormControl>
                                    <FileUpload
                                      onFileSelect={(file) => field.onChange(file)}
                                      onUploadComplete={(filePath) => {
                                        // Update the documentPath when upload completes
                                        form.setValue(`leaseQueryAttachments.${index}.documentPath`, filePath);
                                      }}
                                      onUploadError={(error) => {
                                        console.error("Upload error:", error);
                                      }}
                                      subfolder="documents"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      existingFilePath={form.watch(`leaseQueryAttachments.${index}.existingPath`)}
                                      onDownload={(filePath) => handleDownloadDocument(filePath)}
                                      onRemoveFile={() => {
                                        field.onChange(null);
                                        form.setValue(`leaseQueryAttachments.${index}.documentPath`, "");
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/lease-queries`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : id
                    ? "Update Query"
                    : "Add Query"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Loading Dialog for Edit Mode */}
      <Dialog open={isLoadingDetails} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Lease Query Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-muted-foreground">
              Please wait while we load the lease query details...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
