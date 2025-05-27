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
import { updateMember, type Member } from "@/services/api";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface MembershipDetailsClientProps {
  member: Member;
}

export default function MembershipDetailsClient({
  member,
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
      window.location.reload(); // Simple refresh for now
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
        window.location.reload(); // Simple refresh for now
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
        <TabsList className="flex min-w-full gap-2 overflow-auto p-1 md:grid md:grid-cols-7">
          <TabsTrigger
            value="overview"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="gst"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <FileText className="h-4 w-4" />
            GST Fillings
          </TabsTrigger>
          <TabsTrigger
            value="licenses"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <License className="h-4 w-4" />
            Licenses
          </TabsTrigger>
          <TabsTrigger
            value="machineries"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <Machinery className="h-4 w-4" />
            Machineries
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <FileText className="h-4 w-4" />
            Documents
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
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  All uploaded documents and certificates
                </CardDescription>
              </div>
              <Button>
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
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Compliance documents */}
                  <TableRow>
                    <TableCell className="font-medium">
                      GST Certificate
                    </TableCell>
                    <TableCell>
                      {member.complianceDetails.gstInCertificatePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.complianceDetails.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Factory License
                    </TableCell>
                    <TableCell>
                      {member.complianceDetails.factoryLicensePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.complianceDetails.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      TSPCB Certificate
                    </TableCell>
                    <TableCell>
                      {member.complianceDetails.tspcbCertificatePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.complianceDetails.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      MDL Certificate
                    </TableCell>
                    <TableCell>
                      {member.complianceDetails.mdlCertificatePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.complianceDetails.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Udyam Certificate
                    </TableCell>
                    <TableCell>
                      {member.complianceDetails.udyamCertificatePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.complianceDetails.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Additional attachments */}
                  {member.attachments.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell className="font-medium">
                        {attachment.documentName}
                      </TableCell>
                      <TableCell>{attachment.documentPath}</TableCell>
                      <TableCell>
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Declaration documents */}
                  <TableRow>
                    <TableCell className="font-medium">
                      Membership Form
                    </TableCell>
                    <TableCell>
                      {member.declarations.membershipFormPath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.declarations.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Applicant Signature
                    </TableCell>
                    <TableCell>
                      {member.declarations.applicationSignaturePath}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        member.declarations.createdAt
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content remains the same */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Recent activities and changes to the membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Member approved</p>
                    <p className="text-sm text-muted-foreground">
                      Membership application was approved
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.approvedOrDeclinedAt
                      ? new Date(
                          member.approvedOrDeclinedAt
                        ).toLocaleDateString()
                      : new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Member created</p>
                    <p className="text-sm text-muted-foreground">
                      New membership application submitted
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
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

        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle>GST Fillings</CardTitle>
              <CardDescription>
                Track and manage GST filling history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>No GST filing records available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>Active Licenses</CardTitle>
              <CardDescription>View and manage member licenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        Factory License
                      </CardTitle>
                      <CardDescription>
                        License Number:{" "}
                        {member.complianceDetails.factoryLicenseNumber}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Issued:</span>
                      <span>
                        {new Date(
                          member.complianceDetails.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">TSPCB Order</CardTitle>
                      <CardDescription>
                        Order Number:{" "}
                        {member.complianceDetails.tspcbOrderNumber}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Issued:</span>
                      <span>
                        {new Date(
                          member.complianceDetails.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
