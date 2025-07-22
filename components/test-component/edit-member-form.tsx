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
            saleDeedElectricityBill: {
              existingPath: reponseData.complianceDetails?.gstInCertificatePath || null,
            },
            saleDeedExpiredAt: reponseData.complianceDetails?.gstExpiredAt ? new Date(reponseData.complianceDetails.gstExpiredAt).toISOString().split('T')[0] : "",
            rentalDeed: {
              existingPath: reponseData.complianceDetails?.factoryLicensePath || null,
            },
            rentalDeedExpiredAt: reponseData.complianceDetails?.factoryLicenseExpiredAt ? new Date(reponseData.complianceDetails.factoryLicenseExpiredAt).toISOString().split('T')[0] : "",
            partnershipDeed: {
              existingPath: reponseData.complianceDetails?.tspcbCertificatePath || null,
            },
            partnershipDeedExpiredAt: reponseData.complianceDetails?.tspcbExpiredAt ? new Date(reponseData.complianceDetails.tspcbExpiredAt).toISOString().split('T')[0] : "",
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
            photoUpload: {
              existingPath: reponseData.declarations?.membershipFormPath || null,
            },
            signatureUpload: {
              existingPath: reponseData.declarations?.applicationSignaturePath || null,
            },
          },
        };
        console.log(mappedData);
        methods.reset(mappedData);
        originalDataRef.current = mappedData; // Store original for diffing
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
    setIsSubmitting(true);
    try {
      const original = originalDataRef.current;
      if (!original) throw new Error("Original data not loaded");

      // Upload new files first
      const uploadedFiles: Record<string, string> = {};

      // Upload new document files
      if (data.documentDetails.saleDeedElectricityBill && 
          data.documentDetails.saleDeedElectricityBill instanceof File) {
        const result = await uploadFile(data.documentDetails.saleDeedElectricityBill, 'documents');
        if (result.success && result.filePath) {
          uploadedFiles.saleDeedElectricityBill = result.filePath;
        } else {
          alert(`Failed to upload Sale Deed & Electricity Bill: ${result.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (data.documentDetails.rentalDeed && 
          data.documentDetails.rentalDeed instanceof File) {
        const result = await uploadFile(data.documentDetails.rentalDeed, 'documents');
        if (result.success && result.filePath) {
          uploadedFiles.rentalDeed = result.filePath;
        } else {
          alert(`Failed to upload Rental Deed: ${result.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (data.documentDetails.partnershipDeed && 
          data.documentDetails.partnershipDeed instanceof File) {
        const result = await uploadFile(data.documentDetails.partnershipDeed, 'documents');
        if (result.success && result.filePath) {
          uploadedFiles.partnershipDeed = result.filePath;
        } else {
          alert(`Failed to upload Partnership Deed: ${result.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Upload new declaration files
      if (data.declaration.photoUpload && 
          data.declaration.photoUpload instanceof File) {
        const result = await uploadFile(data.declaration.photoUpload, 'photos');
        if (result.success && result.filePath) {
          uploadedFiles.photoUpload = result.filePath;
        } else {
          alert(`Failed to upload Photo: ${result.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (data.declaration.signatureUpload && 
          data.declaration.signatureUpload instanceof File) {
        const result = await uploadFile(data.declaration.signatureUpload, 'signatures');
        if (result.success && result.filePath) {
          uploadedFiles.signatureUpload = result.filePath;
        } else {
          alert(`Failed to upload Signature: ${result.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Upload additional attachments
      const uploadedAttachments: Record<number, string> = {};
      for (let i = 0; i < data.documentDetails.additionalAttachments.length; i++) {
        const attachment = data.documentDetails.additionalAttachments[i];
        
        // Only upload if it's a new File object
        if (attachment.file && attachment.file instanceof File) {
          const result = await uploadFile(attachment.file, 'documents');
          if (result.success && result.filePath) {
            uploadedAttachments[i] = result.filePath;
          } else {
            alert(`Failed to upload ${attachment.name}: ${result.error}`);
            setIsSubmitting(false);
            return;
          }
        }
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

      // Simple fields (example: applicantName, phoneNumber1, etc.)
      if (changed("memberDetails", "applicantName")) reqData.applicantName = data.memberDetails.applicantName;
      if (changed("firmDetails", "contact1")) reqData.phoneNumber1 = data.firmDetails.contact1;
      if (changed("firmDetails", "contact2")) reqData.phoneNumber2 = data.firmDetails.contact2;
      if (changed("firmDetails", "firmName")) reqData.firmName = data.firmDetails.firmName;
      if (changed("firmDetails", "proprietorName")) reqData.proprietorName = data.firmDetails.proprietorName;
      if (changed("memberDetails", "relation")) reqData.relation = data.memberDetails.relation;
      if (changed("memberDetails", "relativeName")) reqData.relativeName = data.memberDetails.relativeName;
      if (changed("applicationDetails", "electricalUscNumber")) reqData.electricalUscNumber = data.applicationDetails.electricalUscNumber;
      if (changed("applicationDetails", "scNumber")) reqData.scNumber = data.applicationDetails.scNumber;
      if (changed("applicationDetails", "dateOfApplication")) reqData.doj = data.applicationDetails.dateOfApplication;
      if (changed("businessDetails", "surveyNumber")) reqData.surveyNumber = data.businessDetails.surveyNumber;
      if (changed("businessDetails", "village")) reqData.village = data.businessDetails.village;
      if (changed("businessDetails", "zone")) reqData.zone = data.businessDetails.zone;
      if (changed("businessDetails", "mandal")) reqData.mandal = data.businessDetails.mandal;
      if (changed("businessDetails", "district")) reqData.district = data.businessDetails.district;
      if (changed("businessDetails", "state")) reqData.state = data.businessDetails.state;
      if (changed("businessDetails", "pincode")) reqData.pinCode = data.businessDetails.pincode;
      if (changed("businessDetails", "ownershipType")) reqData.proprietorStatus = data.businessDetails.ownershipType?.toUpperCase();
      if (changed("businessDetails", "ownerSubType")) reqData.proprietorType = data.businessDetails.ownerSubType?.toUpperCase();
      if (changed("electricalDetails", "sanctionedHP")) reqData.sanctionedHP = parseFloat(data.electricalDetails.sanctionedHP);
      if (changed("labourDetails", "estimatedMaleWorkers")) reqData.estimatedMaleWorker = parseInt(data.labourDetails.estimatedMaleWorkers);
      if (changed("labourDetails", "estimatedFemaleWorkers")) reqData.estimatedFemaleWorker = parseInt(data.labourDetails.estimatedFemaleWorkers);

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
      reqData.machineryInformations = {
        newMachineryInformations: newMach.filter((m: any) => !('id' in m && m.id)).map((m: any) => ({
          machineName: m.name || m.type || "Unknown",
          machineCount: parseInt(m.quantity),
        })),
        updateMachineryInformations: newMach.filter((m: any) => {
          if (!('id' in m && m.id)) return false;
          const orig = origMach.find((om: any) => 'id' in om && om.id === m.id);
          return m.id && orig && (
            orig.name !== m.name ||
            orig.type !== m.type ||
            orig.quantity !== m.quantity
          );
        }).map((m: any) => ({
          id: m.id,
          machineName: m.name || m.type || "Unknown",
          machineCount: parseInt(m.quantity),
        })),
        deleteMachineryInformations: origMach.filter((om: any) => 'id' in om && om.id && !newMach.some((m: any) => 'id' in m && m.id === om.id)).map((om: any) => ({ id: om.id })),
      };

      // branchDetails diff
      const origBranches = original.branchDetails.branches || [];
      const newBranches = data.branchDetails.branches || [];
      reqData.branchDetails = {
        newBranchSchema: newBranches.filter(b => !b.id).map(b => ({
          electricalUscNumber: b.electricalUscNumber,
          scNumber: b.scNumber,
          proprietorType: b.proprietorType?.toUpperCase() || "OWNED",
          proprietorStatus: b.proprietorStatus?.toUpperCase() || "OWNER",
          sanctionedHP: parseFloat(b.sanctionedHP),
          placeOfBusiness: b.placeOfBusiness,
          machineryInformations: (b.machinery || []).map(m => ({
            machineName: m.type || m.customName || "Custom",
            customName: m.customName || "",
            machineCount: parseInt(m.quantity),
          })),
        })),
        updateBranchSchema: newBranches.filter(b => {
          const orig = origBranches.find(ob => ob.id === b.id);
          return b.id && orig && (
            orig.placeOfBusiness !== b.placeOfBusiness ||
            orig.proprietorStatus !== b.proprietorStatus ||
            orig.proprietorType !== b.proprietorType ||
            orig.electricalUscNumber !== b.electricalUscNumber ||
            orig.scNumber !== b.scNumber ||
            orig.sanctionedHP !== b.sanctionedHP
          );
        }).map(b => ({
          id: b.id,
          electricalUscNumber: b.electricalUscNumber,
          scNumber: b.scNumber,
          proprietorType: b.proprietorType?.toUpperCase() || "OWNED",
          proprietorStatus: b.proprietorStatus?.toUpperCase() || "OWNER",
          sanctionedHP: parseFloat(b.sanctionedHP),
          placeOfBusiness: b.placeOfBusiness,
          // For update, you may also want to diff machineryInformations inside branch if needed
        })),
        deleteBranchSchema: origBranches.filter(ob => ob.id && !newBranches.some(b => b.id === ob.id)).map(ob => ({ id: ob.id })),
      };

      // attachments diff - Fixed logic
      const origAttachments = original.documentDetails.additionalAttachments || [];
      const newAttachments = data.documentDetails.additionalAttachments || [];
      
      reqData.attachments = {
        newAttachments: newAttachments.filter((a: any, index: number) => {
          // New attachment (no ID) or original was empty
          return !a.id || !origAttachments[index] || !origAttachments[index].file;
        }).map((a: any, index: number) => ({
          documentName: a.name,
          documentPath: uploadedAttachments[index] || (a.file && typeof a.file === 'object' && 'existingPath' in a.file ? a.file.existingPath : ""),
          expiredAt: a.expiredAt ? new Date(a.expiredAt).toISOString() : null,
          membershipId: memberId,
        })),
        updateAttachments: newAttachments.filter((a: any, index: number) => {
          const orig = origAttachments[index];
          // Only update if it has an ID, original exists, and something changed
          return a.id && orig && orig.file && (
            orig.name !== a.name || 
            (a.file instanceof File) ||
            orig.expiredAt !== a.expiredAt
          );
        }).map((a: any, index: number) => ({
          id: a.id,
          documentName: a.name,
          documentPath: uploadedAttachments[index] || (a.file && typeof a.file === 'object' && 'existingPath' in a.file ? a.file.existingPath : (origAttachments[index]?.file && typeof origAttachments[index].file === 'object' && 'existingPath' in origAttachments[index].file ? origAttachments[index].file.existingPath : "")),
          expiredAt: a.expiredAt ? new Date(a.expiredAt).toISOString() : null,
          membershipId: memberId,
        })),
        deleteAttachments: origAttachments.filter((oa: any, index: number) => 
          oa.id && !newAttachments[index]
        ).map((oa: any) => ({ id: oa.id })),
      };

      // complianceDetails (always send full object if any field changed)
      if (
        changed("complianceDetails", "gstinNo") ||
        changed("complianceDetails", "factoryLicenseNo") ||
        changed("complianceDetails", "tspcbOrderNo") ||
        changed("complianceDetails", "mdlNo") ||
        changed("complianceDetails", "udyamCertificateNo") ||
        changed("communicationDetails", "fullAddress") ||
        changed("documentDetails", "saleDeedExpiredAt") ||
        changed("documentDetails", "rentalDeedExpiredAt") ||
        changed("documentDetails", "partnershipDeedExpiredAt")
      ) {
        reqData.complianceDetails = {
          gstInNumber: data.complianceDetails.gstinNo,
          gstInCertificatePath: uploadedFiles.saleDeedElectricityBill || (data.documentDetails.saleDeedElectricityBill && typeof data.documentDetails.saleDeedElectricityBill === 'object' && 'existingPath' in data.documentDetails.saleDeedElectricityBill ? data.documentDetails.saleDeedElectricityBill.existingPath : "/uploads/gstin.pdf"),
          gstExpiredAt: data.documentDetails.saleDeedExpiredAt ? new Date(data.documentDetails.saleDeedExpiredAt).toISOString() : null,
          factoryLicenseNumber: data.complianceDetails.factoryLicenseNo,
          factoryLicensePath: uploadedFiles.rentalDeed || (data.documentDetails.rentalDeed && typeof data.documentDetails.rentalDeed === 'object' && 'existingPath' in data.documentDetails.rentalDeed ? data.documentDetails.rentalDeed.existingPath : "/uploads/factory-license.pdf"),
          factoryLicenseExpiredAt: data.documentDetails.rentalDeedExpiredAt ? new Date(data.documentDetails.rentalDeedExpiredAt).toISOString() : null,
          tspcbOrderNumber: data.complianceDetails.tspcbOrderNo,
          tspcbCertificatePath: uploadedFiles.partnershipDeed || (data.documentDetails.partnershipDeed && typeof data.documentDetails.partnershipDeed === 'object' && 'existingPath' in data.documentDetails.partnershipDeed ? data.documentDetails.partnershipDeed.existingPath : "/uploads/tspcb.pdf"),
          tspcbExpiredAt: data.documentDetails.partnershipDeedExpiredAt ? new Date(data.documentDetails.partnershipDeedExpiredAt).toISOString() : null,
          mdlNumber: data.complianceDetails.mdlNo,
          mdlCertificatePath: "/uploads/mdl.pdf",
          mdlExpiredAt: null,
          udyamCertificateNumber: data.complianceDetails.udyamCertificateNo,
          udyamCertificatePath: "/uploads/udyam.pdf",
          udyamCertificateExpiredAt: null,
          fullAddress: data.communicationDetails.fullAddress,
          partnerName: data.representativeDetails.partners[0]?.name || "",
          contactNumber: data.representativeDetails.partners[0]?.contactNo || "",
          AadharNumber: data.representativeDetails.partners[0]?.aadharNo || "",
          emailId: data.representativeDetails.partners[0]?.email,
          panNumber: data.representativeDetails.partners[0]?.pan,
        };
      }

      // similarMembershipInquiry (always send full object if any field changed)
      if (
        changed("membershipDetails", "isMemberOfOrg") ||
        changed("membershipDetails", "hasAppliedEarlier") ||
        changed("membershipDetails", "isValidMember") ||
        changed("membershipDetails", "isExecutiveMember")
      ) {
        reqData.similarMembershipInquiry = {
          is_member_of_similar_org: data.membershipDetails.isMemberOfOrg === "yes" ? "TRUE" : "FALSE",
          has_applied_earlier: data.membershipDetails.hasAppliedEarlier === "yes" ? "TRUE" : "FALSE",
          is_valid_member: data.membershipDetails.isValidMember === "yes" ? "TRUE" : "FALSE",
          is_executive_member: data.membershipDetails.isExecutiveMember === "yes" ? "TRUE" : "FALSE",
        };
      }

      // proposer
      if (changed("proposer1", "membershipId")) {
        reqData.proposer = {
          proposerID: data.proposer1.membershipId,
          signaturePath: "/uploads/proposer-signature.png",
        };
      }
      // executiveProposer
      if (changed("proposer2", "membershipId")) {
        reqData.executiveProposer = {
          proposerID: data.proposer2.membershipId,
          signaturePath: "/uploads/executive-signature.png",
        };
      }
      // declarations
      if (changed("declaration", "agreeToTerms") || uploadedFiles.photoUpload || uploadedFiles.signatureUpload) {
        reqData.declarations = {
          agreesToTerms: data.declaration.agreeToTerms ? "TRUE" : "FALSE",
          membershipFormPath: uploadedFiles.photoUpload || "/uploads/membership-form.pdf",
          applicationSignaturePath: uploadedFiles.signatureUpload || "/uploads/app-signature.pdf",
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
          alert(
            `✅ Member updated successfully! ID: ${
              updatedMember?.data?.membershipId ||  "unknown"
            }`
          );
          // router.push("/admin/memberships");
          console.log("updated DATA", JSON.stringify(updatedMember));
        } else {
          alert("⚠️ Something went wrong. Member not updated.");
        }
      }
    } catch (error) {
      console.error("Error updating member:", error);
      alert("Failed to update member. Please try again.");
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
