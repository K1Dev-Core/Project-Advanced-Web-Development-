# Lunch Route Web (Frontend)

หน้าเว็บของระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง) พัฒนาด้วย Angular 21 ใช้ร่วมกับ Web API ในโฟลเดอร์ `backend/`

## หน้าจอ

| เส้นทาง | ผู้ใช้ | รายละเอียด |
| --- | --- | --- |
| `/` | ทุกคน | หน้าแรก เลือกเข้าใช้งานเป็นเจ้าของร้านหรือไรเดอร์ |
| `/login` | เจ้าของร้าน | เข้าสู่ระบบ |
| `/app/dashboard` | เจ้าของร้าน | ภาพรวมวันนี้ ออเดอร์บนแผนที่ แผนล่าสุด |
| `/app/orders` | เจ้าของร้าน | เพิ่ม ลบ ปรับจำนวนกล่อง จำลองออเดอร์ 20–30 รายการ ล้างออเดอร์จำลอง ค้นในรัศมี 2 กม. |
| `/app/planning` | เจ้าของร้าน | คำนวณเส้นทาง แผนที่แยกสีตามไรเดอร์ สรุปกำไรขาดทุน คำนวณใหม่ ยืนยันแผน มอบหมายไรเดอร์ |
| `/app/customers` | เจ้าของร้าน | จัดการลูกค้าพร้อมปักหมุดบ้านบนแผนที่ ค้นในรัศมีที่กำหนด |
| `/app/riders` | เจ้าของร้าน | รายชื่อไรเดอร์ |
| `/app/settings` | เจ้าของร้าน | ราคา ต้นทุน ค่าไรเดอร์ เวลาออกส่ง ตำแหน่งร้าน |
| `/rider` และ `/rider/:code` | ไรเดอร์ | กรอกเลขใบงาน ดูลำดับจุดส่ง นำทาง โทร กดส่งสำเร็จ |

รองรับทุกขนาดจอ: เดสก์ท็อปใช้แถบเมนูด้านซ้าย มือถือและแท็บเล็ตใช้แถบเมนูด้านล่าง

## โครงสร้าง

```
src/app/
├── core/          models, http (ApiClient, ApiError), auth (service, guard, interceptor), services, ui (toast, confirm)
├── shared/        components (map, modal, stat card, empty state, overlays, brand), illustrations, pipes, icons
├── layout/        owner shell (sidebar + bottom navigation)
└── features/      landing, auth, dashboard, orders, planning, customers, riders, settings, rider
```

## รันในเครื่อง

```bash
cd frontend
npm install
npm start
```

เปิด `http://localhost:4200` โหมดพัฒนาจะเรียก API ที่ `http://localhost:3000/api` (ตั้งใน `src/environments/environment.development.ts`) ส่วนตอน build จริงจะเรียก `https://khaokong-apii.vercel.app/api` (`src/environments/environment.ts`)

## Deploy ขึ้น Vercel

สร้างโปรเจกต์ใหม่บน Vercel จาก repository เดียวกัน ตั้ง **Root Directory** เป็น `frontend` แล้วกด Deploy ได้เลย ค่า build อยู่ใน `vercel.json` แล้ว จากนั้นตั้ง `CORS_ORIGINS` ของ backend ให้เป็นโดเมนของหน้าเว็บ
