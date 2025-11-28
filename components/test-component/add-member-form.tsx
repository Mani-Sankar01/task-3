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
import { uploadFile } from "@/lib/client-file-upload";
import { useToast } from "@/hooks/use-toast";
import { renderRoleBasedPath } from "@/lib/utils";
import PopupMessage from "@/components/ui/popup-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { addMemberAction } from "@/app/actions/member-actions";

// Define the form schema
const formSchema = z.object({
  membershipType: z.enum(["TSMWA", "TQMWA"], {
    required_error: "Membership Type is required",
  }),
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
                machineName: z.string().optional(),
                isOther: z.boolean().default(false),
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
    gstinNo: z.string().min(1, "GSTIN number is required"),
    factoryLicenseNo: z.string().min(1, "Factory License number is required"),
    tspcbOrderNo: z.string().optional(),
    mdlNo: z.string().optional(),
    udyamCertificateNo: z.string().optional(),
    factoryLicenseDoc: z
      .any()
      .refine(
        (file) =>
          !!file &&
          (file instanceof File ||
            (typeof file === "object" && file !== null && "existingPath" in file)),
        "Factory License document is required"
      ),
    factoryLicenseIsExpirable: z.boolean().default(false),
    factoryLicenseExpiredAt: z.string().optional(),
    tspcbOrderDoc: z.any().optional(),
    tspcbIsExpirable: z.boolean().default(false),
    tspcbExpiredAt: z.string().optional(),
    mdlDoc: z.any().optional(),
    mdlIsExpirable: z.boolean().default(false),
    mdlExpiredAt: z.string().optional(),
    udyamCertificateDoc: z.any().optional(),
    udyamIsExpirable: z.boolean().default(false),
    udyamCertificateExpiredAt: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.factoryLicenseIsExpirable && !data.factoryLicenseExpiredAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Factory License expiry date is required when document is expirable",
        path: ["factoryLicenseExpiredAt"],
      });
    }
  }),
  communicationDetails: z.object({
    fullAddress: z.string().min(10, "Full Address is required"),
  }),
  representativeDetails: z.object({
    partners: z
      .array(
        z.object({
          name: z.string().min(2, "Name must be minimum 2 digits"),
          contactNo: z.string().length(10, "Contact number must be 10 digits"),
          aadharNo: z.string().length(12, "Aadhar number must be 12 digits"),
          pan: z.string().length(10, "Pan number must be 10 digits"),
          email: z.string().email("Invalid email address"),
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
    additionalDocuments: z.any().optional(),
    additionalAttachments: z
      .array(
        z.object({
          name: z.string(),
          file: z.any().optional(),
          isExpirable: z.boolean().default(false),
          expiredAt: z.string().optional(),
        }).superRefine((data, ctx) => {
          if (data.isExpirable && !data.expiredAt) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Expiry date is required when document is expirable",
              path: ["expiredAt"],
            });
          }
        })
      )
      .default([]),
  }),
  proposer1: z.object({
    name: z.string().optional(),
    firmName: z.string().optional(),
    membershipId: z.string().optional(),
    address: z.string().optional(),
    signaturePath: z.string().optional(),
  }),
  proposer2: z.object({
    name: z.string().optional(),
    firmName: z.string().optional(),
    membershipId: z.string().optional(),
    address: z.string().optional(),
    signaturePath: z.string().optional(),
  }),
  declaration: z.object({
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions to proceed",
    }),
    photoUpload: z.any().refine((val) => {
      // Check if it's a File object or has existingPath
      if (!val) return false;
      if (val instanceof File) return true;
      if (typeof val === 'object' && val?.existingPath) return true;
      return false;
    }, {
      message: "Membership form copy upload is required",
    }),
    signatureUpload: z.any().refine((val) => {
      // Check if it's a File object or has existingPath
      if (!val) return false;
      if (val instanceof File) return true;
      if (typeof val === 'object' && val?.existingPath) return true;
      return false;
    }, {
      message: "Signature upload is required",
    }),
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
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<{
    electricalUscNumber?: string;
    scNumber?: string;
    gstinNo?: string;
    gstInUsername?: string;
    gstInPassword?: string;
    factoryLicenseNo?: string;
    tspcbOrderNo?: string;
    mdlNo?: string;
    udyamCertificateNo?: string;
    [key: string]: string | undefined;
  }>({});
  const [validationSuccess, setValidationSuccess] = useState<{
    electricalUscNumber?: string;
    scNumber?: string;
    gstinNo?: string;
    gstInUsername?: string;
    gstInPassword?: string;
    factoryLicenseNo?: string;
    tspcbOrderNo?: string;
    mdlNo?: string;
    udyamCertificateNo?: string;
    [key: string]: string | undefined;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (status == "loading" || status === "authenticated") {
      setIsLoading(true);
    }
    setIsLoading(false);
  }, [status, session]);

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
        factoryLicenseDoc: null,
        factoryLicenseIsExpirable: false,
        factoryLicenseExpiredAt: undefined,
        tspcbOrderDoc: null,
        tspcbIsExpirable: false,
        tspcbExpiredAt: undefined,
        mdlDoc: null,
        mdlIsExpirable: false,
        mdlExpiredAt: undefined,
        udyamCertificateDoc: null,
        udyamIsExpirable: false,
        udyamCertificateExpiredAt: undefined,
      },
      communicationDetails: {
        fullAddress: "",
      },
      representativeDetails: {
        partners: [
          {
            name: "",
            contactNo: "",
            aadharNo: "",
            pan: "",
            email: "",
          },
        ],
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
        signaturePath: "",
      },
      proposer2: {
        name: "",
        firmName: "",
        membershipId: "",
        address: "",
        signaturePath: "",
      },
      declaration: {
        agreeToTerms: false,
      },
    },
    mode: "onChange",
  });

  const totalSteps = 5;

  const nextStep = async () => {
    // Special validation for step 5 (declaration step)
    if (currentStep === 5) {
      const formValues = methods.getValues();
      const photoUpload = formValues.declaration?.photoUpload;
      const signatureUpload = formValues.declaration?.signatureUpload;
      const agreeToTerms = formValues.declaration?.agreeToTerms;
      
      // Check if terms are agreed
      if (!agreeToTerms) {
        toast({
          title: "Required Field Missing",
          description: "You must agree to the terms and conditions to proceed.",
          variant: "destructive",
        });
        // Trigger validation to show error message below checkbox
        await methods.trigger("declaration.agreeToTerms");
        return;
      }
      
      // Check if files are uploaded
      const hasPhotoUpload = photoUpload && (
        photoUpload instanceof File || 
        (typeof photoUpload === 'object' && photoUpload?.existingPath)
      );
      const hasSignatureUpload = signatureUpload && (
        signatureUpload instanceof File || 
        (typeof signatureUpload === 'object' && signatureUpload?.existingPath)
      );
      
      if (!hasPhotoUpload || !hasSignatureUpload) {
        const missingFields = [];
        if (!hasPhotoUpload) missingFields.push("Membership form copy");
        if (!hasSignatureUpload) missingFields.push("Signature");
        
        toast({
          title: "Required Fields Missing",
          description: `Please upload: ${missingFields.join(" and ")} before proceeding.`,
          variant: "destructive",
        });
        return;
      }
    }
    
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
      // Validate USC/SC numbers before proceeding
      const isValid = await validateUscScNumbers(
        data.applicationDetails.electricalUscNumber,
        data.applicationDetails.scNumber
      );

      if (!isValid) {
        setIsSubmitting(false);
        return; // Stop submission if validation fails
      }

      // Upload new files first
      const uploadedFiles: Record<string, string> = {};

      // Upload compliance documents from step 3
      if (data.complianceDetails.factoryLicenseDoc) {
        const result = await uploadFile(
          data.complianceDetails.factoryLicenseDoc,
          "documents"
        );
        if (result.success && result.filePath) {
          uploadedFiles.factoryLicenseDoc = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload Factory License: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (data.complianceDetails.tspcbOrderDoc) {
        const result = await uploadFile(
          data.complianceDetails.tspcbOrderDoc,
          "documents"
        );
        if (result.success && result.filePath) {
          uploadedFiles.tspcbOrderDoc = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload TSPCB Certificate: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (data.complianceDetails.mdlDoc) {
        const result = await uploadFile(
          data.complianceDetails.mdlDoc,
          "documents"
        );
        if (result.success && result.filePath) {
          uploadedFiles.mdlDoc = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload MDL Certificate: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (data.complianceDetails.udyamCertificateDoc) {
        const result = await uploadFile(
          data.complianceDetails.udyamCertificateDoc,
          "documents"
        );
        if (result.success && result.filePath) {
          uploadedFiles.udyamCertificateDoc = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload Udyam Certificate: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Upload new declaration files
      if (data.declaration.photoUpload) {
        const result = await uploadFile(data.declaration.photoUpload, "photos");
        if (result.success && result.filePath) {
          uploadedFiles.photoUpload = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload Photo: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (data.declaration.signatureUpload) {
        const result = await uploadFile(
          data.declaration.signatureUpload,
          "signatures"
        );
        if (result.success && result.filePath) {
          uploadedFiles.signatureUpload = result.filePath;
        } else {
          setErrorPopup({
            isOpen: true,
            message: `Failed to upload Signature: ${result.error}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Upload additional attachments
      const additionalAttachments = [];
      for (
        let i = 0;
        i < data.documentDetails.additionalAttachments.length;
        i++
      ) {
        const attachment = data.documentDetails.additionalAttachments[i];
        if (attachment.file) {
          const result = await uploadFile(attachment.file, "documents");
          if (result.success && result.filePath) {
            const attachmentPayload: any = {
              documentName: attachment.name,
              documentPath: result.filePath,
            };
            // Only include expiredAt if isExpirable is true
            if (attachment.isExpirable && attachment.expiredAt) {
              attachmentPayload.expiredAt = new Date(attachment.expiredAt).toISOString();
            }
            additionalAttachments.push(attachmentPayload);
          } else {
            setErrorPopup({
              isOpen: true,
              message: `Failed to upload ${attachment.name}: ${result.error}`,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Build the request data
      const resolveExistingPath = (value: any) => {
        if (!value) return undefined;
        if (typeof value === "string") return value;
        if (value?.existingPath) return value.existingPath;
        return undefined;
      };

      const shouldSendCompliance = Boolean(
        data.communicationDetails.fullAddress?.trim() ||
          data.complianceDetails.gstinNo?.trim() ||
          data.complianceDetails.factoryLicenseNo?.trim() ||
          data.complianceDetails.tspcbOrderNo?.trim() ||
          data.complianceDetails.mdlNo?.trim() ||
          data.complianceDetails.udyamCertificateNo?.trim() ||
          data.complianceDetails.factoryLicenseExpiredAt ||
          data.complianceDetails.tspcbExpiredAt ||
          data.complianceDetails.mdlExpiredAt ||
          data.complianceDetails.udyamCertificateExpiredAt ||
          uploadedFiles.factoryLicenseDoc ||
          resolveExistingPath(data.complianceDetails.factoryLicenseDoc) ||
          uploadedFiles.tspcbOrderDoc ||
          resolveExistingPath(data.complianceDetails.tspcbOrderDoc) ||
          uploadedFiles.mdlDoc ||
          resolveExistingPath(data.complianceDetails.mdlDoc) ||
          uploadedFiles.udyamCertificateDoc ||
          resolveExistingPath(data.complianceDetails.udyamCertificateDoc)
      );

      if (data.proposer1.membershipId && !data.proposer1.signaturePath) {
        setErrorPopup({
          isOpen: true,
          message:
            "Selected proposer (valid member) is missing a signature record. Please choose another member or contact support.",
        });
        setIsSubmitting(false);
        return;
      }

      if (data.proposer2.membershipId && !data.proposer2.signaturePath) {
        setErrorPopup({
          isOpen: true,
          message:
            "Selected executive proposer is missing a signature record. Please choose another member or contact support.",
        });
        setIsSubmitting(false);
        return;
      }

      const requestData: any = {
        membershipType: data.membershipType,
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
          partnerPanNo: partner.pan,
          contactNumber: partner.contactNo,
          emailId: partner.email,
        })),

        estimatedMaleWorker: parseInt(data.labourDetails.estimatedMaleWorkers),
        estimatedFemaleWorker: parseInt(
          data.labourDetails.estimatedFemaleWorkers
        ),

        branches: data.branchDetails.branches.map((branch) => ({
          electricalUscNumber: branch.electricalUscNumber,
          scNumber: branch.scNumber,
          proprietorType: branch.proprietorType?.toUpperCase() || "OWNED",
          proprietorStatus: branch.proprietorStatus?.toUpperCase() || "OWNER",
          sanctionedHP: parseFloat(branch.sanctionedHP),
          placeOfBusiness: branch.placeOfBusiness,
          machineryInformations: branch.machinery.map((m) => ({
            machineName: m.isOther ? m.machineName || "Custom" : m.type,
            isOther: m.isOther ? "TRUE" : "FALSE",
            machineCount: parseInt(m.quantity),
          })),
        })),

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

        attachments: [...additionalAttachments],

        declarations: {
          agreesToTerms: data.declaration.agreeToTerms ? "TRUE" : "FALSE",
          membershipFormPath: uploadedFiles.photoUpload || null,
          applicationSignaturePath: uploadedFiles.signatureUpload || null,
        },
      };

      // Conditionally add proposer fields only if they have values
      if (data.proposer1.membershipId) {
        requestData.proposer = {
          proposerID: data.proposer1.membershipId,
          signaturePath: data.proposer1.signaturePath,
        };
      }

      if (data.proposer2.membershipId) {
        requestData.executiveProposer = {
          proposerID: data.proposer2.membershipId,
          signaturePath: data.proposer2.signaturePath,
        };
      }

      if (shouldSendCompliance) {
        const complianceDetails: Record<string, any> = {};

        const fullAddressValue = data.communicationDetails.fullAddress?.trim();
        if (fullAddressValue) {
          complianceDetails.fullAddress = fullAddressValue;
        }

        if (data.complianceDetails.gstinNo?.trim()) {
          complianceDetails.gstInNumber = data.complianceDetails.gstinNo.trim();
        }
        const primaryPartner = data.representativeDetails.partners?.[0];
        if (primaryPartner?.name) {
          complianceDetails.partnerName = primaryPartner.name;
        }
        if (primaryPartner?.contactNo) {
          complianceDetails.contactNumber = primaryPartner.contactNo;
        }
        if (primaryPartner?.aadharNo) {
          complianceDetails.AadharNumber = primaryPartner.aadharNo;
        }
        if (primaryPartner?.email) {
          complianceDetails.emailId = primaryPartner.email;
        }
        if (primaryPartner?.pan) {
          complianceDetails.panNumber = primaryPartner.pan;
        }

        const factoryLicenseNo = data.complianceDetails.factoryLicenseNo?.trim();
        if (factoryLicenseNo) {
          complianceDetails.factoryLicenseNumber = factoryLicenseNo;
        }
        const factoryLicensePath =
          uploadedFiles.factoryLicenseDoc ||
          resolveExistingPath(data.complianceDetails.factoryLicenseDoc);
        if (factoryLicensePath) {
          complianceDetails.factoryLicensePath = factoryLicensePath;
        }
        if (data.complianceDetails.factoryLicenseIsExpirable && data.complianceDetails.factoryLicenseExpiredAt) {
          complianceDetails.factoryLicenseExpiredAt = new Date(
            data.complianceDetails.factoryLicenseExpiredAt
          ).toISOString();
        }

        const tspcbOrderNo = data.complianceDetails.tspcbOrderNo?.trim();
        if (tspcbOrderNo) {
          complianceDetails.tspcbOrderNumber = tspcbOrderNo;
        }
        const tspcbCertificatePath =
          uploadedFiles.tspcbOrderDoc ||
          resolveExistingPath(data.complianceDetails.tspcbOrderDoc);
        if (tspcbCertificatePath) {
          complianceDetails.tspcbCertificatePath = tspcbCertificatePath;
        }
        if (data.complianceDetails.tspcbIsExpirable && data.complianceDetails.tspcbExpiredAt) {
          complianceDetails.tspcbExpiredAt = new Date(
            data.complianceDetails.tspcbExpiredAt
          ).toISOString();
        }

        const mdlNumber = data.complianceDetails.mdlNo?.trim();
        if (mdlNumber) {
          complianceDetails.mdlNumber = mdlNumber;
        }
        const mdlCertificatePath =
          uploadedFiles.mdlDoc ||
          resolveExistingPath(data.complianceDetails.mdlDoc);
        if (mdlCertificatePath) {
          complianceDetails.mdlCertificatePath = mdlCertificatePath;
        }
        if (data.complianceDetails.mdlIsExpirable && data.complianceDetails.mdlExpiredAt) {
          complianceDetails.mdlExpiredAt = new Date(
            data.complianceDetails.mdlExpiredAt
          ).toISOString();
        }

        const udyamCertificateNo =
          data.complianceDetails.udyamCertificateNo?.trim();
        if (udyamCertificateNo) {
          complianceDetails.udyamCertificateNumber = udyamCertificateNo;
        }
        const udyamCertificatePath =
          uploadedFiles.udyamCertificateDoc ||
          resolveExistingPath(data.complianceDetails.udyamCertificateDoc);
        if (udyamCertificatePath) {
          complianceDetails.udyamCertificatePath = udyamCertificatePath;
        }
        if (data.complianceDetails.udyamIsExpirable && data.complianceDetails.udyamCertificateExpiredAt) {
          complianceDetails.udyamCertificateExpiredAt = new Date(
            data.complianceDetails.udyamCertificateExpiredAt
          ).toISOString();
        }

        if (Object.keys(complianceDetails).length > 0) {
          requestData.complianceDetails = complianceDetails;
        }
      }

      if (uploadedFiles.factoryLicenseDoc &&
        typeof uploadedFiles.factoryLicenseDoc === "string"
      ) {
        requestData.factoryLicensePath = uploadedFiles.factoryLicenseDoc;
      }

      if (uploadedFiles.udyamCertificateDoc) {
        requestData.udyamCertificatePath = uploadedFiles.udyamCertificateDoc;
      }

      requestData.communicationDetails = {
        fullAddress: data.communicationDetails.fullAddress,
      };

      console.log(JSON.stringify(requestData));

      if (session?.user.token) {
        setIsSubmitting(true);
        console.log(session?.user.token); 
        console.log(JSON.stringify(requestData));
        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/member/add_member`,
          requestData,
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
          toast({
            title: "Success",
            description: `Member added successfully! ID: ${
              addedMember?.membershipId || "unknown"
            }`,
          });
          router.push(
            `/${renderRoleBasedPath(session?.user.role)}/memberships`
          );
        } else {
          setErrorPopup({
            isOpen: true,
            message: "Something went wrong. Member not added.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setErrorPopup({
        isOpen: true,
        message: error?.response?.data?.message || error?.message || "Failed to add member. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to determine which fields to validate for each step
  const getFieldsToValidateForStep = (step: number): (keyof FormValues)[] => {
    switch (step) {
      case 1:
        return [
          "membershipType",
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

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    router.push(`/${renderRoleBasedPath(session?.user.role)}/memberships`);
  };

  const handleBack = () => {
    router.back();
  };

  // Function to validate USC/SC numbers
  const validateUscScNumbers = async (
    electricalUscNumber: string,
    scNumber: string
  ) => {
    console.log("validateUscScNumbers called with:", {
      electricalUscNumber,
      scNumber,
    }); // Debug log

    if (!session?.user.token) {
      console.log("No session token found"); // Debug log
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return false;
    }

    setIsValidating(true);

    try {
      console.log("Making API call to validate numbers..."); // Debug log
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/validate_usc_sc_number`,
        {
          electricalUscNumber,
          scNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log("API response:", response.data); // Debug log

      // Clear previous validation errors and success messages
      setValidationErrors({});
      setValidationSuccess({});

      // Check if numbers already exist based on the actual response format
      const errors: { electricalUscNumber?: string; scNumber?: string } = {};
      const success: { electricalUscNumber?: string; scNumber?: string } = {};
      let hasErrors = false;
      let hasSuccess = false;

      // Check Electrical USC Number
      if (response.data["Electrical USC number"]) {
        if (response.data["Electrical USC number"].isMember) {
          const memberInfo = response.data["Electrical USC number"];
          errors.electricalUscNumber = `${memberInfo.message} (${memberInfo.member.membershipId} - ${memberInfo.member.firmName})`;
          hasErrors = true;
        } else {
          success.electricalUscNumber =
            "This USC number is unique and can be used.";
          hasSuccess = true;
        }
      }

      // Check SC Number
      if (response.data["SC number"]) {
        if (response.data["SC number"].isMember) {
          const memberInfo = response.data["SC number"];
          errors.scNumber = `${memberInfo.message} (${memberInfo.member.membershipId} - ${memberInfo.member.firmName})`;
          hasErrors = true;
        } else {
          success.scNumber = "This SC number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (hasErrors) {
        console.log("Numbers exist, setting errors..."); // Debug log
        setValidationErrors(errors);
        console.log("Set validation errors:", errors); // Debug log
      }

      if (hasSuccess) {
        console.log("Numbers are unique, setting success..."); // Debug log
        setValidationSuccess(success);
        console.log("Set validation success:", success); // Debug log
      }

      return !hasErrors; // Return true if no errors
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Compliance validation function
  const validateComplianceDetails = async (
    gstinNo: string,
    factoryLicenseNo: string,
    tspcbOrderNo: string,
    mdlNo: string,
    udyamCertificateNo: string
  ) => {
    if (!session?.user?.token) return false;

    setIsValidating(true);
    try {
      console.log("Making API call to validate compliance details...");

      // Build payload with only non-empty values
      const payload: any = {};
      if (gstinNo.trim()) payload.gstInNumber = gstinNo.trim();
      if (factoryLicenseNo.trim())
        payload.factoryLicenseNumber = factoryLicenseNo.trim();
      if (tspcbOrderNo.trim()) payload.tspcbOrderNumber = tspcbOrderNo.trim();
      if (mdlNo.trim()) payload.mdlNumber = mdlNo.trim();
      if (udyamCertificateNo.trim())
        payload.udyamCertificateNumber = udyamCertificateNo.trim();

      // Only make API call if there's at least one value to validate
      if (Object.keys(payload).length === 0) {
        setIsValidating(false);
        return true;
      }

      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/validate_compliance_details`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log("Compliance validation API response:", response.data);

      // Clear previous validation errors and success messages
      setValidationErrors((prev) => ({
        ...prev,
        gstinNo: undefined,
        factoryLicenseNo: undefined,
        tspcbOrderNo: undefined,
        mdlNo: undefined,
        udyamCertificateNo: undefined,
      }));
      setValidationSuccess((prev) => ({
        ...prev,
        gstinNo: undefined,
        factoryLicenseNo: undefined,
        tspcbOrderNo: undefined,
        mdlNo: undefined,
        udyamCertificateNo: undefined,
      }));

      const errors: any = {};
      const success: any = {};
      let hasErrors = false;
      let hasSuccess = false;

      // Check each compliance field
      if (response.data["GSTIN"] && gstinNo.trim()) {
        if (response.data["GSTIN"].isMember) {
          const firmName = response.data["GSTIN"].firmName || "Unknown Firm";
          errors.gstinNo = `Already added for ${firmName}`;
          hasErrors = true;
        } else {
          success.gstinNo = "This GSTIN number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (response.data["Factory License Number"] && factoryLicenseNo.trim()) {
        if (response.data["Factory License Number"].isMember) {
          const firmName =
            response.data["Factory License Number"].firmName || "Unknown Firm";
          errors.factoryLicenseNo = `Already added for ${firmName}`;
          hasErrors = true;
        } else {
          success.factoryLicenseNo =
            "This Factory License number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (response.data["TSPCB Order Number"] && tspcbOrderNo.trim()) {
        if (response.data["TSPCB Order Number"].isMember) {
          const firmName =
            response.data["TSPCB Order Number"].firmName || "Unknown Firm";
          errors.tspcbOrderNo = `Already added for ${firmName}`;
          hasErrors = true;
        } else {
          success.tspcbOrderNo =
            "This TSPCB Order number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (response.data["MDL Number"] && mdlNo.trim()) {
        if (response.data["MDL Number"].isMember) {
          const firmName =
            response.data["MDL Number"].firmName || "Unknown Firm";
          errors.mdlNo = `Already added for ${firmName}`;
          hasErrors = true;
        } else {
          success.mdlNo = "This MDL number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (
        response.data["Udyam Certificate Number"] &&
        udyamCertificateNo.trim()
      ) {
        if (response.data["Udyam Certificate Number"].isMember) {
          const firmName =
            response.data["Udyam Certificate Number"].firmName ||
            "Unknown Firm";
          errors.udyamCertificateNo = `Already added for ${firmName}`;
          hasErrors = true;
        } else {
          success.udyamCertificateNo =
            "This Udyam Certificate number is unique and can be used.";
          hasSuccess = true;
        }
      }

      if (hasErrors) {
        setValidationErrors((prev) => ({ ...prev, ...errors }));
      }

      if (hasSuccess) {
        setValidationSuccess((prev) => ({ ...prev, ...success }));
      }

      return !hasErrors;
    } catch (error) {
      console.error("Compliance validation error:", error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Single field compliance validation function
  const validateSingleComplianceField = async (
    fieldName: string,
    value: string
  ) => {
    if (!session?.user?.token || value.length < 3) return;

    setIsValidating(true);
    try {
      console.log(`Validating single field: ${fieldName} with value: ${value}`);

      // Build payload with only the specific field
      const payload: any = {};
      const fieldMappings: { [key: string]: string } = {
        gstinNo: "gstInNumber",
        factoryLicenseNo: "factoryLicenseNumber",
        tspcbOrderNo: "tspcbOrderNumber",
        mdlNo: "mdlNumber",
        udyamCertificateNo: "udyamCertificateNumber",
      };

      const apiFieldName = fieldMappings[fieldName];
      if (apiFieldName) {
        payload[apiFieldName] = value.trim();
      }

      const response = await axios.post(
        `${process.env.BACKEND_API_URL}/api/member/validate_compliance_details`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      console.log("Single field validation response:", response.data);

      // Clear previous validation for this field only
      setValidationErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      setValidationSuccess((prev) => ({ ...prev, [fieldName]: undefined }));

      // Check the specific field response
      const responseKeys: { [key: string]: string } = {
        gstinNo: "GSTIN",
        factoryLicenseNo: "Factory License Number",
        tspcbOrderNo: "TSPCB Order Number",
        mdlNo: "MDL Number",
        udyamCertificateNo: "Udyam Certificate Number",
      };

      const responseKey = responseKeys[fieldName];
      if (response.data[responseKey]) {
        if (response.data[responseKey].isMember) {
          const firmName =
            response.data[responseKey].firmName || "Unknown Firm";
          setValidationErrors((prev) => ({
            ...prev,
            [fieldName]: `Already added for ${firmName}`,
          }));
        } else {
          setValidationSuccess((prev) => ({
            ...prev,
            [fieldName]: `This ${fieldName} is unique and can be used.`,
          }));
        }
      }
    } catch (error) {
      console.error(`Error validating ${fieldName}:`, error);
    } finally {
      setIsValidating(false);
    }
  };

  // Real-time validation function
  const handleFieldChange = async (fieldName: string, value: string) => {
    console.log("Field change detected:", fieldName, value); // Debug log

    const currentData = methods.getValues();

    // USC and SC Number validation (Step 1)
    if (fieldName === "electricalUscNumber" || fieldName === "scNumber") {
      const uscNumber =
        fieldName === "electricalUscNumber"
          ? value
          : currentData.applicationDetails.electricalUscNumber;
      const scNumber =
        fieldName === "scNumber"
          ? value
          : currentData.applicationDetails.scNumber;

      console.log("Current values:", { uscNumber, scNumber }); // Debug log

      // Validate each field independently if it has at least 3 characters
      if (fieldName === "electricalUscNumber" && value.length >= 3) {
        console.log("Starting USC validation..."); // Debug log

        // Add a small delay to avoid too many API calls
        setTimeout(async () => {
          console.log("Executing USC validation..."); // Debug log
          const isValid = await validateUscScNumbers(value, scNumber);
          console.log("USC validation result:", isValid); // Debug log

          if (isValid) {
            // Clear USC error if validation passes
            setValidationErrors((prev) => ({
              ...prev,
              electricalUscNumber: undefined,
            }));
            setValidationSuccess((prev) => ({
              ...prev,
              electricalUscNumber: "This USC number is unique and can be used.",
            }));
            console.log("USC validation passed, cleared error"); // Debug log
          }
        }, 500); // 500ms delay
      } else if (fieldName === "scNumber" && value.length >= 3) {
        console.log("Starting SC validation..."); // Debug log

        // Add a small delay to avoid too many API calls
        setTimeout(async () => {
          console.log("Executing SC validation..."); // Debug log
          const isValid = await validateUscScNumbers(uscNumber, value);
          console.log("SC validation result:", isValid); // Debug log

          if (isValid) {
            // Clear SC error if validation passes
            setValidationErrors((prev) => ({ ...prev, scNumber: undefined }));
            setValidationSuccess((prev) => ({
              ...prev,
              scNumber: "This SC number is unique and can be used.",
            }));
            console.log("SC validation passed, cleared error"); // Debug log
          }
        }, 500); // 500ms delay
      } else if (value.length < 3) {
        // Clear errors if field is too short
        setValidationErrors((prev) => ({ ...prev, [fieldName]: undefined }));
        setValidationSuccess((prev) => ({ ...prev, [fieldName]: undefined }));
        console.log(`${fieldName} too short, cleared error`); // Debug log
      }
    }

    // Branch USC and SC Number validation (Step 2)
    if (fieldName.includes('branch_') && (fieldName.includes('electricalUscNumber') || fieldName.includes('scNumber'))) {
      const branchIndex = fieldName.split('_')[1];
      const fieldType = fieldName.split('_')[2];
      
      // Get current branch data
      const branches = currentData.branchDetails?.branches || [];
      const currentBranch = branches[parseInt(branchIndex)] || {};
      
      const uscNumber = fieldType === 'electricalUscNumber' ? value : currentBranch.electricalUscNumber || '';
      const scNumber = fieldType === 'scNumber' ? value : currentBranch.scNumber || '';

      console.log(`Branch ${branchIndex} validation - USC: ${uscNumber}, SC: ${scNumber}`);

      // Validate each field independently if it has at least 3 characters
      if (fieldType === 'electricalUscNumber' && value.length >= 3) {
        console.log(`Starting branch ${branchIndex} USC validation...`);

        setTimeout(async () => {
          const isValid = await validateUscScNumbers(value, scNumber);
          console.log(`Branch ${branchIndex} USC validation result:`, isValid);

          if (isValid) {
            setValidationErrors((prev) => ({
              ...prev,
              [fieldName]: undefined,
            }));
            setValidationSuccess((prev) => ({
              ...prev,
              [fieldName]: "This USC number is unique and can be used.",
            }));
            console.log(`Branch ${branchIndex} USC validation passed`);
          }
        }, 500);
      } else if (fieldType === 'scNumber' && value.length >= 3) {
        console.log(`Starting branch ${branchIndex} SC validation...`);

        setTimeout(async () => {
          const isValid = await validateUscScNumbers(uscNumber, value);
          console.log(`Branch ${branchIndex} SC validation result:`, isValid);

          if (isValid) {
            setValidationErrors((prev) => ({ ...prev, [fieldName]: undefined }));
            setValidationSuccess((prev) => ({
              ...prev,
              [fieldName]: "This SC number is unique and can be used.",
            }));
            console.log(`Branch ${branchIndex} SC validation passed`);
          }
        }, 500);
      } else if (value.length < 3) {
        // Clear errors if field is too short
        setValidationErrors((prev) => ({ ...prev, [fieldName]: undefined }));
        setValidationSuccess((prev) => ({ ...prev, [fieldName]: undefined }));
        console.log(`${fieldName} too short, cleared error`);
      }
    }

    // Compliance validation - single field only
    if (
      fieldName === "gstinNo" ||
      fieldName === "factoryLicenseNo" ||
      fieldName === "tspcbOrderNo" ||
      fieldName === "mdlNo" ||
      fieldName === "udyamCertificateNo"
    ) {
      if (value.length >= 3) {
        console.log(`Starting single field validation for ${fieldName}...`);

        // Add a small delay to avoid too many API calls
        setTimeout(async () => {
          await validateSingleComplianceField(fieldName, value);
        }, 500); // 500ms delay
      } else if (value.length < 3) {
        // Clear errors if field is too short
        setValidationErrors((prev) => ({ ...prev, [fieldName]: undefined }));
        setValidationSuccess((prev) => ({ ...prev, [fieldName]: undefined }));
        console.log(`${fieldName} too short, cleared error`);
      }
    }
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
              {currentStep === 1 && (
                <Step1PersonalBusiness
                  validationErrors={validationErrors as any}
                  validationSuccess={validationSuccess as any}
                  onFieldChange={handleFieldChange}
                  isValidating={isValidating}
                />
              )}
              {currentStep === 2 && (
                <Step2OperationDetails
                  validationErrors={validationErrors as any}
                  validationSuccess={validationSuccess as any}
                  onFieldChange={handleFieldChange}
                  isValidating={isValidating}
                />
              )}
              {currentStep === 3 && (
                <Step3ComplianceLegal
                  validationErrors={validationErrors as any}
                  validationSuccess={validationSuccess as any}
                  onFieldChange={handleFieldChange}
                />
              )}
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
            <Button 
              type="button" 
              onClick={nextStep} 
              disabled={isSubmitting}
            >
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

      {/* Error Popup */}
      <PopupMessage
        isOpen={errorPopup.isOpen}
        onClose={() => setErrorPopup({ isOpen: false, message: "" })}
        type="error"
        title="Error"
        message={errorPopup.message}
        primaryButton={{
          text: "OK",
          onClick: () => setErrorPopup({ isOpen: false, message: "" }),
          variant: "default",
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddMemberForm;
