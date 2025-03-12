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
import { getMemberNameById, type MembershipFee } from "@/data/membership-fees";

interface MembershipFeeDetailsProps {
  fee: MembershipFee;
}

export default function MembershipFeeDetails({
  fee,
}: MembershipFeeDetailsProps) {
  const router = useRouter();
  const memberName = getMemberNameById(fee.memberId);

  const handleEdit = () => {
    router.push(`/admin/membership-fees/${fee.id}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/membership-fees");
  };

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Membership Fee Details</h1>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="mr-2 h-5 w-5" /> {fee.id}
                </CardTitle>
                <CardDescription>Member: {memberName}</CardDescription>
              </div>
              <Badge
                variant={
                  fee.status === "paid"
                    ? "default"
                    : fee.status === "due"
                    ? "secondary"
                    : "destructive"
                }
              >
                {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Period: {new Date(fee.periodFrom).toLocaleDateString()} to{" "}
                    {new Date(fee.periodTo).toLocaleDateString()}
                  </span>
                </div>
                {fee.paidDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Payment Date:{" "}
                      {new Date(fee.paidDate).toLocaleDateString()}
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
                  <span>Total Amount: ₹{fee.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Paid Amount: ₹{fee.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Balance:{" "}
                    <span
                      className={
                        fee.amount - fee.paidAmount > 0
                          ? "text-destructive"
                          : "text-green-600"
                      }
                    >
                      ₹{(fee.amount - fee.paidAmount).toLocaleString()}
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
                    {new Date(fee.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(fee.updatedAt).toLocaleString()}
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
