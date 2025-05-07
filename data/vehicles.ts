// Types for vehicles and trips
export type VehicleStatus = "active" | "maintenance" | "inactive";
export type PaymentStatus = "paid" | "partial" | "unpaid";

// Update the Vehicle interface to include owner information and remove route/price per round
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverNumber: string;
  ownerName: string; // Added owner name
  ownerPhoneNumber: string; // Added owner phone number
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

// Update the Trip interface to include pricePerRound
export interface Trip {
  id: string;
  vehicleId: string;
  date: string;
  totalRounds: number;
  pricePerRound: number; // Added price per round
  totalAmountToPay: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Update the dummy data for vehicles
export const vehicles: Vehicle[] = [
  {
    id: "VEH001",
    vehicleNumber: "TS01AB1234",
    driverName: "John Doe",
    driverNumber: "9876543210",
    ownerName: "Robert Smith",
    ownerPhoneNumber: "9988776655",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "VEH002",
    vehicleNumber: "TS02CD5678",
    driverName: "Jane Smith",
    driverNumber: "8765432109",
    ownerName: "Michael Johnson",
    ownerPhoneNumber: "8877665544",
    status: "active",
    createdAt: "2024-01-20T11:30:00Z",
    updatedAt: "2024-01-20T11:30:00Z",
  },
  {
    id: "VEH003",
    vehicleNumber: "TS03EF9012",
    driverName: "Robert Johnson",
    driverNumber: "7654321098",
    ownerName: "Sarah Williams",
    ownerPhoneNumber: "7766554433",
    status: "maintenance",
    createdAt: "2024-02-05T09:15:00Z",
    updatedAt: "2024-03-10T14:20:00Z",
  },
  {
    id: "VEH004",
    vehicleNumber: "TS04GH3456",
    driverName: "Emily Davis",
    driverNumber: "6543210987",
    ownerName: "David Brown",
    ownerPhoneNumber: "6655443322",
    status: "inactive",
    createdAt: "2024-02-10T13:45:00Z",
    updatedAt: "2024-02-10T13:45:00Z",
  },
  {
    id: "VEH005",
    vehicleNumber: "TS05IJ7890",
    driverName: "Michael Wilson",
    driverNumber: "5432109876",
    ownerName: "Jennifer Miller",
    ownerPhoneNumber: "5544332211",
    status: "active",
    createdAt: "2024-02-15T08:30:00Z",
    updatedAt: "2024-02-15T08:30:00Z",
  },
];

// Update the dummy data for trips to include pricePerRound
export const trips: Trip[] = [
  {
    id: "TRP001",
    vehicleId: "VEH001",
    date: "2024-03-01",
    totalRounds: 5,
    pricePerRound: 500,
    totalAmountToPay: 2500,
    amountPaid: 2500,
    paymentStatus: "paid",
    notes: "All rounds completed on time",
    createdAt: "2024-03-01T18:00:00Z",
    updatedAt: "2024-03-01T18:00:00Z",
  },
  {
    id: "TRP002",
    vehicleId: "VEH001",
    date: "2024-03-05",
    totalRounds: 4,
    pricePerRound: 500,
    totalAmountToPay: 2000,
    amountPaid: 2000,
    paymentStatus: "paid",
    createdAt: "2024-03-05T17:30:00Z",
    updatedAt: "2024-03-05T17:30:00Z",
  },
  {
    id: "TRP003",
    vehicleId: "VEH002",
    date: "2024-03-02",
    totalRounds: 6,
    pricePerRound: 450,
    totalAmountToPay: 2700,
    amountPaid: 1350,
    paymentStatus: "partial",
    notes: "Partial payment received",
    createdAt: "2024-03-02T19:15:00Z",
    updatedAt: "2024-03-02T19:15:00Z",
  },
  {
    id: "TRP004",
    vehicleId: "VEH003",
    date: "2024-03-03",
    totalRounds: 3,
    pricePerRound: 550,
    totalAmountToPay: 1650,
    amountPaid: 0,
    paymentStatus: "unpaid",
    notes: "Vehicle broke down",
    createdAt: "2024-03-03T08:00:00Z",
    updatedAt: "2024-03-03T10:30:00Z",
  },
  {
    id: "TRP005",
    vehicleId: "VEH005",
    date: "2024-03-04",
    totalRounds: 5,
    pricePerRound: 475,
    totalAmountToPay: 2375,
    amountPaid: 2375,
    paymentStatus: "paid",
    createdAt: "2024-03-04T18:45:00Z",
    updatedAt: "2024-03-04T18:45:00Z",
  },
  {
    id: "TRP006",
    vehicleId: "VEH001",
    date: "2024-03-10",
    totalRounds: 6,
    pricePerRound: 500,
    totalAmountToPay: 3000,
    amountPaid: 1500,
    paymentStatus: "partial",
    notes: "Remaining payment due next week",
    createdAt: "2024-03-10T19:00:00Z",
    updatedAt: "2024-03-10T19:00:00Z",
  },
  {
    id: "TRP007",
    vehicleId: "VEH001",
    date: new Date().toISOString().split("T")[0],
    totalRounds: 3,
    pricePerRound: 500,
    totalAmountToPay: 1500,
    amountPaid: 1500,
    paymentStatus: "paid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "TRP008",
    vehicleId: "VEH002",
    date: new Date().toISOString().split("T")[0],
    totalRounds: 4,
    pricePerRound: 450,
    totalAmountToPay: 1800,
    amountPaid: 0,
    paymentStatus: "unpaid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "TRP009",
    vehicleId: "VEH001",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    totalRounds: 5,
    pricePerRound: 500,
    totalAmountToPay: 2500,
    amountPaid: 1000,
    paymentStatus: "partial",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "TRP010",
    vehicleId: "VEH001",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    totalRounds: 2,
    pricePerRound: 500,
    totalAmountToPay: 1000,
    amountPaid: 1000,
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Helper functions to simulate API calls

// Vehicles
export function getAllVehicles(): Vehicle[] {
  return vehicles;
}

export function getAllActiveVehicles(): Vehicle[] {
  let vehicle = vehicles.filter((v, i) => v.status == "active");
  return vehicle;
}

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}

export function addVehicle(
  vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Vehicle {
  const newVehicle: Vehicle = {
    id: `VEH${String(vehicles.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...vehicle,
  };
  vehicles.push(newVehicle);
  return newVehicle;
}

export function updateVehicle(
  id: string,
  vehicle: Omit<Vehicle, "id" | "createdAt">
): Vehicle | null {
  const index = vehicles.findIndex((v) => v.id === id);
  if (index !== -1) {
    const updatedVehicle: Vehicle = {
      ...vehicle,
      id,
      createdAt: vehicles[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    vehicles[index] = updatedVehicle;
    return updatedVehicle;
  }
  return null;
}

export function deleteVehicle(id: string): boolean {
  const index = vehicles.findIndex((vehicle) => vehicle.id === id);
  if (index !== -1) {
    vehicles.splice(index, 1);
    return true;
  }
  return false;
}

// Trips
// Add a function to get all trips
export function getAllTrips(): Trip[] {
  return trips;
}

export function getTripsByVehicleId(vehicleId: string): Trip[] {
  return trips.filter((trip) => trip.vehicleId === vehicleId);
}

export function getTripById(id: string): Trip | undefined {
  return trips.find((trip) => trip.id === id);
}

// Update the addTrip function to accept pricePerRound
export function addTrip(
  trip: Omit<Trip, "id" | "createdAt" | "updatedAt">
): Trip {
  const newTrip: Trip = {
    id: `TRP${String(trips.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...trip,
  };
  trips.push(newTrip);
  return newTrip;
}

// Update the updateTrip function
export function updateTrip(
  id: string,
  trip: Omit<Trip, "id" | "createdAt">
): Trip | null {
  const index = trips.findIndex((t) => t.id === id);
  if (index !== -1) {
    const updatedTrip: Trip = {
      ...trip,
      id,
      createdAt: trips[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    trips[index] = updatedTrip;
    return updatedTrip;
  }
  return null;
}

export function deleteTrip(id: string): boolean {
  const index = trips.findIndex((trip) => trip.id === id);
  if (index !== -1) {
    trips.splice(index, 1);
    return true;
  }
  return false;
}

export function getTripStatistics(vehicleId?: string) {
  const filteredTrips = vehicleId
    ? trips.filter((trip) => trip.vehicleId === vehicleId)
    : trips;

  // Get today's and yesterday's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Count trips by date
  const todayTrips = filteredTrips.filter((trip) => trip.date === today);
  const yesterdayTrips = filteredTrips.filter(
    (trip) => trip.date === yesterday
  );

  // Count trips by payment status
  const paidTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "paid"
  );
  const partialTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "partial"
  );
  const unpaidTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "unpaid"
  );

  // Calculate totals
  const totalTrips = filteredTrips.length;
  const totalAmountToPay = filteredTrips.reduce(
    (sum, trip) => sum + trip.totalAmountToPay,
    0
  );
  const totalAmountPaid = filteredTrips.reduce(
    (sum, trip) => sum + trip.amountPaid,
    0
  );
  const totalDues = totalAmountToPay - totalAmountPaid;

  // Get trips by date for chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const tripsByDate = last7Days.map((date) => ({
    date,
    count: filteredTrips.filter((trip) => trip.date === date).length,
    amount: filteredTrips
      .filter((trip) => trip.date === date)
      .reduce((sum, trip) => sum + trip.totalAmountToPay, 0),
  }));

  return {
    todayTrips: todayTrips.length,
    yesterdayTrips: yesterdayTrips.length,
    paidTrips: paidTrips.length,
    partialTrips: partialTrips.length,
    unpaidTrips: unpaidTrips.length,
    totalTrips,
    totalAmountToPay,
    totalAmountPaid,
    totalDues,
    tripsByDate,
    paymentStatusData: [
      { name: "Paid", value: paidTrips.length },
      { name: "Partial", value: partialTrips.length },
      { name: "Unpaid", value: unpaidTrips.length },
    ],
  };
}

export function getTripsByDateRange(
  startDate: string,
  endDate: string,
  vehicleId?: string
) {
  return trips.filter((trip) => {
    const tripDate = trip.date;
    const matchesVehicle = vehicleId ? trip.vehicleId === vehicleId : true;
    return matchesVehicle && tripDate >= startDate && tripDate <= endDate;
  });
}
