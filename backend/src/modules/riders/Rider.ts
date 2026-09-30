export interface Rider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RiderInput {
  name: string;
  phone: string;
  vehiclePlate: string;
  active: boolean;
}

export interface RiderQuery {
  search?: string;
  active?: boolean;
  page: number;
  limit: number;
}
