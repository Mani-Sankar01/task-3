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
  // getMemberNameByMembershipId, // Removed
  // getMemberById, // Removed
} from "@/data/lease-queries";
import { // getMemberById, // Removed
  // getMemberNameByMembershipId, // Removed
} from "@/data/members";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function LeaseQueryDetails({ id }: { id?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use the id prop if provided, otherwise try to get it from search params
  const queryId = id || searchParams.get("id");
  const [query, setQuery] = useState<LeaseQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchLeaseQueryDetails() {
      if (!queryId) return;
      if (status === "authenticated" && session?.user?.token) {
        try {
          const response = await axios.get(
            `${process.env.BACKEND_API_URL}/api/lease_query/get_lease_query/${queryId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setQuery(response.data.data || null);
        } catch (error) {
          setQuery(null);
        } finally {
          setLoading(false);
        }
      }
      // Do NOT setLoading(false) here if not authenticated; wait for session
    }
    fetchLeaseQueryDetails();
  }, [queryId, status, session]);

  const handleEdit = () => {
    if (query) {
      router.push(`/admin/lease-queries/${query.leaseQueryId}/edit`);
    }
  };

  const handleBack = () => {
    router.push("/admin/lease-queries");
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

  // Use member details from API response
  const member = query.members || {};
  const memberName = (member as any)?.firmName || (member as any)?.applicantName || "Unknown Member";

  // Use correct date fields
  const leaseStartDate = query.dateOfLease ? new Date(query.dateOfLease) : null;
  const leaseEndDate = query.expiryOfLease ? new Date(query.expiryOfLease) : null;
  const renewalDate = query.dateOfRenewal ? new Date(query.dateOfRenewal) : null;
  const durationMs = leaseStartDate && leaseEndDate ? leaseEndDate.getTime() - leaseStartDate.getTime() : 0;
  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  const durationYears = leaseStartDate && leaseEndDate ? Math.floor(durationDays / 365) : 0;
  const durationMonths = leaseStartDate && leaseEndDate ? Math.floor((durationDays % 365) / 30) : 0;

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate lease duration in years, months, and days
  function getLeaseDuration(start: Date | null, end: Date | null) {
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    let result = [];
    if (years > 0) result.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) result.push(`${days} day${days > 1 ? 's' : ''}`);
    if (result.length === 0) {
      // If less than a month, show days
      const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }
    return result.join(' ');
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Lease Query Details</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={"/placeholder.svg?height=64&width=64"}
              alt="Member avatar"
            />
            <AvatarFallback>{memberName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">Query ID: {query.leaseQueryId}</CardTitle>
              <Badge
                variant={
                  query.status === "RESOLVED"
                    ? "default"
                    : query.status === "PENDING"
                    ? "secondary"
                    : query.status === "PROCESSING"
                    ? "default"
                    : query.status === "REJECTED"
                    ? "destructive"
                    : "outline"
                }
              >
                {query.status?.charAt(0).toUpperCase() + query.status?.slice(1).toLowerCase()}
              </Badge>
            </div>
            <CardDescription>
              Membership ID: {query.membershipId} | Member: {memberName}
            </CardDescription>
          </div>

           <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit Query
          </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex min-w-full gap-2 overflow-auto p-1 md:grid md:grid-cols-3">
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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Lease Holder</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{query.presentLeaseHolder}</div>
                <p className="text-xs text-muted-foreground">Current active lease holder</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lease Period</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getLeaseDuration(leaseStartDate, leaseEndDate)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(query.dateOfLease)} - {formatDate(query.expiryOfLease)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Renewal</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{query.dateOfRenewal ? formatDate(query.dateOfRenewal) : "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {query.dateOfRenewal ? `Renewed ${Math.round((new Date().getTime() - new Date(query.dateOfRenewal).getTime()) / (1000 * 60 * 60 * 24))} days ago` : "No renewal recorded"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lease Details</CardTitle>
              <CardDescription>Complete information about this lease agreement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Membership ID</h3>
                  <p>{query.membershipId}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Member Name</h3>
                  <p>{memberName}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Present Lease Holder</h3>
                  <p>{query.presentLeaseHolder}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Date of Lease</h3>
                  <p>{formatDate(query.dateOfLease)}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Expiry of Lease</h3>
                  <p>{formatDate(query.expiryOfLease)}</p>
                </div>
                {query.dateOfRenewal && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Date of Renewal</h3>
                    <p>{formatDate(query.dateOfRenewal)}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p>
                    <Badge
                      variant={
                        query.status === "RESOLVED"
                          ? "default"
                          : query.status === "PENDING"
                          ? "secondary"
                          : query.status === "PROCESSING"
                          ? "default"
                          : query.status === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {query.status?.charAt(0).toUpperCase() + query.status?.slice(1).toLowerCase()}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p>{formatDate(query.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lease Holder History</CardTitle>
              <CardDescription>Present and previous lease holders for this property</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Membership ID</TableHead>
                    <TableHead>Period From</TableHead>
                    <TableHead>Period To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const history = Array.isArray(query.leaseQueryHistory) ? query.leaseQueryHistory : [];
                    const presentRow = (
                      <TableRow>
                        <TableCell className="font-medium">{query.presentLeaseHolder} (Current)</TableCell>
                        <TableCell>{query.membershipId}</TableCell>
                        <TableCell>{formatDate(query.dateOfLease)}</TableCell>
                        <TableCell>{formatDate(query.expiryOfLease)}</TableCell>
                      </TableRow>
                    );
                    // Check if first history entry matches present lease holder
                    if (
                      history.length > 0 &&
                      history[0].leaseHolderName === query.presentLeaseHolder &&
                      history[0].membershipId === query.membershipId &&
                      formatDate(history[0].fromDate) === formatDate(query.dateOfLease) &&
                      formatDate(history[0].toDate) === formatDate(query.expiryOfLease)
                    ) {
                      // Only show history rows
                      return history.map((h: any, idx: number) => (
                        <TableRow key={h.id || idx}>
                          <TableCell className="font-medium">{h.leaseHolderName}</TableCell>
                          <TableCell>{h.membershipId}</TableCell>
                          <TableCell>{formatDate(h.fromDate)}</TableCell>
                          <TableCell>{formatDate(h.toDate)}</TableCell>
                        </TableRow>
                      ));
                    } else if (history.length > 0) {
                      // Show present row, then history
                      return (
                        <>
                          {presentRow}
                          {history.map((h: any, idx: number) => (
                            <TableRow key={h.id || idx}>
                              <TableCell className="font-medium">{h.leaseHolderName}</TableCell>
                              <TableCell>{h.membershipId}</TableCell>
                              <TableCell>{formatDate(h.fromDate)}</TableCell>
                              <TableCell>{formatDate(h.toDate)}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      );
                    } else {
                      // No history, only present row
                      return presentRow;
                    }
                  })()}
                </TableBody>
              </Table>
              {(!Array.isArray(query.leaseQueryHistory) || query.leaseQueryHistory.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  No previous lease holders recorded. {query.presentLeaseHolder} is the first lease holder.
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
              {Array.isArray(query.leaseQueryAttachments) && query.leaseQueryAttachments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>File Path</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.leaseQueryAttachments.map((doc: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{doc.documentName}</TableCell>
                        <TableCell>{doc.documentPath || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            // onClick={() => handleDownload(doc.documentPath)}
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
                  <p>No documents have been uploaded for this lease agreement.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
