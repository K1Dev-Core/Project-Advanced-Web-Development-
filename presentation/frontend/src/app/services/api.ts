import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Envelope } from '../models/models';
declare global {
  interface Window {
    __PARCEL_CONFIG__?: { apiUrl?: string };
  }
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const errors: Record<string, string> = {
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบช่องที่กรอก',
  DATABASE_UNAVAILABLE: 'ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองอีกครั้ง',
  INTERNAL_SERVER_ERROR: 'ระบบขัดข้อง กรุณาลองอีกครั้ง',
  NO_PENDING_ORDERS: 'ไม่มีรายการรอจัดส่งในวันที่เลือก กรุณาเพิ่มรายการหรือเปลี่ยนวันที่',
  CUSTOMER_HAS_ORDERS: 'ลูกค้านี้มีรายการส่งอยู่ กรุณาจัดการรายการส่งก่อนลบลูกค้า',
  CUSTOMER_HAS_ASSIGNED_ORDERS: 'ลูกค้านี้อยู่ในแผนจัดส่งที่ยืนยันแล้ว จึงแก้ไขไม่ได้',
  PLAN_STALE: 'ข้อมูลรายการเปลี่ยนแล้ว กรุณาคำนวณแผนใหม่',
  RIDER_INACTIVE: 'ไรเดอร์นี้พักงานอยู่ กรุณาเลือกไรเดอร์ที่พร้อมรับงาน',
  INVALID_BOXES: 'จำนวนกล่องเกินข้อจำกัดของร้าน กรุณาตรวจสอบอีกครั้ง',
  INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  TOKEN_EXPIRED: 'หมดเวลาใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง',
  INVALID_TOKEN: 'กรุณาเข้าสู่ระบบอีกครั้ง',
  ORDER_LOCKED: 'รายการอยู่ในแผนที่ยืนยันแล้ว จึงแก้ไขไม่ได้',
  JOB_NOT_FOUND: 'ไม่พบเลขใบงานนี้ กรุณาตรวจสอบอีกครั้ง',
  JOB_NOT_AVAILABLE: 'ใบงานยังไม่ยืนยัน หรือถูกยกเลิกแล้ว',
  AUTH_NOT_CONFIGURED: 'ระบบยังไม่ได้ตั้งค่าบัญชีเจ้าของร้าน',
  TRACKING_NOT_FOUND: 'ไม่พบเลขติดตามนี้ กรุณาตรวจสอบลิงก์ที่ได้รับจากร้านผู้ส่ง',
  STOP_NOT_FOUND: 'ไม่พบจุดส่งในใบงานนี้',
};
@Injectable({ providedIn: 'root' })
export class Api {
  private router = inject(Router);
  readonly token = signal(sessionStorage.getItem('khaokong-owner-token-v2') || '');
  readonly demo = signal(false);
  readonly notice = signal('');
  readonly base = (window.__PARCEL_CONFIG__?.apiUrl || '/api').replace(/\/$/, '');
  async request<T>(
    path: string,
    method = 'GET',
    body?: unknown,
    protectedRequest = true,
  ): Promise<Envelope<T>> {
    if (protectedRequest && !this.token())
      throw new ApiError(401, 'LOGIN_REQUIRED', 'กรุณาเข้าสู่ระบบเจ้าของร้าน');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${this.base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(protectedRequest && this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const json = response.status === 204 ? { data: null } : await response.json();
      if (!response.ok) {
        const code = json.error?.code || 'REQUEST_FAILED';
        if (response.status === 401 && protectedRequest) {
          this.token.set('');
          sessionStorage.removeItem('khaokong-owner-token-v2');
          this.router.navigateByUrl('/admin/login');
        }
        throw new ApiError(
          response.status,
          code,
          code === 'VALIDATION_ERROR'
            ? validationMessage(json.error?.details)
            : errors[code] || json.error?.message || 'ดำเนินการไม่สำเร็จ',
        );
      }
      return json;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new Error('เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบเครือข่ายและลองอีกครั้ง');
    } finally {
      clearTimeout(timeout);
    }
  }
  async login(username: string, password: string) {
    const { data } = await this.request<{ token: string; user: { role: string } }>(
      '/auth/login',
      'POST',
      { username, password },
      false,
    );
    if (data.user.role !== 'owner') throw new Error('บัญชีนี้ไม่มีสิทธิ์จัดการ');
    this.token.set(data.token);
    sessionStorage.setItem('khaokong-owner-token-v2', data.token);
    this.demo.set(false);
  }
  logout() {
    this.token.set('');
    sessionStorage.removeItem('khaokong-owner-token-v2');
    this.demo.set(false);
    this.router.navigateByUrl('/customer');
  }
  toast(message: string) {
    this.notice.set(message);
    setTimeout(() => {
      if (this.notice() === message) this.notice.set('');
    }, 4000);
  }
}

const fieldNames: Record<string, string> = {
  shopName: 'ชื่อร้าน',
  shopAddress: 'ที่อยู่ร้าน',
  shopLocation: 'ตำแหน่งร้าน',
  departureTime: 'เวลาออกส่ง',
  deliveryWindowMinutes: 'ระยะเวลาส่ง',
  boxPrice: 'ราคาต่อกล่อง',
  boxCost: 'ต้นทุนต่อกล่อง',
  riderBaseFee: 'ค่าไรเดอร์เริ่มต้น',
  riderFeePerKmPerBox: 'ค่าไรเดอร์ต่อระยะทาง',
  riderSpeedKmh: 'ความเร็วไรเดอร์',
  maxOrdersPerRider: 'รายการสูงสุดต่อไรเดอร์',
  maxBoxesPerOrder: 'กล่องสูงสุดต่อรายการ',
  serviceMinutesPerStop: 'เวลาจอดส่ง',
  roadDistanceFactor: 'ตัวคูณระยะทาง',
  serviceRadiusKm: 'รัศมีบริการ',
  firstName: 'ชื่อ',
  lastName: 'นามสกุล',
  phone: 'เบอร์โทร',
  address: 'ที่อยู่',
  location: 'ตำแหน่งจัดส่ง',
  customerId: 'ลูกค้าผู้รับ',
  boxes: 'จำนวนกล่อง',
  deliveryDate: 'วันที่จัดส่ง',
  name: 'ชื่อไรเดอร์',
  vehiclePlate: 'ทะเบียนรถ',
  note: 'หมายเหตุ',
};
function validationMessage(details: unknown): string {
  const fields = Array.isArray(details)
    ? [
        ...new Set(
          details
            .map((d) =>
              typeof d?.field === 'string' ? fieldNames[d.field.split('.')[0]] : undefined,
            )
            .filter(Boolean),
        ),
      ]
    : [];
  return fields.length ? 'กรุณาตรวจสอบ ' + fields.join(' · ') : errors['VALIDATION_ERROR'];
}
