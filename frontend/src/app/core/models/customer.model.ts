import { GeoPoint } from './common.model';

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
  distanceKm?: number;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  location: GeoPoint;
  note: string;
}

export interface CustomerQuery {
  search?: string;
  simulated?: boolean;
  page?: number;
  limit?: number;
}
