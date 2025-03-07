import { getAllMembers } from "./members";

export type GstFilingStatus = "filled" | "pending" | "due";

export interface GstItem {
  id: string;
  name: string;
  taxableAmount: number;
}

export interface GstFiling {
  id: string;
  membershipId: string;
  filingPeriod: string; // e.g., "Q1 2024", "Apr 2024"
  filingDate: string;
  dueDate: string;
  gstItems: GstItem[];
  totalAmount: number;
  totalTaxableAmount: number;
  status: GstFilingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Dummy data for GST filings
export const gstFilings: GstFiling[] = [
  {
    id: "GST001",
    membershipId: "MEM001",
    filingPeriod: "Q1 2024",
    filingDate: "2024-04-15",
    dueDate: "2024-04-20",
    gstItems: [
      { id: "ITEM001", name: "Manufacturing Services", taxableAmount: 50000 },
      { id: "ITEM002", name: "Raw Materials", taxableAmount: 30000 },
    ],
    totalAmount: 14400, // 18% of totalTaxableAmount
    totalTaxableAmount: 80000,
    status: "filled",
    notes: "Filed on time",
    createdAt: "2024-04-10T10:00:00Z",
    updatedAt: "2024-04-15T15:30:00Z",
  },
  {
    id: "GST002",
    membershipId: "MEM001",
    filingPeriod: "Q2 2024",
    filingDate: "2024-04-15",
    dueDate: "2024-04-20",
    gstItems: [
      { id: "ITEM001", name: "Manufacturing Services", taxableAmount: 50000 },
      { id: "ITEM002", name: "Raw Materials", taxableAmount: 30000 },
    ],
    totalAmount: 14400, // 18% of totalTaxableAmount
    totalTaxableAmount: 80000,
    status: "filled",
    notes: "Filed on time",
    createdAt: "2024-04-10T10:00:00Z",
    updatedAt: "2024-04-15T15:30:00Z",
  },
  {
    id: "GST003",
    membershipId: "MEM002",
    filingPeriod: "Q2 2024",
    filingDate: "2024-04-15",
    dueDate: "2024-04-20",
    gstItems: [
      { id: "ITEM001", name: "Manufacturing Services", taxableAmount: 50000 },
      { id: "ITEM002", name: "Raw Materials", taxableAmount: 30000 },
    ],
    totalAmount: 14400, // 18% of totalTaxableAmount
    totalTaxableAmount: 80000,
    status: "pending",
    notes: "Filed on time",
    createdAt: "2024-04-10T10:00:00Z",
    updatedAt: "2024-04-15T15:30:00Z",
  },
];

// Helper functions to simulate API calls

export function getAllGstFilings(): GstFiling[] {
  return gstFilings;
}

export function getGstFilingById(id: string): GstFiling | undefined {
  return gstFilings.find((filing) => filing.id === id);
}

export function getGstFilingsByMembershipId(membershipId: string): GstFiling[] {
  return gstFilings.filter((filing) => filing.membershipId === membershipId);
}

export function getGstFilingsByDateRange(
  startDate: string,
  endDate: string
): GstFiling[] {
  return gstFilings.filter((filing) => {
    // Use filing date if available, otherwise use due date for comparison
    const dateToCompare = filing.filingDate || filing.dueDate;
    return dateToCompare >= startDate && dateToCompare <= endDate;
  });
}

export function getGstFilingsByStatus(status: GstFilingStatus): GstFiling[] {
  return gstFilings.filter((filing) => filing.status === status);
}

export function addGstFiling(
  filing: Omit<GstFiling, "id" | "createdAt" | "updatedAt">
): GstFiling {
  const newFiling: GstFiling = {
    id: `GST${String(gstFilings.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...filing,
  };
  gstFilings.push(newFiling);
  return newFiling;
}

export function updateGstFiling(
  id: string,
  filing: Omit<GstFiling, "id" | "createdAt">
): GstFiling | null {
  const index = gstFilings.findIndex((f) => f.id === id);
  if (index !== -1) {
    const updatedFiling: GstFiling = {
      ...filing,
      id,
      createdAt: gstFilings[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    gstFilings[index] = updatedFiling;
    return updatedFiling;
  }
  return null;
}

export function deleteGstFiling(id: string): boolean {
  const index = gstFilings.findIndex((filing) => filing.id === id);
  if (index !== -1) {
    gstFilings.splice(index, 1);
    return true;
  }
  return false;
}

// Helper function to get member name by ID
export function getMemberNameById(membershipId: string): string {
  const members = getAllMembers();
  const member = members.find((m) => m.id === membershipId);
  return member ? member.memberDetails.applicantName : "Unknown Member";
}

// Helper function to get member options for dropdown
export function getMemberOptions() {
  const members = getAllMembers();
  return members.map((member) => ({
    value: member.id,
    label: `${member.id} - ${member.memberDetails.applicantName}`,
  }));
}

// Helper function to get GST filing statistics
export function getGstFilingStatistics(membershipId?: string) {
  const filteredFilings = membershipId
    ? getGstFilingsByMembershipId(membershipId)
    : gstFilings;

  // Count filings by status
  const filledFilings = filteredFilings.filter(
    (filing) => filing.status === "filled"
  );
  const pendingFilings = filteredFilings.filter(
    (filing) => filing.status === "pending"
  );
  const dueFilings = filteredFilings.filter(
    (filing) => filing.status === "due"
  );

  // Calculate totals
  const totalFilings = filteredFilings.length;
  const totalTaxableAmount = filteredFilings.reduce(
    (sum, filing) => sum + filing.totalTaxableAmount,
    0
  );
  const totalTaxAmount = filteredFilings.reduce(
    (sum, filing) => sum + filing.totalAmount,
    0
  );

  // Get filings by period for chart data
  const filingsByPeriod = Array.from(
    new Set(filteredFilings.map((filing) => filing.filingPeriod))
  )
    .sort()
    .map((period) => {
      const periodFilings = filteredFilings.filter(
        (filing) => filing.filingPeriod === period
      );
      return {
        period,
        count: periodFilings.length,
        taxableAmount: periodFilings.reduce(
          (sum, filing) => sum + filing.totalTaxableAmount,
          0
        ),
        taxAmount: periodFilings.reduce(
          (sum, filing) => sum + filing.totalAmount,
          0
        ),
      };
    });

  return {
    filledFilings: filledFilings.length,
    pendingFilings: pendingFilings.length,
    dueFilings: dueFilings.length,
    totalFilings,
    totalTaxableAmount,
    totalTaxAmount,
    filingsByPeriod,
    statusData: [
      { name: "Filled", value: filledFilings.length },
      { name: "Pending", value: pendingFilings.length },
      { name: "Due", value: dueFilings.length },
    ],
  };
}
