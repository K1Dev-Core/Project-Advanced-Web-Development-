import { GeoPoint } from "../../shared/geo/GeoPoint";

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  address: string;
  location: GeoPoint;
  note: string;
  simulated: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerWithDistance extends Customer {
  distanceKm: number;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  location: GeoPoint;
  note: string;
  simulated?: boolean;
}

export type CustomerSortField = "id" | "name" | "createdAt";

export interface CustomerQuery {
  search?: string;
  firstName?: string;
  lastName?: string;
  simulated?: boolean;
  sort: CustomerSortField;
  order: "asc" | "desc";
  page: number;
  limit: number;
}
