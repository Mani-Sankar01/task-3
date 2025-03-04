// Import from existing routes data or create new if needed
import { routes as existingRoutes } from "./meetings";

export interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
}

// Use existing routes or create new ones if needed
export const routes: Route[] = existingRoutes || [
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

export function getAllRoutes(): Route[] {
  return routes;
}

export function getRouteById(id: string): Route | undefined {
  return routes.find((route) => route.id === id);
}
