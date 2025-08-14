"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Edit,
  ArrowLeft,
  Save,
  CalendarDays,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  CopyrightIcon as License,
  WashingMachineIcon as Machinery,
  Trash2,
  Download,
  Edit2,
  User2,
  Plus,
  Activity,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMember, type Member, Attachment } from "@/services/api";
import { useForm } from "react-hook-form";
import { uploadFile, downloadFile } from "@/lib/client-file-upload";
import { getAuthToken } from "@/services/api";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface USCMeterHistory {
  id: number;
  electricalUscNumber: string;
  membershipId: string;
  branchId: number | null;
  assignedAt: string;
  unassignedAt: string | null;
}

interface MembershipDetailsClientProps {
  member: Member;
  refetchMember: () => Promise<void>;
}

type AttachmentWithExpiry = Attachment & { expiredAt?: string };

export default function MembershipDetailsClient({
  member,
  refetchMember,
}: MembershipDetailsClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(member.membershipStatus);
  const [isStatusEditing, setIsStatusEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get user role from localStorage
  const [userRole, setUserRole] = useState("viewer");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("userRole");
      if (savedRole && ["admin", "editor", "viewer"].includes(savedRole)) {
        setUserRole(savedRole);
      }
    }
  }, []);

  const handleEdit = () => {
    router.push(`/admin/memberships/${member.membershipId}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/memberships");
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as "ACTIVE" | "INACTIVE");
  };

  const handleStatusSave = () => {
    if (userRole === "admin") {
      setShowConfirmDialog(true);
    } else {
      // Generate and send OTP for non-admin roles
      const generatedOtp = generateOTP();
      setOtp(generatedOtp);
      console.log("OTP for verification:", generatedOtp); // In a real app, this would be sent via SMS/email
      setShowOTPDialog(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    try {
      setIsLoading(true);
      // Update the member status
      await updateMember(member.membershipId, { membershipStatus: status });
      setIsStatusEditing(false);
      setShowConfirmDialog(false);
      // In a real app, you would refresh the data here
      await refetchMember();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (enteredOtp === otp) {
      try {
        setIsLoading(true);
        // OTP is correct, proceed with the update
        await updateMember(member.membershipId, { membershipStatus: status });
        setIsStatusEditing(false);
        setShowOTPDialog(false);
        setEnteredOtp("");
        setOtpError("");
        // In a real app, you would refresh the data here
        await refetchMember();
      } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const DOCUMENT_TYPES = [
    { value: "additional", label: "Additional" },
  ];

  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<AttachmentWithExpiry | null>(null); // null for add, or doc object for edit
  const [docType, setDocType] = useState("additional");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [filePathForUpload, setFilePathForUpload] = useState<string | null>(null);

  const { data: session } = useSession();
  const { toast } = useToast();

  // Add or Edit Document
  const handleDocSubmit = async () => {
    setDocLoading(true);
    setDocError("");
    try {
      let filePath = editDoc?.documentPath || "";
      if (docFile) {
        const upload = await uploadFile(docFile, "documents");
        if (!upload.success || !upload.filePath) {
          setDocError(upload.error || "File upload failed");
          setDocLoading(false);
          return;
        }
        filePath = upload.filePath;
      }
      let payload: any = { membershipId: member.membershipId };
      // Handle compliance document types
      if (["gst", "factory", "tspcb", "mdl", "udyam"].includes(docType)) {
        payload.complianceDetails = { ...member.complianceDetails };
        switch (docType) {
          case "gst":
            payload.complianceDetails.gstInCertificatePath = filePath;
            if (docExpiry) payload.complianceDetails.gstExpiredAt = new Date(docExpiry).toISOString();
            if (docName) payload.complianceDetails.gstInNumber = docName;
            break;
          case "factory":
            payload.complianceDetails.factoryLicensePath = filePath;
            if (docExpiry) payload.complianceDetails.factoryLicenseExpiredAt = new Date(docExpiry).toISOString();
            if (docName) payload.complianceDetails.factoryLicenseNumber = docName;
            break;
          case "tspcb":
            payload.complianceDetails.tspcbCertificatePath = filePath;
            if (docExpiry) payload.complianceDetails.tspcbExpiredAt = new Date(docExpiry).toISOString();
            if (docName) payload.complianceDetails.tspcbOrderNumber = docName;
            break;
          case "mdl":
            payload.complianceDetails.mdlCertificatePath = filePath;
            if (docExpiry) payload.complianceDetails.mdlExpiredAt = new Date(docExpiry).toISOString();
            if (docName) payload.complianceDetails.mdlNumber = docName;
            break;
          case "udyam":
            payload.complianceDetails.udyamCertificatePath = filePath;
            if (docExpiry) payload.complianceDetails.udyamCertificateExpiredAt = new Date(docExpiry).toISOString();
            if (docName) payload.complianceDetails.udyamCertificateNumber = docName;
            break;
        }
      } else {
        // Additional document logic (attachments)
        payload.attachments = {};
        if (!editDoc) {
          // Add
          payload.attachments.newAttachments = [{
            documentName: docName,
            documentPath: filePath,
            expiredAt: docExpiry ? new Date(docExpiry).toISOString() : undefined,
          }];
        } else {
          // Edit
          const update: any = { id: editDoc.id };
          if (docName && docName !== editDoc.documentName) update.documentName = docName;
          if (filePath && filePath !== editDoc.documentPath) update.documentPath = filePath;
          if (docExpiry) update.expiredAt = new Date(docExpiry).toISOString();
          payload.attachments.updateAttachments = [update];
        }
      }
      if (!session?.user.token) throw new Error("No auth token");
      console.log("Update payload:", payload);
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Update response:", response);
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to update member");
      setShowDocDialog(false);
      toast({ title: editDoc ? "Document updated" : "Document added", description: `The document was successfully ${editDoc ? "updated" : "added"}.`, variant: "sucess" });
      await refetchMember();
    } catch (err: any) {
      setDocError(err.message || "Failed to update document");
      alert(err.message || "Failed to update document");
    } finally {
      setDocLoading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (doc: Attachment) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setDocLoading(true);
    setDocError("");
    if (!session?.user.token) {
      alert("No auth token found. Please login again.");
      setDocLoading(false);
      return;
    }
    try {
      const payload = {
        membershipId: member.membershipId,
        attachments: { deleteAttachments: [{ id: doc.id }] },
      };
      console.log("Delete payload:", JSON.stringify(payload));
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Delete response:", response);
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to delete document");
      await refetchMember();
      toast({ title: "Document deleted", description: "The document was successfully deleted.", variant: "sucess" });
    } catch (err: any) {
      setDocError(err.message || "Failed to delete document");
      alert(err.message || "Failed to delete document");
    } finally {
      setDocLoading(false);
    }
  };

  const openAddDoc = () => {
    setEditDoc(null);
    setDocType("additional");
    setDocName("");
    setDocFile(null);
    setDocExpiry("");
    setFilePathForUpload(null);
    setShowDocDialog(true);
  };
  const openEditDoc = (doc: AttachmentWithExpiry, type: string) => {
    setEditDoc(doc);
    setDocType(type);
    setDocName(doc.documentName || "");
    setDocFile(null);
    setDocExpiry(doc.expiredAt ? doc.expiredAt.split("T")[0] : "");
    setFilePathForUpload(doc.documentPath || null);
    setShowDocDialog(true);
  };
  const closeDocDialog = () => setShowDocDialog(false);

  // Map attachments to include expiredAt if present
  const attachmentsWithExpiry: AttachmentWithExpiry[] = member.attachments.map(a => ({
    ...a,
    expiredAt: (a as any).expiredAt,
  }));

  // Helper for pretty date
  const prettyDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Download functions
  const handleDownloadDocument = async (filePath: string) => {
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
        
        toast({
          title: "Download Successful",
          description: `File ${filename} downloaded successfully.`,
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (attachment.documentPath) {
      await handleDownloadDocument(attachment.documentPath);
    }
  };

  // License Management
  const [editLicenseType, setEditLicenseType] = useState<string | null>(null);
  const [editLicenseNumber, setEditLicenseNumber] = useState("");
  const [editLicenseFilePath, setEditLicenseFilePath] = useState<string | null>(null);
  const [editLicenseExpiry, setEditLicenseExpiry] = useState("");
  const [editLicenseFile, setEditLicenseFile] = useState<File | null>(null);
  const [editLicenseDocError, setEditLicenseDocError] = useState("");
  const [showAddLicenseDialog, setShowAddLicenseDialog] = useState(false);
  const [addLicenseType, setAddLicenseType] = useState("");
  const [addLicenseNumber, setAddLicenseNumber] = useState("");
  const [addLicenseFilePath, setAddLicenseFilePath] = useState<string | null>(null);
  const [addLicenseExpiry, setAddLicenseExpiry] = useState("");
  const [addLicenseFile, setAddLicenseFile] = useState<File | null>(null);
  const [addLicenseValidationError, setAddLicenseValidationError] = useState("");
  const [addLicenseValidationSuccess, setAddLicenseValidationSuccess] = useState("");
  const [isValidatingLicense, setIsValidatingLicense] = useState(false);
  
  // USC Meter History states
  const [uscMeterHistory, setUscMeterHistory] = useState<USCMeterHistory[]>([]);
  const [isLoadingMeterHistory, setIsLoadingMeterHistory] = useState(false);
  const [meterHistoryError, setMeterHistoryError] = useState("");

  // Fetch USC Meter History
  const fetchUSCMeterHistory = async () => {
    if (!session?.user?.token) return;
    
    setIsLoadingMeterHistory(true);
    setMeterHistoryError("");
    
    try {
      const response = await fetch(
        `${process.env.BACKEND_API_URL}/api/member/get_usc_history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch USC meter history");
      }

      const data: USCMeterHistory[] = await response.json();
      
      // Filter history for the current member
      const memberHistory = data.filter(
        (entry) => entry.membershipId === member.membershipId
      );
      
      setUscMeterHistory(data); // store all
    } catch (error) {
      console.error("Error fetching USC meter history:", error);
      setMeterHistoryError("Failed to load USC meter history");
      toast({
        title: "Error",
        description: "Failed to load USC meter history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMeterHistory(false);
    }
  };

  // Auto-fetch meter history on component mount
  useEffect(() => {
    fetchUSCMeterHistory();
  }, [session?.user?.token]);

  const handleEditLicenseSubmit = async () => {
    setDocLoading(true);
    setEditLicenseDocError("");
    try {
      let filePath = editLicenseFilePath || "";
      if (editLicenseFile) {
        const upload = await uploadFile(editLicenseFile, "documents");
        if (!upload.success || !upload.filePath) {
          setEditLicenseDocError(upload.error || "File upload failed");
          setDocLoading(false);
          return;
        }
        filePath = upload.filePath;
      }
      let payload: any = { membershipId: member.membershipId };
      if (editLicenseType) {
        payload.complianceDetails = { ...member.complianceDetails };
        if (editLicenseType === "gst") {
          payload.complianceDetails.gstInCertificatePath = filePath;
          if (editLicenseExpiry) payload.complianceDetails.gstExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber) payload.complianceDetails.gstInNumber = editLicenseNumber;
        } else if (editLicenseType === "factory") {
          payload.complianceDetails.factoryLicensePath = filePath;
          if (editLicenseExpiry) payload.complianceDetails.factoryLicenseExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber) payload.complianceDetails.factoryLicenseNumber = editLicenseNumber;
        } else if (editLicenseType === "tspcb") {
          payload.complianceDetails.tspcbCertificatePath = filePath;
          if (editLicenseExpiry) payload.complianceDetails.tspcbExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber) payload.complianceDetails.tspcbOrderNumber = editLicenseNumber;
        } else if (editLicenseType === "mdl") {
          payload.complianceDetails.mdlCertificatePath = filePath;
          if (editLicenseExpiry) payload.complianceDetails.mdlExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber) payload.complianceDetails.mdlNumber = editLicenseNumber;
        } else if (editLicenseType === "udyam") {
          payload.complianceDetails.udyamCertificatePath = filePath;
          if (editLicenseExpiry) payload.complianceDetails.udyamCertificateExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber) payload.complianceDetails.udyamCertificateNumber = editLicenseNumber;
        }
      }
      if (!session?.user.token) throw new Error("No auth token");
      console.log("Update payload:", payload);
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Update response:", response);
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to update member");
      setEditLicenseType(null);
      toast({ title: "License updated", description: "The license was successfully updated.", variant: "sucess" });
      await refetchMember();
    } catch (err: any) {
      setEditLicenseDocError(err.message || "Failed to update license");
      alert(err.message || "Failed to update license");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteLicense = async (type: string) => {
    if (!window.confirm("Are you sure you want to delete this license?")) return;
    setDocLoading(true);
    setDocError("");
    if (!session?.user.token) {
      alert("No auth token found. Please login again.");
      setDocLoading(false);
      return;
    }
    try {
      let payload: any = { membershipId: member.membershipId };
      
      // Create complianceDetails object with only the fields being deleted
      payload.complianceDetails = {};
      
      if (type === "gst") {
        payload.complianceDetails.gstInNumber = "";
        payload.complianceDetails.gstInCertificatePath = "";
        payload.complianceDetails.gstExpiredAt = null;
      } else if (type === "factory") {
        payload.complianceDetails.factoryLicenseNumber = "";
        payload.complianceDetails.factoryLicensePath = "";
        payload.complianceDetails.factoryLicenseExpiredAt = null;
      } else if (type === "tspcb") {
        payload.complianceDetails.tspcbOrderNumber = "";
        payload.complianceDetails.tspcbCertificatePath = "";
        payload.complianceDetails.tspcbExpiredAt = null;
      } else if (type === "mdl") {
        payload.complianceDetails.mdlNumber = "";
        payload.complianceDetails.mdlCertificatePath = "";
        payload.complianceDetails.mdlExpiredAt = null;
      } else if (type === "udyam") {
        payload.complianceDetails.udyamCertificateNumber = "";
        payload.complianceDetails.udyamCertificatePath = "";
        payload.complianceDetails.udyamCertificateExpiredAt = null;
      }
      
      console.log("Delete payload:", JSON.stringify(payload));
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Delete response:", response);
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to delete license");
      setEditLicenseType(null);
      toast({ title: "License deleted", description: "The license was successfully deleted.", variant: "default" });
      await refetchMember();
    } catch (err: any) {
      setDocError(err.message || "Failed to delete license");
      alert(err.message || "Failed to delete license");
    } finally {
      setDocLoading(false);
    }
  };

  // Get available license types (only those that don't have values)
  const getAvailableLicenseTypes = () => {
    const allTypes = [
      { value: "gst", label: "GST Certificate" },
      { value: "factory", label: "Factory License" },
      { value: "tspcb", label: "TSPCB Certificate" },
      { value: "mdl", label: "MDL Certificate" },
      { value: "udyam", label: "Udyam Certificate" }
    ];

    return allTypes.filter(type => {
      if (type.value === "gst") return !member.complianceDetails.gstInNumber && !member.complianceDetails.gstInCertificatePath;
      if (type.value === "factory") return !member.complianceDetails.factoryLicenseNumber && !member.complianceDetails.factoryLicensePath;
      if (type.value === "tspcb") return !member.complianceDetails.tspcbOrderNumber && !member.complianceDetails.tspcbCertificatePath;
      if (type.value === "mdl") return !member.complianceDetails.mdlNumber && !member.complianceDetails.mdlCertificatePath;
      if (type.value === "udyam") return !member.complianceDetails.udyamCertificateNumber && !member.complianceDetails.udyamCertificatePath;
      return false;
    });
  };

  const openAddLicenseDialog = () => {
    setShowAddLicenseDialog(true);
    setAddLicenseType("");
    setAddLicenseNumber("");
    setAddLicenseFilePath(null);
    setAddLicenseExpiry("");
    setAddLicenseFile(null);
  };

  // Single license validation function
  const validateSingleLicenseField = async (fieldName: string, value: string) => {
    if (!session?.user?.token || value.length < 3) return;

    setIsValidatingLicense(true);
    try {
      console.log(`Validating single license field: ${fieldName} with value: ${value}`);
      
      // Build payload with only the specific field
      const payload: any = {};
      const fieldMappings: { [key: string]: string } = {
        gst: 'gstInNumber',
        factory: 'factoryLicenseNumber',
        tspcb: 'tspcbOrderNumber',
        mdl: 'mdlNumber',
        udyam: 'udyamCertificateNumber'
      };
      
      const apiFieldName = fieldMappings[fieldName];
      if (apiFieldName) {
        payload[apiFieldName] = value.trim();
      }

      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/validate_compliance_details`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log('Single license validation response:', response.data);

      // Clear previous validation messages
      setAddLicenseValidationError("");
      setAddLicenseValidationSuccess("");

      // Check the specific field response
      const responseKeys: { [key: string]: string } = {
        gst: 'GSTIN',
        factory: 'Factory License Number',
        tspcb: 'TSPCB Order Number',
        mdl: 'MDL Number',
        udyam: 'Udyam Certificate Number'
      };

      const responseKey = responseKeys[fieldName];
      if (response.data[responseKey]) {
        if (response.data[responseKey].isMember) {
          const firmName = response.data[responseKey].firmName || "Unknown Firm";
          setAddLicenseValidationError(`Already added for ${firmName}`);
        } else {
          setAddLicenseValidationSuccess(`This ${fieldName} is unique and can be used.`);
        }
      }
    } catch (error) {
      console.error(`Error validating ${fieldName}:`, error);
    } finally {
      setIsValidatingLicense(false);
    }
  };

  const handleAddLicenseSubmit = async () => {
    if (!addLicenseType || !session?.user.token) return;
    
    setDocLoading(true);
    setDocError("");
    
    try {
      let filePath = addLicenseFilePath || "";
      if (addLicenseFile) {
        const upload = await uploadFile(addLicenseFile, "documents");
        if (upload.error) {
          setDocError(upload.error || "File upload failed");
          setDocLoading(false);
          return;
        }
        filePath = upload.filePath;
      }

      let payload: any = { membershipId: member.membershipId };
      
      if (addLicenseType === "gst") {
        payload.complianceDetails = { ...member.complianceDetails };
        if (addLicenseExpiry) payload.complianceDetails.gstExpiredAt = new Date(addLicenseExpiry).toISOString();
        if (addLicenseNumber) payload.complianceDetails.gstInNumber = addLicenseNumber;
        if (filePath) payload.complianceDetails.gstInCertificatePath = filePath;
      } else if (addLicenseType === "factory") {
        payload.complianceDetails = { ...member.complianceDetails };
        if (addLicenseExpiry) payload.complianceDetails.factoryLicenseExpiredAt = new Date(addLicenseExpiry).toISOString();
        if (addLicenseNumber) payload.complianceDetails.factoryLicenseNumber = addLicenseNumber;
        if (filePath) payload.complianceDetails.factoryLicensePath = filePath;
      } else if (addLicenseType === "tspcb") {
        payload.complianceDetails = { ...member.complianceDetails };
        if (addLicenseExpiry) payload.complianceDetails.tspcbExpiredAt = new Date(addLicenseExpiry).toISOString();
        if (addLicenseNumber) payload.complianceDetails.tspcbOrderNumber = addLicenseNumber;
        if (filePath) payload.complianceDetails.tspcbCertificatePath = filePath;
      } else if (addLicenseType === "mdl") {
        payload.complianceDetails = { ...member.complianceDetails };
        if (addLicenseExpiry) payload.complianceDetails.mdlExpiredAt = new Date(addLicenseExpiry).toISOString();
        if (addLicenseNumber) payload.complianceDetails.mdlNumber = addLicenseNumber;
        if (filePath) payload.complianceDetails.mdlCertificatePath = filePath;
      } else if (addLicenseType === "udyam") {
        payload.complianceDetails = { ...member.complianceDetails };
        if (addLicenseExpiry) payload.complianceDetails.udyamCertificateExpiredAt = new Date(addLicenseExpiry).toISOString();
        if (addLicenseNumber) payload.complianceDetails.udyamCertificateNumber = addLicenseNumber;
        if (filePath) payload.complianceDetails.udyamCertificatePath = filePath;
      }

      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to add license");
      
      setShowAddLicenseDialog(false);
      toast({ title: "License added", description: "The license was successfully added.", variant: "default" });
      await refetchMember();
    } catch (err: any) {
      setDocError(err.message || "Failed to add license");
      alert(err.message || "Failed to add license");
    } finally {
      setDocLoading(false);
    }
  };

  const openEditLicenseDialog = (type: string) => {
    setEditLicenseType(type);
    if (type === "gst") {
      setEditLicenseNumber(member.complianceDetails.gstInNumber || "");
      setEditLicenseFilePath(member.complianceDetails.gstInCertificatePath || null);
      setEditLicenseExpiry(member.complianceDetails.gstExpiredAt ? new Date(member.complianceDetails.gstExpiredAt).toISOString().split("T")[0] : "");
    } else if (type === "factory") {
      setEditLicenseNumber(member.complianceDetails.factoryLicenseNumber || "");
      setEditLicenseFilePath(member.complianceDetails.factoryLicensePath || null);
      setEditLicenseExpiry(member.complianceDetails.factoryLicenseExpiredAt ? new Date(member.complianceDetails.factoryLicenseExpiredAt).toISOString().split("T")[0] : "");
    } else if (type === "tspcb") {
      setEditLicenseNumber(member.complianceDetails.tspcbOrderNumber || "");
      setEditLicenseFilePath(member.complianceDetails.tspcbCertificatePath || null);
      setEditLicenseExpiry(member.complianceDetails.tspcbExpiredAt ? new Date(member.complianceDetails.tspcbExpiredAt).toISOString().split("T")[0] : "");
    } else if (type === "mdl") {
      setEditLicenseNumber(member.complianceDetails.mdlNumber || "");
      setEditLicenseFilePath(member.complianceDetails.mdlCertificatePath || null);
      setEditLicenseExpiry(member.complianceDetails.mdlExpiredAt ? new Date(member.complianceDetails.mdlExpiredAt).toISOString().split("T")[0] : "");
    } else if (type === "udyam") {
      setEditLicenseNumber(member.complianceDetails.udyamCertificateNumber || "");
      setEditLicenseFilePath(member.complianceDetails.udyamCertificatePath || null);
      setEditLicenseExpiry(member.complianceDetails.udyamCertificateExpiredAt ? new Date(member.complianceDetails.udyamCertificateExpiredAt).toISOString().split("T")[0] : "");
    }
    setEditLicenseFile(null); // Clear file selection for new upload
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Member Details</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder.svg" alt="Member avatar" />
            <AvatarFallback>{member.applicantName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{member.applicantName}</CardTitle>

              {/* Status badge or dropdown based on editing state */}
              {isStatusEditing ? (
                <div className="flex items-center gap-2">
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleStatusSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      member.membershipStatus === "ACTIVE"
                        ? "default"
                        : member.membershipStatus === "INACTIVE"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {member.membershipStatus}
                  </Badge>

                  {/* Only show edit status button for admin role */}
                  {userRole === "admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStatusEditing(true)}
                    >
                      Edit Status
                    </Button>
                  )}
                </div>
              )}
            </div>
            <CardDescription>
              Member since {new Date(member.createdAt).toLocaleDateString()}
              {member.isPaymentDue === "TRUE" && (
                <span className="ml-2 text-destructive font-medium">
                  Payment Due
                </span>
              )}
            </CardDescription>
          </div>

          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </CardHeader>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the member status to {status}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OTP Verification Required</DialogTitle>
            <DialogDescription>
              Please enter the OTP sent to your registered mobile number to
              confirm this status change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otp" className="text-right">
                OTP
              </Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit OTP"
                className="col-span-3"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
              />
            </div>
            {otpError && <p className="text-sm text-red-500">{otpError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOTPDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleVerifyOTP} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : null}
              Verify OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex gap-2 overflow-auto p-1 md:grid md:grid-cols-7">
          <TabsTrigger
            value="overview"
            className=""
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </div>
            
          </TabsTrigger>
          <TabsTrigger
            value="history"
            
          > <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Meter History
            </div>
            
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
           
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </div>
            
          </TabsTrigger>
         
          <TabsTrigger
            value="licenses"
           
          >
            <div className="flex items-center gap-2">
              <License className="h-4 w-4" />
              Licenses
            </div>
            
          </TabsTrigger>
          <TabsTrigger
            value="machineries"
          
          >
            <div className="flex items-center gap-2">
              <Machinery className="h-4 w-4" />
              Machineries
            </div>
            
          </TabsTrigger>
          <TabsTrigger
            value="documents"
           
          >
           <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
           Documents
           </div>
           
          </TabsTrigger>
          <TabsTrigger
            value="labour"
           
          >
           <div className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
           Labours
           </div>
           
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sanctioned HP
                </CardTitle>
                <Machinery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {member.sanctionedHP} HP
                </div>
                <p className="text-xs text-muted-foreground">Main facility</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Branches</CardTitle>
                <License className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {member.branches.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Additional locations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {member.estimatedMaleWorker + member.estimatedFemaleWorker}
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.estimatedMaleWorker} male,{" "}
                  {member.estimatedFemaleWorker} female
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Applicant Name</p>
                      <p className="text-sm text-muted-foreground">
                        {member.applicantName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Relation</p>
                      <p className="text-sm text-muted-foreground">
                        {member.relation} {member.relativeName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gender</p>
                      <p className="text-sm text-muted-foreground">
                        {member.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Membership ID</p>
                      <p className="text-sm text-muted-foreground">
                        {member.membershipId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Electrical USC Number
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.electricalUscNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">SC Number</p>
                      <p className="text-sm text-muted-foreground">
                        {member.scNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Membership Type</p>
                      <p className="text-sm text-muted-foreground">
                        {member.membershipType || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Firm Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Firm Name</p>
                      <p className="text-sm text-muted-foreground">
                        {member.firmName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Proprietor Name</p>
                      <p className="text-sm text-muted-foreground">
                        {member.proprietorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Proprietor Status</p>
                      <p className="text-sm text-muted-foreground">
                        {member.proprietorStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Proprietor Type</p>
                      <p className="text-sm text-muted-foreground">
                        {member.proprietorType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contact 1</p>
                      <p className="text-sm text-muted-foreground">
                        {member.phoneNumber1}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contact 2</p>
                      <p className="text-sm text-muted-foreground">
                        {member.phoneNumber2 || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Survey Number</p>
                      <p className="text-sm text-muted-foreground">
                        {member.surveyNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Village</p>
                      <p className="text-sm text-muted-foreground">
                        {member.village}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Zone</p>
                      <p className="text-sm text-muted-foreground">
                        {member.zone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mandal</p>
                      <p className="text-sm text-muted-foreground">
                        {member.mandal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">District</p>
                      <p className="text-sm text-muted-foreground">
                        {member.district}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">State</p>
                      <p className="text-sm text-muted-foreground">
                        {member.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pin Code</p>
                      <p className="text-sm text-muted-foreground">
                        {member.pinCode}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">GST Number</p>
                      <p className="text-sm text-muted-foreground">
                        {member.complianceDetails.gstInNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Factory License</p>
                      <p className="text-sm text-muted-foreground">
                        {member.complianceDetails.factoryLicenseNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">TSPCB Order</p>
                      <p className="text-sm text-muted-foreground">
                        {member.complianceDetails.tspcbOrderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">MDL Number</p>
                      <p className="text-sm text-muted-foreground">
                        {member.complianceDetails.mdlNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Udyam Certificate</p>
                      <p className="text-sm text-muted-foreground">
                        {member.complianceDetails.udyamCertificateNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="machineries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Machinery Inventory</CardTitle>
                <CardDescription>
                  List of all registered machinery and equipment
                </CardDescription>
              </div>
              <Button>
                <Machinery className="h-4 w-4 mr-2" />
                Add Machinery
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.machineryInformations.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">
                        {machine.machineName}
                      </TableCell>
                      <TableCell>{machine.machineCount}</TableCell>
                      <TableCell>Main Facility</TableCell>
                      <TableCell>
                        <Badge variant="default">Operational</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {member.branches.flatMap((branch) =>
                    branch.machineryInformations.map((machine) => (
                      <TableRow key={`${branch.id}-${machine.id}`}>
                        <TableCell className="font-medium">
                          {machine.machineName}
                        </TableCell>
                        <TableCell>{machine.machineCount}</TableCell>
                        <TableCell>{branch.placeOfBusiness}</TableCell>
                        <TableCell>
                          <Badge variant="default">Operational</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {member.machineryInformations.length === 0 &&
                    member.branches.every(
                      (branch) => branch.machineryInformations.length === 0
                    ) && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No machinery records found
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Licenses & Documents</CardTitle>
                <CardDescription>
                  All uploaded documents and certificates
                </CardDescription>
              </div>
              <Button onClick={openAddDoc}>
                <FileText className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>File Path</TableHead>
                     <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 
                  {/* Additional attachments */}
                  {attachmentsWithExpiry.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell className="font-medium">{attachment.documentName}</TableCell>
                      <TableCell>{attachment.documentPath || "-"}</TableCell>
                      <TableCell>
                        {attachment.expiredAt ? (
                          new Date(attachment.expiredAt) >= new Date(new Date().toDateString()) ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">No Expiry</Badge>
                        )}
                        </TableCell>
                      <TableCell>{attachment.expiredAt ? prettyDate(attachment.expiredAt) : "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDoc(attachment, "additional")}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDoc(attachment)} disabled={docLoading}><Trash2 className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadAttachment(attachment)}><Download className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Add/Edit Document Dialog */}
          <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editDoc ? "Edit Document" : "Add Document"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(docType === "additional" || docType === "") && (
                  <div>
                    <Label>Document Name</Label>
                    <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Enter document name" />
                  </div>
                )}
                <Label>File</Label>
                <FileUpload
                  onFileSelect={setDocFile}
                  onUploadComplete={() => {}}
                  onUploadError={setDocError}
                  subfolder="documents"
                  accept=".pdf,.jpg,.jpeg,.png"
                  existingFilePath={filePathForUpload ?? undefined}
                  onDownload={filePath => handleDownloadDocument(filePath)}
                  onRemoveFile={() => setFilePathForUpload(null)}
                />
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDocDialog} disabled={docLoading}>Cancel</Button>
                <Button onClick={handleDocSubmit} disabled={docLoading}>{editDoc ? "Save Changes" : "Add Document"}</Button>
                {docError && <div className="text-red-500 text-sm mt-2">{docError}</div>}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Other tabs content remains the same */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>USC Meter History</CardTitle>
                  <CardDescription>
                    Full assignment history for meter: <span className="font-mono text-primary">{member.electricalUscNumber || "-"}</span>
                  </CardDescription>
                </div>
                <Button 
                  onClick={fetchUSCMeterHistory} 
                  disabled={isLoadingMeterHistory}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingMeterHistory ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {meterHistoryError ? (
                <div className="text-center py-8">
                  <div className="text-destructive mb-2">{meterHistoryError}</div>
                  <Button onClick={fetchUSCMeterHistory} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              ) : isLoadingMeterHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading USC meter history...</p>
                </div>
              ) : !member.electricalUscNumber ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Meter History</h3>
                  <p className="text-muted-foreground">
                    This member does not have an assigned USC meter number.
                  </p>
                </div>
              ) : (() => {
                const meterHistory = uscMeterHistory.filter(entry => entry.electricalUscNumber === member.electricalUscNumber);
                if (meterHistory.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No History Found</h3>
                      <p className="text-muted-foreground">
                        No assignment history found for this meter.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membership ID</TableHead>
                          <TableHead>Branch ID</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead>Unassigned Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meterHistory.map((entry) => (
                          <TableRow key={entry.id} className={entry.membershipId === member.membershipId ? "bg-primary/10" : ""}>
                            <TableCell className="font-medium">{entry.membershipId}</TableCell>
                            <TableCell>{entry.branchId ? `Branch ${entry.branchId}` : "Main"}</TableCell>
                            <TableCell>{new Date(entry.assignedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                            <TableCell>{entry.unassignedAt ? new Date(entry.unassignedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                            <TableCell>
                              <Badge variant={entry.unassignedAt ? "secondary" : "default"} className={entry.unassignedAt ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"}>
                                {entry.unassignedAt ? "Unassigned" : "Active"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                A list of all transactions made by the member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>No transaction records available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

       

        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Licenses & Certificates</CardTitle>
                  <CardDescription>View and manage member licenses</CardDescription>
                </div>
                <Button onClick={openAddLicenseDialog} disabled={getAvailableLicenseTypes().length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add License
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>File Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      type: "gst",
                      label: "GST Certificate",
                      number: member.complianceDetails.gstInNumber,
                      path: member.complianceDetails.gstInCertificatePath,
                      expiredAt: member.complianceDetails.gstExpiredAt,
                    },
                    {
                      type: "factory",
                      label: "Factory License",
                      number: member.complianceDetails.factoryLicenseNumber,
                      path: member.complianceDetails.factoryLicensePath,
                      expiredAt: member.complianceDetails.factoryLicenseExpiredAt,
                    },
                    {
                      type: "tspcb",
                      label: "TSPCB Certificate",
                      number: member.complianceDetails.tspcbOrderNumber,
                      path: member.complianceDetails.tspcbCertificatePath,
                      expiredAt: member.complianceDetails.tspcbExpiredAt,
                    },
                    {
                      type: "mdl",
                      label: "MDL Certificate",
                      number: member.complianceDetails.mdlNumber,
                      path: member.complianceDetails.mdlCertificatePath,
                      expiredAt: member.complianceDetails.mdlExpiredAt,
                    },
                    {
                      type: "udyam",
                      label: "Udyam Certificate",
                      number: member.complianceDetails.udyamCertificateNumber,
                      path: member.complianceDetails.udyamCertificatePath,
                      expiredAt: member.complianceDetails.udyamCertificateExpiredAt,
                    },
                  ].filter(doc => doc.number || doc.path).map((doc) => (
                    <TableRow key={doc.type}>
                      <TableCell className="font-medium">{doc.label}</TableCell>
                      <TableCell>{doc.number || "-"}</TableCell>
                      <TableCell>{doc.path || "-"}</TableCell>
                      <TableCell>
                        {doc.expiredAt ? (
                          new Date(doc.expiredAt) >= new Date(new Date().toDateString()) ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">No Expiry</Badge>
                        )}
                      </TableCell>
                      <TableCell>{doc.expiredAt ? prettyDate(doc.expiredAt) : "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditLicenseDialog(doc.type)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteLicense(doc.type)} disabled={docLoading}><Trash2 className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(doc.path)}><Download className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {[
                {
                  type: "gst",
                  label: "GST Certificate",
                  number: member.complianceDetails.gstInNumber,
                  path: member.complianceDetails.gstInCertificatePath,
                },
                {
                  type: "factory",
                  label: "Factory License",
                  number: member.complianceDetails.factoryLicenseNumber,
                  path: member.complianceDetails.factoryLicensePath,
                },
                {
                  type: "tspcb",
                  label: "TSPCB Certificate",
                  number: member.complianceDetails.tspcbOrderNumber,
                  path: member.complianceDetails.tspcbCertificatePath,
                },
                {
                  type: "mdl",
                  label: "MDL Certificate",
                  number: member.complianceDetails.mdlNumber,
                  path: member.complianceDetails.mdlCertificatePath,
                },
                {
                  type: "udyam",
                  label: "Udyam Certificate",
                  number: member.complianceDetails.udyamCertificateNumber,
                  path: member.complianceDetails.udyamCertificatePath,
                },
              ].filter(doc => !doc.number && !doc.path).length === 5 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No licenses or certificates found.</p>
                  <p className="text-sm">Click "Add License" to add a new certificate.</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Edit License Dialog */}
          <Dialog open={!!editLicenseType} onOpenChange={val => { if (!val) setEditLicenseType(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit License</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Label>Number</Label>
                <Input value={editLicenseNumber} onChange={e => setEditLicenseNumber(e.target.value)} />
                <Label>File</Label>
                <FileUpload
                  onFileSelect={setEditLicenseFile}
                  onUploadComplete={() => {}}
                  onUploadError={setEditLicenseDocError}
                  subfolder="documents"
                  accept=".pdf,.jpg,.jpeg,.png"
                  existingFilePath={editLicenseFilePath ?? undefined}
                  onDownload={filePath => handleDownloadDocument(filePath)}
                  onRemoveFile={() => setEditLicenseFilePath(null)}
                />
                <Label>Expiry Date</Label>
                <Input type="date" value={editLicenseExpiry} onChange={e => setEditLicenseExpiry(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditLicenseType(null)} disabled={docLoading}>Cancel</Button>
                <Button onClick={handleEditLicenseSubmit} disabled={docLoading}>Save Changes</Button>
                {editLicenseDocError && <div className="text-red-500 text-sm mt-2">{editLicenseDocError}</div>}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add License Dialog */}
          <Dialog open={showAddLicenseDialog} onOpenChange={val => { if (!val) setShowAddLicenseDialog(false); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New License</DialogTitle>
                <DialogDescription>Select a license type to add</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>License Type</Label>
                  <Select value={addLicenseType} onValueChange={setAddLicenseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLicenseTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {addLicenseType && (
                  <>
                    <div>
                      <Label>Number</Label>
                      <Input 
                        value={addLicenseNumber} 
                        onChange={e => {
                          setAddLicenseNumber(e.target.value);
                          // Clear validation messages when user starts typing
                          setAddLicenseValidationError("");
                          setAddLicenseValidationSuccess("");
                          
                          // Validate after 3 characters
                          if (e.target.value.length >= 3) {
                            setTimeout(() => {
                              validateSingleLicenseField(addLicenseType, e.target.value);
                            }, 500);
                          }
                        }} 
                        placeholder="Enter license number"
                      />
                      {isValidatingLicense && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Validating...
                        </div>
                      )}
                      {addLicenseValidationError && (
                        <div className="text-sm text-red-500 mt-1">
                          {addLicenseValidationError}
                        </div>
                      )}
                      {addLicenseValidationSuccess && (
                        <div className="text-sm text-green-500 mt-1">
                          {addLicenseValidationSuccess}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>File</Label>
                      <FileUpload
                        onFileSelect={setAddLicenseFile}
                        onUploadComplete={(filePath) => setAddLicenseFilePath(filePath)}
                        onUploadError={setDocError}
                        subfolder="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onDownload={filePath => handleDownloadDocument(filePath)}
                      />
                    </div>
                    
                    <div>
                      <Label>Expiry Date</Label>
                      <Input 
                        type="date" 
                        value={addLicenseExpiry} 
                        onChange={e => setAddLicenseExpiry(e.target.value)} 
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddLicenseDialog(false)} disabled={docLoading}>Cancel</Button>
                <Button 
                  onClick={handleAddLicenseSubmit} 
                  disabled={docLoading || !addLicenseType || !!addLicenseValidationError || isValidatingLicense}
                >
                  Add License
                </Button>
                {docError && <div className="text-red-500 text-sm mt-2">{docError}</div>}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
