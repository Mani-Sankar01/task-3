import { getAllMembers } from "./members";
import { getAllVehicles, getAllTrips } from "./vehicles";
import { getAllLabour } from "./labour";
import { getAllMeetings } from "./meetings";
import { getAllGstFilings } from "./gst-filings";
import { getAllMembershipFees } from "./membership-fees";
import {
  format,
  subMonths,
  isAfter,
  isBefore,
  isWithinInterval,
  differenceInMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";

// Function to get analytics data for a specific date range
export function getAnalyticsData(startDate: Date, endDate: Date) {
  // Get data from all modules
  const members = getAllMembers();
  const vehicles = getAllVehicles();
  const trips = getAllTrips();
  const labour = getAllLabour();
  const meetings = getAllMeetings();
  const gstFilings = getAllGstFilings();
  const membershipFees = getAllMembershipFees();

  // Filter data by date range
  const membersInRange = members.filter((m) =>
    isWithinInterval(new Date(m.joinDate), { start: startDate, end: endDate })
  );

  const tripsInRange = trips.filter((t) =>
    isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
  );

  const feesInRange = membershipFees.filter((f) =>
    isWithinInterval(new Date(f.periodFrom), { start: startDate, end: endDate })
  );

  const gstFilingsInRange = gstFilings.filter((g) =>
    isWithinInterval(new Date(g.filingPeriod), {
      start: startDate,
      end: endDate,
    })
  );

  // Calculate total revenue and collection rate
  const totalRevenue = feesInRange.reduce((sum, fee) => sum + fee.amount, 0);
  const totalCollected = feesInRange.reduce(
    (sum, fee) => sum + fee.paidAmount,
    0
  );
  const collectionRate =
    totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

  // Calculate pending dues
  const pendingFees = feesInRange
    .filter((fee) => fee.status === "due")
    .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

  const pendingVehicleDues = tripsInRange
    .filter(
      (trip) =>
        trip.paymentStatus === "partial" || trip.paymentStatus === "unpaid"
    )
    .reduce((sum, trip) => sum + (trip.totalAmountToPay - trip.amountPaid), 0);

  const pendingDues = pendingFees + pendingVehicleDues;

  // Calculate growth rates (comparing to previous period of same length)
  const previousStartDate = subMonths(
    startDate,
    differenceInMonths(endDate, startDate)
  );
  const previousEndDate = subMonths(
    endDate,
    differenceInMonths(endDate, startDate)
  );

  const feesInPreviousPeriod = membershipFees.filter((f) =>
    isWithinInterval(new Date(f.periodFrom), {
      start: previousStartDate,
      end: previousEndDate,
    })
  );

  const previousRevenue = feesInPreviousPeriod.reduce(
    (sum, fee) => sum + fee.amount,
    0
  );
  const revenueGrowth =
    previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 100;

  const membersInPreviousPeriod = members.filter((m) =>
    isWithinInterval(new Date(m.joinDate), {
      start: previousStartDate,
      end: previousEndDate,
    })
  );

  const memberGrowth =
    membersInPreviousPeriod.length > 0
      ? Math.round(
          ((membersInRange.length - membersInPreviousPeriod.length) /
            membersInPreviousPeriod.length) *
            100
        )
      : 100;

  const previousDues = feesInPreviousPeriod
    .filter((fee) => fee.status === "due")
    .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

  const duesChange =
    previousDues > 0
      ? Math.round(((pendingDues - previousDues) / previousDues) * 100)
      : 0;

  // Generate monthly data for charts
  const months = getMonthsBetweenDates(startDate, endDate);

  // Revenue by month
  const revenueByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const monthlyFees = membershipFees.filter((f) =>
      isWithinInterval(new Date(f.periodFrom), {
        start: monthStart,
        end: monthEnd,
      })
    );

    return {
      month: format(monthStart, "MMM yyyy"),
      revenue: monthlyFees.reduce((sum, fee) => sum + fee.amount, 0),
      collected: monthlyFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
    };
  });

  // Payment status by month
  const paymentStatusByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const monthlyFees = membershipFees.filter((f) =>
      isWithinInterval(new Date(f.periodFrom), {
        start: monthStart,
        end: monthEnd,
      })
    );

    return {
      month: format(monthStart, "MMM yyyy"),
      paid: monthlyFees
        .filter((f) => f.status === "paid")
        .reduce((sum, fee) => sum + fee.amount, 0),
      due: monthlyFees
        .filter((f) => f.status === "due")
        .reduce((sum, fee) => sum + fee.amount, 0),
      canceled: monthlyFees
        .filter((f) => f.status === "canceled")
        .reduce((sum, fee) => sum + fee.amount, 0),
    };
  });

  // Member growth by month
  const memberGrowthByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const newMembersInMonth = members.filter((m) =>
      isWithinInterval(new Date(m.joinDate), {
        start: monthStart,
        end: monthEnd,
      })
    );

    const totalMembersUntilMonth = members.filter((m) =>
      isBefore(new Date(m.joinDate), monthEnd)
    );

    return {
      month: format(monthStart, "MMM yyyy"),
      new: newMembersInMonth.length,
      total: totalMembersUntilMonth.length,
    };
  });

  // Trip revenue by month
  const tripRevenueByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const monthlyTrips = trips.filter((t) =>
      isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );

    return {
      month: format(monthStart, "MMM yyyy"),
      revenue: monthlyTrips.reduce(
        (sum, trip) => sum + trip.totalAmountToPay,
        0
      ),
      collected: monthlyTrips.reduce((sum, trip) => sum + trip.amountPaid, 0),
    };
  });

  // Labour trends by month
  const labourTrendsByMonth = months.map((month) => {
    const monthEnd = endOfMonth(startOfMonth(parseISO(month + "-01")));

    // Count labour by status as of the end of each month
    const activeLabour = labour.filter(
      (l) =>
        l.status === "active" &&
        (!l.employedTo ||
          l.employedTo === "" ||
          isAfter(new Date(l.employedTo), monthEnd))
    ).length;

    const benchLabour = labour.filter(
      (l) =>
        l.status === "bench" &&
        (!l.employedTo ||
          l.employedTo === "" ||
          isAfter(new Date(l.employedTo), monthEnd))
    ).length;

    const inactiveLabour = labour.filter(
      (l) =>
        l.status === "inactive" ||
        (l.employedTo &&
          l.employedTo !== "" &&
          isBefore(new Date(l.employedTo), monthEnd))
    ).length;

    return {
      month: format(monthEnd, "MMM yyyy"),
      active: activeLabour,
      bench: benchLabour,
      inactive: inactiveLabour,
    };
  });

  // Compliance metrics by month
  const complianceByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));
    const monthEnd = endOfMonth(monthStart);

    // GST compliance: percentage of filings completed on time
    const dueFilings = gstFilings.filter((g) =>
      isWithinInterval(new Date(g.dueDate), {
        start: monthStart,
        end: monthEnd,
      })
    );

    const completedFilings = dueFilings.filter((g) => g.status === "filled");
    const gstCompliance =
      dueFilings.length > 0
        ? Math.round((completedFilings.length / dueFilings.length) * 100)
        : 100;

    // Mock data for license and document compliance
    const licenseCompliance = 75 + Math.floor(Math.random() * 25);
    const documentCompliance = 80 + Math.floor(Math.random() * 20);

    return {
      month: format(monthStart, "MMM yyyy"),
      gstCompliance,
      licenseCompliance,
      documentCompliance,
    };
  });

  // Member activity by month (mock data)
  const memberActivityByMonth = months.map((month) => {
    const monthStart = startOfMonth(parseISO(month + "-01"));

    return {
      month: format(monthStart, "MMM yyyy"),
      meetings: 10 + Math.floor(Math.random() * 20),
      payments: 15 + Math.floor(Math.random() * 30),
      documents: 5 + Math.floor(Math.random() * 15),
    };
  });

  // Revenue sources (pie chart)
  const revenueSources = [
    {
      name: "Membership Fees",
      value: feesInRange.reduce((sum, fee) => sum + fee.amount, 0),
    },
    {
      name: "Vehicle Trips",
      value: tripsInRange.reduce((sum, trip) => sum + trip.totalAmountToPay, 0),
    },
    { name: "GST Services", value: 25000 + Math.floor(Math.random() * 15000) },
    {
      name: "Other Services",
      value: 10000 + Math.floor(Math.random() * 10000),
    },
  ];

  // Members by status
  const membersByStatus = [
    {
      name: "Active",
      value: members.filter((m) => m.status === "active").length,
    },
    {
      name: "Pending",
      value: members.filter((m) => m.status === "pending").length,
    },
    {
      name: "Inactive",
      value: members.filter((m) => m.status === "inactive").length,
    },
  ];

  // Vehicles by status
  const vehiclesByStatus = [
    {
      name: "Active",
      value: vehicles.filter((v) => v.status === "active").length,
    },
    {
      name: "Maintenance",
      value: vehicles.filter((v) => v.status === "maintenance").length,
    },
    {
      name: "Inactive",
      value: vehicles.filter((v) => v.status === "inactive").length,
    },
  ];

  // Labour by status
  const labourByStatus = [
    {
      name: "Active",
      value: labour.filter((l) => l.status === "active").length,
    },
    { name: "Bench", value: labour.filter((l) => l.status === "bench").length },
    {
      name: "Inactive",
      value: labour.filter((l) => l.status === "inactive").length,
    },
  ];

  // GST filings by status
  const gstFilingsByStatus = [
    {
      name: "Filled",
      value: gstFilings.filter((g) => g.status === "filled").length,
    },
    {
      name: "Pending",
      value: gstFilings.filter((g) => g.status === "pending").length,
    },
    { name: "Due", value: gstFilings.filter((g) => g.status === "due").length },
  ];

  // License status (mock data)
  const licenseStatus = [
    { name: "Valid", value: 75 },
    { name: "Expiring Soon", value: 15 },
    { name: "Expired", value: 10 },
  ];

  // Vehicle performance
  const vehiclePerformance = vehicles
    .filter((v) => v.status === "active")
    .slice(0, 5)
    .map((vehicle) => {
      const vehicleTrips = trips.filter((t) => t.vehicleId === vehicle.id);
      return {
        vehicle: vehicle.vehicleNumber,
        trips: vehicleTrips.length,
        revenue: vehicleTrips.reduce(
          (sum, trip) => sum + trip.totalAmountToPay,
          0
        ),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Labour by industry (member)
  const labourByIndustry = members
    .slice(0, 5)
    .map((member) => {
      const memberLabour = labour.filter(
        (l) => l.currentMemberId === member.id
      );
      return {
        industry: member.firmDetails.firmName,
        count: memberLabour.length,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    // Summary metrics
    totalRevenue,
    revenueGrowth,
    collectionRate,
    newMembers: membersInRange.length,
    memberGrowth,
    pendingDues,
    duesChange,

    // Charts data
    revenueByMonth,
    paymentStatusByMonth,
    memberGrowthByMonth,
    tripRevenueByMonth,
    labourTrendsByMonth,
    complianceByMonth,
    memberActivityByMonth,
    revenueSources,
    membersByStatus,
    vehiclesByStatus,
    labourByStatus,
    gstFilingsByStatus,
    licenseStatus,
    vehiclePerformance,
    labourByIndustry,
  };
}

// Helper function to get array of months between two dates in YYYY-MM format
function getMonthsBetweenDates(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    months.push(format(currentDate, "yyyy-MM"));
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
  }

  return months;
}
