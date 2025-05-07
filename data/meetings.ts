export type AttendeeType =
  | "member"
  | "vehicle"
  | "labour"
  | "mandal"
  | "executive"
  | "driver";
export type AttendeeScope = "all" | "selected";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  owner: string;
}

export interface Labour {
  id: string;
  name: string;
  type: string;
  contactNumber: string;
}

export interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
}

export interface Attendee {
  type: AttendeeType;
  scope: AttendeeScope;
  selectedIds?: string[]; // Used when scope is "selected"
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  date: string;
  time: string;
  status: MeetingStatus;
  notes?: string;
  meetingPoint: string;
  attendees: Attendee[];
  expectedAttendees: number;
  actualAttendees?: number;
  createdAt: string;
  updatedAt: string;
  followUps?: {
    date: string;
    time: string;
  }[];
}

// Dummy data for vehicles
export const vehicles: Vehicle[] = [
  {
    id: "VEH001",
    registrationNumber: "TS01AB1234",
    type: "Truck",
    owner: "John Doe",
  },
  {
    id: "VEH002",
    registrationNumber: "TS02CD5678",
    type: "Van",
    owner: "Jane Smith",
  },
  {
    id: "VEH003",
    registrationNumber: "TS03EF9012",
    type: "Pickup",
    owner: "Bob Johnson",
  },
];

// Dummy data for labour
export const labour: Labour[] = [
  {
    id: "LAB001",
    name: "James Wilson",
    type: "Skilled",
    contactNumber: "9876543210",
  },
  {
    id: "LAB002",
    name: "Mary Brown",
    type: "Unskilled",
    contactNumber: "8765432109",
  },
  {
    id: "LAB003",
    name: "David Lee",
    type: "Skilled",
    contactNumber: "7654321098",
  },
];

// Dummy data for routes
export const routes: Route[] = [
  {
    id: "RTE001",
    name: "City Center Route",
    startPoint: "Main Depot",
    endPoint: "City Mall",
  },
  {
    id: "RTE002",
    name: "Industrial Route",
    startPoint: "Warehouse A",
    endPoint: "Factory Zone",
  },
  {
    id: "RTE003",
    name: "Suburban Route",
    startPoint: "Distribution Center",
    endPoint: "Retail Park",
  },
];

// Dummy data for mandals
export const mandals = [
  {
    id: "MND001",
    name: "North District Mandal",
    region: "North",
  },
  {
    id: "MND002",
    name: "South District Mandal",
    region: "South",
  },
  {
    id: "MND003",
    name: "East District Mandal",
    region: "East",
  },
  {
    id: "MND004",
    name: "West District Mandal",
    region: "West",
  },
];

// Dummy data for executives (will be fetched from members in real implementation)
export const executives = [
  {
    id: "EXE001",
    name: "Rajesh Kumar",
    position: "President",
  },
  {
    id: "EXE002",
    name: "Priya Singh",
    position: "Vice President",
  },
  {
    id: "EXE003",
    name: "Amit Sharma",
    position: "Secretary",
  },
];

// Dummy data for drivers
export const drivers = [
  {
    id: "DRV001",
    name: "Suresh Patel",
    licenseNumber: "DL-0123456789",
    contactNumber: "9876543210",
  },
  {
    id: "DRV002",
    name: "Ramesh Verma",
    licenseNumber: "DL-9876543210",
    contactNumber: "8765432109",
  },
  {
    id: "DRV003",
    name: "Dinesh Gupta",
    licenseNumber: "DL-5678901234",
    contactNumber: "7654321098",
  },
];

// Dummy data for meetings
export const meetings: Meeting[] = [
  {
    id: "MTG001",
    title: "Monthly Operations Review",
    agenda: "Review of operational performance and upcoming challenges",
    date: "2024-03-15",
    time: "10:00",
    status: "scheduled",
    meetingPoint: "Main Conference Room",
    attendees: [
      { type: "member", scope: "all" },
      { type: "vehicle", scope: "selected", selectedIds: ["VEH001", "VEH002"] },
    ],
    expectedAttendees: 25,
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "MTG002",
    title: "Safety Training Session",
    agenda: "Mandatory safety training for all drivers and labor staff",
    date: "2024-03-10",
    time: "14:30",
    status: "completed",
    notes: "All participants successfully completed the training",
    meetingPoint: "Training Center",
    attendees: [
      { type: "vehicle", scope: "all" },
      { type: "labour", scope: "all" },
    ],
    expectedAttendees: 50,
    actualAttendees: 48,
    createdAt: "2024-02-25T09:00:00Z",
    updatedAt: "2024-03-10T16:30:00Z",
  },
  {
    id: "MTG003",
    title: "Route Optimization Workshop",
    agenda: "Discussion on optimizing delivery routes and schedules",
    date: "2024-03-20",
    time: "09:00",
    status: "scheduled",
    meetingPoint: "Planning Room",
    attendees: [
      { type: "member", scope: "selected", selectedIds: ["MEM001", "MEM002"] },
    ],
    expectedAttendees: 15,
    createdAt: "2024-03-05T11:00:00Z",
    updatedAt: "2024-03-05T11:00:00Z",
  },
];

// Helper functions to simulate API calls

export function getAllMeetings(): Meeting[] {
  return meetings;
}

export function getMeetingById(id: string): Meeting | undefined {
  return meetings.find((meeting) => meeting.id === id);
}

export function addMeeting(
  meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">
): Meeting {
  const newMeeting: Meeting = {
    id: `MTG${String(meetings.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...meeting,
  };
  meetings.push(newMeeting);
  return newMeeting;
}

export function updateMeeting(
  id: string,
  meeting: Omit<Meeting, "id" | "createdAt">
): Meeting | null {
  const index = meetings.findIndex((m) => m.id === id);
  if (index !== -1) {
    const updatedMeeting: Meeting = {
      ...meeting,
      id,
      createdAt: meetings[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    meetings[index] = updatedMeeting;
    return updatedMeeting;
  }
  return null;
}

export function deleteMeeting(id: string): boolean {
  const index = meetings.findIndex((meeting) => meeting.id === id);
  if (index !== -1) {
    meetings.splice(index, 1);
    return true;
  }
  return false;
}

// Helper functions for attendee options
export function getAttendeeOptions(type: AttendeeType) {
  switch (type) {
    case "member":
      return import("./members").then((module) => module.getAllMembers());
    case "vehicle":
      return vehicles;
    case "labour":
      return labour;
    case "mandal":
      return mandals;
    case "executive":
      return import("./members").then((module) =>
        module
          .getAllMembers()
          .filter(
            (member) => member.membershipDetails.isExecutiveMember == "yes"
          )
      );
    case "driver":
      return drivers;
    default:
      return [];
  }
}
