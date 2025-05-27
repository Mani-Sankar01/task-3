// This file contains data for valid members and executive members
// In a real application, this would be fetched from an API

export interface ValidMember {
  id: string;
  membershipId: string;
  applicantName: string;
  firmName: string;
  address: string;
}

// Sample data for valid members
export const validMembers: ValidMember[] = [
  {
    id: "VM001",
    membershipId: "MEMID001",
    applicantName: "John Doe",
    firmName: "Doe Industries",
    address: "123 Industrial Area, Greenville, Telangana - 500001",
  },
  {
    id: "VM002",
    membershipId: "MEMID002",
    applicantName: "Jane Smith",
    firmName: "Smith Manufacturing",
    address: "456 Manufacturing Hub, Riverside, Telangana - 500018",
  },
  {
    id: "VM003",
    membershipId: "MEMID003",
    applicantName: "Robert Johnson",
    firmName: "Johnson Textiles",
    address: "789 Textile Park, Hillside, Telangana - 500036",
  },
  {
    id: "VM004",
    membershipId: "MEMID004",
    applicantName: "Emily Davis",
    firmName: "Davis Enterprises",
    address: "234 Business Center, Lakeside, Telangana - 500045",
  },
  {
    id: "VM005",
    membershipId: "MEMID005",
    applicantName: "Michael Wilson",
    firmName: "Wilson & Sons",
    address: "567 Commercial Zone, Mountainview, Telangana - 500072",
  },
];

// Sample data for executive members
export const executiveMembers: ValidMember[] = [
  {
    id: "EM001",
    membershipId: "MEMID006",
    applicantName: "Sarah Miller",
    firmName: "Miller Associates",
    address: "890 Executive Plaza, Greenville, Telangana - 500001",
  },
  {
    id: "EM002",
    membershipId: "MEMID007",
    applicantName: "David Brown",
    firmName: "Brown Enterprises",
    address: "345 Corporate Park, Riverside, Telangana - 500018",
  },
  {
    id: "EM003",
    membershipId: "MEMID008",
    applicantName: "Jennifer Clark",
    firmName: "Clark Industries",
    address: "678 Industrial Estate, Hillside, Telangana - 500036",
  },
];

// Helper functions to get members
export function getAllValidMembers() {
  return validMembers;
}

export function getAllExecutiveMembers() {
  return executiveMembers;
}

export function getValidMemberById(id: string) {
  return validMembers.find((member) => member.id === id);
}

export function getExecutiveMemberById(id: string) {
  return executiveMembers.find((member) => member.id === id);
}
