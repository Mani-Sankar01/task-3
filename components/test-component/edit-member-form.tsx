"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
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
          id: z.number().optional(),
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
                id: z.number().optional(),
                type: z.string().min(4, "Machinery Type is required"),
                customName: z.string().optional(),
                quantity: z.string().min(1, "Machinery quantity is required"),
              })
            )
            .default([]),
          labour: z
            .array(
              z.object({
                id: z.number().optional(),
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
          id: z.number().optional(),
          name: z.string().min(6, "Name is required"),
          contactNo: z.string().min(10, "Contact is required"),
          aadharNo: z.string().min(10, "Aadhar No is required"),
          pan: z.string().min(10, "PAN No is required"), // Replace with actual PAN from form
          email: z.string().min(4, "Emailis required"), // Replace with actual email
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
    additionalAttachments: z.array(
      z.object({
        id: z.number().optional(),
        membershipId: z.string(),
        name: z.string(),
        file: z.any().optional(),
      })
    ),
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

const EditMemberForm = ({ memberId }: { memberId: string }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, status } = useSession();

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
      documentDetails: {
        additionalAttachments: [],
      },
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

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

    const fetchData = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await axios.get(
          `https://tandurmart.com/api/member/get_member/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const reponseData = response.data;
        console.log(JSON.stringify(reponseData));

        const mappedData: FormValues = {
          applicationDetails: {
            electricalUscNumber: reponseData.electricalUscNumber,
            dateOfApplication: reponseData.doj, // or from API if available
            scNumber: reponseData.scNumber,
          },
          memberDetails: {
            applicantName: reponseData.applicantName,
            relation: reponseData.relation,
            relativeName: reponseData.relativeName,
          },
          firmDetails: {
            firmName: reponseData.firmName,
            proprietorName: reponseData.proprietorName,
            contact1: reponseData.phoneNumber1,
            contact2: reponseData.phoneNumber2 || "",
          },
          businessDetails: {
            surveyNumber: reponseData.surveyNumber,
            village: reponseData.village,
            zone: reponseData.zone,
            mandal: reponseData.mandal,
            district: reponseData.district,
            state: reponseData.state,
            pincode: reponseData.pinCode,
            ownershipType: reponseData.proprietorStatus,
            ownerSubType: reponseData.proprietorType || "",
          },
          electricalDetails: {
            sanctionedHP: reponseData.sanctionedHP.toString(),
            machinery: [],
          },
          branchDetails: {
            branches: Array.isArray(reponseData.branches)
              ? reponseData.branches.map((b: any) => ({
                  id: b.id || "",
                  placeOfBusiness: b.placeOfBusiness || "",
                  proprietorStatus: b.proprietorStatus || "",
                  proprietorType: b.proprietorType || "",
                  electricalUscNumber: b.electricalUscNumber || "",
                  scNumber: b.scNumber || "",
                  sanctionedHP: b.sanctionedHP?.toString() || "0",

                  machinery: Array.isArray(b.machineryInformations)
                    ? b.machineryInformations.map((m: any) => ({
                        id: m.id,
                        type: m.machineName || "",
                        customName: "", // Or map from API if available
                        quantity: m.machineCount?.toString() || "0",
                      }))
                    : [],

                  labour: Array.isArray(b.labour)
                    ? b.labour.map((l: any) => ({
                        name: l.name || "",
                        aadharNumber: l.aadharNumber || "",
                        eshramCardNumber: l.eshramCardNumber || "",
                        employedFrom: l.employedFrom || "",
                        employedTo: l.employedTo || "",
                        esiNumber: l.esiNumber || "",
                        status: l.status || "Active",
                      }))
                    : [],
                }))
              : [],
          },
          labourDetails: {
            estimatedMaleWorkers:
              reponseData.estimatedMaleWorker?.toString() || "0",
            estimatedFemaleWorkers:
              reponseData.estimatedFemaleWorker?.toString() || "0",
            workers: [],
          },
          complianceDetails: {
            gstinNo: reponseData.complianceDetails?.gstInNumber || "",
            factoryLicenseNo:
              reponseData.complianceDetails?.factoryLicenseNumber || "",
            tspcbOrderNo: reponseData.complianceDetails?.tspcbOrderNumber || "",
            mdlNo: reponseData.complianceDetails?.mdlNumber || "",
            udyamCertificateNo:
              reponseData.complianceDetails?.udyamCertificateNumber || "",
          },
          communicationDetails: {
            fullAddress: reponseData.complianceDetails?.fullAddress || "",
          },
          representativeDetails: {
            partners: (reponseData.partnerDetails || []).map((p: any) => ({
              id: p.id,
              name: p.partnerName,
              contactNo: p.contactNumber,
              aadharNo: p.partnerAadharNo,
              email: p.emailId,
              pan: p.partnerPanNo,
            })),
          },
          membershipDetails: {
            isMemberOfOrg:
              reponseData.similarMembershipInquiry?.is_member_of_similar_org ===
              "TRUE"
                ? "yes"
                : "no",
            hasAppliedEarlier:
              reponseData.similarMembershipInquiry?.has_applied_earlier ===
              "TRUE"
                ? "yes"
                : "no",
            isValidMember:
              reponseData.similarMembershipInquiry?.is_valid_member === "TRUE"
                ? "yes"
                : "no",
            isExecutiveMember:
              reponseData.similarMembershipInquiry?.is_executive_member ===
              "TRUE"
                ? "yes"
                : "no",
          },
          documentDetails: {
            additionalAttachments: (reponseData.attachments || []).map(
              (a: any) => ({
                id: a.id || "",
                name: a.documentName,
                file: a.documentPath,
                membershipId: a.membershipId,
              })
            ),
          },
          proposer1: {
            name: reponseData.proposer?.name || "",
            firmName: reponseData.proposer?.firmName || "",
            membershipId: reponseData.proposer?.proposerID || "",
            address: reponseData.proposer?.address || "",
          },
          proposer2: {
            name: reponseData.executiveProposer?.name || "",
            firmName: reponseData.executiveProposer?.firmName || "",
            membershipId: reponseData.executiveProposer?.proposerID || "",
            address: reponseData.executiveProposer?.address || "",
          },
          declaration: {
            agreeToTerms:
              reponseData.declarations?.agreesToTerms === "TRUE" ? true : false,
          },
        };
        console.log(mappedData);
        methods.reset({
          applicationDetails: mappedData.applicationDetails,
          memberDetails: mappedData.memberDetails,
          firmDetails: mappedData.firmDetails,
          businessDetails: mappedData.businessDetails,
          electricalDetails: mappedData.electricalDetails,
          branchDetails: mappedData.branchDetails,
          labourDetails: mappedData.labourDetails,
          complianceDetails: mappedData.complianceDetails,
          communicationDetails: mappedData.communicationDetails,
          representativeDetails: mappedData.representativeDetails,
          membershipDetails: mappedData.membershipDetails,
          documentDetails: mappedData.documentDetails,
          proposer1: mappedData.proposer1,
          proposer2: mappedData.proposer2,
          declaration: mappedData.declaration,
        });
        // set form data here if needed
      } catch (err: any) {
        console.error("Error fetching member data:", err);
        alert("Failed to load member data");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [status, session?.user?.token, memberId]);

  const totalSteps = 5;

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

  const handleBack = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      router.push("/admin/memberships");
    }
  };

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
    //   setFormData(data);
    setIsSubmitting(true);

    try {
      alert("Data");
      console.log(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to add member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="p-4 text-muted-foreground">Fetching member data...</div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="flex items-center">
        <Button variant="outline" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Memberships</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Member Details</CardTitle>
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

export default EditMemberForm;
