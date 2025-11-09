"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Check,
  X,
  FileText,
  DollarSign,
  Filter,
  Users,
  Receipt,
  UserCog,
} from "lucide-react";

import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Member Change Interfaces
interface PendingChange {
  id: string;
  membershipId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: string | null;
  updatedData: any;
  modifiedBy: number;
  modifiedAt: string;
  declineReason: string | null;
  approvedByAdmin: string | null;
  modifiedByEditor: {
    id: number;
    fullName: string;
    gender: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Membership Fees Change Interfaces
interface PendingBillRequest {
  id: number;
  billingId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: number | null;
  note: string | null;
  updatedData: {
    toDate?: string;
    fromDate?: string;
    billingId: string;
    paidAmount?: number;
  };
  modifiedBy: number;
  modifiedAt: string;
}

// Invoice Change Interfaces
interface InvoiceChangeRequest {
  id: number;
  invoiceId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: number | null;
  note: string | null;
  updatedData: {
    total?: number;
    subTotal?: number;
    invoiceId: string;
    eWayNumber?: string;
    gstInNumber?: string;
    invoiceDate?: string;
    phoneNumber?: string;
    customerName?: string;
    membershipId?: string;
    cGSTInPercent?: number;
    iGSTInPercent?: number;
    sGSTInPercent?: number;
    billingAddress?: string;
    shippingAddress?: string;
  };
  modifiedBy: number;
  modifiedAt: string;
  userId: number | null;
}

interface ChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

interface BillChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

interface InvoiceChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

interface LabourChangeRequest {
  id: string;
  labourId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: number | null;
  note: string | null;
  updatedData: any;
  modifiedBy: number;
  modifiedAt: string;
}

interface SummaryStats {
  totalChanges: number;
  pendingCount: number;
  approvedCount: number;
  declinedCount: number;
  memberChanges: number;
  membershipFeesChanges: number;
  invoiceChanges: number;
  labourChanges: number;
}

const ChangesApprovalPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // State for all data
  const [memberChanges, setMemberChanges] = useState<PendingChange[]>([]);
  const [membershipFeesChanges, setMembershipFeesChanges] = useState<PendingBillRequest[]>([]);
  const [invoiceChanges, setInvoiceChanges] = useState<InvoiceChangeRequest[]>([]);
  const [labourChanges, setLabourChanges] = useState<LabourChangeRequest[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalChanges: 0,
    pendingCount: 0,
    approvedCount: 0,
    declinedCount: 0,
    memberChanges: 0,
    membershipFeesChanges: 0,
    invoiceChanges: 0,
    labourChanges: 0,
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineError, setDeclineError] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  // Fetch all changes
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchAllChanges = async () => {
      try {
        setIsLoading(true);
        
        // Fetch member changes
        const memberResponse = await axios.get(
          `${process.env.BACKEND_API_URL}/api/member/get_member_changes/ALL`,
          {
            headers: { Authorization: `Bearer ${session.user.token}` },
          }
        );

        // Fetch membership fees changes
        const membershipFeesResponse = await axios.get(
          `${process.env.BACKEND_API_URL}/api/bill/get_bill_update_request`,
          {
            headers: { Authorization: `Bearer ${session.user.token}` },
          }
        );

        // Fetch invoice changes
        const invoiceResponse = await axios.get(
          `${process.env.BACKEND_API_URL}/api/tax_invoice/get_update_request/ALL`,
          {
            headers: { Authorization: `Bearer ${session.user.token}` },
          }
        );

        const labourResponse = await axios.get(
          `${process.env.BACKEND_API_URL}/api/labour/get_labour_change`,
          {
            headers: { Authorization: `Bearer ${session.user.token}` },
          }
        );

        const memberData = memberResponse.data || [];
        const membershipFeesData = membershipFeesResponse.data.pendingRequest || [];
        const invoiceData = invoiceResponse.data.invoiceChangeRequests || [];
        const labourData = labourResponse.data?.LabourChanges || [];

        setMemberChanges(memberData);
        setMembershipFeesChanges(membershipFeesData);
        setInvoiceChanges(invoiceData);
        setLabourChanges(labourData);

        // Calculate summary stats
        const allChanges = [...memberData, ...membershipFeesData, ...invoiceData, ...labourData];
        const pendingCount = allChanges.filter(c => c.approvalStatus === "PENDING").length;
        const approvedCount = allChanges.filter(c => c.approvalStatus === "APPROVED").length;
        const declinedCount = allChanges.filter(c => c.approvalStatus === "DECLINED").length;

        setSummaryStats({
          totalChanges: allChanges.length,
          pendingCount,
          approvedCount,
          declinedCount,
          memberChanges: memberData.length,
          membershipFeesChanges: membershipFeesData.length,
          invoiceChanges: invoiceData.length,
          labourChanges: labourData.length,
        });

      } catch (error) {
        console.error("Error fetching changes:", error);
        toast({
          title: "Error",
          description: "Failed to load changes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllChanges();
  }, [status, session?.user?.token, toast]);

  // Filter functions
  const filterChanges = (changes: any[]) => {
    let filtered = changes;
    
    // Filter by approval status
    if (approvalStatusFilter !== "all") {
      filtered = filtered.filter(change => change.approvalStatus === approvalStatusFilter);
    }
    
    // Filter by date
    if (dateFilter !== "all") {
      const today = new Date();
      let startDate, endDate;
      
      switch (dateFilter) {
        case "today":
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          break;
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
          break;
        case "thisWeek":
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          break;
        case "lastWeek":
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          const lastWeekEnd = new Date(today);
          lastWeekEnd.setDate(today.getDate() - today.getDay());
          startDate = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
          endDate = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate());
          break;
        case "thisMonth":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          break;
        case "lastMonth":
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "custom":
          if (selectedDate) {
            const filterDate = new Date(selectedDate);
            startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
            endDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate() + 1);
          }
          break;
      }
      
      if (startDate && endDate) {
        filtered = filtered.filter(change => {
          const changeDate = new Date(change.modifiedAt);
          return changeDate >= startDate && changeDate < endDate;
        });
      }
    }
    
    return filtered;
  };

  const filteredMemberChanges = filterChanges(memberChanges);
  const filteredMembershipFeesChanges = filterChanges(membershipFeesChanges);
  const filteredInvoiceChanges = filterChanges(invoiceChanges);
  const filteredLabourChanges = filterChanges(labourChanges);

  // Member change processing functions
  const extractMemberChanges = (updatedData: any): ChangeDetails[] => {
    const changes: ChangeDetails[] = [];

    const hasData = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (Array.isArray(obj)) return obj.length > 0;
      return Object.keys(obj).some(key => {
        const value = obj[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object' && value !== null) return hasData(value);
        return value !== null && value !== undefined && value !== '';
      });
    };

    // Check basic field changes
    const basicFields = [
      'relativeName', 'applicantName', 'firmName', 'proprietorName', 
      'phoneNumber1', 'phoneNumber2', 'surveyNumber', 'village', 'zone', 
      'mandal', 'district', 'state', 'pinCode', 'sanctionedHP',
      'estimatedMaleWorker', 'estimatedFemaleWorker', 'fullAddress'
    ];

    basicFields.forEach(field => {
      if (updatedData[field] !== undefined && updatedData[field] !== null && updatedData[field] !== '') {
        changes.push({
          type: "updated",
          field: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          newValue: updatedData[field],
          description: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} changed to: ${updatedData[field]}`
        });
      }
    });

    if (updatedData.proposer && hasData(updatedData.proposer)) {
      changes.push({
        type: "updated",
        field: "Proposer",
        newValue: updatedData.proposer.proposerID,
        description: `Proposer changed to: ${updatedData.proposer.proposerID}`
      });
    }

    if (updatedData.executiveProposer && hasData(updatedData.executiveProposer)) {
      changes.push({
        type: "updated",
        field: "Executive Proposer",
        newValue: updatedData.executiveProposer.proposerID,
        description: `Executive Proposer changed to: ${updatedData.executiveProposer.proposerID}`
      });
    }

    if (updatedData.branchDetails && hasData(updatedData.branchDetails)) {
      const branchData = updatedData.branchDetails;
      
      if (branchData.newBranchSchema && branchData.newBranchSchema.length > 0) {
        changes.push({
          type: "added",
          field: "New Branches",
          newValue: branchData.newBranchSchema,
          description: `${branchData.newBranchSchema.length} new branch(es) added`
        });
      }

      if (branchData.updateBranchSchema && branchData.updateBranchSchema.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Branches",
          newValue: branchData.updateBranchSchema,
          description: `${branchData.updateBranchSchema.length} branch(es) updated`
        });
      }

      if (branchData.deleteBranchSchema && branchData.deleteBranchSchema.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Branches",
          newValue: branchData.deleteBranchSchema,
          description: `${branchData.deleteBranchSchema.length} branch(es) deleted`
        });
      }
    }

    if (updatedData.partnerDetails && hasData(updatedData.partnerDetails)) {
      const partnerData = updatedData.partnerDetails;
      
      if (partnerData.newPartnerDetails && partnerData.newPartnerDetails.length > 0) {
        changes.push({
          type: "added",
          field: "New Partners",
          newValue: partnerData.newPartnerDetails,
          description: `${partnerData.newPartnerDetails.length} new partner(s) added`
        });
      }

      if (partnerData.updatePartnerDetails && partnerData.updatePartnerDetails.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Partners",
          newValue: partnerData.updatePartnerDetails,
          description: `${partnerData.updatePartnerDetails.length} partner(s) updated`
        });
      }

      if (partnerData.deletePartnerDetails && partnerData.deletePartnerDetails.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Partners",
          newValue: partnerData.deletePartnerDetails,
          description: `${partnerData.deletePartnerDetails.length} partner(s) deleted`
        });
      }
    }

    if (updatedData.machineryInformations && hasData(updatedData.machineryInformations)) {
      const machineryData = updatedData.machineryInformations;
      
      if (machineryData.newMachineryInformations && machineryData.newMachineryInformations.length > 0) {
        changes.push({
          type: "added",
          field: "New Machinery",
          newValue: machineryData.newMachineryInformations,
          description: `${machineryData.newMachineryInformations.length} new machinery item(s) added`
        });
      }

      if (machineryData.updateMachineryInformations && machineryData.updateMachineryInformations.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Machinery",
          newValue: machineryData.updateMachineryInformations,
          description: `${machineryData.updateMachineryInformations.length} machinery item(s) updated`
        });
      }

      if (machineryData.deleteMachineryInformations && machineryData.deleteMachineryInformations.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Machinery",
          newValue: machineryData.deleteMachineryInformations,
          description: `${machineryData.deleteMachineryInformations.length} machinery item(s) deleted`
        });
      }
    }

    return changes;
  };

  // Membership Fees change processing functions
  const extractMembershipFeesChanges = (updatedData: any): BillChangeDetails[] => {
    const changes: BillChangeDetails[] = [];

    if (updatedData.paidAmount !== undefined) {
      changes.push({
        type: "updated",
        field: "Paid Amount",
        newValue: updatedData.paidAmount,
        description: `Paid amount updated to: ₹${updatedData.paidAmount}`
      });
    }

    if (updatedData.fromDate && updatedData.toDate) {
      changes.push({
        type: "updated",
        field: "Billing Period",
        newValue: {
          fromDate: updatedData.fromDate,
          toDate: updatedData.toDate
        },
        description: `Billing period updated from ${format(new Date(updatedData.fromDate), "MMM dd, yyyy")} to ${format(new Date(updatedData.toDate), "MMM dd, yyyy")}`
      });
    } else if (updatedData.fromDate) {
      changes.push({
        type: "updated",
        field: "From Date",
        newValue: updatedData.fromDate,
        description: `From date updated to: ${format(new Date(updatedData.fromDate), "MMM dd, yyyy")}`
      });
    } else if (updatedData.toDate) {
      changes.push({
        type: "updated",
        field: "To Date",
        newValue: updatedData.toDate,
        description: `To date updated to: ${format(new Date(updatedData.toDate), "MMM dd, yyyy")}`
      });
    }

    return changes;
  };

  // Invoice change processing functions
  const extractInvoiceChanges = (updatedData: any): InvoiceChangeDetails[] => {
    const changes: InvoiceChangeDetails[] = [];

    if (updatedData.total !== undefined) {
      changes.push({
        type: "updated",
        field: "Total Amount",
        newValue: updatedData.total,
        description: `Total amount updated to: ₹${updatedData.total}`
      });
    }

    if (updatedData.subTotal !== undefined) {
      changes.push({
        type: "updated",
        field: "Sub Total",
        newValue: updatedData.subTotal,
        description: `Sub total updated to: ₹${updatedData.subTotal}`
      });
    }

    if (updatedData.cGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "CGST Percentage",
        newValue: updatedData.cGSTInPercent,
        description: `CGST percentage updated to: ${updatedData.cGSTInPercent}%`
      });
    }

    if (updatedData.sGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "SGST Percentage",
        newValue: updatedData.sGSTInPercent,
        description: `SGST percentage updated to: ${updatedData.sGSTInPercent}%`
      });
    }

    if (updatedData.iGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "IGST Percentage",
        newValue: updatedData.iGSTInPercent,
        description: `IGST percentage updated to: ${updatedData.iGSTInPercent}%`
      });
    }

    if (updatedData.customerName !== undefined) {
      changes.push({
        type: "updated",
        field: "Customer Name",
        newValue: updatedData.customerName,
        description: `Customer name updated to: ${updatedData.customerName}`
      });
    }

    if (updatedData.phoneNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "Phone Number",
        newValue: updatedData.phoneNumber,
        description: `Phone number updated to: ${updatedData.phoneNumber}`
      });
    }

    if (updatedData.gstInNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "GSTIN Number",
        newValue: updatedData.gstInNumber,
        description: `GSTIN number updated to: ${updatedData.gstInNumber}`
      });
    }

    if (updatedData.eWayNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "E-Way Number",
        newValue: updatedData.eWayNumber,
        description: `E-Way number updated to: ${updatedData.eWayNumber}`
      });
    }

    if (updatedData.billingAddress !== undefined) {
      changes.push({
        type: "updated",
        field: "Billing Address",
        newValue: updatedData.billingAddress,
        description: `Billing address updated to: ${updatedData.billingAddress}`
      });
    }

    if (updatedData.shippingAddress !== undefined) {
      changes.push({
        type: "updated",
        field: "Shipping Address",
        newValue: updatedData.shippingAddress,
        description: `Shipping address updated to: ${updatedData.shippingAddress}`
      });
    }

    if (updatedData.invoiceDate !== undefined) {
      changes.push({
        type: "updated",
        field: "Invoice Date",
        newValue: updatedData.invoiceDate,
        description: `Invoice date updated to: ${format(new Date(updatedData.invoiceDate), "MMM dd, yyyy")}`
      });
    }

    return changes;
  };

  const extractLabourChanges = (updatedData: any) => {
    return extractMemberChanges(updatedData);
  };

  const formatFieldLabel = (label: string) =>
    label
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .replace(/_/g, " ")
      .trim();

  const hasDisplayableValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => hasDisplayableValue(item));
    if (typeof value === "object")
      return Object.values(value).some((item) => hasDisplayableValue(item));
    return true;
  };

  const renderChangeValue = (value: any, depth = 0): React.ReactNode => {
    if (!hasDisplayableValue(value)) {
      return <span className="italic text-muted-foreground">No additional details</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="italic text-muted-foreground">No items</span>;
      }

      const allPrimitive = value.every(
        (item) => typeof item !== "object" || item === null
      );

      if (allPrimitive) {
        return (
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {value.map((item, index) => (
              <li key={index}>{renderChangeValue(item, depth + 1)}</li>
            ))}
          </ul>
        );
      }

      return (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div
              key={index}
              className="rounded-md border border-dashed bg-muted/40 p-3"
            >
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Item {index + 1}
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {renderChangeValue(item, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value).filter(([, val]) =>
        hasDisplayableValue(val)
      );

      if (entries.length === 0) {
        return <span className="italic text-muted-foreground">No details</span>;
      }

      return (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {formatFieldLabel(key)}
              </p>
              <div className="text-sm text-muted-foreground">
                {renderChangeValue(val, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}/;
      if (isoDatePattern.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return format(date, "MMM dd, yyyy");
        }
      }
      return trimmed;
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  };

  // Generic approval/decline handlers
  const handleApprove = async (change: any, type: 'member' | 'membershipFees' | 'invoice' | 'labour') => {
    if (!session?.user?.token) return;

    setIsProcessing(true);
    try {
      let response;
      let updateFunction;

      switch (type) {
        case 'member':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/member/approve_decline_member_changes`,
            {
              pendingChangeId: change.id,
              action: "APPROVED"
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setMemberChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "APPROVED" } : c
          ));
          break;

        case 'membershipFees':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/bill/approve_decline_bill_changes`,
            {
              id: change.id,
              approvalStatus: "APPROVED"
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setMembershipFeesChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "APPROVED" } : c
          ));
          break;

        case 'invoice':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
            {
              id: change.id,
              action: "APPROVED",
              note: "Approved by admin"
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setInvoiceChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "APPROVED" } : c
          ));
          break;

        case 'labour':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/labour/approved_labour_change`,
            {
              id: change.id,
              action: "APPROVED",
              note: "Approved by admin",
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () =>
            setLabourChanges(prev =>
              prev.map(c =>
                c.id === change.id ? { ...c, approvalStatus: "APPROVED" } : c
              )
            );
          break;
      }

      if (response?.status === 200) {
        toast({
          title: "Success",
          description: "Changes approved successfully",
        });
        
        updateFunction?.();
        
        if (selectedChange?.id === change.id) {
          setShowDetailsDialog(false);
          setSelectedChange(null);
        }
      }
    } catch (error) {
      console.error("Error approving changes:", error);
      toast({
        title: "Error",
        description: "Failed to approve changes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (change: any, type: 'member' | 'membershipFees' | 'invoice' | 'labour') => {
    if (!session?.user?.token) return;

    if (!declineNote.trim()) {
      setSelectedChange({ ...change, type });
      setShowDeclineDialog(true);
      setDeclineError("");
      return;
    }

    setIsProcessing(true);
    setDeclineError("");
    
    try {
      let response;
      let updateFunction;

      switch (type) {
        case 'member':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/member/approve_decline_member_changes`,
            {
              pendingChangeId: change.id,
              action: "DECLINED",
              declineReason: declineNote.trim()
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setMemberChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "DECLINED" } : c
          ));
          break;

        case 'membershipFees':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/bill/approve_decline_bill_changes`,
            {
              id: change.id,
              approvalStatus: "DECLINED",
              note: declineNote.trim()
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setMembershipFeesChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "DECLINED" } : c
          ));
          break;

        case 'invoice':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
            {
              id: change.id,
              action: "DECLINED",
              note: declineNote.trim()
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () => setInvoiceChanges(prev => prev.map(c => 
            c.id === change.id ? { ...c, approvalStatus: "DECLINED" } : c
          ));
          break;

        case 'labour':
          response = await axios.post(
            `${process.env.BACKEND_API_URL}/api/labour/approved_labour_change`,
            {
              id: change.id,
              action: "DECLINED",
              note: declineNote.trim(),
            },
            { headers: { Authorization: `Bearer ${session.user.token}` } }
          );
          updateFunction = () =>
            setLabourChanges(prev =>
              prev.map(c =>
                c.id === change.id ? { ...c, approvalStatus: "DECLINED" } : c
              )
            );
          break;
      }

      if (response?.status === 200) {
        toast({
          title: "Success",
          description: "Changes declined successfully",
        });
        
        updateFunction?.();
        
        setShowDeclineDialog(false);
        setDeclineNote("");
        setDeclineError("");
        
        if (selectedChange?.id === change.id) {
          setShowDetailsDialog(false);
          setSelectedChange(null);
        }
      }
    } catch (error: any) {
      console.error("Error declining changes:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to decline changes";
      setDeclineError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineSubmit = async () => {
    if (!selectedChange || !declineNote.trim()) return;
    
    // Determine the type based on the selected change
    let type: 'member' | 'membershipFees' | 'invoice' | 'labour';
    if (selectedChange.type) {
      type = selectedChange.type;
    } else if (selectedChange.membershipId) {
      type = 'member';
    } else if (selectedChange.billingId) {
      type = 'membershipFees';
    } else if (selectedChange.labourId) {
      type = 'labour';
    } else {
      type = 'invoice';
    }
    
    await handleDecline(selectedChange, type);
  };

  // Get change type badge
  const getChangeTypeBadge = (changes: any[]) => {
    const types = changes.map(c => c.type);
    if (types.includes("added")) return <Badge variant="default" className="bg-green-100 text-green-800">Added</Badge>;
    if (types.includes("deleted")) return <Badge variant="destructive">Deleted</Badge>;
    if (types.includes("updated")) return <Badge variant="secondary">Updated</Badge>;
    return <Badge variant="outline">Modified</Badge>;
  };

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Changes Approval" }]} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading changes...</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Changes Approval" }]} />
      <div className="flex flex-col gap-6 p-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Changes</p>
                  <p className="text-2xl font-bold">{summaryStats.totalChanges}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{summaryStats.pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{summaryStats.approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold text-red-600">{summaryStats.declinedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Member Changes</p>
                  <p className="text-lg font-bold">{summaryStats.memberChanges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Membership Fees</p>
                  <p className="text-lg font-bold">{summaryStats.membershipFeesChanges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                                 <Receipt className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Invoice Changes</p>
                  <p className="text-lg font-bold">{summaryStats.invoiceChanges}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCog className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Labour Changes</p>
                  <p className="text-lg font-bold">{summaryStats.labourChanges}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Changes</h1>
          <div className="flex items-center gap-4">
            <Select
              value={approvalStatusFilter}
              onValueChange={setApprovalStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                if (value === "all") {
                  setSelectedDate("");
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === "custom" && (
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
                placeholder="Select date"
              />
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({filteredMemberChanges.length})
            </TabsTrigger>
            <TabsTrigger value="membershipFees" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Membership Fees ({filteredMembershipFeesChanges.length})
            </TabsTrigger>
                         <TabsTrigger value="invoices" className="flex items-center gap-2">
               <Receipt className="h-4 w-4" />
               Invoices ({filteredInvoiceChanges.length})
             </TabsTrigger>
            <TabsTrigger value="labour" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Labour ({filteredLabourChanges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {filteredMemberChanges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Member Changes</h3>
                  <p className="text-muted-foreground text-center">
                    All member changes have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMemberChanges.map((change) => (
                  <Card key={change.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold">{change.membershipId}</span>
                          </div>
                          <Badge variant="secondary">Updated</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(change.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                          <Badge variant={change.approvalStatus === "PENDING" ? "destructive" : change.approvalStatus === "APPROVED" ? "default" : "destructive"}>
                            {change.approvalStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          Modified by: {change.modifiedByEditor?.fullName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChange({ ...change, type: 'member' });
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show Changes
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(change, 'member')}
                          disabled={isProcessing}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDecline(change, 'member')}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="membershipFees" className="space-y-4">
            {filteredMembershipFeesChanges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Membership Fees Changes</h3>
                  <p className="text-muted-foreground text-center">
                    All membership fees changes have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMembershipFeesChanges.map((change) => (
                  <Card key={change.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            <span className="font-semibold">{change.billingId}</span>
                          </div>
                          <Badge variant="secondary">Updated</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(change.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                          <Badge variant={change.approvalStatus === "PENDING" ? "destructive" : change.approvalStatus === "APPROVED" ? "default" : "destructive"}>
                            {change.approvalStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          Modified by: User ID {change.modifiedBy}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChange({ ...change, type: 'membershipFees' });
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show Changes
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(change, 'membershipFees')}
                          disabled={isProcessing}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDecline(change, 'membershipFees')}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {filteredInvoiceChanges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Invoice Changes</h3>
                  <p className="text-muted-foreground text-center">
                    All invoice changes have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInvoiceChanges.map((change) => (
                  <Card key={change.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                                                         <Receipt className="h-5 w-5 text-purple-500" />
                            <span className="font-semibold">{change.invoiceId}</span>
                          </div>
                          <Badge variant="secondary">Updated</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(change.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                          <Badge variant={change.approvalStatus === "PENDING" ? "destructive" : change.approvalStatus === "APPROVED" ? "default" : "destructive"}>
                            {change.approvalStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4" />
                          Modified by: User ID {change.modifiedBy}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChange({ ...change, type: 'invoice' });
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show Changes
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(change, 'invoice')}
                          disabled={isProcessing}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDecline(change, 'invoice')}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="labour" className="space-y-4">
            {filteredLabourChanges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Labour Changes</h3>
                  <p className="text-muted-foreground text-center">
                    All labour changes have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredLabourChanges.map((change) => (
                  <Card key={change.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-amber-500" />
                            <span className="font-semibold">{change.labourId}</span>
                          </div>
                          <Badge variant="secondary">Updated</Badge>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(change.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                          <Badge
                            variant={
                              change.approvalStatus === "PENDING"
                                ? "destructive"
                                : change.approvalStatus === "APPROVED"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {change.approvalStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4 text-sm text-muted-foreground space-y-1">
                        {change.updatedData?.fullName && (
                          <div>
                            <span className="font-medium">Full Name:</span> {change.updatedData.fullName}
                          </div>
                        )}
                        {change.updatedData?.phoneNumber && (
                          <div>
                            <span className="font-medium">Phone:</span> {change.updatedData.phoneNumber}
                          </div>
                        )}
                        {change.updatedData?.labourStatus && (
                          <div>
                            <span className="font-medium">Status:</span> {change.updatedData.labourStatus}
                          </div>
                        )}
                        {change.updatedData?.assignedTo && (
                          <div>
                            <span className="font-medium">Assigned To:</span> {change.updatedData.assignedTo}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChange({ ...change, type: 'labour' });
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show Changes
                        </Button>

                        {(change.approvalStatus === "PENDING" || change.approvalStatus === "DECLINED") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(change, 'labour')}
                            disabled={isProcessing}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}

                        {(change.approvalStatus === "PENDING" || change.approvalStatus === "APPROVED") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDecline(change, 'labour')}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Change Details -
                {" "}
                {selectedChange?.membershipId ||
                  selectedChange?.billingId ||
                  selectedChange?.invoiceId ||
                  selectedChange?.labourId}
              </DialogTitle>
              <DialogDescription>
                Review the changes made on{" "}
                {selectedChange && format(new Date(selectedChange.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>

            {selectedChange && (
              <div className="space-y-4">
                {(() => {
                  let changes: any[] = [];
                  switch (selectedChange.type) {
                    case 'member':
                      changes = extractMemberChanges(selectedChange.updatedData);
                      break;
                    case 'membershipFees':
                      changes = extractMembershipFeesChanges(selectedChange.updatedData);
                      break;
                    case 'invoice':
                      changes = extractInvoiceChanges(selectedChange.updatedData);
                      break;
                    case 'labour':
                      changes = extractLabourChanges(selectedChange.updatedData);
                      break;
                  }

                  return changes.map((change, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          {change.type === "added" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {change.type === "updated" && <AlertCircle className="h-4 w-4 text-blue-500" />}
                          {change.type === "deleted" && <XCircle className="h-4 w-4 text-red-500" />}
                          <CardTitle className="text-base">{change.field}</CardTitle>
                          <Badge variant={change.type === "added" ? "default" : change.type === "deleted" ? "destructive" : "secondary"}>
                            {change.type.charAt(0).toUpperCase() + change.type.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                        {hasDisplayableValue(change.newValue) && (
                          <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            {renderChangeValue(change.newValue)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            )}

            const selectedStatus = selectedChange?.approvalStatus;
            const canApprove =
              selectedStatus === "PENDING" || selectedStatus === "DECLINED";
            const canDecline =
              selectedStatus === "PENDING" || selectedStatus === "APPROVED";

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
              {selectedChange && canApprove && (
                <Button
                  variant="default"
                  onClick={() => handleApprove(selectedChange, selectedChange.type)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {selectedChange && canDecline && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowDeclineDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Decline Changes
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for declining the changes for {selectedChange?.membershipId || selectedChange?.billingId || selectedChange?.invoiceId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter reason for declining..."
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                rows={4}
              />
              {declineError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {declineError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineNote("");
                  setDeclineError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={isProcessing || !declineNote.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Decline Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
};

export default ChangesApprovalPage;
