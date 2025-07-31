"use client";

import { useEffect, useState, useRef } from "react";
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
import { uploadFile } from "@/lib/client-file-upload";
import PopupMessage from "@/components/ui/popup-message";

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
          id: z.number().optional(),
          type: z.string(),
          machineName: z.string().optional(),
          isOther: z.boolean().default(false),
          quantity: z.string(),
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
                machineName: z.string().optional(),
                isOther: z.boolean().default(false),
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
    gstinDoc: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    gstinExpiredAt: z.string().optional(),
    factoryLicenseNo: z.string(),
    factoryLicenseDoc: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    factoryLicenseExpiredAt: z.string().optional(),
    tspcbOrderNo: z.string(),
    tspcbOrderDoc: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    tspcbExpiredAt: z.string().optional(),
    mdlNo: z.string(),
    mdlDoc: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    mdlExpiredAt: z.string().optional(),
    udyamCertificateNo: z.string(),
    udyamCertificateDoc: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    udyamCertificateExpiredAt: z.string().optional(),
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
    saleDeedElectricityBill: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    saleDeedExpiredAt: z.string().optional(),
    rentalDeed: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    rentalDeedExpiredAt: z.string().optional(),
    partnershipDeed: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    partnershipDeedExpiredAt: z.string().optional(),
    additionalDocuments: z.any().optional(),
    additionalAttachments: z.array(
      z.object({
        id: z.number().optional(),
        membershipId: z.string(),
        name: z.string(),
        file: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
        expiredAt: z.string().optional(),
      })
    ),
  }),
  proposer1: z.object({
    name: z.string().optional(),
    firmName: z.string().optional(),
    membershipId: z.string().optional(),
    address: z.string().optional(),
  }),
  proposer2: z.object({
    name: z.string().optional(),
    firmName: z.string().optional(),
    membershipId: z.string().optional(),
    address: z.string().optional(),
  }),
  declaration: z.object({
    agreeToTerms: z.boolean(),
    photoUpload: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
    signatureUpload: z.union([z.instanceof(File), z.object({ existingPath: z.string().nullable() })]).optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const EditMemberForm = ({ memberId }: { memberId: string }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const originalDataRef = useRef<FormValues | null>(null);
  const [popupMessage, setPopupMessage] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    primaryButton?: {
      text: string;
      onClick: () => void;
      variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    };
    secondaryButton?: {
      text: string;
      onClick: () => void;
      variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    };
    showCloseButton?: boolean;
  } | null>(null);

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
        gstinDoc: { existingPath: null },
        gstinExpiredAt: "",
        factoryLicenseNo: "",
        factoryLicenseDoc: { existingPath: null },
        factoryLicenseExpiredAt: "",
        tspcbOrderNo: "",
        tspcbOrderDoc: { existingPath: null },
        tspcbExpiredAt: "",
        mdlNo: "",
        mdlDoc: { existingPath: null },
        mdlExpiredAt: "",
        udyamCertificateNo: "",
        udyamCertificateDoc: { existingPath: null },
        udyamCertificateExpiredAt: "",
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
          `${process.env.BACKEND_API_URL}/api/member/get_member/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );

        const reponseData = response.data;
        console.log("reponseData", JSON.stringify(reponseData));

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
            machinery: Array.isArray(reponseData.machineryInformations)
              ? reponseData.machineryInformations.map((m: any) => ({
                  id: m.id,
                  type: m.isOther === "TRUE" ? "Others" : (m.machineName || m.customName || ""),
                  machineName: m.isOther === "TRUE" ? m.machineName : "",
                  isOther: m.isOther === "TRUE",
                  quantity: m.machineCount?.toString() || "0",
                }))
              : [],
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
                    ? b.machineryInformations.map((m: any) => {
                        console.log("Mapping machinery item:", m);
                        const mappedItem = {
                          id: m.id,
                          type: m.isOther === "TRUE" ? "Others" : (m.machineName || m.customName || ""),
                          machineName: m.isOther === "TRUE" ? m.machineName : "",
                          isOther: m.isOther === "TRUE",
                          quantity: m.machineCount?.toString() || "0",
                        };
                        console.log("Mapped machinery item:", mappedItem);
                        return mappedItem;
                      })
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
            gstinDoc: { existingPath: reponseData.complianceDetails?.gstInCertificatePath || null },
            gstinExpiredAt: reponseData.complianceDetails?.gstExpiredAt ? new Date(reponseData.complianceDetails.gstExpiredAt).toISOString().split('T')[0] : "",
            factoryLicenseNo: reponseData.complianceDetails?.factoryLicenseNumber || "",
            factoryLicenseDoc: { existingPath: reponseData.complianceDetails?.factoryLicensePath || null },
            factoryLicenseExpiredAt: reponseData.complianceDetails?.factoryLicenseExpiredAt ? new Date(reponseData.complianceDetails.factoryLicenseExpiredAt).toISOString().split('T')[0] : "",
            tspcbOrderNo: reponseData.complianceDetails?.tspcbOrderNumber || "",
            tspcbOrderDoc: { existingPath: reponseData.complianceDetails?.tspcbCertificatePath || null },
            tspcbExpiredAt: reponseData.complianceDetails?.tspcbExpiredAt ? new Date(reponseData.complianceDetails.tspcbExpiredAt).toISOString().split('T')[0] : "",
            mdlNo: reponseData.complianceDetails?.mdlNumber || "",
            mdlDoc: { existingPath: reponseData.complianceDetails?.mdlCertificatePath || null },
            mdlExpiredAt: reponseData.complianceDetails?.mdlExpiredAt ? new Date(reponseData.complianceDetails.mdlExpiredAt).toISOString().split('T')[0] : "",
            udyamCertificateNo: reponseData.complianceDetails?.udyamCertificateNumber || "",
            udyamCertificateDoc: { existingPath: reponseData.complianceDetails?.udyamCertificatePath || null },
            udyamCertificateExpiredAt: reponseData.complianceDetails?.udyamCertificateExpiredAt ? new Date(reponseData.complianceDetails.udyamCertificateExpiredAt).toISOString().split('T')[0] : "",
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
            // Only keep additionalAttachments and other non-compliance docs here
            additionalAttachments: (reponseData.attachments || []).map(
              (a: any) => ({
                id: a.id || "",
                name: a.documentName,
                file: {
                  existingPath: a.documentPath,
                },
                expiredAt: a.expiredAt ? new Date(a.expiredAt).toISOString().split('T')[0] : "",
                membershipId: a.membershipId,
              })
            ),
          },
          proposer1: {
            name: "",
            firmName: "",
            membershipId: reponseData.proposer?.proposerID || "",
            address: "",
          },
          proposer2: {
            name: "",
            firmName: "",
            membershipId: reponseData.executiveProposer?.proposerID || "",
            address: "",
          },
          declaration: {
            agreeToTerms:
              reponseData.declarations?.agreesToTerms === "TRUE" ? true : false,
            photoUpload: {
              existingPath: reponseData.declarations?.membershipFormPath || null,
            },
            signatureUpload: {
              existingPath: reponseData.declarations?.applicationSignaturePath || null,
            },
          },
        };
        console.log("API Response:", JSON.stringify(reponseData, null, 2));
        console.log("Mapped Data:", JSON.stringify(mappedData, null, 2));
        console.log("Machinery from API:", reponseData.machineryInformations);
        console.log("Branch machinery from API:", reponseData.branches?.map((b: any) => ({
          branchId: b.id,
          machinery: b.machineryInformations
        })));
        console.log("Sample machinery item:", reponseData.branches?.[0]?.machineryInformations?.[0]);
        methods.reset(mappedData);
        originalDataRef.current = mappedData; // Store original for diffing
      } catch (err: any) {
        console.error("Error fetching member data:", err);
        setPopupMessage({
          isOpen: true,
          type: "error",
          title: "Load Failed",
          message: "Failed to load member data. Please try again.",
        });
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

  // Function to check if there are any changes
const checkForChanges = (data: FormValues, original: FormValues, uploadedFiles: Record<string, string>): boolean => {
  console.log("Checking for changes...");

    // Check basic fields
    const basicFields = [
      'applicationDetails', 'memberDetails', 'firmDetails', 'businessDetails',
      'electricalDetails', 'labourDetails', 'complianceDetails', 'communicationDetails',
      'representativeDetails', 'membershipDetails', 'documentDetails', 'proposer1', 'proposer2', 'declaration'
    ];

    for (const field of basicFields) {
      const dataValue = JSON.stringify(data[field as keyof FormValues]);
      const originalValue = JSON.stringify(original[field as keyof FormValues]);
      if (dataValue !== originalValue) {
        console.log(`Changes detected in field: ${field}`);
        console.log(`Data:`, data[field as keyof FormValues]);
        console.log(`Original:`, original[field as keyof FormValues]);
        
        // For representativeDetails, let's do a more detailed comparison
        if (field === 'representativeDetails') {
          const dataPartners = data.representativeDetails.partners || [];
          const originalPartners = original.representativeDetails.partners || [];
          
          if (dataPartners.length !== originalPartners.length) {
            console.log("Partner count changed");
            return true;
          }
          
          // Compare each partner individually
          for (let i = 0; i < dataPartners.length; i++) {
            const dataPartner = dataPartners[i];
            const originalPartner = originalPartners[i];
            
            if (dataPartner.name !== originalPartner.name ||
                dataPartner.contactNo !== originalPartner.contactNo ||
                dataPartner.aadharNo !== originalPartner.aadharNo ||
                dataPartner.email !== originalPartner.email ||
                dataPartner.pan !== originalPartner.pan) {
              console.log(`Partner ${i} changed`);
              return true;
            }
          }
          
          // If we get here, the partners are actually the same
          console.log("RepresentativeDetails appears to be the same, ignoring false positive");
          continue; // Skip this field and continue checking others
        }
        
        // For proposer1 and proposer2, only check membershipId changes
        if (field === 'proposer1' || field === 'proposer2') {
          const dataProposer = data[field as keyof FormValues] as any;
          const originalProposer = original[field as keyof FormValues] as any;
          
          if (dataProposer.membershipId !== originalProposer.membershipId) {
            console.log(`${field} membershipId changed`);
            return true;
          }
          
          // Ignore name, firmName, and address changes as they're not in the API
          console.log(`${field} appears to be the same, ignoring false positive`);
          continue; // Skip this field and continue checking others
        }
        
        return true;
      }
    }

    // Check branch details more thoroughly
    const origBranches = original.branchDetails.branches || [];
    const newBranches = data.branchDetails.branches || [];

    if (origBranches.length !== newBranches.length) {
      console.log("Changes detected: Branch count changed");
      return true;
    }

    for (let i = 0; i < newBranches.length; i++) {
      const origBranch = origBranches[i];
      const newBranch = newBranches[i];

      if (!origBranch || !newBranch) {
        return true;
      }

      // Check basic branch fields
      const branchFields = ['placeOfBusiness', 'proprietorStatus', 'proprietorType', 'electricalUscNumber', 'scNumber', 'sanctionedHP'];
      for (const field of branchFields) {
        if (origBranch[field as keyof typeof origBranch] !== newBranch[field as keyof typeof newBranch]) {
          return true;
        }
      }

      // Check machinery
      const origMachinery = origBranch.machinery || [];
      const newMachinery = newBranch.machinery || [];

      if (origMachinery.length !== newMachinery.length) {
        return true;
      }

      for (let j = 0; j < newMachinery.length; j++) {
        const origMachine = origMachinery[j];
        const newMachine = newMachinery[j];

        if (!origMachine || !newMachine) {
          return true;
        }

        if (origMachine.type !== newMachine.type ||
            origMachine.machineName !== newMachine.machineName ||
            origMachine.isOther !== newMachine.isOther ||
            origMachine.quantity !== newMachine.quantity) {
          return true;
        }
      }

      // Check labour
      const origLabour = origBranch.labour || [];
      const newLabour = newBranch.labour || [];

      if (origLabour.length !== newLabour.length) {
        return true;
      }

      for (let j = 0; j < newLabour.length; j++) {
        const origLab = origLabour[j];
        const newLab = newLabour[j];

        if (!origLab || !newLab) {
          return true;
        }

        if (origLab.name !== newLab.name ||
            origLab.aadharNumber !== newLab.aadharNumber ||
            origLab.eshramCardNumber !== newLab.eshramCardNumber ||
            origLab.employedFrom !== newLab.employedFrom ||
            origLab.employedTo !== newLab.employedTo ||
            origLab.esiNumber !== newLab.esiNumber ||
            origLab.status !== newLab.status) {
          return true;
        }
      }
    }

    console.log("No changes detected");
    return false;
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const original = originalDataRef.current;
      if (!original) throw new Error("Original data not loaded");

      // Check if there are any changes
      const hasChanges = checkForChanges(data, original, {});
      console.log("Change detection result:", hasChanges);
      
      if (!hasChanges) {
        setPopupMessage({
          isOpen: true,
          type: "warning",
          title: "No Changes Detected",
          message: "No changes have been made to the member data. Please make some changes before submitting.",
        });
        setIsSubmitting(false);
        return;
      }

      const reqData: any = { membershipId: memberId };

      // Helper to check if a value changed
      const changed = (key: keyof typeof data, subkey?: string) => {
        if (!subkey) return data[key] !== original[key];
        return (data[key] as any)[subkey] !== (original[key] as any)[subkey];
      };

      // Helper to check if original field was empty
      const wasEmpty = (key: keyof typeof data, subkey?: string) => {
        if (!subkey) {
          const value = original[key];
          return !value || (typeof value === 'string' && value === "");
        }
        const obj = original[key] as any;
        return !obj || !obj[subkey] || (typeof obj[subkey] === 'string' && obj[subkey] === "");
      };

      // Basic member fields
      if (changed("memberDetails", "applicantName")) {
        reqData.applicantName = data.memberDetails.applicantName;
        console.log("Added applicantName:", data.memberDetails.applicantName);
      }
      if (changed("firmDetails", "contact1")) {
        reqData.phoneNumber1 = data.firmDetails.contact1;
        console.log("Added phoneNumber1:", data.firmDetails.contact1);
      }
      if (changed("firmDetails", "contact2")) {
        reqData.phoneNumber2 = data.firmDetails.contact2;
        console.log("Added phoneNumber2:", data.firmDetails.contact2);
      }
      if (changed("firmDetails", "firmName")) {
        reqData.firmName = data.firmDetails.firmName;
        console.log("Added firmName:", data.firmDetails.firmName);
      }
      if (changed("firmDetails", "proprietorName")) {
        reqData.proprietorName = data.firmDetails.proprietorName;
        console.log("Added proprietorName:", data.firmDetails.proprietorName);
      }
      if (changed("memberDetails", "relation")) {
        reqData.relation = data.memberDetails.relation;
        console.log("Added relation:", data.memberDetails.relation);
      }
      if (changed("memberDetails", "relativeName")) {
        reqData.relativeName = data.memberDetails.relativeName;
        console.log("Added relativeName:", data.memberDetails.relativeName);
      }
      if (changed("applicationDetails", "electricalUscNumber")) {
        reqData.electricalUscNumber = data.applicationDetails.electricalUscNumber;
        console.log("Added electricalUscNumber:", data.applicationDetails.electricalUscNumber);
      }
      if (changed("applicationDetails", "scNumber")) {
        reqData.scNumber = data.applicationDetails.scNumber;
        console.log("Added scNumber:", data.applicationDetails.scNumber);
      }
      if (changed("applicationDetails", "dateOfApplication")) {
        reqData.doj = data.applicationDetails.dateOfApplication;
        console.log("Added doj:", data.applicationDetails.dateOfApplication);
      }
      if (changed("businessDetails", "surveyNumber")) {
        reqData.surveyNumber = data.businessDetails.surveyNumber;
        console.log("Added surveyNumber:", data.businessDetails.surveyNumber);
      }
      if (changed("businessDetails", "village")) {
        reqData.village = data.businessDetails.village;
        console.log("Added village:", data.businessDetails.village);
      }
      if (changed("businessDetails", "zone")) {
        reqData.zone = data.businessDetails.zone;
        console.log("Added zone:", data.businessDetails.zone);
      }
      if (changed("businessDetails", "mandal")) {
        reqData.mandal = data.businessDetails.mandal;
        console.log("Added mandal:", data.businessDetails.mandal);
      }
      if (changed("businessDetails", "district")) {
        reqData.district = data.businessDetails.district;
        console.log("Added district:", data.businessDetails.district);
      }
      if (changed("businessDetails", "state")) {
        reqData.state = data.businessDetails.state;
        console.log("Added state:", data.businessDetails.state);
      }
      if (changed("businessDetails", "pincode")) {
        reqData.pinCode = data.businessDetails.pincode;
        console.log("Added pinCode:", data.businessDetails.pincode);
      }
      if (changed("businessDetails", "ownershipType")) {
        reqData.proprietorStatus = data.businessDetails.ownershipType?.toUpperCase();
        console.log("Added proprietorStatus:", data.businessDetails.ownershipType?.toUpperCase());
      }
      if (changed("businessDetails", "ownerSubType")) {
        reqData.proprietorType = data.businessDetails.ownerSubType?.toUpperCase();
        console.log("Added proprietorType:", data.businessDetails.ownerSubType?.toUpperCase());
      }
      if (changed("electricalDetails", "sanctionedHP")) {
        reqData.sanctionedHP = parseFloat(data.electricalDetails.sanctionedHP);
        console.log("Added sanctionedHP:", parseFloat(data.electricalDetails.sanctionedHP));
      }
      if (changed("labourDetails", "estimatedMaleWorkers")) {
        reqData.estimatedMaleWorker = parseInt(data.labourDetails.estimatedMaleWorkers);
        console.log("Added estimatedMaleWorker:", parseInt(data.labourDetails.estimatedMaleWorkers));
      }
      if (changed("labourDetails", "estimatedFemaleWorkers")) {
        reqData.estimatedFemaleWorker = parseInt(data.labourDetails.estimatedFemaleWorkers);
        console.log("Added estimatedFemaleWorker:", parseInt(data.labourDetails.estimatedFemaleWorkers));
      }

      // complianceDetails
      if (changed("communicationDetails", "fullAddress") || 
          changed("complianceDetails", "gstinNo") || 
          changed("complianceDetails", "factoryLicenseNo") || 
          changed("complianceDetails", "tspcbOrderNo") || 
          changed("complianceDetails", "mdlNo") || 
          changed("complianceDetails", "udyamCertificateNo")) {
        reqData.complianceDetails = {
          gstInNumber: data.complianceDetails.gstinNo,
          gstInCertificatePath: "/uploads/gstin_certificate.pdf",
          fullAddress: data.communicationDetails.fullAddress,
          partnerName: data.firmDetails.proprietorName,
          emailId: data.firmDetails.contact1, // Using contact1 as email for now
        };
      }

      // similarMembershipInquiry
      if (changed("membershipDetails", "isMemberOfOrg") || 
          changed("membershipDetails", "orgDetails") || 
          changed("membershipDetails", "hasAppliedEarlier") || 
          changed("membershipDetails", "previousApplicationDetails") || 
          changed("membershipDetails", "isValidMember") || 
          changed("membershipDetails", "isExecutiveMember")) {
        reqData.similarMembershipInquiry = {
          is_member_of_similar_org: (data.membershipDetails.isMemberOfOrg === "Yes" || data.membershipDetails.isMemberOfOrg === "yes") ? "TRUE" : "FALSE",
          org_details: data.membershipDetails.orgDetails || "",
          has_applied_earlier: (data.membershipDetails.hasAppliedEarlier === "Yes" || data.membershipDetails.hasAppliedEarlier === "yes") ? "TRUE" : "FALSE",
          previous_application_details: data.membershipDetails.previousApplicationDetails || "",
          is_valid_member: (data.membershipDetails.isValidMember === "Yes" || data.membershipDetails.isValidMember === "yes") ? "TRUE" : "FALSE",
          is_executive_member: (data.membershipDetails.isExecutiveMember === "Yes" || data.membershipDetails.isExecutiveMember === "yes") ? "TRUE" : "FALSE",
        };
        console.log("Membership Details:", {
          isMemberOfOrg: data.membershipDetails.isMemberOfOrg,
          hasAppliedEarlier: data.membershipDetails.hasAppliedEarlier,
          isValidMember: data.membershipDetails.isValidMember,
          isExecutiveMember: data.membershipDetails.isExecutiveMember
        });
        console.log("Similar Membership Inquiry:", reqData.similarMembershipInquiry);
      }

      // partnerDetails diff
      const origPartners = original.representativeDetails.partners || [];
      const newPartners = data.representativeDetails.partners || [];
      reqData.partnerDetails = {
        newPartnerDetails: newPartners.filter(p => !p.id).map(p => ({
          partnerName: p.name,
          partnerAadharNo: p.aadharNo,
          partnerPanNo: p.pan,
          contactNumber: p.contactNo,
          emailId: p.email,
        })),
        updatePartnerDetails: newPartners.filter(p => {
          const orig = origPartners.find(op => op.id === p.id);
          return p.id && orig && (
            orig.name !== p.name ||
            orig.contactNo !== p.contactNo ||
            orig.aadharNo !== p.aadharNo ||
            orig.email !== p.email ||
            orig.pan !== p.pan
          );
        }).map(p => ({
          id: p.id,
          partnerName: p.name,
          partnerAadharNo: p.aadharNo,
          partnerPanNo: p.pan,
          contactNumber: p.contactNo,
          emailId: p.email,
        })),
        deletePartnerDetails: origPartners.filter(op => op.id && !newPartners.some(p => p.id === op.id)).map(op => ({ id: op.id })),
      };

      // machineryInformations diff
      const origMach = original.electricalDetails.machinery || [];
      const newMach = data.electricalDetails.machinery || [];
      
      console.log("Original machinery:", JSON.stringify(origMach, null, 2));
      console.log("New machinery:", JSON.stringify(newMach, null, 2));
      console.log("Original data ref:", originalDataRef.current);
      
      reqData.machineryInformations = {
        newMachineryInformations: newMach.filter((m: any) => !('id' in m && m.id)).map((m: any) => ({
          machineName: m.isOther ? m.machineName || "Custom" : m.type,
          isOther: m.isOther ? "TRUE" : "FALSE",
          machineCount: parseInt(m.quantity),
        })),
        updateMachineryInformations: newMach.filter((m: any) => {
          if (!('id' in m && m.id)) return false;
          const orig = origMach.find((om: any) => 'id' in om && om.id === m.id);
          console.log("Comparing machinery:", { new: m, original: orig });
          const hasChanges = m.id && orig && (
            orig.type !== m.type ||
            orig.machineName !== m.machineName ||
            orig.isOther !== m.isOther ||
            orig.quantity !== m.quantity
          );
          console.log("Has changes:", hasChanges);
          return hasChanges;
        }).map((m: any) => ({
          id: m.id,
          machineName: m.isOther ? m.machineName || "Custom" : m.type,
          isOther: m.isOther ? "TRUE" : "FALSE",
          machineCount: parseInt(m.quantity),
        })),
        deleteMachineryInformations: origMach.filter((om: any) => 'id' in om && om.id && !newMach.some((m: any) => 'id' in m && m.id === om.id)).map((om: any) => ({ id: om.id })),
      };
      
      console.log("Machinery diff result:", reqData.machineryInformations);

      // branchDetails diff
      const origBranches = original.branchDetails.branches || [];
      const newBranches = data.branchDetails.branches || [];
      
      console.log("Original branches:", JSON.stringify(origBranches, null, 2));
      console.log("New branches:", JSON.stringify(newBranches, null, 2));
      reqData.branchDetails = {
        newBranchSchema: newBranches.filter(b => !b.id).map(b => ({
          electricalUscNumber: b.electricalUscNumber,
          scNumber: b.scNumber,
          proprietorType: b.proprietorType?.toUpperCase() || "OWNED",
          proprietorStatus: b.proprietorStatus?.toUpperCase() || "OWNER",
          sanctionedHP: parseFloat(b.sanctionedHP),
          placeOfBusiness: b.placeOfBusiness,
          machineryInformations: (b.machinery || []).map(m => ({
            machineName: m.isOther ? m.machineName || "Custom" : m.type,
            isOther: m.isOther ? "TRUE" : "FALSE",
            machineCount: parseInt(m.quantity),
          })),
        })),
        updateBranchSchema: newBranches.filter(b => {
          const orig = origBranches.find(ob => ob.id === b.id);
          if (!b.id || !orig) return false;
          
          // Check basic branch fields
          const basicFieldsChanged = (
            orig.placeOfBusiness !== b.placeOfBusiness ||
            orig.proprietorStatus !== b.proprietorStatus ||
            orig.proprietorType !== b.proprietorType ||
            orig.electricalUscNumber !== b.electricalUscNumber ||
            orig.scNumber !== b.scNumber ||
            orig.sanctionedHP !== b.sanctionedHP
          );
          
          // Check machinery changes
          const origMachinery = orig.machinery || [];
          const newMachinery = b.machinery || [];
          const machineryChanged = (
            origMachinery.length !== newMachinery.length ||
            origMachinery.some((om: any, index: number) => {
              const nm = newMachinery[index];
              return !nm || (
                om.type !== nm.type ||
                om.machineName !== nm.machineName ||
                om.isOther !== nm.isOther ||
                om.quantity !== nm.quantity
              );
            })
          );
          
          console.log(`Branch ${b.id} changes:`, { basicFieldsChanged, machineryChanged, origMachinery, newMachinery });
          
          return basicFieldsChanged || machineryChanged;
        }).map(b => {
          const orig = origBranches.find(ob => ob.id === b.id);
          const origMachinery = orig?.machinery || [];
          const newMachinery = b.machinery || [];
          
          // Diff machinery changes
          const newMachineryItems = newMachinery.filter((m: any) => !('id' in m && m.id));
          const updateMachineryItems = newMachinery.filter((m: any) => {
            if (!('id' in m && m.id)) return false;
            const orig = origMachinery.find((om: any) => 'id' in om && om.id === m.id);
            return m.id && orig && (
              orig.type !== m.type ||
              orig.machineName !== m.machineName ||
              orig.isOther !== m.isOther ||
              orig.quantity !== m.quantity
            );
          });
          const deleteMachineryItems = origMachinery.filter((om: any) => 
            'id' in om && om.id && !newMachinery.some((m: any) => 'id' in m && m.id === om.id)
          );
          
          console.log(`Branch ${b.id} machinery diff:`, {
            new: newMachineryItems,
            update: updateMachineryItems,
            delete: deleteMachineryItems
          });
          
          return {
            id: b.id,
            electricalUscNumber: b.electricalUscNumber,
            scNumber: b.scNumber,
            proprietorType: b.proprietorType?.toUpperCase() || "OWNED",
            proprietorStatus: b.proprietorStatus?.toUpperCase() || "OWNER",
            sanctionedHP: parseFloat(b.sanctionedHP),
            placeOfBusiness: b.placeOfBusiness,
            newMachineryInformations: newMachineryItems.map((m: any) => ({
              machineName: m.isOther ? m.machineName || "Custom" : m.type,
              isOther: m.isOther ? "TRUE" : "FALSE",
              machineCount: parseInt(m.quantity),
            })),
            updateMachineryInformations: updateMachineryItems.map((m: any) => ({
              id: m.id,
              machineName: m.isOther ? m.machineName || "Custom" : m.type,
              isOther: m.isOther ? "TRUE" : "FALSE",
              machineCount: parseInt(m.quantity),
            })),
            deleteMachineryInformations: deleteMachineryItems.map((m: any) => ({
              id: m.id,
            })),
          };
        }),
        deleteBranchSchema: origBranches.filter(ob => ob.id && !newBranches.some(b => b.id === ob.id)).map(ob => ({ id: ob.id })),
      };

      // proposer
      if (changed("proposer1", "membershipId")) {
        if (data.proposer1.membershipId && data.proposer1.membershipId !== "") {
          reqData.proposer = {
            proposerID: data.proposer1.membershipId,
            signaturePath: "/uploads/proposer-signature.png",
          };
        } else {
          reqData.proposer = null;
        }
      }
      // executiveProposer
      if (changed("proposer2", "membershipId")) {
        if (data.proposer2.membershipId && data.proposer2.membershipId !== "") {
          reqData.executiveProposer = {
            proposerID: data.proposer2.membershipId,
            signaturePath: "/uploads/executive-signature.png",
          };
        } else {
          reqData.executiveProposer = null;
        }
      }
      // declarations
      if (changed("declaration", "agreeToTerms")) {
        reqData.declarations = {
          agreesToTerms: data.declaration.agreeToTerms ? "TRUE" : "FALSE",
          membershipFormPath: "/uploads/membership-form.pdf",
          applicationSignaturePath: "/uploads/app-signature.pdf",
        };
      }

      // Log the payload for debugging
      console.log("REQ DATA", JSON.stringify(reqData));

      // Send the request
      if (session?.user.token) {
        setIsSubmitting(true);
        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/member/update_member`,
          reqData,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200 || response.status === 201) {
          const updatedMember = response.data;
          setIsSubmitting(false);
          setPopupMessage({
            isOpen: true,
            type: "success",
            title: "Success",
            message: `Member updated successfully! ID: ${updatedMember?.data?.membershipId || "unknown"}`,
            primaryButton: {
              text: "Go to Memberships",
              onClick: () => router.push("/admin/memberships"),
            },
          });
          console.log("updated DATA", JSON.stringify(updatedMember));
        } else {
          setPopupMessage({
            isOpen: true,
            type: "error",
            title: "Update Failed",
            message: "Something went wrong. Member not updated.",
          });
        }
      }
    } catch (error) {
      console.error("Error updating member:", error);
      setPopupMessage({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update member. Please try again.",
      });
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
              {currentStep === 3 && <Step3ComplianceLegal isEditMode />}
              {currentStep === 4 && <Step4MembershipDocs isEditMode />}
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

      {/* Popup Message */}
      {popupMessage && (
        <PopupMessage
          isOpen={popupMessage.isOpen}
          onClose={() => setPopupMessage(null)}
          type={popupMessage.type}
          title={popupMessage.title}
          message={popupMessage.message}
        />
      )}
    </div>
  );
};

export default EditMemberForm;
