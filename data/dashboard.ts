import { getAllMembers } from "./members";
import { getAllVehicles, getAllTrips } from "./vehicles";
import { getAllLabour } from "./labour";
import { getAllMeetings } from "./meetings";
import { getAllGstFilings } from "./gst-filings";
import { getAllMembershipFees } from "./membership-fees";
import {
  addDays,
  isToday,
  isThisWeek,
  isThisMonth,
  isFuture,
  isPast,
} from "date-fns";

// Types for dashboard data
export interface DashboardActivity {
  type: "member" | "vehicle" | "fee" | "meeting" | "gst" | "labour";
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  expectedAttendees: number;
}

export interface DashboardFee {
  id: string;
  memberName: string;
  amount: number;
  dueDate: string;
  periodFrom: string;
  periodTo: string;
}

export interface DashboardLicense {
  id: string;
  name: string;
  memberName: string;
  expiryDate: string;
}

export interface DashboardVehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  maintenanceDate: string;
}

export interface DashboardVehiclePayment {
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  amount: number;
  dueDate: string;
}

export interface DashboardGstFiling {
  id: string;
  memberName: string;
  filingPeriod: string;
  dueDate: string;
}

export interface DashboardAlert {
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  actionLink: string;
}

export interface DashboardNotification {
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface SystemHealthItem {
  name: string;
  status: "healthy" | "warning" | "error";
  uptime: string;
}

export interface DashboardData {
  // Counts
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalLabour: number;
  activeLabour: number;
  benchLabour: number;

  // Financial
  pendingFees: number;
  pendingFeesCount: number;
  pendingVehicleDues: number;
  pendingVehicleDuesCount: number;
  collectionRate: number;

  // Lists
  recentActivities: DashboardActivity[];
  upcomingMeetings: DashboardMeeting[];
  dueFeesToday: DashboardFee[];
  dueFeesThisMonth: DashboardFee[];
  expiringLicenses: DashboardLicense[];
  vehiclesDueForMaintenance: DashboardVehicle[];
  dueVehiclePayments: DashboardVehiclePayment[];
  upcomingGstFilings: DashboardGstFiling[];

  // Alerts and notifications
  criticalAlerts: DashboardAlert[];
  notifications: DashboardNotification[];
  systemHealth: SystemHealthItem[];
}

// Function to get dashboard data
export function getDashboardData(): DashboardData {
  // Get data from all modules
  const members = getAllMembers();
  const vehicles = getAllVehicles();
  const trips = getAllTrips();
  const labour = getAllLabour();
  const meetings = getAllMeetings();
  const gstFilings = getAllGstFilings();
  const membershipFees = getAllMembershipFees();

  // Calculate counts
  const activeMembers = members.filter((m) => m.status === "active").length;
  const inactiveMembers = members.filter(
    (m) => m.status === "inactive" || m.status === "pending"
  ).length;

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "maintenance"
  ).length;

  const activeLabour = labour.filter((l) => l.status === "active").length;
  const benchLabour = labour.filter((l) => l.status === "bench").length;

  // Calculate financial metrics
  const pendingFees = membershipFees
    .filter((fee) => fee.status === "due")
    .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

  const pendingFeesCount = membershipFees.filter(
    (fee) => fee.status === "due"
  ).length;

  const pendingVehicleDues = trips
    .filter(
      (trip) =>
        trip.paymentStatus === "partial" || trip.paymentStatus === "unpaid"
    )
    .reduce((sum, trip) => sum + (trip.totalAmountToPay - trip.amountPaid), 0);

  const pendingVehicleDuesCount = trips.filter(
    (trip) =>
      trip.paymentStatus === "partial" || trip.paymentStatus === "unpaid"
  ).length;

  // Calculate collection rate
  const totalBilled = membershipFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalCollected = membershipFees.reduce(
    (sum, fee) => sum + fee.paidAmount,
    0
  );
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Generate recent activities
  const recentActivities: DashboardActivity[] = [
    // Membership activities
    ...membershipFees
      .filter((fee) => new Date(fee.updatedAt) > addDays(new Date(), -7))
      .map((fee) => ({
        type: "fee" as const,
        title: `Membership Fee ${fee.status === "paid" ? "Paid" : "Recorded"}`,
        description: `${getMemberName(
          fee.memberId
        )} - ₹${fee.paidAmount.toLocaleString()} ${
          fee.status === "paid" ? "paid" : "recorded"
        }`,
        timestamp: fee.updatedAt,
      })),

    // Meeting activities
    ...meetings
      .filter(
        (meeting) => new Date(meeting.updatedAt) > addDays(new Date(), -7)
      )
      .map((meeting) => ({
        type: "meeting" as const,
        title: `Meeting ${
          meeting.status === "completed" ? "Completed" : "Scheduled"
        }`,
        description: `${meeting.title} - ${meeting.status}`,
        timestamp: meeting.updatedAt,
      })),

    // Vehicle activities
    ...trips
      .filter((trip) => new Date(trip.updatedAt) > addDays(new Date(), -7))
      .map((trip) => {
        const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
        return {
          type: "vehicle" as const,
          title: `Trip ${
            trip.paymentStatus === "paid" ? "Payment Completed" : "Recorded"
          }`,
          description: `${
            vehicle?.vehicleNumber || "Unknown Vehicle"
          } - ₹${trip.amountPaid.toLocaleString()} ${trip.paymentStatus}`,
          timestamp: trip.updatedAt,
        };
      }),

    // GST activities
    ...gstFilings
      .filter((filing) => new Date(filing.updatedAt) > addDays(new Date(), -7))
      .map((filing) => ({
        type: "gst" as const,
        title: `GST Filing ${
          filing.status === "filled" ? "Completed" : "Updated"
        }`,
        description: `${getMemberName(filing.membershipId)} - ${
          filing.filingPeriod
        }`,
        timestamp: filing.updatedAt,
      })),
  ];

  // Sort activities by timestamp (newest first)
  recentActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get upcoming meetings
  const upcomingMeetings = meetings
    .filter(
      (meeting) =>
        meeting.status === "scheduled" && isThisWeek(new Date(meeting.date))
    )
    .map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      expectedAttendees: meeting.expectedAttendees,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Get fees due today
  const dueFeesToday = membershipFees
    .filter((fee) => fee.status === "due" && isToday(new Date(fee.periodFrom)))
    .map((fee) => ({
      id: fee.id,
      memberName: getMemberName(fee.memberId),
      amount: fee.amount - fee.paidAmount,
      dueDate: fee.periodFrom,
      periodFrom: fee.periodFrom,
      periodTo: fee.periodTo,
    }));

  // Get fees due this month
  const dueFeesThisMonth = membershipFees
    .filter(
      (fee) => fee.status === "due" && isThisMonth(new Date(fee.periodFrom))
    )
    .map((fee) => ({
      id: fee.id,
      memberName: getMemberName(fee.memberId),
      amount: fee.amount - fee.paidAmount,
      dueDate: fee.periodFrom,
      periodFrom: fee.periodFrom,
      periodTo: fee.periodTo,
    }))
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  // Generate expiring licenses (mock data since we don't have a licenses module)
  const expiringLicenses: DashboardLicense[] = [
    {
      id: "LIC001",
      name: "Business Operation License",
      memberName: "Doe Industries",
      expiryDate: addDays(new Date(), 15).toISOString(),
    },
    {
      id: "LIC002",
      name: "Food Safety Certificate",
      memberName: "Smith Manufacturing",
      expiryDate: addDays(new Date(), 5).toISOString(),
    },
    {
      id: "LIC003",
      name: "Health and Safety Permit",
      memberName: "Johnson Textiles",
      expiryDate: addDays(new Date(), 25).toISOString(),
    },
  ];

  // Generate vehicles due for maintenance (mock data)
  const vehiclesDueForMaintenance: DashboardVehicle[] = vehicles
    .filter((v) => v.status === "active")
    .slice(0, 3)
    .map((vehicle, index) => ({
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      driverName: vehicle.driverName,
      maintenanceDate: addDays(new Date(), 5 + index * 3).toISOString(),
    }));

  // Generate due vehicle payments
  const dueVehiclePayments: DashboardVehiclePayment[] = trips
    .filter(
      (trip) =>
        (trip.paymentStatus === "partial" || trip.paymentStatus === "unpaid") &&
        isThisMonth(new Date(trip.date))
    )
    .map((trip) => {
      const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
      return {
        vehicleId: trip.vehicleId,
        vehicleNumber: vehicle?.vehicleNumber || "Unknown",
        driverName: vehicle?.driverName || "Unknown",
        amount: trip.totalAmountToPay - trip.amountPaid,
        dueDate: trip.date,
      };
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  // Get upcoming GST filings
  const upcomingGstFilings = gstFilings
    .filter(
      (filing) =>
        filing.status !== "filled" && isFuture(new Date(filing.dueDate))
    )
    .map((filing) => ({
      id: filing.id,
      memberName: getMemberName(filing.membershipId),
      filingPeriod: filing.filingPeriod,
      dueDate: filing.dueDate,
    }))
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  // Generate critical alerts
  const criticalAlerts: DashboardAlert[] = [];

  // Add alerts for overdue fees
  const overdueFees = membershipFees.filter(
    (fee) =>
      fee.status === "due" &&
      isPast(new Date(fee.periodFrom)) &&
      !isToday(new Date(fee.periodFrom))
  );

  if (overdueFees.length > 0) {
    criticalAlerts.push({
      title: "Overdue Membership Fees",
      description: `${overdueFees.length} membership fees are overdue and require attention`,
      severity: "critical",
      actionLink: "/admin/membership-fees",
    });
  }

  // Add alerts for expiring licenses
  const urgentLicenses = expiringLicenses.filter(
    (license) => new Date(license.expiryDate) < addDays(new Date(), 7)
  );

  if (urgentLicenses.length > 0) {
    criticalAlerts.push({
      title: "Licenses Expiring Soon",
      description: `${urgentLicenses.length} licenses are expiring within 7 days`,
      severity: "critical",
      actionLink: "/admin/licenses",
    });
  }

  // Add alerts for upcoming meetings
  const todayMeetings = meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" && isToday(new Date(meeting.date))
  );

  if (todayMeetings.length > 0) {
    criticalAlerts.push({
      title: "Meetings Today",
      description: `${todayMeetings.length} meetings are scheduled for today`,
      severity: "warning",
      actionLink: "/admin/meetings",
    });
  }

  // Generate notifications
  const notifications: DashboardNotification[] = [
    {
      title: "System Update",
      description:
        "The system will undergo maintenance tonight from 2 AM to 4 AM",
      timestamp: addDays(new Date(), -1).toISOString(),
      read: false,
    },
    {
      title: "New Feature Added",
      description: "You can now export reports to Excel format",
      timestamp: addDays(new Date(), -2).toISOString(),
      read: true,
    },
    {
      title: "Welcome to the Dashboard",
      description:
        "Explore the new dashboard features to manage your organization better",
      timestamp: addDays(new Date(), -5).toISOString(),
      read: true,
    },
  ];

  // Generate system health
  const systemHealth: SystemHealthItem[] = [
    {
      name: "Database",
      status: "healthy",
      uptime: "99.9%",
    },
    {
      name: "API Services",
      status: "healthy",
      uptime: "100%",
    },
    {
      name: "File Storage",
      status: "warning",
      uptime: "98.5%",
    },
    {
      name: "Email Service",
      status: "healthy",
      uptime: "99.7%",
    },
  ];

  return {
    // Counts
    totalMembers: members.length,
    activeMembers,
    inactiveMembers,
    totalVehicles: vehicles.length,
    activeVehicles,
    maintenanceVehicles,
    totalLabour: labour.length,
    activeLabour,
    benchLabour,

    // Financial
    pendingFees,
    pendingFeesCount,
    pendingVehicleDues,
    pendingVehicleDuesCount,
    collectionRate,

    // Lists
    recentActivities: recentActivities.slice(0, 10),
    upcomingMeetings,
    dueFeesToday,
    dueFeesThisMonth,
    expiringLicenses,
    vehiclesDueForMaintenance,
    dueVehiclePayments,
    upcomingGstFilings,

    // Alerts and notifications
    criticalAlerts,
    notifications,
    systemHealth,
  };
}

// Helper function to get member name by ID
function getMemberName(memberId: string): string {
  const members = getAllMembers();
  const member = members.find((m) => m.id === memberId);
  return member ? member.memberDetails.applicantName : "Unknown Member";
}
