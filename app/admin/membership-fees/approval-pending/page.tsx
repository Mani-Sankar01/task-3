"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  Check,
  X,
  DollarSign
} from "lucide-react";

import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PendingBillRequest {
  id: number;
  billingId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: number | null;
  note: string | null;
  updatedData: {
    toDate?: string;
    fromDate?: string;
    billingId: string;
    paidAmount?: number;
  };
  modifiedBy: number;
  modifiedAt: string;
}

interface BillChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

const BillApprovalPendingPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<PendingBillRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingBillRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineError, setDeclineError] = useState("");

  // Fetch pending bill requests
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchPendingRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/bill/get_bill_update_request`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        setPendingRequests(response.data.pendingRequest || []);
      } catch (error) {
        console.error("Error fetching pending bill requests:", error);
        toast({
          title: "Error",
          description: "Failed to load pending bill requests",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRequests();
  }, [status, session?.user?.token, toast]);

  // Process changes and extract meaningful changes
  const extractChanges = (updatedData: any): BillChangeDetails[] => {
    const changes: BillChangeDetails[] = [];

    // Check paid amount changes
    if (updatedData.paidAmount !== undefined) {
      changes.push({
        type: "updated",
        field: "Paid Amount",
        newValue: updatedData.paidAmount,
        description: `Paid amount updated to: ₹${updatedData.paidAmount}`
      });
    }

    // Check date range changes
    if (updatedData.fromDate && updatedData.toDate) {
      changes.push({
        type: "updated",
        field: "Billing Period",
        newValue: {
          fromDate: updatedData.fromDate,
          toDate: updatedData.toDate
        },
        description: `Billing period updated from ${format(new Date(updatedData.fromDate), "MMM dd, yyyy")} to ${format(new Date(updatedData.toDate), "MMM dd, yyyy")}`
      });
    } else if (updatedData.fromDate) {
      changes.push({
        type: "updated",
        field: "From Date",
        newValue: updatedData.fromDate,
        description: `From date updated to: ${format(new Date(updatedData.fromDate), "MMM dd, yyyy")}`
      });
    } else if (updatedData.toDate) {
      changes.push({
        type: "updated",
        field: "To Date",
        newValue: updatedData.toDate,
        description: `To date updated to: ${format(new Date(updatedData.toDate), "MMM dd, yyyy")}`
      });
    }

    return changes;
  };

  // Handle approval
  const handleApprove = async (billingId: string) => {
    if (!session?.user?.token) return;

    const request = pendingRequests.find(req => req.billingId === billingId);
    if (!request) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/bill/approve_decline_bill_changes`,
        {
          billingId: billingId,
          approvalStatus: "APPROVED"
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Bill changes approved successfully",
        });
        
        // Remove the approved request from the list
        setPendingRequests(prev => prev.filter(request => request.billingId !== billingId));
        
        if (selectedRequest?.billingId === billingId) {
          setShowDetailsDialog(false);
          setSelectedRequest(null);
        }
      }
    } catch (error) {
      console.error("Error approving bill changes:", error);
      toast({
        title: "Error",
        description: "Failed to approve bill changes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline
  const handleDecline = async (billingId: string) => {
    if (!session?.user?.token) return;

    // Show decline dialog if no note provided
    if (!declineNote.trim()) {
      setSelectedRequest(pendingRequests.find(request => request.billingId === billingId) || null);
      setShowDeclineDialog(true);
      setDeclineError(""); // Clear any previous errors
      return;
    }

    const request = pendingRequests.find(req => req.billingId === billingId);
    if (!request) return;

    setIsProcessing(true);
    setDeclineError(""); // Clear any previous errors
    
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/bill/approve_decline_bill_changes`,
        {
          billingId: billingId,
          approvalStatus: "DECLINED",
          note: declineNote.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Bill changes declined successfully",
        });
        
        // Remove the declined request from the list
        setPendingRequests(prev => prev.filter(request => request.billingId !== billingId));
        
        setShowDeclineDialog(false);
        setDeclineNote("");
        setDeclineError("");
        
        if (selectedRequest?.billingId === billingId) {
          setShowDetailsDialog(false);
          setSelectedRequest(null);
        }
      }
    } catch (error: any) {
      console.error("Error declining bill changes:", error);
      
      // Show error in dialog instead of toast
      const errorMessage = error.response?.data?.message || error.message || "Failed to decline bill changes";
      setDeclineError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline submission from dialog
  const handleDeclineSubmit = async () => {
    if (!selectedRequest || !declineNote.trim()) return;
    await handleDecline(selectedRequest.billingId);
  };

  // Get change type badge
  const getChangeTypeBadge = (changes: BillChangeDetails[]) => {
    const types = changes.map(c => c.type);
    if (types.includes("added")) return <Badge variant="default" className="bg-green-100 text-green-800">Added</Badge>;
    if (types.includes("deleted")) return <Badge variant="destructive">Deleted</Badge>;
    if (types.includes("updated")) return <Badge variant="secondary">Updated</Badge>;
    return <Badge variant="outline">Modified</Badge>;
  };

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Bill Approval Pending" }]} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading pending bill requests...</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Bill Approval Pending" }]} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bill Approval Pending</h1>
          <Badge variant="outline" className="text-sm">
            {pendingRequests.length} pending requests
          </Badge>
        </div>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Bill Requests</h3>
              <p className="text-muted-foreground text-center">
                All bill change requests have been processed. Check back later for new pending requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => {
              const changes = extractChanges(request.updatedData);
              
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">{request.billingId}</span>
                        </div>
                        {getChangeTypeBadge(changes)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(request.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        Modified by: User ID {request.modifiedBy}
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">Changes:</span> {changes.length} modification(s)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Show Changes
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(request.billingId)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDeclineDialog(true);
                        }}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Bill Change Details - {selectedRequest?.billingId}
              </DialogTitle>
              <DialogDescription>
                Review the changes made on{" "}
                {selectedRequest && format(new Date(selectedRequest.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {extractChanges(selectedRequest.updatedData).map((change, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {change.type === "added" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {change.type === "updated" && <AlertCircle className="h-4 w-4 text-blue-500" />}
                        {change.type === "deleted" && <XCircle className="h-4 w-4 text-red-500" />}
                        <CardTitle className="text-base">{change.field}</CardTitle>
                        <Badge variant={change.type === "added" ? "default" : change.type === "deleted" ? "destructive" : "secondary"}>
                          {change.type.charAt(0).toUpperCase() + change.type.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                      {change.newValue && (
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(change.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
              {selectedRequest && (
                <>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(selectedRequest.billingId)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowDeclineDialog(true);
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Decline Bill Changes
              </DialogTitle>
              <DialogDescription>
                Please provide a note for declining the changes for {selectedRequest?.billingId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter note for declining..."
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                rows={4}
              />
              {declineError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {declineError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineNote("");
                  setDeclineError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={isProcessing || !declineNote.trim()}
              >
                <X className="h-4 w-4 mr-2" />
                Decline Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
};

export default BillApprovalPendingPage; 