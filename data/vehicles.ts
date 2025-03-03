export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  driver: string;
  contactNumber: string;
  registrationDate: string;
  status: "active" | "pending" | "inactive";
  feesPerRound: Number;
  route: "Route1" | "Route2" | "Route3";
  visits: Array<{
    id: string;
    plateNumber: string;
    date: string;
    rounds: number;
    totalCharge: number;
    amountPaid: number;
    paymentStatus: "paid" | "due";
    notes: string;
  }>;
}

export interface Visit {
  id: string;
  plateNumber: string;
  date: string;
  rounds: number;
  totalCharge: number;
  amountPaid: number;
  paymentStatus: "paid" | "due";
  notes: string;
}

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    plateNumber: "ABC-123",
    model: "Toyota Corolla",
    driver: "John Doe",
    contactNumber: "+1 234 567 8901",
    registrationDate: "2023-01-15",
    status: "active",
    feesPerRound: 1,
    route: "Route1",
    visits: [
      {
        id: "visit1",
        plateNumber: "ABC-123",
        date: "2023-03-01",
        rounds: 5,
        totalCharge: 5,
        amountPaid: 5,
        paymentStatus: "paid",
        notes: "Regular trip",
      },
      {
        id: "visit2",
        plateNumber: "ABC-123",
        date: "2023-03-02",
        rounds: 4,
        totalCharge: 4,
        amountPaid: 0,
        paymentStatus: "due",
        notes: "Extra stop added",
      },
    ],
  },
  {
    id: "v2",
    plateNumber: "XYZ-789",
    model: "Honda Civic",
    driver: "Jane Smith",
    contactNumber: "+1 987 654 3210",
    registrationDate: "2023-02-20",
    status: "active",
    feesPerRound: 1,
    route: "Route2",
    visits: [
      {
        id: "visit3",
        plateNumber: "XYZ-789",
        date: "2023-03-01",
        rounds: 6,
        totalCharge: 6,
        amountPaid: 6,
        paymentStatus: "paid",
        notes: "Busy day",
      },
      {
        id: "visit4",
        plateNumber: "XYZ-789",
        date: "2023-03-03",
        rounds: 3,
        totalCharge: 3,
        amountPaid: 0,
        paymentStatus: "due",
        notes: "Half day",
      },
    ],
  },
];

export function getAllVehicles() {
  return vehicles;
}

export function getVehicleById(id: string) {
  return vehicles.find((vehicle) => vehicle.id === id);
}

export function getAllVisits(): Visit[] {
  return vehicles.flatMap((vehicle) => vehicle.visits);
}

export function getVisitsByVehicleNumber(plateNumber: string): Visit[] {
  return (
    vehicles.find((vehicle) => vehicle.plateNumber === plateNumber)?.visits ||
    []
  );
}

export function updatePaymentStatus(
  visitID: string,
  status: "paid" | "due"
): boolean {
  for (const vehicle of vehicles) {
    const visit = vehicle.visits.find((v) => v.id === visitID);
    if (visit) {
      visit.paymentStatus = status;
      return true; // Update successful
    }
  }
  return false; // Visit not found
}
