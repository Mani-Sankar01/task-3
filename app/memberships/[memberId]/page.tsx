import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  CreditCardIcon,
  FileTextIcon,
  MessageCircle,
} from "lucide-react";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const memberId = (await params).memberId;
  const memberIdDetails = await prisma.membership.findFirst({
    where: {
      id: Number(memberId),
    },
  });

  //   console.log(meterIdDetails);
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              {memberIdDetails?.industryName}
            </CardTitle>
            <Badge
              variant={
                memberIdDetails?.status === "Active" ? "default" : "destructive"
              }
            >
              {memberIdDetails?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Meter Number</p>
              <p className="font-medium">{memberIdDetails?.meterNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{memberIdDetails?.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center">
              <PhoneIcon className="mr-2 h-4 w-4" />
              <a href={`tel:${memberIdDetails?.contactNumber}`}>
                {" "}
                <span>{memberIdDetails?.contactNumber}</span>
              </a>
            </div>{" "}
            <div className="flex items-center">
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>{`8520852020`}</span>
            </div>
            <div className="flex items-center">
              <MailIcon className="mr-2 h-4 w-4" />
              <span>{memberIdDetails?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Aadhar Number</p>
              <p className="font-medium">{memberIdDetails?.aadharNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PAN Number</p>
              <p className="font-medium">{memberIdDetails?.panNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GSTIN Number</p>
              <p className="font-medium">{memberIdDetails?.gstinNumber}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                Start Date:{" "}
                {memberIdDetails?.membershipStartDate.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                Due Date: {memberIdDetails?.membershipDueDate.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <CreditCardIcon className="mr-2 h-4 w-4" />
              <span>Monthly Fee: ₹{memberIdDetails?.monthlyFee}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>
                Last Payment:{" "}
                {memberIdDetails?.lastPaymentDate
                  ? memberIdDetails?.lastPaymentDate.toLocaleString()
                  : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start">
              <FileTextIcon className="mr-2 h-4 w-4 mt-1" />
              <p>{memberIdDetails?.notes}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
