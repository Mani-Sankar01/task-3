// This is a dummy data file that simulates a database
// In a real application, this would be replaced with API calls to your backend

export interface Member {
  id: string;
  applicationDetails: {
    electricalUscNumber: string;
    dateOfApplication: string;
  };
  memberDetails: {
    applicantName: string;
    relation: string;
  };
  firmDetails: {
    firmName: string;
    proprietorName: string;
    officeNumber: string;
    phoneNumber: string;
  };
  businessDetails: {
    surveyNumber: string;
    village: string;
    zone: string;
    mandal: string;
    district: string;
    state: string;
    pincode: string;
    ownershipType: string;
    ownerSubType?: string;
  };
  electricalDetails: {
    sanctionedHP: string;
    machinery: Array<{
      name: string;
      quantity: string;
      chasisNumber: string;
    }>;
  };
  branchDetails: {
    branches: Array<{
      placeBusiness: string;
      ownershipType: string;
      ownerSubType?: string;
      electricalUscNumber: string;
      sanctionedHP: string;
    }>;
  };
  labourDetails: {
    estimatedMaleWorkers: string;
    estimatedFemaleWorkers: string;
    workers: Array<{
      name: string;
      aadharNumber: string;
      photo: string | null;
    }>;
  };
  complianceDetails: {
    gstinNo: string;
    factoryLicenseNo: string;
    tspcbOrderNo: string;
    mdlNo: string;
    udyamCertificateNo: string;
  };
  communicationDetails: {
    fullAddress: string;
  };
  representativeDetails: {
    partners: Array<{
      name: string;
      contactNo: string;
      aadharNo: string;
    }>;
  };
  membershipDetails: {
    isMemberOfOrg: string;
    orgDetails?: string;
    hasAppliedEarlier: string;
    previousApplicationDetails?: string;
  };
  documentDetails: {
    saleDeedElectricityBill?: string;
    rentalDeed?: string;
    partnershipDeed?: string;
    additionalDocuments?: string[];
  };
  proposer1: {
    name: string;
    firmName: string;
    address: string;
    signature?: string;
  };
  proposer2: {
    name: string;
    firmName: string;
    address: string;
    signature?: string;
  };
  declaration: {
    agreeToTerms: boolean;
    photoUpload?: string;
    signatureUpload?: string;
  };
  status: "active" | "pending" | "inactive";
  joinDate: string;
}

export const members: Member[] = [
  {
    id: "MEM001",
    applicationDetails: {
      electricalUscNumber: "USC12345678",
      dateOfApplication: "2024-01-15",
    },
    memberDetails: {
      applicantName: "John Doe",
      relation: "S/O",
    },
    firmDetails: {
      firmName: "Doe Industries",
      proprietorName: "John Doe",
      officeNumber: "123-456-7890",
      phoneNumber: "9876543210",
    },
    businessDetails: {
      surveyNumber: "SRV123",
      village: "Greenville",
      zone: "zone1",
      mandal: "Central",
      district: "district1",
      state: "telangana",
      pincode: "500001",
      ownershipType: "owner",
      ownerSubType: "own_business",
    },
    electricalDetails: {
      sanctionedHP: "50",
      machinery: [
        {
          name: "Industrial Mixer XL2000",
          quantity: "2",
          chasisNumber: "MIX123456",
        },
        {
          name: "Conveyor Belt CB500",
          quantity: "1",
          chasisNumber: "CB789012",
        },
      ],
    },
    branchDetails: {
      branches: [
        {
          placeBusiness: "Downtown Branch",
          ownershipType: "tenant",
          electricalUscNumber: "USC87654321",
          sanctionedHP: "25",
        },
      ],
    },
    labourDetails: {
      estimatedMaleWorkers: "15",
      estimatedFemaleWorkers: "10",
      workers: [
        {
          name: "Robert Smith",
          aadharNumber: "1234 5678 9012",
          photo: "/placeholder.svg",
        },
        {
          name: "Jane Wilson",
          aadharNumber: "9876 5432 1098",
          photo: "/placeholder.svg",
        },
      ],
    },
    complianceDetails: {
      gstinNo: "27AAPFU0939F1ZV",
      factoryLicenseNo: "FL123456",
      tspcbOrderNo: "TSPCB/2023/1234",
      mdlNo: "MDL9876",
      udyamCertificateNo: "UDYAM-TS-01-0000123",
    },
    communicationDetails: {
      fullAddress: "123 Industrial Area, Greenville, Telangana - 500001",
    },
    representativeDetails: {
      partners: [
        {
          name: "Michael Johnson",
          contactNo: "8765432109",
          aadharNo: "5678 1234 9012",
        },
      ],
    },
    membershipDetails: {
      isMemberOfOrg: "no",
      hasAppliedEarlier: "no",
    },
    documentDetails: {
      saleDeedElectricityBill: "/placeholder.svg",
      additionalDocuments: ["/placeholder.svg"],
    },
    proposer1: {
      name: "David Brown",
      firmName: "Brown Enterprises",
      address: "456 Business Park, Greenville",
      signature: "/placeholder.svg",
    },
    proposer2: {
      name: "Sarah Miller",
      firmName: "Miller Associates",
      address: "789 Commercial Zone, Greenville",
      signature: "/placeholder.svg",
    },
    declaration: {
      agreeToTerms: true,
      photoUpload: "/placeholder.svg",
      signatureUpload: "/placeholder.svg",
    },
    status: "active",
    joinDate: "2024-01-20",
  },
];

// Helper functions to simulate API calls

// Get all members
export function getAllMembers() {
  return members;
}

// Get a member by ID
export function getMemberById(id: string) {
  return members.find((member) => member.id === id);
}

// Add a new member
export function addMember(member: Omit<Member, "id">) {
  const newId = `MEM${String(members.length + 1).padStart(3, "0")}`;
  const newMember = { ...member, id: newId };
  members.push(newMember);
  return newMember;
}

// Update an existing member
export function updateMember(id: string, updatedMember: Omit<Member, "id">) {
  const index = members.findIndex((member) => member.id === id);
  if (index !== -1) {
    members[index] = { ...updatedMember, id };
    return members[index];
  }
  return null;
}

// Delete a member
export function deleteMember(id: string) {
  const index = members.findIndex((member) => member.id === id);
  if (index !== -1) {
    members.splice(index, 1);
    return true;
  }
  return false;
}
