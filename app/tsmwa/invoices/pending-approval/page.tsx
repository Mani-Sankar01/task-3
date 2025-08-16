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
  FileText,
  Filter
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceChangeRequest {
  id: number;
  invoiceId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: number | null;
  note: string | null;
  updatedData: {
    total?: number;
    subTotal?: number;
    invoiceId: string;
    eWayNumber?: string;
    gstInNumber?: string;
    invoiceDate?: string;
    phoneNumber?: string;
    customerName?: string;
    membershipId?: string;
    cGSTInPercent?: number;
    iGSTInPercent?: number;
    sGSTInPercent?: number;
    billingAddress?: string;
    shippingAddress?: string;
  };
  modifiedBy: number;
  modifiedAt: string;
  userId: number | null;
}

interface InvoiceChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

const InvoiceApprovalPendingPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [invoiceRequests, setInvoiceRequests] = useState<InvoiceChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InvoiceChangeRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineError, setDeclineError] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("ALL");

  // Fetch invoice change requests
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchInvoiceRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/tax_invoice/get_update_request/${approvalStatusFilter}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log("Invoice requests response:", response.data);
        setInvoiceRequests(response.data.invoiceChangeRequests || []);
      } catch (error) {
        console.error("Error fetching invoice requests:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice change requests",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceRequests();
  }, [status, session?.user?.token, toast, approvalStatusFilter]);

  // Process changes and extract meaningful changes
  const extractChanges = (updatedData: any): InvoiceChangeDetails[] => {
    const changes: InvoiceChangeDetails[] = [];

    // Check total amount changes
    if (updatedData.total !== undefined) {
      changes.push({
        type: "updated",
        field: "Total Amount",
        newValue: updatedData.total,
        description: `Total amount updated to: ₹${updatedData.total}`
      });
    }

    // Check subtotal changes
    if (updatedData.subTotal !== undefined) {
      changes.push({
        type: "updated",
        field: "Sub Total",
        newValue: updatedData.subTotal,
        description: `Sub total updated to: ₹${updatedData.subTotal}`
      });
    }

    // Check GST changes
    if (updatedData.cGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "CGST Percentage",
        newValue: updatedData.cGSTInPercent,
        description: `CGST percentage updated to: ${updatedData.cGSTInPercent}%`
      });
    }

    if (updatedData.sGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "SGST Percentage",
        newValue: updatedData.sGSTInPercent,
        description: `SGST percentage updated to: ${updatedData.sGSTInPercent}%`
      });
    }

    if (updatedData.iGSTInPercent !== undefined) {
      changes.push({
        type: "updated",
        field: "IGST Percentage",
        newValue: updatedData.iGSTInPercent,
        description: `IGST percentage updated to: ${updatedData.iGSTInPercent}%`
      });
    }

    // Check customer information changes
    if (updatedData.customerName !== undefined) {
      changes.push({
        type: "updated",
        field: "Customer Name",
        newValue: updatedData.customerName,
        description: `Customer name updated to: ${updatedData.customerName}`
      });
    }

    if (updatedData.phoneNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "Phone Number",
        newValue: updatedData.phoneNumber,
        description: `Phone number updated to: ${updatedData.phoneNumber}`
      });
    }

    if (updatedData.gstInNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "GSTIN Number",
        newValue: updatedData.gstInNumber,
        description: `GSTIN number updated to: ${updatedData.gstInNumber}`
      });
    }

    if (updatedData.eWayNumber !== undefined) {
      changes.push({
        type: "updated",
        field: "E-Way Number",
        newValue: updatedData.eWayNumber,
        description: `E-Way number updated to: ${updatedData.eWayNumber}`
      });
    }

    // Check address changes
    if (updatedData.billingAddress !== undefined) {
      changes.push({
        type: "updated",
        field: "Billing Address",
        newValue: updatedData.billingAddress,
        description: `Billing address updated to: ${updatedData.billingAddress}`
      });
    }

    if (updatedData.shippingAddress !== undefined) {
      changes.push({
        type: "updated",
        field: "Shipping Address",
        newValue: updatedData.shippingAddress,
        description: `Shipping address updated to: ${updatedData.shippingAddress}`
      });
    }

    // Check invoice date changes
    if (updatedData.invoiceDate !== undefined) {
      changes.push({
        type: "updated",
        field: "Invoice Date",
        newValue: updatedData.invoiceDate,
        description: `Invoice date updated to: ${format(new Date(updatedData.invoiceDate), "MMM dd, yyyy")}`
      });
    }

    return changes;
  };

  // Handle approval
  const handleApprove = async (id: number) => {
    if (!session?.user?.token) return;

    const request = invoiceRequests.find(req => req.id === id);
    if (!request) return;

    console.log({
      id: id,
      action: "APPROVED"
    });

    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
        {
          id: id,
          action: "APPROVED",
          note: "Approved by admin"
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
          description: "Invoice changes approved successfully",
        });
        
        // Update the approval status instead of removing
        setInvoiceRequests(prev => prev.map(request => 
          request.id === id 
            ? { ...request, approvalStatus: "APPROVED" }
            : request
        ));
        
        if (selectedRequest?.id === id) {
          setShowDetailsDialog(false);
          setSelectedRequest(null);
        }
      }
    } catch (error) {
      console.error("Error approving invoice changes:", error);
      toast({
        title: "Error",
        description: "Failed to approve invoice changes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline
  const handleDecline = async (id: number) => {
    if (!session?.user?.token) return;

    // Show decline dialog if no note provided
    if (!declineNote.trim()) {
      setSelectedRequest(invoiceRequests.find(request => request.id === id) || null);
      setShowDeclineDialog(true);
      setDeclineError(""); // Clear any previous errors
      return;
    }

    const request = invoiceRequests.find(req => req.id === id);
    if (!request) return;

    setIsProcessing(true);
    setDeclineError(""); // Clear any previous errors
    
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/tax_invoice/approve_decline_request`,
        {
          id: id,
          action: "DECLINED",
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
          description: "Invoice changes declined successfully",
        });
        
        // Update the approval status instead of removing
        setInvoiceRequests(prev => prev.map(request => 
          request.id === id 
            ? { ...request, approvalStatus: "DECLINED" }
            : request
        ));
        
        setShowDeclineDialog(false);
        setDeclineNote("");
        setDeclineError("");
        
        if (selectedRequest?.id === id) {
          setShowDetailsDialog(false);
          setSelectedRequest(null);
        }
      }
    } catch (error: any) {
      console.error("Error declining invoice changes:", error);
      
      // Show error in dialog instead of toast
      const errorMessage = error.response?.data?.message || error.message || "Failed to decline invoice changes";
      setDeclineError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline submission from dialog
  const handleDeclineSubmit = async () => {
    if (!selectedRequest || !declineNote.trim()) return;
    await handleDecline(selectedRequest.id);
  };

  // Get change type badge
  const getChangeTypeBadge = (changes: InvoiceChangeDetails[]) => {
    const types = changes.map(c => c.type);
    if (types.includes("added")) return <Badge variant="default" className="bg-green-100 text-green-800">Added</Badge>;
    if (types.includes("deleted")) return <Badge variant="destructive">Deleted</Badge>;
    if (types.includes("updated")) return <Badge variant="secondary">Updated</Badge>;
    return <Badge variant="outline">Modified</Badge>;
  };

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Invoice Approval Pending" }]} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading invoice change requests...</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Invoice Approval Pending" }]} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoice Approval For Changes</h1>
          <div className="flex items-center gap-4">
            <Select
              value={approvalStatusFilter}
              onValueChange={setApprovalStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-sm">
              {invoiceRequests.length} requests
            </Badge>
          </div>
        </div>

        {invoiceRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoice Change Requests</h3>
              <p className="text-muted-foreground text-center">
                All invoice change requests have been processed. Check back later for new pending requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoiceRequests.map((request) => {
              const changes = extractChanges(request.updatedData);
              
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold">{request.invoiceId}</span>
                        </div>
                        {getChangeTypeBadge(changes)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(request.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                        <Badge variant={request.approvalStatus === "PENDING" ? "destructive" : request.approvalStatus === "APPROVED" ? "default" : "destructive"}>
                          {request.approvalStatus}
                        </Badge>
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

                      {request.note && (
                        <div className="text-sm mt-2">
                          <span className="font-medium">Note:</span> {request.note}
                        </div>
                      )}
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
                      
                      {session?.user?.role === "ADMIN" && (
                        <>
                          <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        className="bg-primary hover:bg-primary/90"
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
                        </>
                      )}
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
                Invoice Change Details - {selectedRequest?.invoiceId}
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
              {selectedRequest && session?.user?.role === "ADMIN" && (
                <>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(selectedRequest.id)}
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
                Decline Invoice Changes
              </DialogTitle>
              <DialogDescription>
                Please provide a note for declining the changes for {selectedRequest?.invoiceId}
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

export default InvoiceApprovalPendingPage;
