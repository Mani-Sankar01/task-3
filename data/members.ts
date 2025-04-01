// This is a dummy data file that simulates a database
// In a real application, this would be replaced with API calls to your backend

export interface Member {
  id: string;
  applicationDetails: {
    electricalUscNumber: string;
    dateOfApplication: string;
    scNumber: string;
  };
  memberDetails: {
    applicantName: string;
    relation: string;
    relativeName: string;
  };
  firmDetails: {
    firmName: string;
    proprietorName: string;
    contact1: string;
    contact2?: string;
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
      proprietorStatus: string;
      proprietorType?: string;
      electricalUscNumber: string;
      scNumber: string; // Added SC Number field
      sanctionedHP: string;
      machinery: Array<{
        type: string; // Changed from name to type with dropdown options
        customName?: string; // For "Others" type
        quantity: string;
      }>;
      labour: Array<{
        // Renamed from workers to labour
        name: string;
        aadharNumber: string;
        eshramCardNumber: string; // Added Eshram Card Number
        employedFrom: string; // Added Employed From date
        employedTo?: string; // Added Employed To date (optional)
        esiNumber?: string; // Added ESI Number (optional)
        status: string; // Added Status dropdown
      }>;
    }>;
  };
  labourDetails: {
    estimatedMaleWorkers: string;
    estimatedFemaleWorkers: string;
    // workers: Array<{
    //   name: string;
    //   aadharNumber: string;
    //   photo: string | null;
    // }>;
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
      email?: string;
      pan?: string;
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
  };
  proposer2: {
    name: string;
    firmName: string;
    address: string;
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
      scNumber: "SC98765",
      dateOfApplication: "2024-01-15",
    },
    memberDetails: {
      applicantName: "John Doe",
      relation: "S/O",
      relativeName: "Michael Doe",
    },
    firmDetails: {
      firmName: "Doe Industries",
      proprietorName: "John Doe",
      contact1: "123-456-7890",
      contact2: "9876543210",
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
          placeBusiness: "Main Branch",
          proprietorStatus: "owner",
          proprietorType: "owned",
          electricalUscNumber: "USC12345678",
          scNumber: "SC98765", // Added SC Number
          sanctionedHP: "50",
          machinery: [
            {
              type: "High Polish", // Changed from name to type
              quantity: "2",
            },
            {
              type: "Cutting", // Changed from name to type
              quantity: "1",
            },
          ],
          labour: [
            // Renamed from workers to labour
            {
              name: "Robert Smith",
              aadharNumber: "1234 5678 9012",
              eshramCardNumber: "ESHRAM123456", // Added Eshram Card Number
              employedFrom: "2023-01-15", // Added Employed From date
              esiNumber: "ESI789012", // Added ESI Number
              status: "Active", // Added Status
            },
            {
              name: "Jane Wilson",
              aadharNumber: "9876 5432 1098",
              eshramCardNumber: "ESHRAM654321", // Added Eshram Card Number
              employedFrom: "2023-03-10", // Added Employed From date
              employedTo: "2023-12-31", // Added Employed To date
              status: "Discontinued", // Added Status
            },
          ],
        },
        {
          placeBusiness: "Downtown Branch",
          proprietorStatus: "tenant",
          electricalUscNumber: "USC87654321",
          scNumber: "SC54321", // Added SC Number
          sanctionedHP: "25",
          machinery: [],
          labour: [],
        },
      ],
    },
    labourDetails: {
      estimatedMaleWorkers: "15",
      estimatedFemaleWorkers: "10",
      // workers: [
      //   {
      //     name: "Robert Smith",
      //     aadharNumber: "1234 5678 9012",
      //     photo: "/placeholder.svg",
      //   },
      //   {
      //     name: "Jane Wilson",
      //     aadharNumber: "9876 5432 1098",
      //     photo: "/placeholder.svg",
      //   },
      // ],
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
          email: "example@gmail.com",
          pan: "1akdbfb5431dsf",
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
    },
    proposer2: {
      name: "Sarah Miller",
      firmName: "Miller Associates",
      address: "789 Commercial Zone, Greenville",
    },
    declaration: {
      agreeToTerms: true,
      photoUpload: "/placeholder.svg",
      signatureUpload: "/placeholder.svg",
    },
    status: "active",
    joinDate: "2024-01-20",
  },
  {
    id: "MEM002",
    applicationDetails: {
      electricalUscNumber: "USC12345678",
      dateOfApplication: "2024-01-15",
      scNumber: "SC12345",
    },
    memberDetails: {
      applicantName: "James Bond",
      relation: "S/O",
      relativeName: "Robert Smith",
    },
    firmDetails: {
      firmName: "James Bond Industries",
      proprietorName: "John Doe",
      contact1: "987-654-3210",
      contact2: "8765432109",
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
          placeBusiness: "Main Branch",
          proprietorStatus: "tenant",
          electricalUscNumber: "USC98765432",
          scNumber: "SC12345", // Added SC Number
          sanctionedHP: "75",
          machinery: [
            {
              type: "Slice", // Changed from name to type
              quantity: "3",
            },
          ],
          labour: [
            // Renamed from workers to labour
            {
              name: "Thomas Clark",
              aadharNumber: "3456 7890 1234",
              eshramCardNumber: "ESHRAM345678", // Added Eshram Card Number
              employedFrom: "2023-05-20", // Added Employed From date
              esiNumber: "ESI345678", // Added ESI Number
              status: "Active", // Added Status
            },
          ],
        },
      ],
    },
    labourDetails: {
      estimatedMaleWorkers: "15",
      estimatedFemaleWorkers: "10",
      // workers: [
      //   {
      //     name: "Robert Smith",
      //     aadharNumber: "1234 5678 9012",
      //     photo: "/placeholder.svg",
      //   },
      //   {
      //     name: "Jane Wilson",
      //     aadharNumber: "9876 5432 1098",
      //     photo: "/placeholder.svg",
      //   },
      // ],
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
          email: "example@gmail.com",
          pan: "q3456edfq435",
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
    },
    proposer2: {
      name: "Sarah Miller",
      firmName: "Miller Associates",
      address: "789 Commercial Zone, Greenville",
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
