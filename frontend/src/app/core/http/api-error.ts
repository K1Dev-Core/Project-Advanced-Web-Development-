import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/common.model';

export class ApiError extends Error {
  private static readonly MESSAGES: Record<string, string> = {
    UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
    INVALID_TOKEN: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    TOKEN_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    AUTH_NOT_CONFIGURED: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่านเจ้าของร้าน',
    VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    NO_PENDING_ORDERS: 'ยังไม่มีออเดอร์ที่รอจัดส่งในวันนี้',
    ORDER_LOCKED: 'ออเดอร์นี้อยู่ในแผนที่ยืนยันแล้ว ต้องยกเลิกแผนก่อน',
    CUSTOMER_HAS_ORDERS: 'ลูกค้ารายนี้ยังมีออเดอร์อยู่',
    CUSTOMER_HAS_ASSIGNED_ORDERS: 'ลูกค้ารายนี้มีออเดอร์ในแผนที่ยืนยันแล้ว',
    INVALID_BOXES: 'จำนวนกล่องต้องอยู่ระหว่าง 1 ถึง 3 กล่อง',
    PLAN_STALE: 'ออเดอร์มีการเปลี่ยนแปลง กรุณาคำนวณเส้นทางใหม่ก่อนยืนยัน',
    PLAN_ACTIVE: 'ต้องยกเลิกแผนก่อนลบ',
    INVALID_PLAN_STATUS: 'สถานะแผนไม่รองรับการทำรายการนี้',
    JOB_NOT_FOUND: 'ไม่พบเลขใบงานนี้',
    JOB_NOT_AVAILABLE: 'ใบงานนี้ยังไม่พร้อมใช้งาน',
    DATABASE_UNAVAILABLE: 'เชื่อมต่อฐานข้อมูลไม่ได้ ลองใหม่อีกครั้ง',
    NETWORK_ERROR: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
  };

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new ApiError(0, 'NETWORK_ERROR', ApiError.MESSAGES['NETWORK_ERROR']);
      }
      const body = error.error as ApiErrorBody | null;
      const code = body?.error?.code ?? 'HTTP_' + error.status;
      const message = ApiError.MESSAGES[code] ?? body?.error?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      return new ApiError(error.status, code, message, body?.error?.details);
    }
    return new ApiError(-1, 'UNKNOWN', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
  }
}
