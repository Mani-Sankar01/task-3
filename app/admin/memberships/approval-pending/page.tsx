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

interface PendingChange {
  id: string;
  membershipId: string;
  approvalStatus: string;
  approvedOrDeclinedBy: string | null;
  updatedData: any;
  modifiedBy: number;
  modifiedAt: string;
  declineReason: string | null;
  approvedByAdmin: string | null;
  modifiedByEditor: {
    id: number;
    fullName: string;
    gender: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ChangeDetails {
  type: "added" | "updated" | "deleted";
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

const ApprovalPendingPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineError, setDeclineError] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");

  // Fetch pending changes
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchPendingChanges = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/member/get_member_changes/ALL`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        console.log(response.data);

        setPendingChanges(response.data);
      } catch (error) {
        console.error("Error fetching pending changes:", error);
        toast({
          title: "Error",
          description: "Failed to load pending changes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingChanges();
  }, [status, session?.user?.token, toast]);

  // Process changes and extract meaningful changes
  const extractChanges = (updatedData: any): ChangeDetails[] => {
    const changes: ChangeDetails[] = [];

    // Helper function to check if object has meaningful data
    const hasData = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (Array.isArray(obj)) return obj.length > 0;
      return Object.keys(obj).some(key => {
        const value = obj[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object' && value !== null) return hasData(value);
        return value !== null && value !== undefined && value !== '';
      });
    };

    // Check basic field changes
    const basicFields = [
      'relativeName', 'applicantName', 'firmName', 'proprietorName', 
      'phoneNumber1', 'phoneNumber2', 'surveyNumber', 'village', 'zone', 
      'mandal', 'district', 'state', 'pinCode', 'sanctionedHP',
      'estimatedMaleWorker', 'estimatedFemaleWorker', 'fullAddress'
    ];

    basicFields.forEach(field => {
      if (updatedData[field] !== undefined && updatedData[field] !== null && updatedData[field] !== '') {
        changes.push({
          type: "updated",
          field: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          newValue: updatedData[field],
          description: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} changed to: ${updatedData[field]}`
        });
      }
    });

    // Check proposer changes
    if (updatedData.proposer && hasData(updatedData.proposer)) {
      changes.push({
        type: "updated",
        field: "Proposer",
        newValue: updatedData.proposer.proposerID,
        description: `Proposer changed to: ${updatedData.proposer.proposerID}`
      });
    }

    // Check executive proposer changes
    if (updatedData.executiveProposer && hasData(updatedData.executiveProposer)) {
      changes.push({
        type: "updated",
        field: "Executive Proposer",
        newValue: updatedData.executiveProposer.proposerID,
        description: `Executive Proposer changed to: ${updatedData.executiveProposer.proposerID}`
      });
    }

    // Check branch details changes
    if (updatedData.branchDetails && hasData(updatedData.branchDetails)) {
      const branchData = updatedData.branchDetails;
      
      if (branchData.newBranchSchema && branchData.newBranchSchema.length > 0) {
        changes.push({
          type: "added",
          field: "New Branches",
          newValue: branchData.newBranchSchema,
          description: `${branchData.newBranchSchema.length} new branch(es) added`
        });
      }

      if (branchData.updateBranchSchema && branchData.updateBranchSchema.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Branches",
          newValue: branchData.updateBranchSchema,
          description: `${branchData.updateBranchSchema.length} branch(es) updated`
        });
      }

      if (branchData.deleteBranchSchema && branchData.deleteBranchSchema.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Branches",
          newValue: branchData.deleteBranchSchema,
          description: `${branchData.deleteBranchSchema.length} branch(es) deleted`
        });
      }
    }

    // Check partner details changes
    if (updatedData.partnerDetails && hasData(updatedData.partnerDetails)) {
      const partnerData = updatedData.partnerDetails;
      
      if (partnerData.newPartnerDetails && partnerData.newPartnerDetails.length > 0) {
        changes.push({
          type: "added",
          field: "New Partners",
          newValue: partnerData.newPartnerDetails,
          description: `${partnerData.newPartnerDetails.length} new partner(s) added`
        });
      }

      if (partnerData.updatePartnerDetails && partnerData.updatePartnerDetails.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Partners",
          newValue: partnerData.updatePartnerDetails,
          description: `${partnerData.updatePartnerDetails.length} partner(s) updated`
        });
      }

      if (partnerData.deletePartnerDetails && partnerData.deletePartnerDetails.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Partners",
          newValue: partnerData.deletePartnerDetails,
          description: `${partnerData.deletePartnerDetails.length} partner(s) deleted`
        });
      }
    }

    // Check machinery information changes
    if (updatedData.machineryInformations && hasData(updatedData.machineryInformations)) {
      const machineryData = updatedData.machineryInformations;
      
      if (machineryData.newMachineryInformations && machineryData.newMachineryInformations.length > 0) {
        changes.push({
          type: "added",
          field: "New Machinery",
          newValue: machineryData.newMachineryInformations,
          description: `${machineryData.newMachineryInformations.length} new machinery item(s) added`
        });
      }

      if (machineryData.updateMachineryInformations && machineryData.updateMachineryInformations.length > 0) {
        changes.push({
          type: "updated",
          field: "Updated Machinery",
          newValue: machineryData.updateMachineryInformations,
          description: `${machineryData.updateMachineryInformations.length} machinery item(s) updated`
        });
      }

      if (machineryData.deleteMachineryInformations && machineryData.deleteMachineryInformations.length > 0) {
        changes.push({
          type: "deleted",
          field: "Deleted Machinery",
          newValue: machineryData.deleteMachineryInformations,
          description: `${machineryData.deleteMachineryInformations.length} machinery item(s) deleted`
        });
      }
    }

    // Check similar membership inquiry changes
    if (updatedData.similarMembershipInquiry && hasData(updatedData.similarMembershipInquiry)) {
      const inquiryData = updatedData.similarMembershipInquiry;
      const changesList = [];
      
      if (inquiryData.org_details) changesList.push(`Organization details: ${inquiryData.org_details}`);
      if (inquiryData.previous_application_details) changesList.push(`Previous application: ${inquiryData.previous_application_details}`);
      if (inquiryData.is_member_of_similar_org) changesList.push(`Member of similar org: ${inquiryData.is_member_of_similar_org}`);
      if (inquiryData.has_applied_earlier) changesList.push(`Applied earlier: ${inquiryData.has_applied_earlier}`);
      if (inquiryData.is_valid_member) changesList.push(`Valid member: ${inquiryData.is_valid_member}`);
      if (inquiryData.is_executive_member) changesList.push(`Executive member: ${inquiryData.is_executive_member}`);

      if (changesList.length > 0) {
        changes.push({
          type: "updated",
          field: "Membership Inquiry",
          newValue: inquiryData,
          description: changesList.join(", ")
        });
      }
    }

    return changes;
  };

  // Handle approval
  const handleApprove = async (changeId: string) => {
    if (!session?.user?.token) return;

    console.log({
          pendingChangeId: changeId,
          action: "APPROVED"
        });

    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/approve_decline_member_changes`,
        {
          pendingChangeId: changeId,
          action: "APPROVED"
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
          description: "Changes approved successfully",
        });
        
        // Update the approval status instead of removing
        setPendingChanges(prev => prev.map(change => 
          change.id === changeId 
            ? { ...change, approvalStatus: "APPROVED" }
            : change
        ));
        
        if (selectedChange?.id === changeId) {
          setShowDetailsDialog(false);
          setSelectedChange(null);
        }
      }
    } catch (error) {
      console.error("Error approving changes:", error);
      toast({
        title: "Error",
        description: "Failed to approve changes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline
  const handleDecline = async (changeId: string) => {
    if (!session?.user?.token) return;

    // Show decline dialog if no reason provided
    if (!declineReason.trim()) {
      setSelectedChange(pendingChanges.find(change => change.id === changeId) || null);
      setShowDeclineDialog(true);
      setDeclineError(""); // Clear any previous errors
      return;
    }

    setIsProcessing(true);
    setDeclineError(""); // Clear any previous errors
    
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/approve_decline_member_changes`,
        {
          pendingChangeId: changeId,
          action: "DECLINED",
          declineReason: declineReason.trim()
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
          description: "Changes declined successfully",
        });
        
        // Update the approval status instead of removing
        setPendingChanges(prev => prev.map(change => 
          change.id === changeId 
            ? { ...change, approvalStatus: "DECLINED" }
            : change
        ));
        
        setShowDeclineDialog(false);
        setDeclineReason("");
        setDeclineError("");
        
        if (selectedChange?.id === changeId) {
          setShowDetailsDialog(false);
          setSelectedChange(null);
        }
      }
    } catch (error: any) {
      console.error("Error declining changes:", error);
      
      // Show error in dialog instead of toast
      const errorMessage = error.response?.data?.message || error.message || "Failed to decline changes";
      setDeclineError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline submission from dialog
  const handleDeclineSubmit = async () => {
    if (!selectedChange || !declineReason.trim()) return;
    await handleDecline(selectedChange.id);
  };

  // Get change type badge
  const getChangeTypeBadge = (changes: ChangeDetails[]) => {
    const types = changes.map(c => c.type);
    if (types.includes("added")) return <Badge variant="default" className="bg-green-100 text-green-800">Added</Badge>;
    if (types.includes("deleted")) return <Badge variant="destructive">Deleted</Badge>;
    if (types.includes("updated")) return <Badge variant="secondary">Updated</Badge>;
    return <Badge variant="outline">Modified</Badge>;
  };

  // Filter pending changes based on approval status
  const filteredPendingChanges = pendingChanges.filter((change) => {
    if (approvalStatusFilter === "all") return true;
    return change.approvalStatus === approvalStatusFilter;
  });

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Approval Pending" }]} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading pending changes...</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Approval Pending" }]} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Approval For Changes</h1>
          <div className="flex items-center gap-4">
            <Select
              value={approvalStatusFilter}
              onValueChange={setApprovalStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-sm">
              {filteredPendingChanges.length} of {pendingChanges.length} changes
            </Badge>
          </div>
        </div>

        {filteredPendingChanges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {pendingChanges.length === 0 ? "No Pending Changes" : "No Changes Found"}
              </h3>
              <p className="text-muted-foreground text-center">
                {pendingChanges.length === 0 
                  ? "All member changes have been processed. Check back later for new pending changes."
                  : `No changes found with "${approvalStatusFilter}" status. Try adjusting the filter.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPendingChanges.map((change) => {
              const changes = extractChanges(change.updatedData);
              
              return (
                <Card key={change.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold">{change.membershipId}</span>
                        </div>
                        {getChangeTypeBadge(changes)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(change.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
                        <Badge variant={change.approvalStatus === "PENDING" ? "destructive" : change.approvalStatus === "APPROVED" ? "default" : "destructive"}>
                          {change.approvalStatus}
                        </Badge>
                      </div>
                      
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        Modified by: {change.modifiedByEditor.fullName}
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
                          setSelectedChange(change);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Show Changes
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(change.id)}
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
                          setSelectedChange(change);
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
                Change Details - {selectedChange?.membershipId}
              </DialogTitle>
              <DialogDescription>
                Review the changes made by {selectedChange?.modifiedByEditor.fullName} on{" "}
                {selectedChange && format(new Date(selectedChange.modifiedAt), "MMM dd, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>

            {selectedChange && (
              <div className="space-y-4">
                {extractChanges(selectedChange.updatedData).map((change, index) => (
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
              {selectedChange && (
                <>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(selectedChange.id)}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/90"
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
                Decline Changes
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for declining the changes for {selectedChange?.membershipId}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
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
                  setDeclineReason("");
                  setDeclineError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineSubmit}
                disabled={isProcessing || !declineReason.trim()}
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

export default ApprovalPendingPage;
