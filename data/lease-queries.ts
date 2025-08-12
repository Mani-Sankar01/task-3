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
  id: number;
  leaseQueryId: string;
  membershipId: string;
  presentLeaseHolder: string;
  dateOfLease: string;
  expiryOfLease: string;
  dateOfRenewal?: string | null;
  status: string;
  createdAt: string;
  createdBy: number;
  modifiedAt: string;
  modifiedBy: number | null;
  leaseQueryAttachments?: Array<any>;
  leaseQueryHistory: Array<{
    id: number;
    leaseQueryId: string;
    membershipId: string;
    leaseHolderName: string;
    fromDate: string;
    toDate: string;
    createdAt: string;
  }>;
  members?: {
    membershipId: string;
    applicantName: string;
    firmName: string;
    phoneNumber1: string;
    zone: string;
    mandal: string;
  };
}

// Sample data
const leaseQueries: LeaseQuery[] = [
  {
    id: 1,
    leaseQueryId: "LQ001",
    membershipId: "MEMID001",
    presentLeaseHolder: "John Doe",
    dateOfLease: "2022-05-15",
    expiryOfLease: "2025-05-14",
    dateOfRenewal: "2022-05-15",
    status: "resolved",
    createdAt: "2022-05-10T10:30:00Z",
    createdBy: 1,
    modifiedAt: "2022-05-15T14:45:00Z",
    modifiedBy: 1,
    leaseQueryAttachments: [
      {
        id: 1,
        leaseQueryId: "LQ001",
        fileName: "lease_agreement_LQ001.pdf",
        uploadDate: "2022-05-15T10:30:00Z",
      },
      {
        id: 2,
        leaseQueryId: "LQ001",
        fileName: "renewal_LQ001.pdf",
        uploadDate: "2022-05-15T10:35:00Z",
      },
    ],
    leaseQueryHistory: [
      {
        id: 1,
        leaseQueryId: "LQ001",
        membershipId: "MEMID001",
        leaseHolderName: "Michael Smith",
        fromDate: "2019-01-10",
        toDate: "2022-05-14",
        createdAt: "2022-05-10T10:30:00Z",
      },
      {
        id: 2,
        leaseQueryId: "LQ001",
        membershipId: "MEMID001",
        leaseHolderName: "Sarah Johnson",
        fromDate: "2016-03-22",
        toDate: "2019-01-09",
        createdAt: "2022-05-10T10:30:00Z",
      },
    ],
    members: {
      membershipId: "MEMID001",
      applicantName: "John Doe",
      firmName: "Firm A",
      phoneNumber1: "123-456-7890",
      zone: "Zone 1",
      mandal: "Mandal 1",
    },
  },
  {
    id: 2,
    leaseQueryId: "LQ002",
    membershipId: "MEMID002",
    presentLeaseHolder: "Jane Smith",
    dateOfLease: "2023-02-20",
    expiryOfLease: "2026-02-19",
    status: "pending",
    createdAt: "2023-02-15T09:15:00Z",
    createdBy: 2,
    modifiedAt: "2023-02-15T09:15:00Z",
    modifiedBy: 2,
    leaseQueryHistory: [],
    members: {
      membershipId: "MEMID002",
      applicantName: "Jane Smith",
      firmName: "Firm B",
      phoneNumber1: "987-654-3210",
      zone: "Zone 2",
      mandal: "Mandal 2",
    },
  },
  {
    id: 3,
    leaseQueryId: "LQ003",
    membershipId: "MEMID003",
    presentLeaseHolder: "Robert Johnson",
    dateOfLease: "2021-11-10",
    expiryOfLease: "2024-11-09",
    dateOfRenewal: "2021-11-10",
    status: "processing",
    createdAt: "2021-11-05T11:20:00Z",
    createdBy: 1,
    modifiedAt: "2021-11-12T16:30:00Z",
    modifiedBy: 1,
    leaseQueryHistory: [
      {
        id: 3,
        leaseQueryId: "LQ003",
        membershipId: "MEMID003",
        leaseHolderName: "David Wilson",
        fromDate: "2018-05-15",
        toDate: "2021-11-09",
        createdAt: "2021-11-05T11:20:00Z",
      },
    ],
    members: {
      membershipId: "MEMID003",
      applicantName: "Robert Johnson",
      firmName: "Firm A",
      phoneNumber1: "111-222-3333",
      zone: "Zone 1",
      mandal: "Mandal 1",
    },
  },
];

// Helper functions to simulate API calls

// Get all lease queries
export function getAllLeaseQueries() {
  return leaseQueries;
}

// Get a lease query by ID
export function getLeaseQueryById(id: number) {
  return leaseQueries.find((query) => query.id === id);
}

// Add a new lease query
export function addLeaseQuery(
  query: Omit<LeaseQuery, "id" | "createdAt" | "updatedAt">
) {
  const newId = leaseQueries.length + 1;
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
  id: number,
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
export function deleteLeaseQuery(id: number) {
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
