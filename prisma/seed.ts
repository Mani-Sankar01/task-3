const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create Memberships
  const membership1 = await prisma.membership.create({
    data: {
      meterNumber: "MTR001",
      industryName: "StoneWorks Ltd.",
      address: "123 Quarry Road, Tandur",
      contactNumber: "555-1234",
      email: "contact@stoneworks.com",
      aadharNumber: "1234-5678-9012",
      panNumber: "PAN001",
      gstinNumber: "GSTIN001",
      membershipStartDate: new Date("2023-01-01"),
      membershipDueDate: new Date("2023-12-31"),
      monthlyFee: 1000,
      lastPaymentDate: new Date("2023-11-01"),
      status: "Active",
      notes: "Premium member",
    },
  });

  const membership2 = await prisma.membership.create({
    data: {
      meterNumber: "MTR002",
      industryName: "Granite Masters",
      address: "456 Stone Ave, Tandur",
      contactNumber: "555-5678",
      email: "info@granitemasters.com",
      aadharNumber: "2345-6789-0123",
      panNumber: "PAN002",
      gstinNumber: "GSTIN002",
      membershipStartDate: new Date("2023-05-01"),
      membershipDueDate: new Date("2023-12-01"),
      monthlyFee: 1500,
      lastPaymentDate: new Date("2023-10-01"),
      status: "Active",
      notes: "Standard member",
    },
  });

  // Create Payments
  await prisma.payment.createMany({
    data: [
      {
        membershipId: membership1.id,
        amount: 1000,
        paymentDate: new Date("2023-11-01"),
        dueDate: new Date("2023-12-01"),
        status: "Paid",
        transactionType: "Membership Fee",
      },
      {
        membershipId: membership2.id,
        amount: 1500,
        paymentDate: new Date("2023-10-01"),
        dueDate: new Date("2023-11-01"),
        status: "Pending",
        transactionType: "Membership Fee",
      },
    ],
  });

  // Create Meetings
  await prisma.meeting.create({
    data: {
      meetingDate: new Date("2023-12-15"),
      location: "Main Conference Hall, Tandur",
      agenda: "Year-end review and future planning",
      allMembers: true,
      notificationSent: true,
    },
  });

  // Create GST Filings
  await prisma.gstFiling.createMany({
    data: [
      {
        membershipId: membership1.id,
        filingDate: new Date("2023-11-10"),
        amount: 500,
        filingPeriod: "Q4 2023",
        notes: "Quarterly filing",
      },
      {
        membershipId: membership2.id,
        filingDate: new Date("2023-10-05"),
        amount: 750,
        filingPeriod: "Q3 2023",
        notes: "Quarterly filing",
      },
    ],
  });

  // Create Employees
  await prisma.employee.createMany({
    data: [
      {
        membershipId: membership1.id,
        name: "John Doe",
        role: "Supervisor",
        contactNumber: "555-0001",
        aadharNumber: "5678-9012-3456",
        joiningDate: new Date("2021-01-10"),
      },
      {
        membershipId: membership2.id,
        name: "Jane Smith",
        role: "Manager",
        contactNumber: "555-0002",
        aadharNumber: "6789-0123-4567",
        joiningDate: new Date("2022-06-15"),
      },
    ],
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      {
        name: "Limestone",
        category: "Building Material",
        description: "High-quality limestone slabs.",
        pricePerUnit: 50,
        stockQuantity: 1000,
      },
      {
        name: "Granite",
        category: "Building Material",
        description: "Durable granite blocks.",
        pricePerUnit: 80,
        stockQuantity: 500,
      },
    ],
  });

  // Create Vehicles
  await prisma.vehicle.createMany({
    data: [
      {
        membershipId: membership1.id,
        vehicleNumber: "TS09AB1234",
        visitDate: new Date("2023-11-20"),
        feesCollected: 100,
        dueAmount: 0,
        lastPaymentDate: new Date("2023-11-20"),
      },
      {
        membershipId: membership2.id,
        vehicleNumber: "TS10CD5678",
        visitDate: new Date("2023-10-15"),
        feesCollected: 100,
        dueAmount: 100,
        lastPaymentDate: new Date("2023-10-15"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
