"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import axios from "axios";
import { useSession } from "next-auth/react";
// import { addMemberAction } from "@/app/actions/member-actions";

// Define the form schema
const formSchema = z.object({
  applicationDetails: z.object({
    electricalUscNumber: z.string().min(1, "USC Number is required"),
    dateOfApplication: z.string().min(1, "Date is required"),
    scNumber: z.string().min(1, "SC Number is required"),
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
    sanctionedHP: z.string().min(1, "sanctionedHP is required"),
    machinery: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.string(),
          type: z.string(),
        })
      )
      .default([]),
  }),
  branchDetails: z.object({
    branches: z
      .array(
        z.object({
          placeOfBusiness: z.string().min(1, "Place Business is required"),
          proprietorStatus: z.string().min(1, "Proprietor Status is required"),
          proprietorType: z.string().optional(),
          electricalUscNumber: z
            .string()
            .min(4, "Electrical Usc Number is required"),
          scNumber: z.string().min(4, "SC Number is required"),
          sanctionedHP: z.string().min(1, "SC Number is required"),
          machinery: z
            .array(
              z.object({
                type: z.string().min(4, "Machinery Type is required"),
                customName: z.string().optional(),
                quantity: z.string().min(1, "Machinery quantity is required"),
              })
            )
            .default([]),
          labour: z
            .array(
              z.object({
                name: z.string(),
                aadharNumber: z.string(),
                eshramCardNumber: z.string(),
                employedFrom: z.string(),
                employedTo: z.string().optional(),
                esiNumber: z.string().optional(),
                status: z.string(),
              })
            )
            .default([]),
        })
      )
      .default([]),
  }),
  labourDetails: z.object({
    estimatedMaleWorkers: z.string().min(1, "Male Workers is required"),
    estimatedFemaleWorkers: z.string().min(1, "Female Workers is required"),
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
    fullAddress: z.string().min(10, "Full Address is required"),
  }),
  representativeDetails: z.object({
    partners: z
      .array(
        z.object({
          name: z.string().min(6, "Name is required"),
          contactNo: z.string().min(10, "Contact is required"),
          aadharNo: z.string().min(10, "Aadhar No is required"),
          pan: z.string().min(10, "Pan No is required"),
          email: z.string().min(4, "Email No is required"),
        })
      )
      .default([]),
  }),
  membershipDetails: z.object({
    isMemberOfOrg: z
      .string()
      .min(1, "Select you a member of any similar organization or not ?"),
    orgDetails: z.string().optional(),
    hasAppliedEarlier: z
      .string()
      .min(1, "Select if you applied for membership earlier?"),
    previousApplicationDetails: z.string().optional(),
    isValidMember: z.string().min(1, "Select is Valid member or not"),
    isExecutiveMember: z
      .string()
      .min(1, "Select is an Executive member or not"),
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
    membershipId: z.string(),
    address: z.string(),
  }),
  proposer2: z.object({
    name: z.string(),
    firmName: z.string(),
    membershipId: z.string(),
    address: z.string(),
  }),
  declaration: z.object({
    agreeToTerms: z.boolean(),
    photoUpload: z.any().optional(),
    signatureUpload: z.any().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const AddMemberForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status == "loading" || status === "authenticated") {
      setIsLoading(true);
    }
    setIsLoading(false);
  }, [status, session]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
        membershipId: "",
        address: "",
      },
      proposer2: {
        name: "",
        firmName: "",
        membershipId: "",
        address: "",
      },
      declaration: {
        agreeToTerms: false,
      },
    },
    mode: "onChange",
  });

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

  const handleSubmit = async (data: FormValues) => {
    setFormData(data);
    setIsSubmitting(true);

    try {
      // Call the server action to add a new member
      //   const result = await addMemberAction(data);
      // console.log(JSON.stringify(data));
      const reqData = {
        electricalUscNumber: data.applicationDetails.electricalUscNumber,
        scNumber: data.applicationDetails.scNumber,
        applicantName: data.memberDetails.applicantName,
        relation: data.memberDetails.relation || "SO",
        doj: data.applicationDetails.dateOfApplication,
        relativeName: data.memberDetails.relativeName,
        gender: "MALE", // hardcoded or can be added to form

        firmName: data.firmDetails.firmName,
        proprietorName: data.firmDetails.proprietorName,
        phoneNumber1: data.firmDetails.contact1,
        phoneNumber2: data.firmDetails.contact2,

        surveyNumber: data.businessDetails.surveyNumber,
        village: data.businessDetails.village,
        zone: data.businessDetails.zone,
        mandal: data.businessDetails.mandal,
        district: data.businessDetails.district,
        state: data.businessDetails.state,
        pinCode: data.businessDetails.pincode,

        proprietorStatus:
          data.businessDetails.ownershipType?.toUpperCase() || "OWNER",
        proprietorType:
          data.businessDetails.ownerSubType?.toUpperCase() || "OWNED",

        sanctionedHP: parseFloat(data.electricalDetails.sanctionedHP),

        partnerDetails: data.representativeDetails.partners.map((partner) => ({
          partnerName: partner.name,
          partnerAadharNo: partner.aadharNo,
          partnerPanNo: partner.pan, // Replace with actual PAN from form
          contactNumber: partner.contactNo,
          emailId: partner.email, // Replace with actual email
        })),

        estimatedMaleWorker: parseInt(data.labourDetails.estimatedMaleWorkers),
        estimatedFemaleWorker: parseInt(
          data.labourDetails.estimatedFemaleWorkers
        ),

        machineryInformations: data.electricalDetails.machinery.map(
          (machine) => ({
            machineName: machine.name || machine.type || "Unknown",
            machineCount: parseInt(machine.quantity),
          })
        ),

        branches: data.branchDetails.branches.map((branch) => ({
          electricalUscNumber: branch.electricalUscNumber,
          scNumber: branch.scNumber,
          proprietorType: branch.proprietorType?.toUpperCase() || "OWNED",
          proprietorStatus: branch.proprietorStatus?.toUpperCase() || "OWNER",
          sanctionedHP: parseFloat(branch.sanctionedHP),
          placeOfBusiness: branch.placeOfBusiness,
          machineryInformations: branch.machinery.map((m) => ({
            machineName: m.type || m.customName || "Custom",
            customName: m.customName || "",
            machineCount: parseInt(m.quantity),
          })),
        })),

        complianceDetails: {
          gstInNumber: data.complianceDetails.gstinNo,
          gstInCertificatePath: "/uploads/gstin.pdf",
          factoryLicenseNumber: data.complianceDetails.factoryLicenseNo,
          factoryLicensePath: "/uploads/factory-license.pdf",
          tspcbOrderNumber: data.complianceDetails.tspcbOrderNo,
          tspcbCertificatePath: "/uploads/tspcb.pdf",
          mdlNumber: data.complianceDetails.mdlNo,
          mdlCertificatePath: "/uploads/mdl.pdf",
          udyamCertificateNumber: data.complianceDetails.udyamCertificateNo,
          udyamCertificatePath: "/uploads/udyam.pdf",
          fullAddress: data.communicationDetails.fullAddress,
          partnerName: data.representativeDetails.partners[0]?.name || "",
          contactNumber:
            data.representativeDetails.partners[0]?.contactNo || "",
          AadharNumber: data.representativeDetails.partners[0]?.aadharNo || "",
          emailId: data.representativeDetails.partners[0]?.email,
          panNumber: data.representativeDetails.partners[0]?.pan,
        },

        similarMembershipInquiry: {
          is_member_of_similar_org:
            data.membershipDetails.isMemberOfOrg === "yes" ? "TRUE" : "FALSE",
          has_applied_earlier:
            data.membershipDetails.hasAppliedEarlier === "yes"
              ? "TRUE"
              : "FALSE",
          is_valid_member:
            data.membershipDetails.isValidMember === "yes" ? "TRUE" : "FALSE",
          is_executive_member:
            data.membershipDetails.isExecutiveMember === "yes"
              ? "TRUE"
              : "FALSE",
        },

        attachments: [
          {
            documentName: "Sale Deed or Electricity Bill",
            documentPath: "/uploads/sale-deed.pdf",
          },
          {
            documentName: "Rental Deed",
            documentPath: "/uploads/rental-deed.pdf",
          },
          {
            documentName: "Partnership Deed",
            documentPath: "/uploads/partnership-deed.pdf",
          },
        ],

        proposer: {
          proposerID: data.proposer1.membershipId,
          signaturePath: "/uploads/proposer-signature.png",
        },

        executiveProposer: {
          proposerID: data.proposer2.membershipId,
          signaturePath: "/uploads/executive-signature.png",
        },

        declarations: {
          agreesToTerms: data.declaration.agreeToTerms ? "TRUE" : "FALSE",
          membershipFormPath: "/uploads/membership-form.pdf",
          applicationSignaturePath: "/uploads/app-signature.pdf",
        },
      };

      console.log(JSON.stringify(reqData));

      if (session?.user.token) {
        setIsSubmitting(true);
        const response = await axios.post(
          "https://tandurmart.com/api/member/add_member",
          reqData,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          const addedMember = response.data;
          setIsSubmitting(false);
          alert(
            `✅ Member added successfully! ID: ${
              addedMember?.memberId || "unknown"
            }`
          );
          router.push("/admin/memberships");
        } else {
          alert("⚠️ Something went wrong. Member not added.");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to add member. Please try again.");
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
      router.push("/admin/memberships");
    }
  };

  const handleBack = () => {
    router.push("/admin/memberships");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex items-center">
        <Button variant="outline" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Add Memberships</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Member</CardTitle>
          <CardDescription>
            Complete all steps to register a new member
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
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              {currentStep === 1 && <Step1PersonalBusiness />}
              {currentStep === 2 && <Step2OperationDetails />}
              {currentStep === 3 && <Step3ComplianceLegal />}
              {currentStep === 4 && <Step4MembershipDocs />}
              {currentStep === 5 && <Step5ProposerDeclaration />}
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
                  Submitting
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddMemberForm;
