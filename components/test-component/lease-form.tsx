"use client";

import type React from "react";
import axios from "axios";
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
import {
  addLeaseQuery,
  updateLeaseQuery,
  getLeaseQueryById,
  type LeaseQuery,
} from "@/data/lease-queries";
import { getAllMembers } from "@/data/members";
import { AlertCircle, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { memberApi } from "@/services/api";

export interface Member {
  id: string;
  applicantName: string;
  firmName: string;
  membershipId: string;
}

// Form schema
const leaseHolderSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  periodFrom: z.string().min(1, { message: "Period from date is required" }),
  periodTo: z.string().min(1, { message: "Period to date is required" }),
});

const documentSchema = z.object({
  name: z.string().min(1, { message: "Document name is required" }),
  fileName: z.string().optional(),
  uploadDate: z.string().optional(),
});

const leaseQuerySchema = z.object({
  membershipId: z.string().min(1, { message: "Membership ID is required" }),
  presentLeaseHolder: z
    .string()
    .min(1, { message: "Present lease holder name is required" }),
  leaseDate: z.string().min(1, { message: "Lease date is required" }),
  expiryDate: z.string().min(1, { message: "Expiry date is required" }),
  renewalDate: z.string().optional(),
  leaseHolderHistory: z.array(leaseHolderSchema),
  documents: z.array(documentSchema),
  status: z.enum(["pending", "processing", "resolved", "rejected"]),
});

type LeaseQueryFormValues = z.infer<typeof leaseQuerySchema>;

interface LeaseQueryFormProps {
  id?: string;
}

export default function LeaseQueryForm({ id }: LeaseQueryFormProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [formData, setFormData] = useState<LeaseQueryFormValues | null>(null);
  const [userRole, setUserRole] = useState<string>("Editor");
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<number, File | null>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const session = useSession();

  const form = useForm<LeaseQueryFormValues>({
    resolver: zodResolver(leaseQuerySchema),
    defaultValues: {
      membershipId: "",
      presentLeaseHolder: "",
      leaseDate: "",
      expiryDate: "",
      renewalDate: "",
      leaseHolderHistory: [],
      documents: [],
      status: "pending",
    },
  });

  const leaseHolderFields = useFieldArray({
    control: form.control,
    name: "leaseHolderHistory",
  });

  const documentFields = useFieldArray({
    control: form.control,
    name: "documents",
  });

  const memberDataExample: Member[] = [
    {
      applicantName: "Member 1",
      firmName: "Firm",
      id: "1",
      membershipId: "MEM2025-5",
    },
  ];

  useEffect(() => {
    // Load members
    const allMembers = getAllMembers();
    // setMembers(memberDataExample);
    // setFilteredMembers(memberDataExample);

    // Get user role from localStorage
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }

    // If editing, load existing data
    if (id) {
      const query = getLeaseQueryById(id);
      if (query) {
        form.reset({
          membershipId: query.membershipId,
          presentLeaseHolder: query.presentLeaseHolder,
          leaseDate: query.leaseDate,
          expiryDate: query.expiryDate,
          renewalDate: query.renewalDate || "",
          leaseHolderHistory: query.leaseHolderHistory || [],
          documents: query.documents || [],
          status: query.status,
        });
      }
    }
  }, [id, form, form.reset]);

  useEffect(() => {
    console.log(session.status);
    if (session.status == "loading") {
      setIsLoading(true);
    }
    const role = session?.data?.user.role!;
    console.log(role);
    setUserRole(role);
  }, [session.status]);

  // Fetch members from API
  useEffect(() => {
    if (session.status !== "authenticated" || !session?.data.user.token) return;
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://tandurmart.com/api/member/get_members`,
          {
            headers: {
              Authorization: `Bearer ${session.data.user.token}`,
            },
          }
        );
        const data = response.data.filter(
          (m: any) =>
            m.approvalStatus == "APPROVED" && m.membershipStatus == "ACTIVE"
        );
        setMembers(data);
        setFilteredMembers(data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load members. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [session.status]);

  useEffect(() => {
    // Filter members based on search term
    if (searchTerm) {
      const filtered = members.filter(
        (member) =>
          member.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setFormData(data);

    // // If user is Admin, submit directly
    // if (userRole === "admin") {
    //   handleConfirmSubmit();
    // } else {
    //   // For non-Admin roles, show OTP verification
    //   setShowOtpDialog(true);
    // }

    if (!formData) return;

    const updatedFormData = {
      membershipId: formData.membershipId,
      presentLeaseHolder: formData.presentLeaseHolder,
      dateOfLease: formData.leaseDate,
      expiryOfLease: formData.expiryDate,
      leaseQueryAttachments: formData.documents.map((doc, index) => {
        const file = uploadedFiles[index];
        return {
          documentName: doc.name,
          documentPath: file ? doc.fileName : "",
        };
      }),
      status: formData.status.toUpperCase(),
    };

    const response = await axios.post(
      "https://tandurmart.com/api/lease_query/add_lease_query",
      updatedFormData,
      {
        headers: {
          Authorization: `Bearer ${session.data?.user.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      setIsSubmitting(false);
      alert(`✅ Lease Added successfully!`);
    } else {
      alert("⚠️ Something went wrong. Vechicle not updated.");
    }
  };

  const handleConfirmSubmit = async () => {
    if (!formData) return;

    setIsSubmitting(true);

    try {
      // In a real app, we would upload the files to a server here
      // For now, we'll just simulate it by adding the file names to the form data
      const updatedFormData = {
        ...formData,
        documents: formData.documents.map((doc, index) => {
          const file = uploadedFiles[index];
          return {
            ...doc,
            fileName: file ? file.name : doc.fileName,
            uploadDate: file ? new Date().toISOString() : doc.uploadDate,
          };
        }),
      };

      // Redirect back to list
      //   router.push(`/admin/lease-queries?role=${userRole}`);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = () => {
    // In a real app, this would verify the OTP with a backend service
    // For demo purposes, we'll accept "123456" as the valid OTP
    if (otp === "123456") {
      setOtpError("");
      setShowOtpDialog(false);
      handleConfirmSubmit();
    } else {
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const getMemberLabel = (member: Member) => {
    return `${member.membershipId || "No ID"} - ${member.applicantName} (${
      member.firmName
    })`;
  };

  const addLeaseHolder = () => {
    leaseHolderFields.append({ name: "", periodFrom: "", periodTo: "" });
  };

  const addDocument = () => {
    documentFields.append({ name: "", fileName: "", uploadDate: "" });
  };

  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setUploadedFiles((prev) => ({ ...prev, [index]: file }));

    // Update the hidden fileName field
    if (file) {
      form.setValue(`documents.${index}.fileName`, file.name);
    }
  };

  if (isLoading || session.status === "loading") {
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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {id ? "Edit Lease Query" : "Add New Lease Query"}
          </CardTitle>
          <CardDescription>
            {id
              ? "Update the details of an existing lease query"
              : "Create a new lease query record"}
          </CardDescription>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a membership" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <Input
                              placeholder="Search by ID, name, or firm..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="mb-2"
                            />
                            {filteredMembers.map((member) => (
                              <SelectItem
                                key={member.membershipId}
                                value={member.membershipId}
                              >
                                {getMemberLabel(member)}
                              </SelectItem>
                            ))}
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
                  name="leaseDate"
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
                  name="expiryDate"
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
                  name="renewalDate"
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Documents</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDocument}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Document
                  </Button>
                </div>

                {documentFields.fields.length === 0 ? (
                  <div className="text-center py-4 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">
                      No documents added yet.
                    </p>
                    <Button type="button" variant="link" onClick={addDocument}>
                      Add a document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documentFields.fields.map((field, index) => (
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
                              onClick={() => documentFields.remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Document Name */}
                            <FormField
                              control={form.control}
                              name={`documents.${index}.name`}
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
                              name={`documents.${index}.fileName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Upload Document</FormLabel>
                                  <div className="flex items-center gap-2">
                                    {/* Hidden input for form state */}
                                    <input type="hidden" {...field} />

                                    {/* File input for user interaction */}
                                    <FormControl>
                                      <div className="flex flex-col space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="file"
                                            id={`document-${index}`}
                                            className="hidden"
                                            onChange={(e) =>
                                              handleFileChange(index, e)
                                            }
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                          />
                                          <label
                                            htmlFor={`document-${index}`}
                                            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                                          >
                                            <Upload className="h-4 w-4" />
                                            <span>Choose File</span>
                                          </label>
                                          {(uploadedFiles[index] ||
                                            field.value) && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <FileText className="h-4 w-4" />
                                              <span>
                                                {uploadedFiles[index]?.name ||
                                                  field.value}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Hidden field for upload date */}
                            <input
                              type="hidden"
                              {...form.register(
                                `documents.${index}.uploadDate`
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Lease Holder History */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Previous Lease Holder History
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLeaseHolder}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Lease Holder
                  </Button>
                </div>

                {leaseHolderFields.fields.length === 0 ? (
                  <div className="text-center py-4 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">
                      No previous lease holders added yet.
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={addLeaseHolder}
                    >
                      Add a previous lease holder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaseHolderFields.fields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">
                              Lease Holder #{index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => leaseHolderFields.remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`leaseHolderHistory.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`leaseHolderHistory.${index}.periodFrom`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Period From</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`leaseHolderHistory.${index}.periodTo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Period To</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
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
                  onClick={() =>
                    router.push(`/admin/lease-queries?role=${userRole}`)
                  }
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

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify OTP</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              An OTP has been sent to your registered mobile number. Please
              enter it below to confirm your changes.
            </p>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            {otpError && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{otpError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              Cancel
            </Button>
            <Button>Verify & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
