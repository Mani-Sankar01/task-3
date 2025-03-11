"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  Phone,
  Mail,
  User,
  Edit,
  ArrowLeft,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Labour, getMemberNameById } from "@/data/labour";
import Link from "next/link";

interface LabourDetailsProps {
  labour: Labour;
}

export default function LabourDetails({ labour }: LabourDetailsProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/labour/${labour.id}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/labour");
  };

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Labour Details</h1>
        </div>
        <Link href={`/admin/labour/${labour.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={labour.photoUrl} alt={labour.name} />
              <AvatarFallback>{labour.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{labour.name}</CardTitle>
                  <Badge
                    variant={
                      labour.status === "active"
                        ? "default"
                        : labour.status === "bench"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {labour.status.charAt(0).toUpperCase() +
                      labour.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  {labour.currentMemberId
                    ? `Currently working at ${getMemberNameById(
                        labour.currentMemberId
                      )}`
                    : "Not currently assigned"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Father's Name: {labour.fatherName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Date of Birth:{" "}
                    {new Date(labour.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Phone: {labour.phone}</span>
                </div>
                {labour.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Email: {labour.email}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Aadhar Number: {labour.aadharNumber}</span>
                </div>
                {labour.panNumber && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>PAN Number: {labour.panNumber}</span>
                  </div>
                )}
                {labour.esiNumber && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>ESI Number: {labour.esiNumber}</span>
                  </div>
                )}
                {labour.employedFrom && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Employed From:{" "}
                      {new Date(labour.employedFrom).toLocaleDateString()}
                      {labour.employedTo
                        ? ` to ${new Date(
                            labour.employedTo
                          ).toLocaleDateString()}`
                        : " (Current)"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="employment" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employment">Employment History</TabsTrigger>
            <TabsTrigger value="address">Address Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment History</CardTitle>
                <CardDescription>
                  Record of all employment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead>From Date</TableHead>
                      <TableHead>To Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labour.employmentHistory.length > 0 ? (
                      labour.employmentHistory.map((employment) => (
                        <TableRow key={employment.id}>
                          <TableCell className="font-medium">
                            {employment.memberName}
                          </TableCell>
                          <TableCell>
                            {new Date(employment.fromDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {employment.toDate
                              ? new Date(employment.toDate).toLocaleDateString()
                              : "Current"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employment.status === "active"
                                  ? "default"
                                  : employment.status === "bench"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {employment.status.charAt(0).toUpperCase() +
                                employment.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No employment history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>
                  Permanent and present addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> Permanent Address
                    </h3>
                    <p className="text-muted-foreground">
                      {labour.permanentAddress}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> Present Address
                    </h3>
                    <p className="text-muted-foreground">
                      {labour.presentAddress}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Uploaded documents and identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-medium mb-2">Aadhar Card</h3>
                      <div className="border rounded-md p-2">
                        <img
                          src={labour.aadharCardUrl || "/placeholder.svg"}
                          alt="Aadhar Card"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Photo</h3>
                      <div className="border rounded-md p-2">
                        <img
                          src={labour.photoUrl || "/placeholder.svg"}
                          alt="Photo"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {labour.additionalDocuments.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4">Additional Documents</h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {labour.additionalDocuments.map((doc) => (
                          <Card key={doc.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {doc.name}
                              </CardTitle>
                              <CardDescription>
                                Uploaded on:{" "}
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="border rounded-md p-2">
                                <img
                                  src={doc.documentUrl || "/placeholder.svg"}
                                  alt={doc.name}
                                  className="w-full h-auto max-h-32 object-contain"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
