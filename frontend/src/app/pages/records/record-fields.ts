import { Field } from '../../shared/fields';
export type RecordKind = 'customers' | 'orders' | 'riders';
export const recordNames: Record<RecordKind, string> = {
  customers: 'ลูกค้า',
  orders: 'รายการส่ง',
  riders: 'ไรเดอร์',
};
export const customerFields: Field[] = [
  { key: 'firstName', label: 'ชื่อ', required: true },
  { key: 'lastName', label: 'นามสกุล' },
  { key: 'phone', label: 'เบอร์โทร', type: 'tel', required: true },
  { key: 'address', label: 'ที่อยู่' },
  { key: 'note', label: 'หมายเหตุ' },
];
export const riderFields: Field[] = [
  { key: 'name', label: 'ชื่อไรเดอร์', required: true },
  { key: 'phone', label: 'เบอร์โทร', type: 'tel' },
  { key: 'vehiclePlate', label: 'ทะเบียนรถ' },
  { key: 'active', label: 'พร้อมรับงาน', type: 'checkbox' },
];
