"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { string, z } from "zod";
import { Check, ChevronRight, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Step1PersonalBusiness from "@/components/add-member/step-1-personal-business";
import Step2OperationDetails from "@/components/add-member/step-2-operation-details";
import Step3ComplianceLegal from "@/components/add-member/step-3-compliance-legal";
import Step4MembershipDocs from "@/components/add-member/step-4-membership-docs";
import Step5ProposerDeclaration from "@/components/add-member/step-5-proposer-declaration";
import { getMemberById, addMember, updateMember } from "@/data/members";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { renderRoleBasedPath } from "@/lib/utils";

// Define the form schema
const formSchema = z.object({
  membershipType: z.enum(["TSMWA", "TQMWA"]).default("TSMWA"),
  applicationDetails: z.object({
    electricalUscNumber: z.string().min(1, "USC Number is required"),
    dateOfApplication: z.string().min(1, "Date is required"),
    scNumber: z.string().min(1, "USC Number is required"),
  }),
  memberDetails: z.object({
    applicantName: z.string().min(1, "Name is required"),
    relation: z.string().min(1, "Relation is required"),
    relativeName: z.string().min(1, "Name is required"),
  }),
  firmDetails: z.object({
    firmName: z.string().min(1, "Firm name is required"),
    proprietorName: z.string().min(1, "Proprietor name is required"),
    contact1: z.string().min(10, "Contact1 number is required"),
    contact2: z.string().optional(),
  }),
  businessDetails: z.object({
    surveyNumber: z.string().min(1, "Survey number is required"),
    village: z.string().min(1, "Village is required"),
    zone: z.string().min(1, "Zone is required"),
    mandal: z.string().min(1, "Mandal is required"),
    district: z.string().min(1, "District is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().length(6, "Pincode must be 6 digits"),
    ownershipType: z.string().min(1, "Ownership type is required"),
    ownerSubType: z.string().optional(),
  }),
  electricalDetails: z.object({
    sanctionedHP: z.string(),
    machinery: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.string(),
          chasisNumber: z.string(),
        })
      )
      .default([]),
  }),
  branchDetails: z.object({
    branches: z
      .array(
        z.object({
          placeBusiness: z.string(),
          proprietorStatus: z.string(),
          proprietorType: z.string().optional(),
          electricalUscNumber: z.string(),
          scNumber: z.string(), // Added SC Number field
          sanctionedHP: z.string(),
          machinery: z
            .array(
              z.object({
                type: z.string(), // Changed from name to type
                customName: z.string().optional(), // For "Others" type
                quantity: z.string(),
              })
            )
            .default([]),
          labour: z // Renamed from workers to labour
            .array(
              z.object({
                name: z.string(),
                aadharNumber: z.string(),
                eshramCardNumber: z.string(), // Added Eshram Card Number
                employedFrom: z.string(), // Added Employed From date
                employedTo: z.string().optional(), // Added Employed To date (optional)
                esiNumber: z.string().optional(), // Added ESI Number (optional)
                status: z.string(), // Added Status dropdown
              })
            )
            .default([]),
        })
      )
      .default([]),
  }),
  labourDetails: z.object({
    estimatedMaleWorkers: z.string(),
    estimatedFemaleWorkers: z.string(),
    workers: z
      .array(
        z.object({
          name: z.string(),
          aadharNumber: z.string(),
          photo: z.string().nullable().default(null),
        })
      )
      .default([]),
  }),
  complianceDetails: z.object({
    gstinNo: z.string(),
    factoryLicenseNo: z.string(),
    tspcbOrderNo: z.string(),
    mdlNo: z.string(),
    udyamCertificateNo: z.string(),
  }),
  communicationDetails: z.object({
    fullAddress: z.string(),
  }),
  representativeDetails: z.object({
    partners: z
      .array(
        z.object({
          name: z.string(),
          contactNo: z.string(),
          aadharNo: z.string(),
        })
      )
      .default([]),
  }),
  membershipDetails: z.object({
    isMemberOfOrg: z.string(),
    orgDetails: z.string().optional(),
    hasAppliedEarlier: z.string(),
    previousApplicationDetails: z.string().optional(),
  }),
  documentDetails: z.object({
    saleDeedElectricityBill: z.any().optional(),
    rentalDeed: z.any().optional(),
    partnershipDeed: z.any().optional(),
    additionalDocuments: z.any().optional(),
  }),
  proposer1: z.object({
    name: z.string(),
    firmName: z.string(),
    address: z.string(),
  }),
  proposer2: z.object({
    name: z.string(),
    firmName: z.string(),
    address: z.string(),
  }),
  declaration: z.object({
    agreeToTerms: z.boolean(),
    photoUpload: z.any().optional(),
    signatureUpload: z.any().optional(),
  }),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddMember = ({
  meterId,
  editMode,
}: {
  meterId: string;
  editMode: boolean;
}) => {
  const router = useRouter();
  const memberId = meterId;
  const isEditMode = editMode;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipType: "TSMWA",
      applicationDetails: {
        electricalUscNumber: "",
        dateOfApplication: new Date().toISOString().split("T")[0],
        scNumber: "",
      },
      memberDetails: {
        applicantName: "",
        relation: "",
        relativeName: "",
      },
      firmDetails: {
        firmName: "",
        proprietorName: "",
        contact1: "",
        contact2: "",
      },
      businessDetails: {
        surveyNumber: "",
        village: "",
        zone: "",
        mandal: "",
        district: "",
        state: "",
        pincode: "",
        ownershipType: "",
        ownerSubType: "",
      },
      electricalDetails: {
        sanctionedHP: "",
        machinery: [],
      },
      branchDetails: {
        branches: [],
      },
      labourDetails: {
        estimatedMaleWorkers: "",
        estimatedFemaleWorkers: "",
        workers: [],
      },
      complianceDetails: {
        gstinNo: "",
        factoryLicenseNo: "",
        tspcbOrderNo: "",
        mdlNo: "",
        udyamCertificateNo: "",
      },
      communicationDetails: {
        fullAddress: "",
      },
      representativeDetails: {
        partners: [],
      },
      membershipDetails: {
        isMemberOfOrg: "",
        hasAppliedEarlier: "",
      },
      documentDetails: {},
      proposer1: {
        name: "",
        firmName: "",
        address: "",
      },
      proposer2: {
        name: "",
        firmName: "",
        address: "",
      },
      declaration: {
        agreeToTerms: false,
      },
    },
    mode: "onChange",
  });

  // Load member data if in edit mode
  useEffect(() => {
    if (isEditMode && memberId) {
      setIsLoading(true);
      // In a real app, this would be an API call
      const member = getMemberById(memberId);

      if (member) {
        // Reset form with member data
        methods.reset({
          applicationDetails: member.applicationDetails,
          memberDetails: member.memberDetails,
          firmDetails: member.firmDetails,
          businessDetails: member.businessDetails,
          electricalDetails: member.electricalDetails,
          branchDetails: member.branchDetails,
          labourDetails: member.labourDetails,
          complianceDetails: member.complianceDetails,
          communicationDetails: member.communicationDetails,
          representativeDetails: member.representativeDetails,
          membershipDetails: member.membershipDetails,
          documentDetails: member.documentDetails,
          proposer1: member.proposer1,
          proposer2: member.proposer2,
          declaration: member.declaration,
        });
      }
      setIsLoading(false);
    }
  }, [isEditMode, memberId, methods]);

  const totalSteps = 5;

  const nextStep = async () => {
    const isValid = await methods.trigger(
      getFieldsToValidateForStep(currentStep)
    );
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: FormValues) => {
    setFormData(data);
    setIsSubmitting(true);
    try {
      // Here you would send the data to your API
      if (isEditMode && memberId) {
        // Update existing member
        const updatedMember = updateMember(memberId, {
          ...data,
          status: "active", // Maintain existing status
          joinDate: new Date().toISOString().split("T")[0], // Update join date
        });
        console.log("Member updated:", updatedMember);
      } else {
        // Add new member
        const newMember = addMember({
          ...data,
          status: "pending",
          joinDate: new Date().toISOString().split("T")[0],
        });
        console.log("New member added:", newMember);
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success message
      alert(
        isEditMode
          ? "Member updated successfully!"
          : "Member added successfully!"
      );

      // Redirect to memberships page
      router.push("/memberships");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    console.log(role);
    setUserRole(role);
  }, []);

  const handleSubmit = (data: FormValues) => {
    setFormData(data);

    if (isEditMode) {
      // For edit mode, show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // For new member, directly submit
      processSubmit(data);
    }
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);

    if (userRole === "admin") {
      // Admin can directly submit
      if (formData) processSubmit(formData);
    } else {
      // Editor needs OTP verification
      setShowOtpDialog(true);
    }
  };

  const verifyOtp = () => {
    if (otp === "1234") {
      // OTP is correct
      setOtpError("");
      setShowOtpDialog(false);
      if (formData) processSubmit(formData);
    } else {
      // OTP is incorrect
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const processSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Here you would send the data to your API
      if (isEditMode && memberId) {
        // Update existing member
        const updatedMember = updateMember(memberId, {
          ...data,
          status: data.status || "active", // Use selected status or default to active
          joinDate: new Date().toISOString().split("T")[0], // Update join date
        });
        console.log("Member updated:", updatedMember);
      } else {
        // Add new member
        const newMember = addMember({
          ...data,
          status: data.status || "pending", // Use selected status or default to pending
          joinDate: new Date().toISOString().split("T")[0],
        });
        console.log("New member added:", newMember);
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success message
      alert(
        isEditMode
          ? "Member updated successfully!"
          : "Member added successfully!"
      );

      // Redirect to memberships page
      router.push(`/${renderRoleBasedPath(userRole)}/memberships`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to determine which fields to validate for each step
  const getFieldsToValidateForStep = (step: number): (keyof FormValues)[] => {
    switch (step) {
      case 1:
        return [
          "applicationDetails",
          "memberDetails",
          "firmDetails",
          "businessDetails",
        ];
      case 2:
        return ["electricalDetails", "branchDetails", "labourDetails"];
      case 3:
        return [
          "complianceDetails",
          "communicationDetails",
          "representativeDetails",
        ];
      case 4:
        return ["membershipDetails", "documentDetails"];
      case 5:
        return ["proposer1", "proposer2", "declaration"];
      default:
        return [];
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.push("/memberships");
    }
  };

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Add Memberships" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <p className="mt-4 text-muted-foreground">Loading member data...</p>
        </div>
      </SidebarInset>
    );
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <SidebarInset>
      <Header
        breadcrumbs={
          isEditMode
            ? [{ label: "Edit Memberships" }]
            : [{ label: "Add Memberships" }]
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div className=" flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">
            {" "}
            {isEditMode ? "Edit Memberships" : "Add Memberships"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditMode ? "Edit Member Details" : "Add New Member"}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? "Update member information by completing all required fields"
                : "Complete all steps to register a new member"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex justify-between">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                      ${
                        currentStep > index + 1
                          ? "bg-primary border-primary text-primary-foreground"
                          : currentStep === index + 1
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > index + 1 ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 text-center max-w-[80px] 
                    ${
                      currentStep >= index + 1
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    >
                      {index === 0 && "Personal & Business"}
                      {index === 1 && "Operation Details"}
                      {index === 2 && "Compliance & Legal"}
                      {index === 3 && "Membership & Docs"}
                      {index === 4 && "Proposer & Declaration"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative mt-2">
                <div className="absolute top-0 left-0 h-1 bg-muted w-full"></div>
                <div
                  className="absolute top-0 left-0 h-1 bg-primary transition-all"
                  style={{
                    width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Form Steps */}
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                {currentStep === 1 && <Step1PersonalBusiness />}
                {currentStep === 2 && (
                <Step2OperationDetails
                  validationErrors={{}}
                  validationSuccess={{}}
                  onFieldChange={() => {}}
                  isValidating={false}
                />
              )}
                {currentStep === 3 && <Step3ComplianceLegal />}
                {currentStep === 4 && <Step4MembershipDocs />}
                {currentStep === 5 && (
                  <>
                    <Step5ProposerDeclaration />

                    {/* Status dropdown for admin only */}
                    {userRole === "admin" && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium border-b pb-2 mb-4">
                          Membership Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={methods.watch("status") || "pending"}
                              onValueChange={(value) =>
                                methods.setValue("status", value)
                              }
                            >
                              <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
                                <SelectItem value="approved">
                                  Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </form>
            </FormProvider>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={methods.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Updating" : "Submitting"}
                  </>
                ) : isEditMode ? (
                  "Update Member"
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Changes</DialogTitle>
              <DialogDescription>
                Are you sure you want to save the changes to this member?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                No
              </Button>
              <Button onClick={confirmSubmit}>Yes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Dialog */}
        <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>OTP Verification</DialogTitle>
              <DialogDescription>
                Please enter the OTP sent to your registered mobile number to
                proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <FormLabel htmlFor="otp">OTP</FormLabel>
                <Input
                  id="otp"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {otpError && (
                  <p className="text-sm font-medium text-destructive">
                    {otpError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  For demo purposes, the OTP is 1234
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
                Cancel
              </Button>
              <Button onClick={verifyOtp}>Verify</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarInset>
  );
};

export default AddMember;
