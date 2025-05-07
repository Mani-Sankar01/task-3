"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getLeaseQueryById,
  getMemberNameByMembershipId,
  type LeaseQuery,
} from "@/data/lease-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileQuestion,
} from "lucide-react";

interface LeaseQueryDetailsProps {
  id?: string;
}

export default function LeaseQueryDetails({
  id: propId,
}: LeaseQueryDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = propId || searchParams.get("id");

  const [leaseQuery, setLeaseQuery] = useState<LeaseQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("viewer");

  useEffect(() => {
    // Get user role from localStorage
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }

    if (queryId) {
      try {
        const query = getLeaseQueryById(queryId);
        if (query) {
          setLeaseQuery(query);
        } else {
          setError("Lease Query Not Found");
        }
      } catch (err) {
        setError("Error loading lease query");
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setError("No Lease Query ID provided");
      setLoading(false);
    }
  }, [queryId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Processing
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Resolved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <FileQuestion className="h-5 w-5 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <p>Loading lease query details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !leaseQuery) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col justify-center items-center h-40 gap-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-lg font-medium text-red-500">
                {error || "Lease Query Not Found"}
              </p>
              <Button onClick={() => router.push("/admin/lease-queries")}>
                Back to Lease Queries
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lease Query Details</h1>
        <div className="flex gap-2">
          {userRole !== "viewer" && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/admin/lease-queries/${leaseQuery.id}/edit`)
              }
            >
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/lease-queries`)}
          >
            Back to List
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Lease Query #{leaseQuery.id}</CardTitle>
              <CardDescription>
                Created on {formatDate(leaseQuery.createdAt)} • Last updated on{" "}
                {formatDate(leaseQuery.updatedAt)}
              </CardDescription>
            </div>
            <div>{getStatusBadge(leaseQuery.status)}</div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Lease History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Membership ID
                    </h3>
                    <p className="text-lg">{leaseQuery.membershipId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Member Name
                    </h3>
                    <p className="text-lg">
                      {getMemberNameByMembershipId(leaseQuery.membershipId)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Present Lease Holder
                    </h3>
                    <p className="text-lg">{leaseQuery.presentLeaseHolder}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Lease Date
                    </h3>
                    <p className="text-lg">
                      {formatDate(leaseQuery.leaseDate)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Expiry Date
                    </h3>
                    <p className="text-lg">
                      {formatDate(leaseQuery.expiryDate)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Renewal Date
                    </h3>
                    <p className="text-lg">
                      {leaseQuery.renewalDate
                        ? formatDate(leaseQuery.renewalDate)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                {getStatusIcon(leaseQuery.status)}
                <span className="font-medium">
                  Status:{" "}
                  {leaseQuery.status.charAt(0).toUpperCase() +
                    leaseQuery.status.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lease Holder History</CardTitle>
              <CardDescription>
                Previous lease holders for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaseQuery.leaseHolderHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No previous lease holders recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Period From</TableHead>
                      <TableHead>Period To</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaseQuery.leaseHolderHistory.map((holder, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {holder.name}
                        </TableCell>
                        <TableCell>{formatDate(holder.periodFrom)}</TableCell>
                        <TableCell>{formatDate(holder.periodTo)}</TableCell>
                        <TableCell>
                          {Math.round(
                            (new Date(holder.periodTo).getTime() -
                              new Date(holder.periodFrom).getTime()) /
                              (1000 * 60 * 60 * 24 * 30)
                          )}{" "}
                          months
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Lease agreements and related documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaseQuery.documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaseQuery.documents.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell>{doc.fileName || "N/A"}</TableCell>
                        <TableCell>
                          {doc.uploadDate ? formatDate(doc.uploadDate) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <FileText className="h-4 w-4 mr-2" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>History of changes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l">
                <div className="mb-8 relative">
                  <div className="absolute -left-[25px] p-1 rounded-full bg-white border">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mb-1 text-sm text-muted-foreground">
                    {formatDate(leaseQuery.createdAt)}
                  </div>
                  <h4 className="text-base font-medium">Lease Query Created</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Initial lease query was created for membership{" "}
                    {leaseQuery.membershipId}
                  </p>
                </div>

                {leaseQuery.renewalDate && (
                  <div className="mb-8 relative">
                    <div className="absolute -left-[25px] p-1 rounded-full bg-white border">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mb-1 text-sm text-muted-foreground">
                      {formatDate(leaseQuery.renewalDate)}
                    </div>
                    <h4 className="text-base font-medium">Lease Renewed</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lease was renewed for {leaseQuery.presentLeaseHolder}
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute -left-[25px] p-1 rounded-full bg-white border">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mb-1 text-sm text-muted-foreground">
                    {formatDate(leaseQuery.updatedAt)}
                  </div>
                  <h4 className="text-base font-medium">Last Updated</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lease query was last updated with status:{" "}
                    {leaseQuery.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
