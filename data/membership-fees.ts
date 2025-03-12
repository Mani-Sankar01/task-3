import { getAllMembers } from "./members";

export type MembershipFeeStatus = "paid" | "due" | "canceled";

export interface MembershipFee {
  id: string;
  memberId: string;
  amount: number;
  paidAmount: number;
  paidDate?: string;
  periodFrom: string;
  periodTo: string;
  status: MembershipFeeStatus;
  notes?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

// Dummy data for membership fees
export const membershipFees: MembershipFee[] = [
  {
    id: "FEE001",
    memberId: "MEM001",
    amount: 5000,
    paidAmount: 5000,
    paidDate: "2025-01-15",
    periodFrom: "2025-01-01",
    periodTo: "2025-03-31",
    status: "paid",
    notes: "Quarterly membership fee",
    receiptNumber: "REC-2025-001",
    paymentMethod: "Bank Transfer",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "FEE002",
    memberId: "MEM002",
    amount: 5000,
    paidAmount: 2500,
    paidDate: "2025-01-20",
    periodFrom: "2025-01-01",
    periodTo: "2025-03-31",
    status: "due",
    notes: "Partial payment received",
    receiptNumber: "REC-2025-002",
    paymentMethod: "Cash",
    createdAt: "2025-01-20T11:30:00Z",
    updatedAt: "2025-01-20T11:30:00Z",
  },
  {
    id: "FEE003",
    memberId: "MEM003",
    amount: 5000,
    paidAmount: 0,
    periodFrom: "2025-01-01",
    periodTo: "2025-03-31",
    status: "canceled",
    notes: "Membership on hold",
    createdAt: "2025-01-05T09:15:00Z",
    updatedAt: "2025-01-25T14:20:00Z",
  },
  {
    id: "FEE004",
    memberId: "MEM001",
    amount: 5000,
    paidAmount: 5000,
    paidDate: "2025-10-10",
    periodFrom: "2025-10-01",
    periodTo: "2025-12-31",
    status: "paid",
    notes: "Quarterly membership fee",
    receiptNumber: "REC-2025-042",
    paymentMethod: "Bank Transfer",
    createdAt: "2025-10-10T10:00:00Z",
    updatedAt: "2025-10-10T10:00:00Z",
  },
  {
    id: "FEE005",
    memberId: "MEM002",
    amount: 5000,
    paidAmount: 5000,
    paidDate: "2025-10-15",
    periodFrom: "2025-10-01",
    periodTo: "2025-12-31",
    status: "paid",
    notes: "Quarterly membership fee",
    receiptNumber: "REC-2025-043",
    paymentMethod: "Cheque",
    createdAt: "2025-10-15T11:30:00Z",
    updatedAt: "2025-10-15T11:30:00Z",
  },
  {
    id: "FEE006",
    memberId: "MEM003",
    amount: 5000,
    paidAmount: 5000,
    paidDate: "2025-10-20",
    periodFrom: "2025-10-01",
    periodTo: "2025-12-31",
    status: "paid",
    notes: "Quarterly membership fee",
    receiptNumber: "REC-2025-044",
    paymentMethod: "Cash",
    createdAt: "2025-10-20T09:15:00Z",
    updatedAt: "2025-10-20T09:15:00Z",
  },
  {
    id: "FEE007",
    memberId: "MEM001",
    amount: 5000,
    paidAmount: 0,
    periodFrom: "2025-04-01",
    periodTo: "2025-06-30",
    status: "due",
    notes: "Upcoming quarterly fee",
    createdAt: "2025-03-15T10:00:00Z",
    updatedAt: "2025-03-15T10:00:00Z",
  },
];

// Helper functions to simulate API calls

export function getAllMembershipFees(): MembershipFee[] {
  loadMembershipFees();
  return membershipFees;
}

export function getMembershipFeeById(id: string): MembershipFee | undefined {
  loadMembershipFees();
  return membershipFees.find((fee) => fee.id === id);
}

export function getMembershipFeesByMemberId(memberId: string): MembershipFee[] {
  return membershipFees.filter((fee) => fee.memberId === memberId);
}

export function getMembershipFeesByStatus(
  status: MembershipFeeStatus
): MembershipFee[] {
  return membershipFees.filter((fee) => fee.status === status);
}

export function getMembershipFeesByDateRange(
  startDate: string,
  endDate: string
): MembershipFee[] {
  return membershipFees.filter((fee) => {
    // Use period start date for comparison
    return fee.periodFrom >= startDate && fee.periodFrom <= endDate;
  });
}

export function addMembershipFee(
  fee: Omit<MembershipFee, "id" | "createdAt" | "updatedAt">
): MembershipFee {
  const newFee: MembershipFee = {
    id: `FEE${String(membershipFees.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...fee,
  };
  membershipFees.push(newFee);
  persistMembershipFees();
  return newFee;
}

export function updateMembershipFee(
  id: string,
  fee: Omit<MembershipFee, "id" | "createdAt" | "updatedAt">
): MembershipFee | null {
  const index = membershipFees.findIndex((f) => f.id === id);
  if (index !== -1) {
    const updatedFee: MembershipFee = {
      ...fee,
      id,
      createdAt: membershipFees[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    membershipFees[index] = updatedFee;
    persistMembershipFees();
    return updatedFee;
  }
  return null;
}

export function deleteMembershipFee(id: string): boolean {
  const index = membershipFees.findIndex((fee) => fee.id === id);
  if (index !== -1) {
    membershipFees.splice(index, 1);
    persistMembershipFees();
    return true;
  }
  return false;
}

// Helper function to get member name by ID
export function getMemberNameById(memberId: string): string {
  const members = getAllMembers();
  const member = members.find((m) => m.id === memberId);
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

// Function to persist membership fees to localStorage
function persistMembershipFees() {
  if (typeof window !== "undefined") {
    localStorage.setItem("membershipFees", JSON.stringify(membershipFees));
  }
}

// Function to load membership fees from localStorage
function loadMembershipFees() {
  if (typeof window !== "undefined") {
    const storedFees = localStorage.getItem("membershipFees");
    if (storedFees) {
      const parsedFees = JSON.parse(storedFees);
      // Replace the contents of the membershipFees array
      membershipFees.length = 0;
      membershipFees.push(...parsedFees);
    }
  }
}

// Helper function to get membership fee statistics
export function getMembershipFeeStatistics() {
  const totalFees = membershipFees.length;
  const paidFees = membershipFees.filter((fee) => fee.status === "paid").length;
  const dueFees = membershipFees.filter((fee) => fee.status === "due").length;
  const canceledFees = membershipFees.filter(
    (fee) => fee.status === "canceled"
  ).length;

  const totalAmount = membershipFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaidAmount = membershipFees.reduce(
    (sum, fee) => sum + fee.paidAmount,
    0
  );
  const totalDueAmount = totalAmount - totalPaidAmount;

  // Get fees by quarter for chart data
  const feesByQuarter = membershipFees.reduce((acc, fee) => {
    const year = fee.periodFrom.substring(0, 4);
    const month = Number.parseInt(fee.periodFrom.substring(5, 7));
    const quarter = Math.ceil(month / 3);
    const period = `Q${quarter} ${year}`;

    if (!acc[period]) {
      acc[period] = {
        period,
        count: 0,
        amount: 0,
        paidAmount: 0,
      };
    }

    acc[period].count += 1;
    acc[period].amount += fee.amount;
    acc[period].paidAmount += fee.paidAmount;

    return acc;
  }, {} as Record<string, { period: string; count: number; amount: number; paidAmount: number }>);

  return {
    totalFees,
    paidFees,
    dueFees,
    canceledFees,
    totalAmount,
    totalPaidAmount,
    totalDueAmount,
    feesByQuarter: Object.values(feesByQuarter).sort((a, b) =>
      a.period.localeCompare(b.period)
    ),
    statusData: [
      { name: "Paid", value: paidFees },
      { name: "Due", value: dueFees },
      { name: "Canceled", value: canceledFees },
    ],
  };
}
