// API service for making requests to the backend

// Base URL for API requests
const API_BASE_URL = "https://tandurmart.com/api";

// Default authentication token - in a real app, this would be handled more securely
const DEFAULT_AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsInBob25lIjoiOTY1MjMxNDQwNiIsImlhdCI6MTc0ODIzNjgxOSwiZXhwIjoxNzQ4ODQxNjE5fQ.zrwaWhasv8-F9rkNmFKAwhycCQ8c1U-oCntcZKBn7_Y";

// Function to get the auth token - in a real app, this would come from a secure storage
export const getAuthToken = (): string => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) return token;
  }
  return DEFAULT_AUTH_TOKEN;
};

// Function to set the auth token - in a real app, this would use secure storage
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

// Function to clear the auth token
export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};

// Function to handle API errors
const handleApiError = (error: any) => {
  console.error("API Error:", error);
  // Check if the error is due to an expired token
  if (
    error.message &&
    (error.message.includes("Unauthorized") ||
      error.message.includes("token expired"))
  ) {
    // Clear the token in case it's expired
    clearAuthToken();
    // In a real app, you might redirect to login here
  }
  throw error;
};

// Generic fetch function with error handling and authentication
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

// Member API endpoints
export const memberApi = {
  // Get all members
  getAllMembers: () => fetchApi<Member[]>("/member/get_members"),

  // Get member by ID
  getMemberById: async (id: string) => {
    const allMem = await memberApi.getAllMembers();
    const MemberDetails = allMem.filter((m) => m.membershipId == id);
    return MemberDetails[0];
  },

  // Create new member
  createMember: (data: Omit<Member, "membershipId">) =>
    fetchApi<Member>("/member/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update member
  updateMember: (id: string, data: Partial<Member>) =>
    fetchApi<Member>(`/member/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete member
  deleteMember: (id: string) =>
    fetchApi<{ success: boolean }>(`/member/${id}`, {
      method: "DELETE",
    }),
};

// Update member
export async function updateMember(
  id: string,
  data: Partial<Member>
): Promise<Member> {
  return fetchApi<Member>(`/member/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Auth API endpoints (for future use)
export const authApi = {
  // Login and get token
  login: (credentials: { phone: string; password: string }) =>
    fetchApi<{
      token: string;
      user: { userId: number; role: string; phone: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  // Check if token is valid
  validateToken: () =>
    fetchApi<{
      valid: boolean;
      user?: { userId: number; role: string; phone: string };
    }>("/auth/validate"),

  // Logout (client-side only for now)
  logout: () => {
    clearAuthToken();
    return Promise.resolve({ success: true });
  },
};

// Types based on the API response
export interface Member {
  membershipId: string;
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  membershipStatus: "ACTIVE" | "INACTIVE";
  nextDueDate: string | null;
  isPaymentDue: "TRUE" | "FALSE";
  electricalUscNumber: string;
  scNumber: string;
  applicantName: string;
  relation: string;
  relativeName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  firmName: string;
  proprietorName: string;
  proprietorStatus: string;
  proprietorType: string;
  sanctionedHP: string;
  phoneNumber1: string;
  phoneNumber2: string;
  surveyNumber: number;
  village: string;
  zone: string;
  mandal: string;
  district: string;
  state: string;
  pinCode: string;
  estimatedMaleWorker: number;
  estimatedFemaleWorker: number;
  modifiedBy: number | null;
  approvedOrDeclinedBy: number | null;
  approvedOrDeclinedAt: string | null;
  declineReason: string | null;
  createdAt: string;
  modifiedAt: string;
  machineryInformations: MachineryInformation[];
  branches: Branch[];
  complianceDetails: ComplianceDetails;
  partnerDetails: PartnerDetail[];
  similarMembershipInquiry: SimilarMembershipInquiry;
  attachments: Attachment[];
  proposer: Proposer;
  executiveProposer: ExecutiveProposer;
  declarations: Declaration;
}

export interface MachineryInformation {
  id: number;
  membershipId: string | null;
  branchId: number | null;
  machineName: string;
  machineCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface Branch {
  id: number;
  membershipId: string;
  electricalUscNumber: string;
  scNumber: string;
  proprietorType: string;
  proprietorStatus: string;
  placeOfBusiness: string;
  sanctionedHP: string;
  createdAt: string;
  modifiedAt: string;
  machineryInformations: MachineryInformation[];
}

export interface ComplianceDetails {
  id: number;
  membershipId: string;
  gstInNumber: string;
  gstInCertificatePath: string;
  factoryLicenseNumber: string;
  factoryLicensePath: string;
  tspcbOrderNumber: string;
  tspcbCertificatePath: string;
  mdlNumber: string;
  mdlCertificatePath: string;
  udyamCertificateNumber: string;
  udyamCertificatePath: string;
  fullAddress: string;
  partnerName: string;
  contactNumber: string;
  AadharNumber: string;
  emailId: string;
  panNumber: string;
  createdAt: string;
  modifiedAt: string;
}

export interface PartnerDetail {
  id: number;
  membershipId: string;
  partnerName: string;
  partnerAadharNo: string;
  partnerPanNo: string;
  contactNumber: string;
  emailId: string;
  createdAt: string;
  modifiedAt: string;
}

export interface SimilarMembershipInquiry {
  id: number;
  membershipId: string;
  is_member_of_similar_org: "TRUE" | "FALSE";
  has_applied_earlier: "TRUE" | "FALSE";
  is_valid_member: "TRUE" | "FALSE";
  is_executive_member: "TRUE" | "FALSE";
  createdAt: string;
  modifiedAt: string;
}

export interface Attachment {
  id: number;
  membershipId: string;
  documentName: string;
  documentPath: string;
  createdAt: string;
  modifiedAt: string;
}

export interface Proposer {
  id: number;
  membershipId: string;
  proposerID: string | null;
  signaturePath: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ExecutiveProposer {
  id: number;
  membershipId: string;
  proposerID: string | null;
  signaturePath: string;
  createdAt: string;
  modifiedAt: string;
}

export interface Declaration {
  id: number;
  membershipId: string;
  agreesToTerms: "TRUE" | "FALSE";
  membershipFormPath: string;
  applicationSignaturePath: string;
  createdAt: string;
  modifiedAt: string;
}
