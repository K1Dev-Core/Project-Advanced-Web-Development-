export interface Point {
  latitude: number;
  longitude: number;
}
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  address: string;
  location: Point;
  note: string;
  simulated: boolean;
}
export interface Rider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
  active: boolean;
}
export interface Order {
  trackingCode?: string;
  id: number;
  customerId: number;
  customer: { id: number; fullName: string; phone: string; address: string; location: Point };
  boxes: number;
  status: string;
  deliveryDate: string;
  totalPrice: number;
  note: string;
  simulated: boolean;
  planId: number | null;
}
export interface Stop {
  id: number;
  sequence: number;
  orderId: number | null;
  customerName: string;
  phone: string;
  address: string;
  location: Point;
  boxes: number;
  eta: string;
  status: string;
  late: boolean;
  mapUrl: string;
  callUrl?: string;
}
export interface DeliveryRoute {
  id: number;
  sequence: number;
  jobCode: string;
  status: string;
  color: string;
  colorName: string;
  rider: Rider | null;
  orderCount: number;
  boxCount: number;
  distanceKm: number;
  durationMinutes: number;
  finishTime: string;
  riderFee: number;
  profit: number;
  lateStops: number;
  navigationUrl: string;
  geometry: Point[];
  path: Point[];
  stops: Stop[];
}
export interface Summary {
  orderCount: number;
  boxCount: number;
  riderCount: number;
  totalDistanceKm: number;
  totalRiderFee: number;
  revenue: number;
  foodCost: number;
  netProfit: number;
  latestArrivalTime: string;
  onTime: boolean;
  lateStops: number;
  distanceSource: string;
}
export interface Plan {
  id: number;
  deliveryDate: string;
  status: string;
  objective: string;
  seed: number;
  departureTime: string;
  deadlineTime: string;
  shop: { name: string; location: Point };
  summary: Summary;
  routes: DeliveryRoute[];
}
export interface Proposal {
  seed: number;
  objective: string;
  summary: Summary;
  routes: DeliveryRoute[];
}
export interface Job {
  geometry?: Point[];
  jobCode: string;
  color: string;
  colorName: string;
  planStatus: string;
  deliveryDate: string;
  status: string;
  rider: Rider | null;
  shop: { name: string; location: Point };
  departureTime: string;
  deadlineTime: string;
  finishTime: string;
  totalOrders: number;
  totalBoxes: number;
  distanceKm: number;
  durationMinutes: number;
  riderFee: number;
  deliveredStops: number;
  remainingStops: number;
  navigationUrl: string;
  path: Point[];
  stops: Stop[];
}
export interface Settings {
  shopName: string;
  shopAddress: string;
  shopLocation: Point;
  boxPrice: number;
  boxCost: number;
  riderBaseFee: number;
  riderFeePerKmPerBox: number;
  riderSpeedKmh: number;
  maxOrdersPerRider: number;
  maxBoxesPerOrder: number;
  departureTime: string;
  deliveryWindowMinutes: number;
  serviceMinutesPerStop: number;
  roadDistanceFactor: number;
  serviceRadiusKm: number;
}
export interface Dashboard {
  deliveryDate: string;
  customers: { total: number };
  riders: { active: number };
  orders: {
    totalOrders: number;
    totalBoxes: number;
    totalRevenue: number;
    byStatus: Record<string, { orders: number; boxes: number }>;
  };
  plans: { total: number; active: Plan | null };
  shop: { name: string; departureTime: string; deadlineTime: string };
}
export interface Envelope<T> {
  data: T;
  meta?: { total: number; page: number; totalPages: number };
}
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const labels: Record<string, string> = {
  pending: 'รอจัดส่ง',
  assigned: 'จัดไรเดอร์แล้ว',
  delivered: 'ส่งสำเร็จ',
  cancelled: 'ยกเลิก',
  draft: 'แบบร่าง',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  in_progress: 'กำลังจัดส่ง',
  cost: 'ประหยัดที่สุด',
  distance: 'ระยะทางสั้นที่สุด',
  time: 'ส่งเร็วที่สุด',
  balanced: 'สมดุล',
};

export interface TrackingSnapshot {
  reference: string;
  status: string;
  boxes: number;
  deliveryDate: string;
  updatedAt: string | null;
  deliveredAt: string | null;
  recipient: { displayName: string; location: Point };
  origin: { name: string; location: Point };
  schedule: {
    eta: string | null;
    departureTime: string | null;
    deadlineTime: string | null;
    late: boolean;
  };
  routeStatus: string | null;
  riderName: string | null;
}
