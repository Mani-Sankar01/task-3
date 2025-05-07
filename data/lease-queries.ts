import { getAllMembers } from "./members";

export interface LeaseHolder {
  name: string;
  periodFrom: string;
  periodTo: string;
}

export interface LeaseDocument {
  name: string;
  fileName?: string;
  uploadDate?: string;
}

export interface LeaseQuery {
  id: string;
  membershipId: string;
  presentLeaseHolder: string;
  leaseDate: string;
  expiryDate: string;
  renewalDate?: string;
  leaseHolderHistory: LeaseHolder[];
  documents: LeaseDocument[];
  status: "pending" | "processing" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// Sample data
const leaseQueries: LeaseQuery[] = [
  {
    id: "LQ001",
    membershipId: "MEMID001",
    presentLeaseHolder: "John Doe",
    leaseDate: "2022-05-15",
    expiryDate: "2025-05-14",
    renewalDate: "2022-05-15",
    leaseHolderHistory: [
      {
        name: "Michael Smith",
        periodFrom: "2019-01-10",
        periodTo: "2022-05-14",
      },
      {
        name: "Sarah Johnson",
        periodFrom: "2016-03-22",
        periodTo: "2019-01-09",
      },
    ],
    documents: [
      {
        name: "Original Lease Agreement",
        fileName: "lease_agreement_LQ001.pdf",
        uploadDate: "2022-05-15T10:30:00Z",
      },
      {
        name: "Renewal Document",
        fileName: "renewal_LQ001.pdf",
        uploadDate: "2022-05-15T10:35:00Z",
      },
    ],
    status: "resolved",
    createdAt: "2022-05-10T10:30:00Z",
    updatedAt: "2022-05-15T14:45:00Z",
  },
  {
    id: "LQ002",
    membershipId: "MEMID002",
    presentLeaseHolder: "Jane Smith",
    leaseDate: "2023-02-20",
    expiryDate: "2026-02-19",
    leaseHolderHistory: [],
    documents: [],
    status: "pending",
    createdAt: "2023-02-15T09:15:00Z",
    updatedAt: "2023-02-15T09:15:00Z",
  },
  {
    id: "LQ003",
    membershipId: "MEMID003",
    presentLeaseHolder: "Robert Johnson",
    leaseDate: "2021-11-10",
    expiryDate: "2024-11-09",
    renewalDate: "2021-11-10",
    leaseHolderHistory: [
      {
        name: "David Wilson",
        periodFrom: "2018-05-15",
        periodTo: "2021-11-09",
      },
    ],
    documents: [
      {
        name: "Original Lease Agreement",
        fileName: "lease_agreement_LQ003.pdf",
        uploadDate: "2021-11-10T11:20:00Z",
      },
    ],
    status: "processing",
    createdAt: "2021-11-05T11:20:00Z",
    updatedAt: "2021-11-12T16:30:00Z",
  },
];

// Helper functions to simulate API calls

// Get all lease queries
export function getAllLeaseQueries() {
  return leaseQueries;
}

// Get a lease query by ID
export function getLeaseQueryById(id: string) {
  return leaseQueries.find((query) => query.id === id);
}

// Add a new lease query
export function addLeaseQuery(
  query: Omit<LeaseQuery, "id" | "createdAt" | "updatedAt">
) {
  const newId = `LQ${String(leaseQueries.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const newQuery = {
    ...query,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  leaseQueries.push(newQuery);
  return newQuery;
}

// Update an existing lease query
export function updateLeaseQuery(
  id: string,
  updatedQuery: Omit<LeaseQuery, "id" | "createdAt">
) {
  const index = leaseQueries.findIndex((query) => query.id === id);
  if (index !== -1) {
    const now = new Date().toISOString();
    leaseQueries[index] = {
      ...updatedQuery,
      id,
      createdAt: leaseQueries[index].createdAt,
      updatedAt: now,
    };
    return leaseQueries[index];
  }
  return null;
}

// Delete a lease query
export function deleteLeaseQuery(id: string) {
  const index = leaseQueries.findIndex((query) => query.id === id);
  if (index !== -1) {
    leaseQueries.splice(index, 1);
    return true;
  }
  return false;
}

// Get member name by membership ID
export function getMemberNameByMembershipId(membershipId: string) {
  const members = getAllMembers();
  const member = members.find((m) => m.id === membershipId);
  return member ? member.memberDetails.applicantName : "Unknown Member";
}
