"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  FileText,
  Edit,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderRoleBasedPath } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface MembershipFeeDetailsProps {
  fee: any; // API response data
}

export default function MembershipFeeDetails({
  fee,
}: MembershipFeeDetailsProps) {
  const router = useRouter();
  const session = useSession();

  // Helper function to safely format date
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  // Get the last updated date from various possible field names
  const getLastUpdatedDate = (): string => {
    const possibleFields = [
      fee?.updatedAt,
      fee?.modifiedAt,
      fee?.updated_at,
      fee?.modified_at,
    ];
    
    for (const field of possibleFields) {
      if (field) {
        const formatted = formatDate(field);
        if (formatted !== "N/A") return formatted;
      }
    }
    
    // Fallback to createdAt if updatedAt is not available
    return formatDate(fee?.createdAt || fee?.created_at);
  };

  const handleEdit = () => {
    router.push(
      `/${renderRoleBasedPath(session?.data?.user.role)}/membership-fees/${
        fee.billingId
      }/edit`
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Membership Fee Details</h1>
        </div>
        {(session?.data?.user?.role === "ADMIN" ||
          session?.data?.user?.role === "TQMA_EDITOR" ||
          session?.data?.user?.role === "TSMWA_EDITOR") &&
          <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        }
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="mr-2 h-5 w-5" /> {fee.billingId}
                </CardTitle>
                <CardDescription>Member: {fee.applicantName || fee.firmName || fee.membershipId}</CardDescription>
              </div>
              <Badge
                variant={
                  fee.paymentStatus === "PAID"
                    ? "default"
                    : fee.paymentStatus === "DUE"
                    ? "secondary"
                    : fee.paymentStatus === "PARTIAL"
                    ? "secondary"
                    : "destructive"
                }
              >
                {fee.paymentStatus ? fee.paymentStatus.charAt(0).toUpperCase() + fee.paymentStatus.slice(1).toLowerCase() : "Unknown"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Period: {fee.fromDate ? new Date(fee.fromDate).toLocaleDateString() : "N/A"} to{" "}
                    {fee.toDate ? new Date(fee.toDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                {fee.paymentDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Payment Date:{" "}
                      {new Date(fee.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {fee.receiptNumber && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Receipt Number: {fee.receiptNumber}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Total Amount: ₹{fee.totalAmount ? parseFloat(fee.totalAmount).toLocaleString() : "0"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Paid Amount: ₹{fee.paidAmount ? parseFloat(fee.paidAmount).toLocaleString() : "0"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Balance:{" "}
                    <span
                      className={
                        (parseFloat(fee.totalAmount) || 0) - (parseFloat(fee.paidAmount) || 0) > 0
                          ? "text-destructive"
                          : "text-green-600"
                      }
                    >
                      ₹{((parseFloat(fee.totalAmount) || 0) - (parseFloat(fee.paidAmount) || 0)).toLocaleString()}
                    </span>
                  </span>
                </div>
                {fee.paymentMethod && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Payment Method: {fee.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          {fee.notes && (
            <CardFooter>
              <div className="w-full">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">{fee.notes}</p>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Timeline</CardTitle>
            <CardDescription>Important dates and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(fee?.createdAt || fee?.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {getLastUpdatedDate()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
