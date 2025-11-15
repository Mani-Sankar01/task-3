"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  Edit,
  ArrowLeft,
  Save,
  CalendarDays,
  Loader2,
  Calendar,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  CopyrightIcon as License,
  WashingMachineIcon as Machinery,
  Download,
  Edit2,
  User2,
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MoreHorizontal,
  Trash2,
  PencilIcon,
  EyeIcon,
  EyeOff,
  Key,
  Eye,
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMember, type Member, Attachment, type MachineryInformation } from "@/services/api";
import { useForm } from "react-hook-form";
import { uploadFile, downloadFile } from "@/lib/client-file-upload";
import { getAuthToken } from "@/services/api";
import axios from "axios";
import { useSession } from "next-auth/react";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderRoleBasedPath } from "@/lib/utils";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Member Labours Table Component for Labour Tab
function MemberLaboursTable({ memberId }: { memberId: string }) {
  const [labours, setLabours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [labourToDelete, setLabourToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLabours = async () => {
      if (status === "authenticated" && session?.user?.token) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/labour/get_all_labours`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          const memberLabours = response.data.filter((labour: any) =>
            labour.assignedTo === memberId
          );
          setLabours(memberLabours);
        } catch (err) {
          console.error("Error fetching member labours:", err);
          setLabours([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchLabours();
  }, [memberId, status, session?.user?.token]);

  const getStatusBadge = (status: string) => {
    const statusMap: {
      [key: string]: {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      };
    } = {
      ACTIVE: { label: "Active", variant: "default" },
      INACTIVE: { label: "Inactive", variant: "secondary" },
      SUSPENDED: { label: "Suspended", variant: "destructive" },
      TERMINATED: { label: "Terminated", variant: "destructive" },
    };
    const statusInfo =
      statusMap[status] || { label: status || "Unknown", variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const viewLabourDetails = (labourId: string) => {
    const basePath = renderRoleBasedPath(session?.user?.role || "");
    router.push(`/${basePath}/labour/${labourId}`);
  };

  const editLabour = (labourId: string) => {
    const basePath = renderRoleBasedPath(session?.user?.role || "");
    router.push(`/${basePath}/labour/${labourId}/edit`);
  };

  const handleDeleteLabour = async (labourId: string) => {
    if (!session?.user.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(labourId);
    try {
      const response = await axios.delete(
        `${process.env.BACKEND_API_URL || "https://tsmwa.online"
        }/api/labour/delete_labour/${labourId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast({
          title: "Success",
          description: "Labour deleted successfully.",
        });
        const updatedResponse = await axios.get(
          `${process.env.BACKEND_API_URL || "https://tsmwa.online"
          }/api/labour/get_all_labours`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );
        const memberLabours = updatedResponse.data.filter((labour: any) =>
          labour.assignedTo === memberId
        );
        setLabours(memberLabours);
      }
    } catch (err: any) {
      console.error("Error deleting labour:", err);
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to delete labour.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const openDeleteDialog = (labourId: string, labourName: string) => {
    setLabourToDelete({ id: labourId, name: labourName });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setLabourToDelete(null);
  };

  const confirmDelete = async () => {
    if (labourToDelete) {
      await handleDeleteLabour(labourToDelete.id);
      closeDeleteDialog();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading labours...</p>
      </div>
    );
  }

  if (labours.length === 0) {
    return (
      <div className="text-center py-8">
        <User2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Labours Found</h3>
        <p className="text-muted-foreground">
          This member doesn't have any labour records yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labours</CardTitle>
            <User2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labours.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labours</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labours.filter((labour) => labour.labourStatus === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Labours</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labours.filter((labour) => labour.labourStatus !== "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Labour ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Aadhar Number</TableHead>
            <TableHead>Status</TableHead>
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "TQMA_EDITOR" ||
              session?.user?.role === "TSMWA_EDITOR") &&
              <TableHead>Actions</TableHead>
            }
          </TableRow>
        </TableHeader>
        <TableBody>
          {labours.map((labour) => (
            <TableRow key={labour.labourId}>
              <TableCell className="font-medium">{labour.labourId}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={labour.photoPath || ""} alt={labour.fullName} />
                    <AvatarFallback>
                      {labour.fullName?.charAt(0) || "L"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{labour.fullName}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{labour.phoneNumber || "-"}</span>
                </div>
              </TableCell>
              <TableCell>{labour.aadharNumber || "-"}</TableCell>
              <TableCell>{getStatusBadge(labour.labourStatus)}</TableCell>
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "TQMA_EDITOR" ||
                session?.user?.role === "TSMWA_EDITOR") &&
                <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => viewLabourDetails(labour.labourId)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editLabour(labour.labourId)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(labour.labourId, labour.fullName)}
                      disabled={isDeleting === labour.labourId}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              }
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Labour</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {labourToDelete?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting !== null}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Membership Fees Table Component for Transactions Tab
function MembershipFeesTable({ memberId }: { memberId: string }) {
  const [fees, setFees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchFees = async () => {
      if (status === "authenticated" && session?.user?.token) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/bill/filterBills/null/null/null`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          // Filter fees for this specific member
          const memberFees = response.data.filter((fee: any) => fee.membershipId === memberId);
          setFees(memberFees);
        } catch (err) {
          console.error("Error fetching membership fees:", err);
          setFees([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchFees();
  }, [memberId, status, session?.user?.token]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "partial":
        return <Badge className="bg-orange-100 text-orange-800">Partial</Badge>;
      case "due":
        return <Badge className="bg-yellow-100 text-yellow-800">Due</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // Navigate to fee details
  const viewFeeDetails = (feeId: string) => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/membership-fees/${feeId}`
    );
  };

  // Navigate to edit fee
  const editFee = (feeId: string) => {
    router.push(
      `/${renderRoleBasedPath(
        session?.user?.role
      )}/membership-fees/${feeId}/edit`
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  if (fees.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No membership fee transactions found for this member</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{fees.reduce((sum, fee) => sum + (parseFloat(fee.totalAmount) || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{fees.reduce((sum, fee) => sum + (parseFloat(fee.paidAmount) || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{fees.reduce((sum, fee) => sum + ((parseFloat(fee.totalAmount) || 0) - (parseFloat(fee.paidAmount) || 0)), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid Amount</TableHead>
            <TableHead>Status</TableHead>
            {(session?.user?.role === "ADMIN" ||
              session?.user?.role === "TQMA_EDITOR" ||
              session?.user?.role === "TSMWA_EDITOR") &&
              <TableHead>Actions</TableHead>
            }
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <TableRow key={fee.billingId}>
              <TableCell className="font-medium">{fee.billingId}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {fee.fromDate
                      ? new Date(fee.fromDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                      : "-"}{" "}
                    -{" "}
                    {fee.toDate
                      ? new Date(fee.toDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                      : "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  ₹{fee.totalAmount
                    ? parseFloat(fee.totalAmount).toLocaleString()
                    : "-"}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  ₹{fee.paidAmount
                    ? parseFloat(fee.paidAmount).toLocaleString()
                    : "-"}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(fee.paymentStatus)}</TableCell>
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "TQMA_EDITOR" ||
                session?.user?.role === "TSMWA_EDITOR") &&
                <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        viewFeeDetails(fee.billingId);
                      }}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {(session?.user?.role === "ADMIN" ||
                      session?.user?.role === "TSMWA_EDITOR" ||
                      session?.user?.role === "TQMA_EDITOR") && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            editFee(fee.billingId);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit Fee
                        </DropdownMenuItem>
                      )}
                    {session?.user?.role === "ADMIN" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                </TableCell>
              }
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
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
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/memberships/${member.membershipId}/edit`);
  };

  const handleBack = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/memberships`);
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
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
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
  const [showMachineryDialog, setShowMachineryDialog] = useState(false);
  const [machineryDialogMode, setMachineryDialogMode] = useState<"add" | "edit">("add");
  const [machineryForm, setMachineryForm] = useState<{
    branchId: string;
    machineType: string;
    customMachineName: string;
    quantity: string;
    machineId: number | null;
  }>({
    branchId: "",
    machineType: "",
    customMachineName: "",
    quantity: "1",
    machineId: null,
  });
  const [machineryError, setMachineryError] = useState<string | null>(null);
  const [isSavingMachinery, setIsSavingMachinery] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<{
    branchId: string;
    machine: MachineryInformation;
  } | null>(null);
  const [showDeleteMachineDialog, setShowDeleteMachineDialog] = useState(false);
  const [isDeletingMachine, setIsDeletingMachine] = useState(false);
  const [showDeleteDocDialog, setShowDeleteDocDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Attachment | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [showDeleteLicenseDialog, setShowDeleteLicenseDialog] = useState(false);
  const [licenseTypeToDelete, setLicenseTypeToDelete] = useState<string | null>(null);
  const [isDeletingLicense, setIsDeletingLicense] = useState(false);

  const { data: session } = useSession();
  const { toast } = useToast();

  const toBranchIdString = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

  const findBranchById = (branchId: string) =>
    member.branches.find(
      (branch) => toBranchIdString(branch.id) === branchId
    );

  const buildBranchPayloadBase = (branch: Member["branches"][number]) => ({
    id: branch.id,
  });

  const determineMachineType = (machine: MachineryInformation): string => {
    const rawIsOther = (machine as any).isOther;
    const isOther =
      rawIsOther === "TRUE" || rawIsOther === "true" || rawIsOther === true;
    if (isOther) return "Others";
    const name = machine.machineName || (machine as any).customName || "";
    if (MACHINE_OPTIONS.includes(name)) return name;
    return "Others";
  };

  const getMachineDisplayName = (machine: MachineryInformation) => {
    if (!machine) return "-";
    if (
      (machine as any).isOther === "TRUE" ||
      (machine as any).isOther === "true" ||
      (machine as any).isOther === true
    ) {
      return machine.machineName || (machine as any).customName || "Custom";
    }
    return machine.machineName || (machine as any).customName || "-";
  };

  const openAddMachineryDialog = (preselectedBranchId?: string) => {
    if (!member.branches.length) {
      toast({
        title: "Add Branch First",
        description: "Please add a branch before managing machinery.",
        variant: "destructive",
      });
      return;
    }

    const defaultBranch =
      preselectedBranchId !== undefined
        ? findBranchById(preselectedBranchId)
        : member.branches[0];

    setMachineryDialogMode("add");
    setMachineryForm({
      branchId: toBranchIdString(defaultBranch?.id ?? ""),
      machineType: "",
      customMachineName: "",
      quantity: "1",
      machineId: null,
    });
    setMachineryError(null);
    setShowMachineryDialog(true);
  };

  const openEditMachineryDialog = (
    branchId: string,
    machine: MachineryInformation
  ) => {
    const machineType = determineMachineType(machine);
    const customName =
      machineType === "Others"
        ? machine.machineName || (machine as any).customName || ""
        : "";

    setMachineryDialogMode("edit");
    setMachineryForm({
      branchId,
      machineType,
      customMachineName: customName,
      quantity: machine.machineCount?.toString() || "1",
      machineId: machine.id ?? null,
    });
    setMachineryError(null);
    setShowMachineryDialog(true);
  };

  const handleSaveMachinery = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage machinery.",
        variant: "destructive",
      });
      return;
    }

    const branch = findBranchById(machineryForm.branchId);
    if (!branch) {
      setMachineryError("Please select a branch.");
      return;
    }

    if (!machineryForm.machineType) {
      setMachineryError("Please select a machine type.");
      return;
    }

    const isOther = machineryForm.machineType === "Others";
    const machineName = isOther
      ? machineryForm.customMachineName.trim()
      : machineryForm.machineType;

    if (!machineName) {
      setMachineryError("Please provide a machine name.");
      return;
    }

    const quantityNumber = parseInt(machineryForm.quantity, 10);
    if (!quantityNumber || quantityNumber <= 0) {
      setMachineryError("Please enter a valid machine count.");
      return;
    }

    if (
      machineryDialogMode === "edit" &&
      (machineryForm.machineId === null || machineryForm.machineId === undefined)
    ) {
      setMachineryError("Invalid machinery record selected for editing.");
      return;
    }

    const branchPayload: any = buildBranchPayloadBase(branch);

    const machinePayload = {
      machineName,
      isOther: isOther ? "TRUE" : "FALSE",
      machineCount: quantityNumber,
    };

    if (machineryDialogMode === "add") {
      branchPayload.newMachineryInformations = [machinePayload];
    } else {
      branchPayload.updateMachineryInformations = [
        {
          id: machineryForm.machineId,
          ...machinePayload,
        },
      ];
    }

    const payload: any = {
      membershipId: member.membershipId,
      branchDetails: {
        updateBranchSchema: [branchPayload],
      },
    };

    setIsSavingMachinery(true);
    setMachineryError(null);
    try {
      await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Payload:", JSON.stringify(payload));

      toast({
        title:
          machineryDialogMode === "add"
            ? "Machinery Added"
            : "Machinery Updated",
        description:
          machineryDialogMode === "add"
            ? "New machinery has been added successfully."
            : "Machinery details updated successfully.",
      });

      setShowMachineryDialog(false);
      await refetchMember();
    } catch (error: any) {
      console.error("Error saving machinery:", error);
      setMachineryError(
        error?.response?.data?.message ||
        "Failed to save machinery. Please try again."
      );
    } finally {
      setIsSavingMachinery(false);
    }
  };

  const openDeleteMachineryDialog = (
    branchId: string,
    machine: MachineryInformation
  ) => {
    setMachineToDelete({ branchId, machine });
    setShowDeleteMachineDialog(true);
  };

  const handleConfirmDeleteMachinery = async () => {
    if (!machineToDelete) return;
    if (!session?.user?.token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage machinery.",
        variant: "destructive",
      });
      return;
    }

    const branch = findBranchById(machineToDelete.branchId);
    if (!branch) {
      toast({
        title: "Branch Not Found",
        description: "Unable to determine branch details for this machine.",
        variant: "destructive",
      });
      return;
    }

    if (!machineToDelete.machine.id) {
      toast({
        title: "Invalid Machine",
        description: "Selected machine has no identifier attached.",
        variant: "destructive",
      });
      return;
    }

    const branchPayload: any = {
      ...buildBranchPayloadBase(branch),
      deleteMachineryInformations: [
        {
          id: machineToDelete.machine.id,
        },
      ],
    };

    const payload: any = {
      membershipId: member.membershipId,
      branchDetails: {
        updateBranchSchema: [branchPayload],
      },
    };

    setIsDeletingMachine(true);
    try {
      await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/update_member`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Machinery Deleted",
        description: "Selected machinery has been removed.",
      });

      setShowDeleteMachineDialog(false);
      setMachineToDelete(null);
      await refetchMember();
    } catch (error: any) {
      console.error("Error deleting machinery:", error);
      toast({
        title: "Delete Failed",
        description:
          error?.response?.data?.message ||
          "Failed to delete machinery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMachine(false);
    }
  };

  const branchMachinerySections = member.branches.map((branch) => ({
    branch,
    branchId: toBranchIdString(branch.id),
    machines: branch.machineryInformations || [],
  }));

  const selectedBranchForDialog = findBranchById(machineryForm.branchId);

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
      toast({
        title: "Error",
        description: err.message || "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setDocLoading(false);
    }
  };

  // Delete Document
  const openDeleteDocDialog = (doc: Attachment) => {
    setDocToDelete(doc);
    setShowDeleteDocDialog(true);
  };

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;

    if (!session?.user.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      setShowDeleteDocDialog(false);
      setDocToDelete(null);
      return;
    }

    setIsDeletingDoc(true);
    setDocError("");
    try {
      const payload = {
        membershipId: member.membershipId,
        attachments: { deleteAttachments: [{ id: docToDelete.id }] },
      };
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
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to delete document");
      await refetchMember();
      toast({ title: "Success", description: "The document was successfully deleted.", variant: "default" });
      setShowDeleteDocDialog(false);
      setDocToDelete(null);
    } catch (err: any) {
      setDocError(err.message || "Failed to delete document");
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setIsDeletingDoc(false);
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

  const formatBoolean = (value?: string | boolean | null) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const normalized = value.toString().trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return "Yes";
    if (["false", "no", "n", "0"].includes(normalized)) return "No";
    return value;
  };

  const totalWorkers =
    (Number(member.estimatedMaleWorker) || 0) +
    (Number(member.estimatedFemaleWorker) || 0);
  const primaryEmail =
    member.complianceDetails?.emailId ||
    member.partnerDetails?.find((partner) => partner.emailId)?.emailId ||
    "-";
  const branchSummary = member.branches.length
    ? member.branches
      .map(
        (branch) =>
          `${branch.placeOfBusiness || "Branch"}${branch.electricalUscNumber
            ? ` (${branch.electricalUscNumber})`
            : ""
          }`
      )
      .join(", ")
    : "No additional branches";
  const partnerSummary = member.partnerDetails?.length
    ? `${member.partnerDetails.length} partner(s)`
    : "No partners added";
  const documentsSummary = member.attachments?.length
    ? `${member.attachments.length} additional document(s)`
    : "No additional documents uploaded";
  const branchMachineryCount = member.branches.reduce(
    (count, branch) => count + (branch.machineryInformations?.length || 0),
    0
  );
  const totalMachinery =
    (member.machineryInformations?.length || 0) + branchMachineryCount;
  const similarInquiry = member.similarMembershipInquiry;
  const similarOrgDetails =
    (similarInquiry as any)?.org_details ??
    (similarInquiry as any)?.orgDetails ??
    "-";
  const similarPreviousDetails =
    (similarInquiry as any)?.previous_application_details ??
    (similarInquiry as any)?.previousApplicationDetails ??
    "-";
  const MACHINE_OPTIONS = ["High Polish", "Slice", "Cutting", "Others"];

  useEffect(() => {
    if (!session?.user?.token) return;

    const primaryId = member.proposer?.proposerID || null;
    const executiveId = member.executiveProposer?.proposerID || null;

    if (!primaryId && !executiveId) {
      setPrimaryProposerMember(null);
      setExecutiveProposerMember(null);
      return;
    }

    let cancelled = false;
    const loadProposers = async () => {
      setIsLoadingProposers(true);
      setProposerError(null);
      try {
        const uniqueIds = Array.from(
          new Set([primaryId, executiveId].filter(Boolean) as string[])
        );
        const cache: Record<string, Member | null> = {};

        for (const id of uniqueIds) {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL}/api/member/get_member/${id}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          cache[id] = response.data || null;
        }

        if (cancelled) return;

        setPrimaryProposerMember(primaryId ? cache[primaryId] || null : null);
        setExecutiveProposerMember(
          executiveId ? cache[executiveId] || null : null
        );
      } catch (error: any) {
        if (cancelled) return;
        console.error("Failed to fetch proposer details:", error);
        setProposerError(
          error?.response?.data?.message ||
          "Unable to fetch proposer details right now."
        );
        setPrimaryProposerMember(null);
        setExecutiveProposerMember(null);
      } finally {
        if (!cancelled) {
          setIsLoadingProposers(false);
        }
      }
    };

    loadProposers();

    return () => {
      cancelled = true;
    };
  }, [
    session?.user?.token,
    member.proposer?.proposerID,
    member.executiveProposer?.proposerID,
  ]);

  const displayValue = (value: ReactNode) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : "-";
    }
    if (Array.isArray(value) && value.length === 0) return "-";
    return value;
  };

  const SummaryCard = ({
    title,
    value,
    subtitle,
    icon,
  }: {
    title: string;
    value: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue(value)}</div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground break-words">{displayValue(subtitle)}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground break-words">
        {displayValue(value)}
      </span>
    </div>
  );

  const DetailSection = ({
    title,
    items,
    columns = 2,
  }: {
    title: string;
    items: Array<{ label: string; value: ReactNode }>;
    columns?: number;
  }) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-primary">{title}</h4>
      <div className={`grid gap-4 ${columns === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {items.map((item) => (
          <DetailItem key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );

  const renderProposerCard = (
    title: string,
    membershipId?: string | null,
    memberData?: Member | null
  ) => {
    return (
      <div className="rounded-md border bg-muted/40 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {title}
        </p>
        <div className="py-3 grid grid-cols-5 gap-3">
          <DetailItem label="Membership ID" value={membershipId || "-"} />
          <DetailItem
            label="Applicant Name"
            value={memberData?.applicantName || "-"}
          />
          <DetailItem label="Firm Name" value={memberData?.firmName || "-"} />
          <DetailItem
            label="Phone"
            value={memberData?.phoneNumber1 || memberData?.phoneNumber2 || "-"}
          />
          <DetailItem
            label="Email"
            value={
              memberData?.complianceDetails?.emailId ||
              memberData?.partnerDetails?.[0]?.emailId ||
              "-"
            }
          />
        </div>
      </div>
    );
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
  const [showGSTCredentialsDialog, setShowGSTCredentialsDialog] = useState(false);
  const memberCompliance = member.complianceDetails as typeof member.complianceDetails & {
    gstInUsername?: string;
    gstInPassword?: string;
  };
  const [gstUsername, setGstUsername] = useState(
    memberCompliance?.gstInUsername || ""
  );
  const [gstPassword, setGstPassword] = useState(
    memberCompliance?.gstInPassword || ""
  );
  const [isSavingGstCredentials, setIsSavingGstCredentials] = useState(false);
  const [gstCredentialsError, setGstCredentialsError] = useState("");
  const [showGstPassword, setShowGstPassword] = useState(false);
  const [primaryProposerMember, setPrimaryProposerMember] = useState<Member | null>(
    null
  );
  const [executiveProposerMember, setExecutiveProposerMember] =
    useState<Member | null>(null);
  const [isLoadingProposers, setIsLoadingProposers] = useState(false);
  const [proposerError, setProposerError] = useState<string | null>(null);

  useEffect(() => {
    setGstUsername(memberCompliance?.gstInUsername || "");
    setGstPassword(memberCompliance?.gstInPassword || "");
  }, [memberCompliance?.gstInUsername, memberCompliance?.gstInPassword]);

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
        payload.complianceDetails = {};
        if (editLicenseType === "gst") {
          if (filePath) payload.complianceDetails.gstInCertificatePath = filePath;
          if (editLicenseExpiry)
            payload.complianceDetails.gstExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber)
            payload.complianceDetails.gstInNumber = editLicenseNumber;
        } else if (editLicenseType === "factory") {
          if (filePath) payload.complianceDetails.factoryLicensePath = filePath;
          if (editLicenseExpiry)
            payload.complianceDetails.factoryLicenseExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber)
            payload.complianceDetails.factoryLicenseNumber = editLicenseNumber;
        } else if (editLicenseType === "tspcb") {
          if (filePath) payload.complianceDetails.tspcbCertificatePath = filePath;
          if (editLicenseExpiry)
            payload.complianceDetails.tspcbExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber)
            payload.complianceDetails.tspcbOrderNumber = editLicenseNumber;
        } else if (editLicenseType === "mdl") {
          if (filePath) payload.complianceDetails.mdlCertificatePath = filePath;
          if (editLicenseExpiry)
            payload.complianceDetails.mdlExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber)
            payload.complianceDetails.mdlNumber = editLicenseNumber;
        } else if (editLicenseType === "udyam") {
          if (filePath) payload.complianceDetails.udyamCertificatePath = filePath;
          if (editLicenseExpiry)
            payload.complianceDetails.udyamCertificateExpiredAt = new Date(editLicenseExpiry).toISOString();
          if (editLicenseNumber)
            payload.complianceDetails.udyamCertificateNumber = editLicenseNumber;
        }
      }
      if (!session?.user.token) throw new Error("No auth token");
      console.log("Update payload:", JSON.stringify(payload));
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
      toast({
        title: "Error",
        description: err.message || "Failed to update license",
        variant: "destructive",
      });
    } finally {
      setDocLoading(false);
    }
  };

  const handleSaveGstCredentials = async () => {
    if (!session?.user?.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingGstCredentials(true);
    setGstCredentialsError("");

    try {
      const payload: any = {
        membershipId: member.membershipId,
        complianceDetails: {
          gstInUsername: gstUsername.trim(),
          gstInPassword: gstPassword,
        },
      };

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

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to update GST credentials");
      }

      toast({
        title: "GST Credentials Updated",
        description: "GST username and password saved successfully.",
      });
      setShowGSTCredentialsDialog(false);
      setShowGstPassword(false);
      await refetchMember();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update GST credentials. Please try again.";
      setGstCredentialsError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingGstCredentials(false);
    }
  };

  const openDeleteLicenseDialog = (type: string) => {
    setLicenseTypeToDelete(type);
    setShowDeleteLicenseDialog(true);
  };

  const confirmDeleteLicense = async () => {
    if (!licenseTypeToDelete || !session?.user.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      setShowDeleteLicenseDialog(false);
      setLicenseTypeToDelete(null);
      return;
    }

    setIsDeletingLicense(true);
    setDocError("");
    try {
      let payload: any = { membershipId: member.membershipId };

      // Create complianceDetails object with only the fields being deleted
      payload.complianceDetails = {};

      if (licenseTypeToDelete === "gst") {
        payload.complianceDetails.gstInNumber = "";
        payload.complianceDetails.gstInCertificatePath = "";
        payload.complianceDetails.gstExpiredAt = null;
      } else if (licenseTypeToDelete === "factory") {
        payload.complianceDetails.factoryLicenseNumber = "";
        payload.complianceDetails.factoryLicensePath = "";
        payload.complianceDetails.factoryLicenseExpiredAt = null;
      } else if (licenseTypeToDelete === "tspcb") {
        payload.complianceDetails.tspcbOrderNumber = "";
        payload.complianceDetails.tspcbCertificatePath = "";
        payload.complianceDetails.tspcbExpiredAt = null;
      } else if (licenseTypeToDelete === "mdl") {
        payload.complianceDetails.mdlNumber = "";
        payload.complianceDetails.mdlCertificatePath = "";
        payload.complianceDetails.mdlExpiredAt = null;
      } else if (licenseTypeToDelete === "udyam") {
        payload.complianceDetails.udyamCertificateNumber = "";
        payload.complianceDetails.udyamCertificatePath = "";
        payload.complianceDetails.udyamCertificateExpiredAt = null;
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
      if (response.status !== 200 && response.status !== 201) throw new Error("Failed to delete license");
      setEditLicenseType(null);
      toast({ title: "Success", description: "The license was successfully deleted.", variant: "default" });
      await refetchMember();
      setShowDeleteLicenseDialog(false);
      setLicenseTypeToDelete(null);
    } catch (err: any) {
      setDocError(err.message || "Failed to delete license");
      toast({
        title: "Error",
        description: err.message || "Failed to delete license",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLicense(false);
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
        filePath = upload.filePath || "";
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
      toast({
        title: "Error",
        description: err.message || "Failed to add license",
        variant: "destructive",
      });
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
    <div className=" p-6">
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

          {(session?.user?.role === "ADMIN" ||
            session?.user?.role === "TQMA_EDITOR" ||
            session?.user?.role === "TSMWA_EDITOR") &&
            <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          }
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SummaryCard
              title="Sanctioned HP"
              icon={<Machinery className="h-4 w-4 text-muted-foreground" />}
              value={`${member.sanctionedHP} HP`}
              subtitle="Main facility power"
            />
            <SummaryCard
              title="Branches"
              icon={<License className="h-4 w-4 text-muted-foreground" />}
              value={member.branches.length}
              subtitle={branchSummary}
            />
            <SummaryCard
              title="Workforce"
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              value={totalWorkers}
              subtitle={`${member.estimatedMaleWorker} male • ${member.estimatedFemaleWorker} female`}
            />

            <SummaryCard
              title="Primary Contact"
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
              value={member.phoneNumber1 || "-"}
              subtitle={member.phoneNumber2 ? `Alt: ${member.phoneNumber2}` : undefined}
            />
            <SummaryCard
              title="Email"
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
              value={primaryEmail}
              subtitle={partnerSummary}
            />
            <SummaryCard
              title="Member Since"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              value={new Date(member.createdAt).toLocaleDateString()}
              subtitle={`Last updated ${new Date(member.modifiedAt).toLocaleDateString()}`}
            />
            <SummaryCard
              title="Additional Documents"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              value={member.attachments?.length || 0}
              subtitle={documentsSummary}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Complete member and firm information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <DetailSection
                title="Application Information"
                items={[
                  { label: "Membership ID", value: member.membershipId },
                  { label: "Membership Type", value: member.membershipType || "-" },
                  { label: "Applicant Name", value: member.applicantName },
                  { label: "Gender", value: member.gender },
                  {
                    label: "Relation",
                    value: member.relation || "-",
                  },
                  {
                    label: "Relative Name",
                    value: member.relativeName || "-",
                  },
                  { label: "Membership Status", value: member.membershipStatus },
                  { label: "Approval Status", value: member.approvalStatus },
                  {
                    label: "Payment Due",
                    value: formatBoolean(member.isPaymentDue),
                  },
                  {
                    label: "Next Due Date",
                    value: member.nextDueDate ? prettyDate(member.nextDueDate) : "-",
                  },
                  {
                    label: "Created At",
                    value: new Date(member.createdAt).toLocaleDateString(),
                  },
                  {
                    label: "Last Updated",
                    value: new Date(member.modifiedAt).toLocaleDateString(),
                  },
                ]}
              />
              <DetailSection
                title="Contact & Firm Details"
                items={[
                  { label: "Firm Name", value: member.firmName },
                  { label: "Proprietor Name", value: member.proprietorName },
                  { label: "Proprietor Status", value: member.proprietorStatus },
                  { label: "Proprietor Type", value: member.proprietorType },
                  { label: "Primary Contact", value: member.phoneNumber1 || "-" },
                  { label: "Alternate Contact", value: member.phoneNumber2 || "-" },
                  { label: "Email", value: primaryEmail },
                  { label: "Survey Number", value: member.surveyNumber || "-" },
                  { label: "Zone", value: member.zone || "-" },
                  { label: "Village", value: member.village || "-" },
                  { label: "Mandal", value: member.mandal || "-" },
                  { label: "District", value: member.district || "-" },
                  { label: "State", value: member.state || "-" },
                  { label: "Pin Code", value: member.pinCode || "-" },
                  {
                    label: "Registered Address",
                    value: member.complianceDetails?.fullAddress || "-",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Electrical & Workforce</CardTitle>
              <CardDescription>Primary connection details and workforce overview</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <DetailSection
                title="Electrical Information"
                items={[
                  {
                    label: "Electrical USC Number",
                    value: member.electricalUscNumber || "-",
                  },
                  { label: "SC Number", value: member.scNumber || "-" },
                  {
                    label: "Sanctioned HP",
                    value: `${member.sanctionedHP} HP`,
                  },
                ]}
              />
              <DetailSection
                title="Workforce"
                items={[
                  {
                    label: "Total Workers",
                    value: totalWorkers || "-",
                  },
                  {
                    label: "Male Workers",
                    value: member.estimatedMaleWorker || 0,
                  },
                  {
                    label: "Female Workers",
                    value: member.estimatedFemaleWorker || 0,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branches & Machinery</CardTitle>
              <CardDescription>Summary of branch locations and equipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {member.branches.length ? (
                <div className="flex flex-col gap-2">
                  {member.branches.map((branch) => (
                    <div
                      key={branch.id || branch.placeOfBusiness}
                      className="rounded-lg border bg-muted/40 p-4 space-y-2"
                    >

                      <h4 className="text-sm text-muted-foreground">
                        Branch Id: {branch.id || ""}
                      </h4>

                      <h4 className="text-xl font-semibold text-primary">
                        {branch.placeOfBusiness || ""}
                      </h4>

                      <div className="grid grid-cols-4 gap-3">
                        <DetailItem
                          label="Electrical USC Number"
                          value={branch.electricalUscNumber || "-"}
                        />
                        <DetailItem label="SC Number" value={branch.scNumber || "-"} />
                        <DetailItem
                          label="Proprietor Type"
                          value={branch.proprietorType || "-"}
                        />
                        <DetailItem
                          label="Proprietor Status"
                          value={branch.proprietorStatus || "-"}
                        />
                        <DetailItem
                          label="Sanctioned HP"
                          value={branch.sanctionedHP || "-"}
                        />
                        <DetailItem
                          label="Machinery Count"
                          value={branch.machineryInformations?.length || 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional branches recorded.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance & Legal</CardTitle>
              <CardDescription>Regulatory registrations and expiries</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <DetailSection
                title="GST Details"
                items={[
                  {
                    label: "GST Number",
                    value: member.complianceDetails?.gstInNumber || "-",
                  },
                  {
                    label: "GST Username",
                    value: member.complianceDetails?.gstInUsername || "-",
                  },
                  {
                    label: "GST Expiry",
                    value: member.complianceDetails?.gstExpiredAt
                      ? prettyDate(member.complianceDetails.gstExpiredAt)
                      : "-",
                  },
                ]}
              />
              <DetailSection
                title="Other Licenses"
                items={[
                  {
                    label: "Factory License",
                    value: member.complianceDetails?.factoryLicenseNumber || "-",
                  },
                  {
                    label: "Factory License Expiry",
                    value: member.complianceDetails?.factoryLicenseExpiredAt
                      ? prettyDate(member.complianceDetails.factoryLicenseExpiredAt)
                      : "-",
                  },
                  {
                    label: "TSPCB Order",
                    value: member.complianceDetails?.tspcbOrderNumber || "-",
                  },
                  {
                    label: "TSPCB Expiry",
                    value: member.complianceDetails?.tspcbExpiredAt
                      ? prettyDate(member.complianceDetails.tspcbExpiredAt)
                      : "-",
                  },
                  {
                    label: "MDL Number",
                    value: member.complianceDetails?.mdlNumber || "-",
                  },
                  {
                    label: "MDL Expiry",
                    value: member.complianceDetails?.mdlExpiredAt
                      ? prettyDate(member.complianceDetails.mdlExpiredAt)
                      : "-",
                  },
                  {
                    label: "Udyam Certificate",
                    value: member.complianceDetails?.udyamCertificateNumber || "-",
                  },
                  {
                    label: "Udyam Expiry",
                    value: member.complianceDetails?.udyamCertificateExpiredAt
                      ? prettyDate(member.complianceDetails.udyamCertificateExpiredAt)
                      : "-",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partners & Representatives</CardTitle>
              <CardDescription>Authorised representatives for this membership</CardDescription>
            </CardHeader>
            <CardContent>
              {member.partnerDetails?.length ? (
                <div className="grid gap-4 ">
                  {member.partnerDetails.map((partner) => (
                    <Card key={partner.id || partner.partnerName} className="border border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                          Partner ID: {displayValue(partner.id?.toString() || "-")}
                        </CardTitle>
                        <CardDescription className="text-xl font-semibold text-primary">

                          {displayValue(partner.partnerName || "Partner")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-5 gap-3">
                        <DetailItem
                          label="Contact Number"
                          value={partner.contactNumber || "-"}
                        />
                        <DetailItem label="Email" value={partner.emailId || "-"} />
                        <DetailItem
                          label="Aadhar"
                          value={partner.partnerAadharNo || "-"}
                        />
                        <DetailItem label="PAN" value={partner.partnerPanNo || "-"} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No partners added yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership References</CardTitle>
              <CardDescription>Similar membership history and proposer details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <DetailSection
                title="Similar Membership Inquiry"
                columns={1}
                items={[
                  {
                    label: "Member of Similar Organisation",
                    value: formatBoolean(similarInquiry?.is_member_of_similar_org),
                  },
                  {
                    label: "Organisation Details",
                    value: similarOrgDetails,
                  },
                  {
                    label: "Applied Earlier",
                    value: formatBoolean(similarInquiry?.has_applied_earlier),
                  },
                  {
                    label: "Previous Application Details",
                    value: similarPreviousDetails,
                  },
                  {
                    label: "Valid Member",
                    value: formatBoolean(similarInquiry?.is_valid_member),
                  },
                  {
                    label: "Executive Member",
                    value: formatBoolean(similarInquiry?.is_executive_member),
                  },
                ]}
              />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary">Proposers</h4>
                {proposerError ? (
                  <p className="text-sm text-destructive">{proposerError}</p>
                ) : null}
                {isLoadingProposers ? (
                  <p className="text-sm text-muted-foreground">
                    Loading proposer details...
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {member.proposer?.proposerID ? (
                      renderProposerCard(
                        "Primary Proposer",
                        member.proposer.proposerID,
                        primaryProposerMember
                      )
                    ) : (
                      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        No primary proposer assigned.
                      </div>
                    )}
                    {member.executiveProposer?.proposerID ? (
                      renderProposerCard(
                        "Executive Proposer",
                        member.executiveProposer.proposerID,
                        executiveProposerMember
                      )
                    ) : (
                      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        No executive proposer assigned.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents & Declarations</CardTitle>
              <CardDescription>Uploaded certificates and acknowledgement records</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary">
                  Additional Documents
                </h4>
                {member.attachments?.length ? (
                  <div className="flex flex-col gap-3">
                    {member.attachments.map((doc, index) => (
                      <div
                        key={doc.id || `${doc.documentName}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {doc.documentName || `Document ${index + 1}`}
                          </span>
                          <span className="text-sm break-all">
                            {doc.documentPath || "-"}
                          </span>
                        </div>
                        {doc.documentPath ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No additional documents uploaded.
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary">Declarations</h4>
                <DetailSection
                  title=""
                  columns={1}
                  items={[
                    {
                      label: "Agreed To Terms",
                      value: formatBoolean(member.declarations?.agreesToTerms),
                    },
                  ]}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Membership Form",
                      path: member.declarations?.membershipFormPath,
                    },
                    {
                      label: "Application Signature",
                      path: member.declarations?.applicationSignaturePath,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm break-all">
                          {item.path || "-"}
                        </span>
                      </div>
                      {item.path ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadDocument(item.path as string)
                          }
                        >
                          <Download className="h-4 w-4 mr-1" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machineries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Machinery Inventory</CardTitle>
                <CardDescription>
                  Manage machinery details for each branch
                </CardDescription>
              </div>

            </CardHeader>
            <CardContent>
              {!branchMachinerySections.length ? (
                <p className="text-sm text-muted-foreground">
                  No branches available. Add a branch to start managing machinery.
                </p>
              ) : (
                <div className="space-y-6">
                  {branchMachinerySections.map(({ branch, branchId, machines }) => (
                    <div
                      key={branchId || branch.placeOfBusiness || `branch-${branchId}`}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="text-base font-semibold text-primary">
                            {branch.placeOfBusiness || `Branch ${branchId || ""}`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            USC: {branch.electricalUscNumber || "-"} • SC:{" "}
                            {branch.scNumber || "-"}
                          </p>
                        </div>
                        {(session?.user?.role === "ADMIN" ||
                          session?.user?.role === "TQMA_EDITOR" ||
                          session?.user?.role === "TSMWA_EDITOR") &&
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddMachineryDialog(branchId)}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Machine
                          </Button>
                        }
                      </div>

                      {machines.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Machine</TableHead>
                              <TableHead>Quantity</TableHead>
                              {(session?.user?.role === "ADMIN" ||
                                session?.user?.role === "TQMA_EDITOR" ||
                                session?.user?.role === "TSMWA_EDITOR") &&
                                <TableHead>Actions</TableHead>
                              }
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {machines.map((machine) => (
                              <TableRow key={machine.id ?? `${machine.machineName}-${machine.machineCount}`}>
                                <TableCell className="font-medium">
                                  {getMachineDisplayName(machine)}
                                </TableCell>
                                <TableCell>{machine.machineCount}</TableCell>
                                {(session?.user?.role === "ADMIN" ||
                                  session?.user?.role === "TQMA_EDITOR" ||
                                  session?.user?.role === "TSMWA_EDITOR") &&
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          openEditMachineryDialog(branchId, machine)
                                        }
                                        aria-label="Edit machinery"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                          openDeleteMachineryDialog(branchId, machine)
                                        }
                                        aria-label="Delete machinery"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                }
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No machinery recorded for this branch.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
              {(session?.user?.role === "ADMIN" ||
                session?.user?.role === "TQMA_EDITOR" ||
                session?.user?.role === "TSMWA_EDITOR") &&
                <Button onClick={openAddDoc}>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              }
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>File Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    {(session?.user?.role === "ADMIN" ||
                      session?.user?.role === "TQMA_EDITOR" ||
                      session?.user?.role === "TSMWA_EDITOR") &&
                      <TableHead>Actions</TableHead>
                    }
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
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "TQMA_EDITOR" ||
                        session?.user?.role === "TSMWA_EDITOR") &&
                        <TableCell className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDoc(attachment, "additional")}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="sm" onClick={() => openDeleteDocDialog(attachment)} disabled={docLoading || isDeletingDoc}><Trash2 className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadAttachment(attachment)}><Download className="h-4 w-4" /></Button>
                        </TableCell>
                      }
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
                  onUploadComplete={() => { }}
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
              <CardTitle>Membership Fee Transactions</CardTitle>
              <CardDescription>
                A list of all membership fee transactions for this member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipFeesTable memberId={member.membershipId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labour">
          <Card>
            <CardHeader>
              <CardTitle>Member Labours</CardTitle>
              <CardDescription>
                A list of all labours associated with this member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberLaboursTable memberId={member.membershipId} />
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
                {(session?.user?.role === "ADMIN" ||
                  session?.user?.role === "TQMA_EDITOR" ||
                  session?.user?.role === "TSMWA_EDITOR") &&
                  <Button onClick={openAddLicenseDialog} disabled={getAvailableLicenseTypes().length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add License
                  </Button>
                }
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
                    {(session?.user?.role === "ADMIN" ||
                      session?.user?.role === "TQMA_EDITOR" ||
                      session?.user?.role === "TSMWA_EDITOR") &&
                      <TableHead>Actions</TableHead>
                    }
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
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "TQMA_EDITOR" ||
                        session?.user?.role === "TSMWA_EDITOR") &&
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLicenseDialog(doc.type)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => openDeleteLicenseDialog(doc.type)} disabled={docLoading || isDeletingLicense}><Trash2 className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(doc.path)}><Download className="h-4 w-4" /></Button>
                          {doc.type === "gst" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGstCredentialsError("");
                                setGstUsername(memberCompliance?.gstInUsername || "");
                                setGstPassword(memberCompliance?.gstInPassword || "");
                                setShowGSTCredentialsDialog(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      }
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
                  onUploadComplete={() => { }}
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

          {/* GST Credentials Dialog */}
          <Dialog
            open={showGSTCredentialsDialog}
            onOpenChange={(val) => {
              if (!val) {
                setShowGSTCredentialsDialog(false);
                setGstCredentialsError("");
                setGstUsername(memberCompliance?.gstInUsername || "");
                setGstPassword(memberCompliance?.gstInPassword || "");
                setShowGstPassword(false);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>GST Credentials</DialogTitle>
                <DialogDescription>
                  View or update the GST portal username and password for this member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>GST Username</Label>
                  <Input
                    value={gstUsername}
                    onChange={(e) => setGstUsername(e.target.value)}
                    placeholder="Enter GST username"
                  />
                </div>
                <div>
                  <Label>GST Password</Label>
                  <div className="relative">
                    <Input
                      type={showGstPassword ? "text" : "password"}
                      value={gstPassword}
                      onChange={(e) => setGstPassword(e.target.value)}
                      placeholder="Enter GST password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                      onClick={() => setShowGstPassword((prev) => !prev)}
                      aria-label={showGstPassword ? "Hide password" : "Show password"}
                    >
                      {showGstPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {gstCredentialsError && (
                  <p className="text-sm text-red-500">{gstCredentialsError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGSTCredentialsDialog(false);
                    setGstCredentialsError("");
                    setGstUsername(memberCompliance?.gstInUsername || "");
                    setGstPassword(memberCompliance?.gstInPassword || "");
                    setShowGstPassword(false);
                  }}
                  disabled={isSavingGstCredentials}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveGstCredentials}
                  disabled={isSavingGstCredentials}
                >
                  {isSavingGstCredentials ? "Saving..." : "Save Credentials"}
                </Button>
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

      <Dialog
        open={showMachineryDialog}
        onOpenChange={(open) => {
          setShowMachineryDialog(open);
          if (!open) {
            setMachineryError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {machineryDialogMode === "add"
                ? "Add Machinery"
                : "Edit Machinery"}
            </DialogTitle>
            <DialogDescription>
              Manage machinery details for the selected branch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Branch</Label>
              <Select
                value={machineryForm.branchId}
                onValueChange={(value) =>
                  setMachineryForm((prev) => ({ ...prev, branchId: value }))
                }
                disabled={machineryDialogMode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {member.branches.map((branch) => (
                    <SelectItem
                      key={toBranchIdString(branch.id)}
                      value={toBranchIdString(branch.id)}
                    >
                      {branch.placeOfBusiness || `Branch ${branch.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Machine Type</Label>
              <Select
                value={machineryForm.machineType}
                onValueChange={(value) =>
                  setMachineryForm((prev) => ({
                    ...prev,
                    machineType: value,
                    customMachineName:
                      value === "Others" ? prev.customMachineName : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select machine type" />
                </SelectTrigger>
                <SelectContent>
                  {MACHINE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {machineryForm.machineType === "Others" && (
              <div className="space-y-2">
                <Label>Machine Name</Label>
                <Input
                  placeholder="Enter machine name"
                  value={machineryForm.customMachineName}
                  onChange={(event) =>
                    setMachineryForm((prev) => ({
                      ...prev,
                      customMachineName: event.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={machineryForm.quantity}
                onChange={(event) =>
                  setMachineryForm((prev) => ({
                    ...prev,
                    quantity: event.target.value,
                  }))
                }
              />
            </div>

            {machineryError ? (
              <p className="text-sm text-destructive">{machineryError}</p>
            ) : null}

            {selectedBranchForDialog ? (
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Managing machinery for{" "}
                <span className="font-semibold text-primary">
                  {selectedBranchForDialog.placeOfBusiness ||
                    `Branch ${selectedBranchForDialog.id}`}
                </span>
                .
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveMachinery} disabled={isSavingMachinery}>
              {isSavingMachinery ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteMachineDialog}
        onOpenChange={(open) => {
          setShowDeleteMachineDialog(open);
          if (!open) {
            setMachineToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Machinery
            </DialogTitle>
            <DialogDescription>
              {machineToDelete?.machine
                ? `Are you sure you want to delete ${getMachineDisplayName(
                  machineToDelete.machine
                )} from ${findBranchById(machineToDelete.branchId)?.placeOfBusiness ||
                "this branch"
                }?`
                : "Selected machinery will be deleted permanently."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteMachinery}
              disabled={isDeletingMachine}
            >
              {isDeletingMachine ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <Dialog open={showDeleteDocDialog} onOpenChange={setShowDeleteDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDocDialog(false)} disabled={isDeletingDoc}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDoc} disabled={isDeletingDoc}>
              {isDeletingDoc ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete License Confirmation Dialog */}
      <Dialog open={showDeleteLicenseDialog} onOpenChange={setShowDeleteLicenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete License</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this license? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteLicenseDialog(false)} disabled={isDeletingLicense}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLicense} disabled={isDeletingLicense}>
              {isDeletingLicense ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
