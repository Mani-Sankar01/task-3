"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Plus, Trash2, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import {
  updateInvoice,
  calculateInvoiceAmounts,
  type Invoice,
} from "@/data/invoices";
import { renderRoleBasedPath } from "@/lib/utils";
import { SidebarInset } from "../ui/sidebar";
import Header from "../header";

// GST percentage options
const GST_PERCENTAGE_OPTIONS = [
  { value: 0, label: "0%" },
  { value: 0.1, label: "0.1%" },
  { value: 0.25, label: "0.25%" },
  { value: 1, label: "1%" },
  { value: 1.5, label: "1.5%" },
  { value: 3, label: "3%" },
  { value: 5, label: "5%" },
  { value: 6, label: "6%" },
  { value: 7.5, label: "7.5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
];

// Define the form schema
const invoiceFormSchema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required"),
  memberId: z.string().min(1, "Member is required"),
  memberName: z.string().min(1, "Member name is required"),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddress: z.string().min(1, "Firm address is required"),
  gstNumber: z.string().min(1, "GST number is required"),
  state: z.string().min(1, "State is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyGstin: z.string().min(1, "Company GSTIN is required"),
  // New customer fields
  customerName: z.string().min(1, "Customer name is required"),
  gstInNumber: z.string().min(1, "GSTIN number is required"),
  billingAddress: z.string().min(1, "Billing address is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  eWayNumber: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  items: z
    .array(
              z.object({
          id: z.string().optional(),
          hsnCode: z.string().min(1, "HSN code is required"),
          particulars: z.string().min(1, "Particulars are required"),
          noOfStones: z.coerce.number().optional(),
          sizes: z.string().optional(),
          totalSqFeet: z.coerce.number().min(0.1, "Total sq. feet is required"),
          ratePerSqFt: z.coerce.number().min(0.1, "Rate per sq. ft. is required"),
          amount: z.coerce.number().min(0),
        })
    )
    .min(1, "At least one item is required"),
  cgstPercentage: z.coerce.number().min(0),
  sgstPercentage: z.coerce.number().min(0),
  igstPercentage: z.coerce.number().min(0),
  subTotal: z.coerce.number().min(0),
  cgstAmount: z.coerce.number().min(0),
  sgstAmount: z.coerce.number().min(0),
  igstAmount: z.coerce.number().min(0),
  totalAmount: z.coerce.number().min(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  invoiceId?: string;
  isEditMode: boolean;
}

export default function InvoiceForm({
  invoice,
  invoiceId,
  isEditMode,
}: InvoiceFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<
    Array<{
      id: string;
      membershipId: string;
      applicantName: string;
      firmName: string;
      complianceDetails?: {
        fullAddress?: string;
        gstInNumber?: string;
      };
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<
    Array<{
      id: string;
      membershipId: string;
      applicantName: string;
      firmName: string;
      complianceDetails?: {
        fullAddress?: string;
        gstInNumber?: string;
      };
    }>
  >([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [apiInvoice, setApiInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Initialize form with default values or invoice data if editing
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
            defaultValues: invoice
      ? {
          invoiceDate: invoice.invoiceDate,
          memberId: invoice.memberId,
          memberName: invoice.memberName,
          firmName: invoice.firmName,
          firmAddress: invoice.firmAddress,
          gstNumber: invoice.gstNumber,
          state: invoice.state,
          companyName: invoice.companyName,
          companyAddress: invoice.companyAddress,
          companyGstin: invoice.companyGstin,
          // New customer fields
          customerName: invoice.customerName || "",
          gstInNumber: invoice.gstInNumber || "",
          billingAddress: invoice.billingAddress || "",
          shippingAddress: invoice.shippingAddress || "",
          eWayNumber: invoice.eWayNumber || "",
          phoneNumber: invoice.phoneNumber || "",
          items: invoice.items,
          cgstPercentage: invoice.cgstPercentage,
          sgstPercentage: invoice.sgstPercentage,
          igstPercentage: invoice.igstPercentage,
          subTotal: invoice.subTotal,
          cgstAmount: invoice.cgstAmount,
          sgstAmount: invoice.sgstAmount,
          igstAmount: invoice.igstAmount,
          totalAmount: invoice.totalAmount,
        }
              : {
          invoiceDate: new Date().toISOString().split("T")[0],
          memberId: "",
          memberName: "",
          firmName: "",
          firmAddress: "",
          gstNumber: "",
          state: "",
          companyName: "",
          companyAddress: "",
          companyGstin: "36AIMPT1151B1ZG",
          // New customer fields
          customerName: "",
          gstInNumber: "",
          billingAddress: "",
          shippingAddress: "",
          eWayNumber: "",
          phoneNumber: "",
          items: [
            {
              hsnCode: "",
              particulars: "",
              noOfStones: undefined,
              sizes: "",
              totalSqFeet: 0,
              ratePerSqFt: 0,
              amount: 0,
            },
          ],
          cgstPercentage: 0,
          sgstPercentage: 0,
          igstPercentage: 0,
          subTotal: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalAmount: 0,
        },
  });

  // Setup field array for items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch invoice data from API if in edit mode
  useEffect(() => {
    if (
      isEditMode &&
      invoiceId &&
      status === "authenticated" &&
      session?.user?.token
    ) {
      const fetchInvoice = async () => {
        try {
          setIsLoading(true);
          const apiUrl = process.env.BACKEND_API_URL || "https://tsmwa.online";
          const response = await axios.get(
            `${apiUrl}/api/tax_invoice/get_tax_invoice_id/${invoiceId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );

          console.log("Invoice API response:", response.data);

          // Handle the response structure with taxInvoice array
          let invoiceData: any = null;
          if (
            response.data &&
            response.data.taxInvoice &&
            Array.isArray(response.data.taxInvoice)
          ) {
            invoiceData = response.data.taxInvoice[0];
          } else if (response.data && !response.data.taxInvoice) {
            invoiceData = response.data;
          }

          if (invoiceData) {
            setApiInvoice(invoiceData);

            // Fetch member details
            const memberResponse = await axios.get(
              `${apiUrl}/api/member/get_member/${invoiceData.membershipId}`,
              {
                headers: {
                  Authorization: `Bearer ${session.user.token}`,
                },
              }
            );

            const member = memberResponse.data;

            // Update form with API data
            form.reset({
              invoiceDate: invoiceData.invoiceDate.split("T")[0],
              memberId: invoiceData.membershipId,
              memberName: member.applicantName || "",
              firmName: member.firmName || "",
              firmAddress: member.complianceDetails?.fullAddress || "",
              gstNumber: member.complianceDetails?.gstInNumber || "",
              state: "telangana", // Default state
              companyName: "TSMWA",
              companyAddress: "Telangana State Mineral Workers Association",
              companyGstin: "36AIMPT1151B1ZG",
              // Customer fields from API
              customerName: invoiceData.customerName || "",
              gstInNumber: invoiceData.gstInNumber || "",
              billingAddress: invoiceData.billingAddress || "",
              shippingAddress: invoiceData.shippingAddress || "",
              eWayNumber: invoiceData.eWayNumber || "",
              phoneNumber: invoiceData.phoneNumber || "",
              items: invoiceData.invoiceItems?.map((item: any) => ({
                id: item.id?.toString(),
                hsnCode: item.hsnCode,
                particulars: item.particular,
                noOfStones: item.stoneCount || undefined,
                sizes: item.size?.toString() || "",
                totalSqFeet: parseFloat(item.totalSqFeet),
                ratePerSqFt: parseFloat(item.ratePerSqFeet),
                amount: parseFloat(item.amount),
              })) || [
                {
                  hsnCode: "",
                  particulars: "",
                  noOfStones: undefined,
                  sizes: "",
                  totalSqFeet: 0,
                  ratePerSqFt: 0,
                  amount: 0,
                },
              ],
              cgstPercentage: invoiceData.cGSTInPercent,
              sgstPercentage: invoiceData.sGSTInPercent,
              igstPercentage: invoiceData.iGSTInPercent,
              subTotal: parseFloat(invoiceData.subTotal),
              cgstAmount:
                (parseFloat(invoiceData.subTotal) * invoiceData.cGSTInPercent) /
                100,
              sgstAmount:
                (parseFloat(invoiceData.subTotal) * invoiceData.sGSTInPercent) /
                100,
              igstAmount:
                (parseFloat(invoiceData.subTotal) * invoiceData.iGSTInPercent) /
                100,
              totalAmount: parseFloat(invoiceData.total),
            });
          }
        } catch (error) {
          console.error("Error fetching invoice:", error);
          alert("Failed to load invoice data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchInvoice();
    }
  }, [isEditMode, invoiceId, status, session?.user?.token, form]);

  // Load members from API on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      if (status === "authenticated" && session?.user?.token) {
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
          console.log(response.data);
          setMembers(response.data);
          setFilteredMembers(response.data);
        } catch (err) {
          console.error("Error fetching members:", err);
          setMembers([]);
          setFilteredMembers([]);
        }
      }
    };
    fetchMembers();
  }, [status, session?.user?.token]);

  // Filter members based on search term
  useEffect(() => {
    if (memberSearchTerm) {
      const filtered = members.filter(
        (member) =>
          member.applicantName
            .toLowerCase()
            .includes(memberSearchTerm.toLowerCase()) ||
          member.firmName.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [memberSearchTerm, members]);

  // Handle member selection
  const handleMemberSelect = async (membershipId: string) => {
    if (!membershipId) return;
    if (status !== "authenticated" || !session?.user?.token) return;
    try {
      const response = await axios.get(
        `${process.env.BACKEND_API_URL}/api/member/get_member/${membershipId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );
      const member = response.data;
      form.setValue("memberId", member.membershipId);
      form.setValue("memberName", member.applicantName || "Unknown");
      form.setValue("firmName", member.firmName || "Unknown");
      form.setValue("firmAddress", member.complianceDetails?.fullAddress || "");
      form.setValue("gstNumber", member.complianceDetails?.gstInNumber || "");
      form.setValue("state", member.state || "");
      form.setValue("companyName", member.firmName || "Unknown");
      form.setValue(
        "companyAddress",
        member.complianceDetails?.fullAddress || ""
      );
    } catch (err) {
      console.error("Error fetching member details:", err);
    }
  };

  // Calculate item amount when quantity or rate changes
  const calculateItemAmount = (index: number) => {
    const totalSqFeet = form.getValues(`items.${index}.totalSqFeet`) || 0;
    const ratePerSqFt = form.getValues(`items.${index}.ratePerSqFt`) || 0;
    const amount = totalSqFeet * ratePerSqFt;
    form.setValue(`items.${index}.amount`, amount);

    // Recalculate totals
    calculateTotals();
  };

  // Calculate all totals
  const calculateTotals = () => {
    const items = form.getValues("items");
    const cgstPercentage = form.getValues("cgstPercentage") || 0;
    const sgstPercentage = form.getValues("sgstPercentage") || 0;
    const igstPercentage = form.getValues("igstPercentage") || 0;

    const { subTotal, cgstAmount, sgstAmount, igstAmount, totalAmount } =
      calculateInvoiceAmounts(
        items,
        cgstPercentage,
        sgstPercentage,
        igstPercentage
      );

    form.setValue("subTotal", subTotal);
    form.setValue("cgstAmount", cgstAmount);
    form.setValue("sgstAmount", sgstAmount);
    form.setValue("igstAmount", igstAmount);
    form.setValue("totalAmount", totalAmount);
  };

  // Recalculate tax amounts when tax percentages change
  const handleTaxChange = () => {
    calculateTotals();
  };

  // Add a new item
  const addItem = () => {
    append({
      hsnCode: "",
      particulars: "",
      noOfStones: undefined,
      sizes: "",
      totalSqFeet: 0,
      ratePerSqFt: 0,
      amount: 0,
    });
  };

  // Function to detect changes between current form data and original data
  const detectChanges = (currentData: InvoiceFormValues, originalData: any) => {
    const changes: any = {};
    
    // Compare basic fields
    const fieldsToCompare = [
      'membershipId', 'invoiceDate', 'customerName', 'gstInNumber', 
      'billingAddress', 'shippingAddress', 'eWayNumber', 'phoneNumber',
      'cgstPercentage', 'sgstPercentage', 'igstPercentage', 'subTotal', 'totalAmount'
    ];
    
    fieldsToCompare.forEach(field => {
      const apiField = field === 'membershipId' ? 'membershipId' : 
                      field === 'invoiceDate' ? 'invoiceDate' :
                      field === 'customerName' ? 'customerName' :
                      field === 'gstInNumber' ? 'gstInNumber' :
                      field === 'billingAddress' ? 'billingAddress' :
                      field === 'shippingAddress' ? 'shippingAddress' :
                      field === 'eWayNumber' ? 'eWayNumber' :
                      field === 'phoneNumber' ? 'phoneNumber' :
                      field === 'cgstPercentage' ? 'cGSTInPercent' :
                      field === 'sgstPercentage' ? 'sGSTInPercent' :
                      field === 'igstPercentage' ? 'iGSTInPercent' :
                      field === 'subTotal' ? 'subTotal' :
                      field === 'totalAmount' ? 'total' : field;
      
      const currentValue = currentData[field as keyof InvoiceFormValues];
      const originalValue = originalData[apiField];
      
      // Handle different data types
      if (field === 'invoiceDate') {
        const currentDate = currentValue as string;
        const originalDate = originalValue ? originalValue.split('T')[0] : '';
        if (currentDate !== originalDate) {
          changes[field] = currentValue;
        }
      } else if (typeof currentValue === 'number' && typeof originalValue === 'string') {
        if (currentValue !== parseFloat(originalValue)) {
          changes[field] = currentValue;
        }
      } else if (currentValue !== originalValue) {
        changes[field] = currentValue;
      }
    });
    
    // Compare items
    const originalItems = originalData.invoiceItems || [];
    const currentItems = currentData.items;
    
    // Find new items (no id)
    const newItems = currentItems.filter(item => !item.id);
    
    // Find updated items (has id and changed)
    const updatedItems = currentItems.filter(item => {
      if (!item.id) return false;
      const originalItem = originalItems.find((oi: any) => oi.id.toString() === item.id);
      if (!originalItem) return false;
      
      return (
        item.hsnCode !== originalItem.hsnCode ||
        item.particulars !== originalItem.particular ||
        item.noOfStones !== originalItem.stoneCount ||
        item.sizes !== originalItem.size?.toString() ||
        item.totalSqFeet !== parseFloat(originalItem.totalSqFeet) ||
        item.ratePerSqFt !== parseFloat(originalItem.ratePerSqFeet) ||
        item.amount !== parseFloat(originalItem.amount)
      );
    });
    
    // Find deleted items (in original but not in current)
    const deletedItems = originalItems.filter((originalItem: any) => {
      return !currentItems.some(currentItem => 
        currentItem.id && currentItem.id === originalItem.id.toString()
      );
    });
    
    if (newItems.length > 0) {
      changes.newInvoiceItem = newItems.map(item => ({
        hsnCode: item.hsnCode,
        particular: item.particulars,
        stoneCount: item.noOfStones,
        size: item.sizes,
        totalSqFeet: item.totalSqFeet,
        ratePerSqFeet: item.ratePerSqFt,
        amount: item.amount,
      }));
    }
    
    if (updatedItems.length > 0) {
      changes.updateInvoiceItem = updatedItems.map(item => ({
        id: parseInt(item.id!),
        hsnCode: item.hsnCode,
        particular: item.particulars,
        stoneCount: item.noOfStones,
        size: item.sizes,
        totalSqFeet: item.totalSqFeet,
        ratePerSqFeet: item.ratePerSqFt,
        amount: item.amount,
      }));
    }
    
    if (deletedItems.length > 0) {
      changes.deleteInvoiceItem = deletedItems.map((item: any) => item.id);
    }
    
    return changes;
  };

  // Handle form submission
  const onSubmit = async (data: InvoiceFormValues, download = false) => {
    console.log("onSubmit called", data);
    setIsSubmitting(true);
    try {
      if (isEditMode && invoiceId) {
        // Update existing invoice using API
        if (status !== "authenticated" || !session?.user?.token) {
          alert("Authentication required");
          setIsSubmitting(false);
          return;
        }

        // Detect changes and create minimal update payload
        const changes = detectChanges(data, apiInvoice);
        
        // Only proceed if there are actual changes
        if (Object.keys(changes).length === 0) {
          alert("No changes detected. Invoice remains unchanged.");
          setIsSubmitting(false);
          return;
        }
        
        // Log what specific fields were changed
        const changedFields = Object.keys(changes).filter(key => 
          key !== 'newInvoiceItem' && key !== 'updateInvoiceItem' && key !== 'deleteInvoiceItem'
        );
        if (changedFields.length > 0) {
          console.log("Changed fields:", changedFields);
        }
        if (changes.newInvoiceItem) {
          console.log("New items added:", changes.newInvoiceItem.length);
        }
        if (changes.updateInvoiceItem) {
          console.log("Items updated:", changes.updateInvoiceItem.length);
        }
        if (changes.deleteInvoiceItem) {
          console.log("Items deleted:", changes.deleteInvoiceItem.length);
        }
        
        // Prepare update payload with only changed fields
        const updatePayload = {
          invoiceId: invoiceId,
          ...changes
        };

        console.log("Optimized update payload (only changed fields):", JSON.stringify(updatePayload));
        console.log("Changes detected:", Object.keys(changes));

        try {
          const response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/tax_invoice/update_tax_invoice`,
            updatePayload,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Update API response:", response.data);
        } catch (error: any) {
          console.error("Update API error:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error status:", error.response?.status);
          throw error;
        }

        alert("Invoice updated successfully!");

        // If download is requested, trigger download
        if (download) {
          handleDownloadInvoice(invoiceId);
        }

        // Redirect to invoice details page
        router.push(`/admin/invoices/${invoiceId}`);
      } else {
        // Add new invoice using API
        if (status !== "authenticated" || !session?.user?.token) {
          alert("Authentication required");
          setIsSubmitting(false);
          return;
        }
        const addPayload = {
          membershipId: data.memberId,
          invoiceDate: data.invoiceDate,
          customerName: data.customerName,
          gstInNumber: data.gstInNumber,
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
          eWayNumber: data.eWayNumber,
          phoneNumber: data.phoneNumber,
          cGSTInPercent: data.cgstPercentage,
          sGSTInPercent: data.sgstPercentage,
          iGSTInPercent: data.igstPercentage,
          subTotal: data.subTotal,
          total: data.totalAmount,
          invoiceItem: data.items.map((item) => ({
            hsnCode: item.hsnCode,
            particular: item.particulars,
            stoneCount: item.noOfStones,
            size: item.sizes, // Send as string, not parseFloat
            totalSqFeet: item.totalSqFeet,
            ratePerSqFeet: item.ratePerSqFt,
            amount: item.amount,
          })),
        };
        console.log(JSON.stringify(addPayload));
        await axios.post(
          `${process.env.BACKEND_API_URL}/api/tax_invoice/add_tax_invoice`,
          addPayload,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        alert("Invoice created successfully!");
        // router.push("/admin/invoices");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        `Failed to ${
          isEditMode ? "update" : "create"
        } invoice. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // Import the PDF generator
      const { generateTaxInvoicePDF } = await import("@/lib/invoice-generator");
      
      // Create invoice data object from form values
      const formData = form.getValues();
      const invoiceData = {
        invoiceId: invoiceId,
        membershipId: formData.memberId,
        invoiceDate: formData.invoiceDate,
        customerName: formData.customerName,
        gstInNumber: formData.gstInNumber,
        billingAddress: formData.billingAddress,
        shippingAddress: formData.shippingAddress,
        eWayNumber: formData.eWayNumber,
        phoneNumber: formData.phoneNumber,
        cGSTInPercent: formData.cgstPercentage,
        sGSTInPercent: formData.sgstPercentage,
        iGSTInPercent: formData.igstPercentage,
        subTotal: formData.subTotal,
        total: formData.totalAmount,
        invoiceItems: formData.items.map((item) => ({
          hsnCode: item.hsnCode,
          particular: item.particulars,
          stoneCount: item.noOfStones || 0,
          size: item.sizes || "",
          totalSqFeet: item.totalSqFeet,
          ratePerSqFeet: item.ratePerSqFt,
          amount: item.amount,
        })),
      };

      // Create member data object
      const memberData = {
        applicantName: formData.memberName,
        firmName: formData.firmName,
        complianceDetails: {
          fullAddress: formData.firmAddress,
          gstInNumber: formData.gstNumber,
        },
      };

      // Generate and download PDF
      await generateTaxInvoicePDF(invoiceData, memberData);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading invoice data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    
     <SidebarInset>
     <Header breadcrumbs={[{ label: isEditMode ? `Edit Invoice #${invoiceId}` : "Create New Invoice" }]} />
     <div className="flex flex-1 flex-col p-4">
     <div className="">
      

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                type="button"
                className=""
              >
                <ArrowLeft className=" h-4 w-4" />
              </Button>
             <div> <CardTitle className="text-2xl">TAX INVOICE</CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Edit invoice details"
                  : "Create a new invoice by filling out the form below"}
              </CardDescription></div>
              </div>
              
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
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
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : ""
                              )
                            }
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Member Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Member Information</h3>
                <div className="space-y-4">
                  {!isEditMode && (
                    <div>
                      <Label htmlFor="memberSearch">Select Member</Label>

                      <FormField
                        control={form.control}
                        name="memberId"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleMemberSelect(value);
                              }}
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
                                  id="memberSearch"
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
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="memberName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firmName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firm Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firmAddress"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Firm Address</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstInNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GSTIN number" {...field} />
                        </FormControl>
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
                    name="eWayNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Way Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter E-Way number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter billing address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Shipping Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter shipping address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.hsnCode`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>HSN Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter HSN code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.particulars`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Particulars</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter item description"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.noOfStones`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>No. of Stones (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter quantity (optional)"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.sizes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sizes (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter sizes (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.totalSqFeet`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Sq. Feet</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter total sq. feet"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      calculateItemAmount(index);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.ratePerSqFt`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rate per Sq. Ft.</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter rate"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      calculateItemAmount(index);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-4 text-destructive"
                            onClick={() => {
                              remove(index);
                              calculateTotals();
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cgstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CGST %</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseFloat(value));
                            handleTaxChange();
                          }}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CGST %" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GST_PERCENTAGE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
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
                    name="sgstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SGST %</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseFloat(value));
                            handleTaxChange();
                          }}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select SGST %" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GST_PERCENTAGE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
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
                    name="igstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IGST %</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseFloat(value));
                            handleTaxChange();
                          }}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select IGST %" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GST_PERCENTAGE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
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
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="space-y-4">
                <Separator />
                <div className="grid grid-cols-2 gap-4 w-full max-w-md ml-auto">
                  <div className="text-right font-medium">Sub Total:</div>
                  <div className="text-right">
                    ₹{form.watch("subTotal").toLocaleString()}
                  </div>

                  {form.watch("cgstPercentage") > 0 && (
                    <>
                      <div className="text-right font-medium">
                        CGST ({form.watch("cgstPercentage")}%):
                      </div>
                      <div className="text-right">
                        ₹{form.watch("cgstAmount").toLocaleString()}
                      </div>
                    </>
                  )}

                  {form.watch("sgstPercentage") > 0 && (
                    <>
                      <div className="text-right font-medium">
                        SGST ({form.watch("sgstPercentage")}%):
                      </div>
                      <div className="text-right">
                        ₹{form.watch("sgstAmount").toLocaleString()}
                      </div>
                    </>
                  )}

                  {form.watch("igstPercentage") > 0 && (
                    <>
                      <div className="text-right font-medium">
                        IGST ({form.watch("igstPercentage")}%):
                      </div>
                      <div className="text-right">
                        ₹{form.watch("igstAmount").toLocaleString()}
                      </div>
                    </>
                  )}

                  <div className="text-right font-medium text-lg">Total:</div>
                  <div className="text-right font-bold text-lg">
                    ₹{form.watch("totalAmount").toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isEditMode ? "Update Invoice" : "Create Invoice"}
                </Button>
                <Button
                  type="button"
                  onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                  disabled={isSubmitting}
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                    ? "Update & Download"
                    : "Save & Download"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div> 
     </div>
   </SidebarInset>
  );
}
