"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import React from "react";

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
  addMembershipFee,
  updateMembershipFee,
  getMemberOptions,
  type MembershipFee,
} from "@/data/membership-fees";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";

const formSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
  paidDate: z.date().optional(),
  periodFrom: z.date({
    required_error: "Period start date is required",
  }),
  periodTo: z.date({
    required_error: "Period end date is required",
  }),
  status: z.string(), // Allow any string from API
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MembershipFeeFormProps {
  fee?: MembershipFee;
  isEditMode: boolean;
  billingId?: string;
}

export default function MembershipFeeForm({
  fee,
  isEditMode,
  billingId,
}: MembershipFeeFormProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPath, setReceiptPath] = useState<string>("");
  const [receiptError, setReceiptError] = useState<string>("");
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [originalFee, setOriginalFee] = useState<any>(null);

  // Fetch members from API
  React.useEffect(() => {
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
  React.useEffect(() => {
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

  const memberOptions = getMemberOptions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: fee
      ? {
          memberId: fee.memberId,
          amount: fee.amount,
          paidAmount: fee.paidAmount,
          paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
          periodFrom: new Date(fee.periodFrom),
          periodTo: new Date(fee.periodTo),
          status: fee.status,
          notes: fee.notes || "",
          receiptNumber: fee.receiptNumber || "",
          paymentMethod: fee.paymentMethod || "",
        }
      : {
          memberId: "",
          amount: 5000, // Default amount
          paidAmount: 0,
          paidDate: undefined,
          periodFrom: new Date(),
          periodTo: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Default 3 months period
          status: "due",
          notes: "",
          receiptNumber: "",
          paymentMethod: "",
        },
  });

  // Watch status to conditionally show fields
  const status = form.watch("status");
  const amount = form.watch("amount");
  const paidAmount = form.watch("paidAmount");

  // Update status based on paid amount
  const updateStatus = (paid: number, total: number) => {
    if (paid === 0) {
      form.setValue("status", "due");
    } else if (paid < total) {
      form.setValue("status", "due");
    } else if (paid >= total) {
      form.setValue("status", "paid");
    }
  };

  // Fetch fee details if in edit mode and billingId is provided
  React.useEffect(() => {
    if (isEditMode && billingId && sessionStatus === "authenticated" && session?.user?.token) {
      setIsLoadingFee(true);
      axios.get(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/bill/getBillById/${billingId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      )
        .then((response) => {
          const feeData = response.data;
          setOriginalFee(feeData);
          form.reset({
            memberId: feeData.membershipId,
            amount: parseFloat(feeData.totalAmount),
            paidAmount: parseFloat(feeData.paidAmount),
            paidDate: undefined, // Not in API
            periodFrom: new Date(feeData.fromDate),
            periodTo: new Date(feeData.toDate),
            status: feeData.paymentStatus || "",
            notes: feeData.notes || "",
            receiptNumber: "",
            paymentMethod: "",
          });
          setReceiptPath(feeData.receiptPath || "");
        })
        .finally(() => setIsLoadingFee(false));
    }
    // eslint-disable-next-line
  }, [isEditMode, billingId, sessionStatus, session?.user?.token]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (sessionStatus !== "authenticated" || !session?.user?.token) {
        alert("Authentication required");
        setIsSubmitting(false);
        return;
      }
      // Upload receipt if present
      let uploadedReceiptPath = receiptPath;
      if (receiptFile) {
        const result = await axios.post(
          "/api/upload",
          (() => {
            const formData = new FormData();
            formData.append("file", receiptFile);
            formData.append("subfolder", `receipts/${data.memberId}`);
            return formData;
          })(),
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        uploadedReceiptPath = result.data.filePath;
      }
      if (isEditMode && billingId && originalFee) {
        // Only send changed fields
        const payload: any = { billingId };
        if (data.memberId !== originalFee.membershipId) payload.membershipId = data.memberId;
        if (data.amount !== parseFloat(originalFee.totalAmount)) payload.totalAmount = data.amount;
        if (data.paidAmount !== parseFloat(originalFee.paidAmount)) payload.paidAmount = data.paidAmount;
        if (data.notes !== originalFee.notes) payload.notes = data.notes;
        if (uploadedReceiptPath && uploadedReceiptPath !== originalFee.receiptPath) payload.receiptPath = uploadedReceiptPath;
        if (data.periodFrom && new Date(data.periodFrom).toISOString() !== originalFee.fromDate) payload.fromDate = new Date(data.periodFrom).toISOString();
        if (data.periodTo && new Date(data.periodTo).toISOString() !== originalFee.toDate) payload.toDate = new Date(data.periodTo).toISOString();
        await axios.post(
          `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/bill/update_bill`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        router.push("/admin/membership-fees");
        router.refresh();
        setIsSubmitting(false);
        return;
      }
      // Format dates
      const payload: any = {
        membershipId: data.memberId,
        fromDate: data.periodFrom.toISOString(),
        toDate: data.periodTo.toISOString(),
        totalAmount: data.amount,
        paidAmount: data.paidAmount,
        notes: data.notes,
      };
      if (uploadedReceiptPath) {
        payload.receiptPath = uploadedReceiptPath;
      }
      await axios.post(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/bill/add_bill`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      router.push("/admin/membership-fees");
      router.refresh();
    } catch (error: any) {
      alert("Failed to save membership fee. Please try again.\n" + (error?.response?.data?.message || error.message));
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
      router.push("/admin/membership-fees");
    }
  };

  return (
    <div className="container">
      {(isEditMode && isLoadingFee) ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <span className="text-muted-foreground">Fetching fee details...</span>
        </div>
      ) : (
      <>
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Membership Fee" : "Add New Membership Fee"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Membership Fee Details" : "New Membership Fee"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the membership fee information below"
              : "Fill in the details to add a new membership fee"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isEditMode}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly value={field.value} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Status is set automatically by the backend.</p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodFrom"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period From</FormLabel>
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
                  name="periodTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period To</FormLabel>
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter total amount"
                          {...field}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            field.onChange(value);
                            updateStatus(paidAmount, value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter paid amount"
                          {...field}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            field.onChange(value);
                            updateStatus(value, amount);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(status === "paid" ||
                  (status === "due" && paidAmount > 0)) && (
                  <FormField
                    control={form.control}
                    name="paidDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(status === "paid" ||
                  (status === "due" && paidAmount > 0)) && (
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank Transfer">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {status === "paid" && (
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter receipt number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Receipt Upload */}
              <div>
                <FormLabel>Receipt (optional)</FormLabel>
                <FileUpload
                  onFileSelect={setReceiptFile}
                  onUploadComplete={setReceiptPath}
                  onUploadError={setReceiptError}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={6 * 1024 * 1024}
                  subfolder={form.watch("memberId") ? `receipts/${form.watch("memberId")}` : "receipts"}
                  existingFilePath={receiptPath}
                />
                {receiptError && <p className="text-sm text-destructive">{receiptError}</p>}
              </div>

              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">₹{amount}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Paid Amount:</span>
                  <span>₹{paidAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Balance:</span>
                  <span
                    className={
                      amount - paidAmount > 0
                        ? "text-destructive font-bold"
                        : "text-green-600 font-bold"
                    }
                  >
                    ₹{amount - paidAmount}
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
                    <>{isEditMode ? "Update Fee" : "Add Fee"}</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
