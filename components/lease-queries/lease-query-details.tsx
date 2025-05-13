"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  FileText,
  History,
  LayoutDashboard,
  Edit,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  Download,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLeaseQueryById,
  type LeaseQuery,
  getMemberNameByMembershipId,
} from "@/data/lease-queries";
import { getMemberById } from "@/data/members";

export default function LeaseQueryDetails({ id }: { id?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use the id prop if provided, otherwise try to get it from search params
  const queryId = id || searchParams.get("id");
  const [query, setQuery] = useState<LeaseQuery | null>(null);
  const [loading, setLoading] = useState(true);

  // User role for role-based access control - get from localStorage for persistence
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("userRole");
      if (savedRole && ["admin", "editor", "viewer"].includes(savedRole)) {
        return savedRole;
      }
    }
    return "admin"; // Default role
  });

  useEffect(() => {
    if (queryId) {
      // In a real app, this would be an API call
      const fetchedQuery = getLeaseQueryById(queryId);
      setQuery(fetchedQuery || null);
    }
    setLoading(false);
  }, [queryId]);

  const handleEdit = () => {
    if (query) {
      router.push(`/admin/lease-queries/${query.id}/edit/?role=${userRole}`);
    }
  };

  const handleBack = () => {
    router.push("/admin/lease-queries");
  };

  // Change user role (for demo purposes)
  const handleRoleChange = (role: string) => {
    setUserRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading lease query details...
          </p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Lease Query Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The lease query you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lease Queries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get member details
  const memberName = getMemberNameByMembershipId(query.membershipId);
  const member = getMemberById(query.membershipId);

  // Calculate lease duration in years and months
  const leaseStartDate = new Date(query.leaseDate);
  const leaseEndDate = new Date(query.expiryDate);
  const durationMs = leaseEndDate.getTime() - leaseStartDate.getTime();
  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  const durationYears = Math.floor(durationDays / 365);
  const durationMonths = Math.floor((durationDays % 365) / 30);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Lease Query Details</h1>
        </div>

        {/* Role selector for demo purposes */}
        {/* <div className="flex items-center gap-2">
          <span className="text-sm">Role:</span>
          <Select
            value={userRole}
            onValueChange={handleRoleChange}
            className="w-[120px]"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={
                member?.declaration?.membershipFormUpload ||
                "/placeholder.svg?height=64&width=64"
              }
              alt="Member avatar"
            />
            <AvatarFallback>{memberName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">Query ID: {query.id}</CardTitle>
              <Badge
                variant={
                  query.status === "resolved"
                    ? "default"
                    : query.status === "pending"
                    ? "secondary"
                    : query.status === "processing"
                    ? "default"
                    : query.status === "rejected"
                    ? "destructive"
                    : "outline"
                }
              >
                {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
              </Badge>
            </div>
            <CardDescription>
              Membership ID: {query.membershipId} | Member: {memberName}
            </CardDescription>
          </div>

          {/* Show Edit button only for Admin or Editor roles */}
          {(userRole === "admin" || userRole === "editor") && (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit Query
            </Button>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex min-w-full gap-2 overflow-auto p-1 md:grid md:grid-cols-4">
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
            Lease History
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="flex min-w-[130px] items-center justify-center gap-2 md:min-w-0"
          >
            <CalendarDays className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Present Lease Holder
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {query.presentLeaseHolder}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current active lease holder
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lease Period
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {durationYears} years {durationMonths} months
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(query.leaseDate)} - {formatDate(query.expiryDate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Last Renewal
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {query.renewalDate ? formatDate(query.renewalDate) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {query.renewalDate
                    ? `Renewed ${Math.round(
                        (new Date().getTime() -
                          new Date(query.renewalDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days ago`
                    : "No renewal recorded"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lease Details</CardTitle>
              <CardDescription>
                Complete information about this lease agreement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Membership ID
                  </h3>
                  <p>{query.membershipId}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Member Name
                  </h3>
                  <p>{memberName}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Present Lease Holder
                  </h3>
                  <p>{query.presentLeaseHolder}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Date of Lease
                  </h3>
                  <p>{formatDate(query.leaseDate)}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Expiry of Lease
                  </h3>
                  <p>{formatDate(query.expiryDate)}</p>
                </div>
                {query.renewalDate && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">
                      Date of Renewal
                    </h3>
                    <p>{formatDate(query.renewalDate)}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p>
                    <Badge
                      variant={
                        query.status === "resolved"
                          ? "default"
                          : query.status === "pending"
                          ? "secondary"
                          : query.status === "processing"
                          ? "default"
                          : query.status === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {query.status.charAt(0).toUpperCase() +
                        query.status.slice(1)}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Created At
                  </h3>
                  <p>{new Date(query.createdAt).toLocaleString()}</p>
                </div>
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
              {query.leaseHolderHistory &&
              query.leaseHolderHistory.length > 0 ? (
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
                    {query.leaseHolderHistory.map((holder, index) => (
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
                    <TableRow>
                      <TableCell className="font-medium">
                        {query.presentLeaseHolder} (Current)
                      </TableCell>
                      <TableCell>{formatDate(query.leaseDate)}</TableCell>
                      <TableCell>{formatDate(query.expiryDate)}</TableCell>
                      <TableCell>
                        {Math.round(
                          (new Date(query.expiryDate).getTime() -
                            new Date(query.leaseDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )}{" "}
                        months
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No previous lease holders recorded. {query.presentLeaseHolder}{" "}
                  is the first lease holder.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Lease Documents</CardTitle>
              <CardDescription>
                All documents related to this lease agreement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {query.documents && query.documents.length > 0 ? (
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
                    {query.documents.map((doc, index) => (
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
                            <Download className="h-4 w-4 mr-2" /> Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>
                    No documents have been uploaded for this lease agreement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Lease Timeline</CardTitle>
              <CardDescription>
                History of events for this lease agreement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Lease Created</p>
                    <p className="text-sm text-muted-foreground">
                      Lease agreement created for {query.presentLeaseHolder}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(query.createdAt)}
                  </div>
                </div>
                {query.renewalDate && (
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Lease Renewed</p>
                      <p className="text-sm text-muted-foreground">
                        Lease agreement renewed for {query.presentLeaseHolder}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(query.renewalDate)}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Lease Expiry</p>
                    <p className="text-sm text-muted-foreground">
                      Lease agreement will expire
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(query.expiryDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
