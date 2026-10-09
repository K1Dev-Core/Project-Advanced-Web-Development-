import { OrderStatus, PlanObjective, PlanStatus, RouteStatus } from '../core/models';

export class Labels {
  static readonly orderStatus: Record<OrderStatus, { text: string; tone: string }> = {
    pending: { text: 'รอจัดส่ง', tone: 'yellow' },
    assigned: { text: 'จัดรถแล้ว', tone: 'blue' },
    delivered: { text: 'ส่งแล้ว', tone: 'green' },
    cancelled: { text: 'ยกเลิก', tone: 'red' },
  };

  static readonly planStatus: Record<PlanStatus, { text: string; tone: string }> = {
    draft: { text: 'ร่าง', tone: 'yellow' },
    confirmed: { text: 'ยืนยันแล้ว', tone: 'blue' },
    completed: { text: 'ส่งครบแล้ว', tone: 'green' },
    cancelled: { text: 'ยกเลิก', tone: 'red' },
  };

  static readonly routeStatus: Record<RouteStatus, { text: string; tone: string }> = {
    pending: { text: 'รอออกส่ง', tone: 'yellow' },
    in_progress: { text: 'กำลังส่ง', tone: 'blue' },
    completed: { text: 'ส่งครบ', tone: 'green' },
  };

  static readonly objectiveIcon: Record<PlanObjective, string> = {
    cost: 'wallet',
    distance: 'route',
    time: 'zap',
    balanced: 'scale',
  };
}
