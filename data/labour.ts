import { getAllMembers } from "./members";

export type LabourStatus = "active" | "bench" | "inactive";

export interface AdditionalDocument {
  id: string;
  name: string;
  documentUrl: string;
  uploadDate: string;
}

export interface EmploymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  fromDate: string;
  toDate: string;
  status: LabourStatus;
}

export interface Labour {
  id: string;
  name: string;
  phone: string;
  email?: string;
  fatherName: string;
  dateOfBirth: string;
  aadharNumber: string;
  aadharCardUrl: string;
  photoUrl: string;
  permanentAddress: string;
  presentAddress: string;
  panNumber?: string;
  esiNumber?: string;
  currentMemberId?: string;
  employedFrom?: string;
  employedTo?: string;
  status: LabourStatus;
  additionalDocuments: AdditionalDocument[];
  employmentHistory: EmploymentRecord[];
  createdAt: string;
  updatedAt: string;
}

// Dummy data for labour
export const labourList: Labour[] = [
  {
    id: "LAB001",
    name: "Rajesh Kumar",
    phone: "9876543210",
    email: "rajesh@example.com",
    fatherName: "Mahesh Kumar",
    dateOfBirth: "1985-05-15",
    aadharNumber: "1234 5678 9012",
    aadharCardUrl: "/placeholder.svg",
    photoUrl: "/placeholder.svg",
    permanentAddress:
      "123, Main Street, Village Nandpur, District Patna, Bihar - 800001",
    presentAddress: "45, Worker's Colony, Industrial Area, Hyderabad - 500032",
    panNumber: "ABCPK1234D",
    esiNumber: "31-00-123456-000-0001",
    currentMemberId: "MEM001",
    employedFrom: "2023-01-15",
    employedTo: "",
    status: "active",
    additionalDocuments: [
      {
        id: "DOC001",
        name: "Police Verification",
        documentUrl: "/placeholder.svg",
        uploadDate: "2023-01-10",
      },
      {
        id: "DOC002",
        name: "Previous Experience Certificate",
        documentUrl: "/placeholder.svg",
        uploadDate: "2023-01-10",
      },
    ],
    employmentHistory: [
      {
        id: "EMP001",
        memberId: "MEM001",
        memberName: "Doe Industries",
        fromDate: "2023-01-15",
        toDate: "",
        status: "active",
      },
      {
        id: "EMP002",
        memberId: "MEM002",
        memberName: "Smith Manufacturing",
        fromDate: "2021-06-10",
        toDate: "2022-12-31",
        status: "inactive",
      },
    ],
    createdAt: "2023-01-10T10:00:00Z",
    updatedAt: "2023-01-15T15:30:00Z",
  },
  {
    id: "LAB002",
    name: "Sunita Devi",
    phone: "8765432109",
    email: "",
    fatherName: "Ramesh Prasad",
    dateOfBirth: "1990-08-22",
    aadharNumber: "9876 5432 1098",
    aadharCardUrl: "/placeholder.svg",
    photoUrl: "/placeholder.svg",
    permanentAddress: "56, East Colony, Ranchi, Jharkhand - 834001",
    presentAddress: "78, Labour Quarters, Industrial Zone, Hyderabad - 500032",
    panNumber: "",
    esiNumber: "31-00-123456-000-0002",
    currentMemberId: "MEM003",
    employedFrom: "2023-03-01",
    employedTo: "",
    status: "active",
    additionalDocuments: [
      {
        id: "DOC003",
        name: "Medical Certificate",
        documentUrl: "/placeholder.svg",
        uploadDate: "2023-02-25",
      },
    ],
    employmentHistory: [
      {
        id: "EMP003",
        memberId: "MEM003",
        memberName: "Johnson Textiles",
        fromDate: "2023-03-01",
        toDate: "",
        status: "active",
      },
    ],
    createdAt: "2023-02-25T09:15:00Z",
    updatedAt: "2023-03-01T11:30:00Z",
  },
  {
    id: "LAB003",
    name: "Mohan Singh",
    phone: "7654321098",
    email: "mohan@example.com",
    fatherName: "Bhupinder Singh",
    dateOfBirth: "1982-11-10",
    aadharNumber: "5678 9012 3456",
    aadharCardUrl: "/placeholder.svg",
    photoUrl: "/placeholder.svg",
    permanentAddress: "34, West Village, Amritsar, Punjab - 143001",
    presentAddress: "23, Worker Housing, Industrial Estate, Hyderabad - 500032",
    panNumber: "DEFPS5678G",
    esiNumber: "31-00-123456-000-0003",
    currentMemberId: "MEM002",
    employedFrom: "2022-09-15",
    employedTo: "2023-05-30",
    status: "inactive",
    additionalDocuments: [
      {
        id: "DOC004",
        name: "Skill Certificate",
        documentUrl: "/placeholder.svg",
        uploadDate: "2022-09-10",
      },
      {
        id: "DOC005",
        name: "Background Verification",
        documentUrl: "/placeholder.svg",
        uploadDate: "2022-09-10",
      },
    ],
    employmentHistory: [
      {
        id: "EMP004",
        memberId: "MEM002",
        memberName: "Smith Manufacturing",
        fromDate: "2022-09-15",
        toDate: "2023-05-30",
        status: "inactive",
      },
      {
        id: "EMP005",
        memberId: "MEM001",
        memberName: "Doe Industries",
        fromDate: "2020-03-10",
        toDate: "2022-08-31",
        status: "inactive",
      },
    ],
    createdAt: "2022-09-10T14:20:00Z",
    updatedAt: "2023-05-30T17:45:00Z",
  },
  {
    id: "LAB004",
    name: "Priya Sharma",
    phone: "6543210987",
    email: "priya@example.com",
    fatherName: "Vikram Sharma",
    dateOfBirth: "1995-04-03",
    aadharNumber: "3456 7890 1234",
    aadharCardUrl: "/placeholder.svg",
    photoUrl: "/placeholder.svg",
    permanentAddress: "78, South Street, Jaipur, Rajasthan - 302001",
    presentAddress: "90, Labour Colony, Industrial Area, Hyderabad - 500032",
    panNumber: "GHIPS9012H",
    esiNumber: "",
    currentMemberId: "",
    employedFrom: "2023-02-01",
    employedTo: "2023-06-15",
    status: "bench",
    additionalDocuments: [
      {
        id: "DOC006",
        name: "Training Certificate",
        documentUrl: "/placeholder.svg",
        uploadDate: "2023-01-25",
      },
    ],
    employmentHistory: [
      {
        id: "EMP006",
        memberId: "MEM003",
        memberName: "Johnson Textiles",
        fromDate: "2023-02-01",
        toDate: "2023-06-15",
        status: "inactive",
      },
    ],
    createdAt: "2023-01-25T11:10:00Z",
    updatedAt: "2023-06-15T16:30:00Z",
  },
];

// Helper functions to simulate API calls

export function getAllLabour(): Labour[] {
  loadLabourList();
  return labourList;
}

export function getLabourById(id: string): Labour | undefined {
  loadLabourList();
  return labourList.find((labour) => labour.id === id);
}

export function getLabourByMemberId(memberId: string): Labour[] {
  return labourList.filter((labour) => labour.currentMemberId === memberId);
}

export function getLabourByStatus(status: LabourStatus): Labour[] {
  return labourList.filter((labour) => labour.status === status);
}

export function addLabour(
  labour: Omit<Labour, "id" | "createdAt" | "updatedAt" | "employmentHistory">
): Labour {
  // Generate employment history record if currentMemberId is provided
  const employmentHistory: EmploymentRecord[] = [];

  if (labour.currentMemberId) {
    const memberName = getMemberNameById(labour.currentMemberId);
    employmentHistory.push({
      id: `EMP${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      memberId: labour.currentMemberId,
      memberName,
      fromDate: labour.employedFrom || new Date().toISOString().split("T")[0],
      toDate: labour.employedTo || "",
      status: labour.status,
    });
  }

  // Ensure each additional document has an ID
  const additionalDocuments = labour.additionalDocuments.map((doc) => ({
    ...doc,
    id:
      doc.id ||
      `DOC${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
  }));

  const newLabour: Labour = {
    id: `LAB${String(labourList.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    employmentHistory,
    ...labour,
    additionalDocuments,
  };

  labourList.push(newLabour);
  persistLabourList();

  return newLabour;
}

// Update the type signature of updateLabour to also exclude updatedAt
export function updateLabour(
  id: string,
  labour: Omit<Labour, "id" | "createdAt" | "updatedAt" | "employmentHistory">
): Labour | null {
  const index = labourList.findIndex((l) => l.id === id);

  if (index !== -1) {
    const existingLabour = labourList[index];
    const employmentHistory = [...existingLabour.employmentHistory];

    // Check if current employment has changed
    const currentEmployment = employmentHistory.find(
      (emp) =>
        emp.memberId === existingLabour.currentMemberId && emp.toDate === ""
    );

    // If current member has changed, update employment history
    if (existingLabour.currentMemberId !== labour.currentMemberId) {
      // Close previous employment record if exists
      if (currentEmployment) {
        currentEmployment.toDate = new Date().toISOString().split("T")[0];
        currentEmployment.status = "inactive";
      }

      // Add new employment record if new member is assigned
      if (labour.currentMemberId) {
        const memberName = getMemberNameById(labour.currentMemberId);
        employmentHistory.push({
          id: `EMP${String(Math.floor(Math.random() * 10000)).padStart(
            4,
            "0"
          )}`,
          memberId: labour.currentMemberId,
          memberName,
          fromDate:
            labour.employedFrom || new Date().toISOString().split("T")[0],
          toDate: labour.employedTo || "",
          status: labour.status,
        });
      }
    } else if (currentEmployment && labour.status !== existingLabour.status) {
      // Update status of current employment if only status has changed
      currentEmployment.status = labour.status;
    }

    // Ensure each additional document has an ID
    const additionalDocuments = labour.additionalDocuments.map((doc) => ({
      ...doc,
      id:
        doc.id ||
        `DOC${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    }));

    const updatedLabour: Labour = {
      ...labour,
      id,
      createdAt: existingLabour.createdAt,
      updatedAt: new Date().toISOString(),
      employmentHistory,
      additionalDocuments,
    };

    labourList[index] = updatedLabour;
    persistLabourList();

    return updatedLabour;
  }

  return null;
}

export function deleteLabour(id: string): boolean {
  const index = labourList.findIndex((labour) => labour.id === id);

  if (index !== -1) {
    labourList.splice(index, 1);
    persistLabourList();
    return true;
  }

  return false;
}

// Helper function to get member name by ID
export function getMemberNameById(memberId: string): string {
  const members = getAllMembers();
  const member = members.find((m) => m.id === memberId);
  return member ? member.firmDetails.firmName : "Unknown Industry";
}

// Helper function to get member options for dropdown
export function getMemberOptions() {
  const members = getAllMembers();
  return members.map((member) => ({
    value: member.id,
    label: `${member.id} - ${member.firmDetails.firmName}`,
  }));
}

// Function to persist labour list to localStorage
function persistLabourList() {
  if (typeof window !== "undefined") {
    localStorage.setItem("labourList", JSON.stringify(labourList));
  }
}

// Function to load labour list from localStorage
function loadLabourList() {
  if (typeof window !== "undefined") {
    const storedLabourList = localStorage.getItem("labourList");
    if (storedLabourList) {
      const parsedLabourList = JSON.parse(storedLabourList);
      // Replace the contents of the labourList array
      labourList.length = 0;
      labourList.push(...parsedLabourList);
    }
  }
}
