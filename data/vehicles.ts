// Types for vehicles and trips
export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";
export type PaymentStatus = "paid" | "partial" | "unpaid";

// Update the Vehicle interface to include owner information and remove route/price per round
export interface Vehicle {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhoneNumber: string;
  ownerName: string; // Added owner name
  ownerPhoneNumber: string; // Added owner phone number
  status: VehicleStatus;
  createdAt: string;
  modifiedAt: string;
}

// Update the Trip interface to match API response
export interface Trip {
  id: number;
  tripId: string;
  vehicleId: string;
  tripDate: string;
  amountPerTrip: number;
  numberOfTrips: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  paymentStatus: string;
  notes: string;
  receiptPath: string | null;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number | null;
}

// Update the dummy data for vehicles
export const vehicles: Vehicle[] = [
  {
    id: "VEH001",
    vehicleId: "VEH2025-001",
    vehicleNumber: "TS01AB1234",
    driverName: "John Doe",
    driverPhoneNumber: "9876543210",
    ownerName: "Robert Smith",
    ownerPhoneNumber: "9988776655",
    status: "ACTIVE",
    createdAt: "2024-01-15T10:00:00Z",
    modifiedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "VEH002",
    vehicleId: "VEH2025-001",
    vehicleNumber: "TS02CD5678",
    driverName: "Jane Smith",
    driverPhoneNumber: "8765432109",
    ownerName: "Michael Johnson",
    ownerPhoneNumber: "8877665544",
    status: "ACTIVE",
    createdAt: "2024-01-20T11:30:00Z",
    modifiedAt: "2024-01-20T11:30:00Z",
  },
];

// Update the dummy data for trips to match API response structure
export const trips: Trip[] = [
  {
    id: 1,
    tripId: "TRP2025-001",
    vehicleId: "VEH2025-001",
    tripDate: "2024-03-01T00:00:00.000Z",
    amountPerTrip: 500,
    numberOfTrips: 5,
    totalAmount: 2500,
    amountPaid: 2500,
    balanceAmount: 0,
    paymentStatus: "PAID",
    notes: "All rounds completed on time",
    receiptPath: null,
    createdAt: "2024-03-01T18:00:00Z",
    modifiedAt: "2024-03-01T18:00:00Z",
    createdBy: 1,
    modifiedBy: null,
  },
  {
    id: 2,
    tripId: "TRP2025-002",
    vehicleId: "VEH2025-001",
    tripDate: "2024-03-05T00:00:00.000Z",
    amountPerTrip: 500,
    numberOfTrips: 4,
    totalAmount: 2000,
    amountPaid: 2000,
    balanceAmount: 0,
    paymentStatus: "PAID",
    notes: "",
    receiptPath: null,
    createdAt: "2024-03-05T17:30:00Z",
    modifiedAt: "2024-03-05T17:30:00Z",
    createdBy: 1,
    modifiedBy: null,
  },
  {
    id: 3,
    tripId: "TRP2025-003",
    vehicleId: "VEH2025-002",
    tripDate: "2024-03-02T00:00:00.000Z",
    amountPerTrip: 450,
    numberOfTrips: 6,
    totalAmount: 2700,
    amountPaid: 1350,
    balanceAmount: 1350,
    paymentStatus: "PARTIAL",
    notes: "Partial payment received",
    receiptPath: null,
    createdAt: "2024-03-02T19:15:00Z",
    modifiedAt: "2024-03-02T19:15:00Z",
    createdBy: 1,
    modifiedBy: null,
  },
  {
    id: 4,
    tripId: "TRP2025-004",
    vehicleId: "VEH2025-003",
    tripDate: "2024-03-03T00:00:00.000Z",
    amountPerTrip: 550,
    numberOfTrips: 3,
    totalAmount: 1650,
    amountPaid: 0,
    balanceAmount: 1650,
    paymentStatus: "UNPAID",
    notes: "Vehicle broke down",
    receiptPath: null,
    createdAt: "2024-03-03T08:00:00Z",
    modifiedAt: "2024-03-03T10:30:00Z",
    createdBy: 1,
    modifiedBy: null,
  },
  {
    id: 5,
    tripId: "TRP2025-005",
    vehicleId: "VEH2025-005",
    tripDate: "2024-03-04T00:00:00.000Z",
    amountPerTrip: 475,
    numberOfTrips: 5,
    totalAmount: 2375,
    amountPaid: 2375,
    balanceAmount: 0,
    paymentStatus: "PAID",
    notes: "",
    receiptPath: null,
    createdAt: "2024-03-04T18:45:00Z",
    modifiedAt: "2024-03-04T18:45:00Z",
    createdBy: 1,
    modifiedBy: null,
  },
];

// Helper functions to simulate API calls

// Vehicles
export function getAllVehicles(): Vehicle[] {
  return vehicles;
}

export function getAllActiveVehicles(): Vehicle[] {
  let vehicle = vehicles.filter((v, i) => v.status == "ACTIVE");
  return vehicle;
}

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.vehicleId === id);
}

export function addVehicle(
  vehicle: Omit<Vehicle, "id" | "createdAt" | "modifiedAt">
): Vehicle {
  const newVehicle: Vehicle = {
    id: `VEH${String(vehicles.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
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
      modifiedAt: new Date().toISOString(),
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

export function getTripById(id: number): Trip | undefined {
  return trips.find((trip) => trip.id === id);
}

// Update the addTrip function to match new interface
export function addTrip(
  trip: Omit<Trip, "id" | "tripId" | "createdAt" | "modifiedAt" | "createdBy">
): Trip {
  const newTrip: Trip = {
    id: trips.length + 1,
    tripId: `TRP2025-${String(trips.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    createdBy: 1,
    ...trip,
  };
  trips.push(newTrip);
  return newTrip;
}

// Update the updateTrip function
export function updateTrip(
  id: number,
  trip: Omit<Trip, "id" | "createdAt" | "createdBy">
): Trip | null {
  const index = trips.findIndex((t) => t.id === id);
  if (index !== -1) {
    const updatedTrip: Trip = {
      ...trip,
      id,
      createdAt: trips[index].createdAt,
      createdBy: trips[index].createdBy,
      modifiedAt: new Date().toISOString(),
    };
    trips[index] = updatedTrip;
    return updatedTrip;
  }
  return null;
}

export function deleteTrip(id: number): boolean {
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
  const todayTrips = filteredTrips.filter((trip) => trip.tripDate.split("T")[0] === today);
  const yesterdayTrips = filteredTrips.filter(
    (trip) => trip.tripDate.split("T")[0] === yesterday
  );

  // Count trips by payment status
  const paidTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "PAID"
  );
  const partialTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "PARTIAL"
  );
  const unpaidTrips = filteredTrips.filter(
    (trip) => trip.paymentStatus === "UNPAID"
  );

  // Calculate totals
  const totalTrips = filteredTrips.length;
  const totalAmountToPay = filteredTrips.reduce(
    (sum, trip) => sum + trip.totalAmount,
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
    count: filteredTrips.filter((trip) => trip.tripDate.split("T")[0] === date).length,
    amount: filteredTrips
      .filter((trip) => trip.tripDate.split("T")[0] === date)
      .reduce((sum, trip) => sum + trip.totalAmount, 0),
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
    const tripDate = trip.tripDate.split("T")[0];
    const matchesVehicle = vehicleId ? trip.vehicleId === vehicleId : true;
    return matchesVehicle && tripDate >= startDate && tripDate <= endDate;
  });
}
