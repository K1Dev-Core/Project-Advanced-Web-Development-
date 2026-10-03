# ข้าวกล่อง · ส่งด่วนมื้อเที่ยง

ระบบจัดเส้นทางและแบ่งงานไรเดอร์สำหรับร้านข้าวกล่อง ใช้ Angular frontend เวอร์ชันเรียบง่าย เชื่อม Lunch Route API ของโปรเจกต์ UI ภาษาไทย รองรับมือถือ แท็บเล็ต และเดสก์ท็อป

## เปิดเว็บกับ backend ของโปรเจกต์

```bash
cd frontend
npm ci
npm start
```

เปิด http://127.0.0.1:4200 ใช้ API `https://khaokong-apii.vercel.app/api` ผ่าน same-origin proxy ทั้ง development และ Vercel Frontend หลักมีเวอร์ชันเดียว

## วิธีใช้งาน

1. เจ้าของร้านเข้าสู่ระบบ เพิ่มลูกค้าและเลือกพิกัดบนแผนที่
2. เพิ่มรายการอาหาร เลือกผู้รับ จำนวนกล่อง และวันส่ง
3. คำนวณแผนจัดส่ง เลือกไรเดอร์ และยืนยันแผน
4. ส่งเลขใบงานให้ไรเดอร์ เปิดแผนที่นำทาง และยืนยันการส่งแต่ละจุด

สิทธิ์ owner JWT และเลขใบงานไรเดอร์ยังใช้ตาม API เดิม แผนที่ใช้ Leaflet/OpenStreetMap กับพิกัดจริง หาก API ส่ง geometry ถนนมาจะแสดงเส้นถนน หากไม่มีจะแสดงเส้นประพร้อมคำอธิบาย ETA เป็นเวลาตามแผน ไม่มีการจำลอง GPS สด

## ระบบทดสอบแยกในเครื่อง

ต้องมี Node.js 22.22.3+ และ MySQL 8+ (`mysql` / `mysqld`)

```bash
npm run start:local -- --detach
```

- เว็บทดสอบ: http://127.0.0.1:4201 (frontend หลักกับ backend ฐานข้อมูลทดสอบในเครื่อง)
- Backend ทดสอบ: http://127.0.0.1:3000/api
- MySQL: `127.0.0.1:33307` ฐานข้อมูล `songsook_local`
- บัญชีในเครื่อง: `.local/ACCESS.md` ไม่ใช่บัญชี backend ออนไลน์
- ข้อมูล MySQL, รหัสผ่าน และ logs อยู่ใน `.local/` และไม่ได้ commit

ระบบนี้ใช้ `frontend/proxy.local.conf.json` แยกจาก backend ออนไลน์ ไม่แตะข้อมูล production การเริ่มครั้งถัดไปเก็บข้อมูลเดิมไว้

Backend ใน checkout นี้เพิ่ม migration 3 และ `GET /api/tracking/:code` สำหรับลิงก์ติดตามเฉพาะรายการ แต่ backend ออนไลน์ยังไม่มี endpoint นี้ จึงไม่แสดงเมนูติดตามในงานหลัก และแสดงปุ่มแชร์เฉพาะรายการที่มี `trackingCode` เท่านั้น หากต้องการเปิดใช้งานออนไลน์ต้อง deploy backend รุ่นนี้และรัน migration ก่อน

## ตรวจสอบและเอกสาร

```bash
npm run build
npm test
npm run test:live --prefix frontend
```

ชุด live ทดสอบ CRUD → เส้นทางถนน → ไรเดอร์ส่งสำเร็จ → ติดตามรายการ บนฐานข้อมูลทดสอบแยก และลบเฉพาะข้อมูลที่ชุดทดสอบสร้าง

- [Frontend และการ deploy](frontend/README.md)
- [Backend API](backend/README.md)
- [Design system](design-system/MASTER.md)
- [ผลตรวจ](frontend/review/VERIFICATION.md)

## Frontend เวอร์ชันหลัก: แบบเรียบง่าย

โค้ดอยู่ใน `frontend/src/app/` แยก pages, components, services และ models ตามบทเรียน Angular ดู [คู่มือ frontend](frontend/README.md) และ [โครงสร้างและวิธีอธิบายโค้ด](SIMPLE-FRONTEND.md)

ชุดโค้ดแบบย่อสำหรับนำไปอธิบายหรือ deploy แยกไว้ที่ [`main/v1/`](main/v1/) ภายในมี `frontend/`, `backend/` และคู่มือการรัน
