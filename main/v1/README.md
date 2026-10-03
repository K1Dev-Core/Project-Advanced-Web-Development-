# ข้าวกล่อง · ระบบจัดส่ง

ชุดโค้ดหลักเวอร์ชัน 1 แยกส่วนที่ใช้รันระบบจริงเป็น `backend/` และ `frontend/` ไม่มี tests, build output, dependencies ที่ติดตั้งไว้, cache, รายงาน หรือค่า `.env` จริง

## โครงสร้าง

- `backend/src/server.ts` เปิด Express API
- `backend/src/app/Container.ts` ประกอบ services, repositories และ controllers
- `backend/src/modules/` แบ่งงานตามฟีเจอร์ เช่น ลูกค้า ออเดอร์ ไรเดอร์ เส้นทาง แผน และใบงาน
- `backend/src/database/` เชื่อม MySQL และจัดการ migrations
- `frontend/src/app/` มีหน้าเว็บและคอมโพเนนต์ที่ใช้ร่วมกัน
- `frontend/src/app/services/` มี API client
- `frontend/src/app/models/` มีแบบข้อมูล
- `frontend/src/app/components/` มีไอคอน สถานะ และแผนที่ Leaflet

## วิธีทำงานของระบบ

1. ร้านจัดการลูกค้า ไรเดอร์ และรายการส่งผ่านหน้าเว็บ ซึ่งเรียก API ของ backend
2. backend ขอระยะทางและ geometry ถนนจาก OSRM แล้วคำนวณแผนจัดส่งตามเป้าหมายและเงื่อนไขเวลา
3. ร้านตรวจและยืนยันแผน ระบบสร้างเลขใบงานให้แต่ละไรเดอร์
4. ไรเดอร์เปิดใบงาน ดูเส้นทางและจุดส่ง แล้วอัปเดตสถานะส่งสำเร็จผ่าน API

## รัน Backend ในเครื่อง

ต้องมี MySQL ที่ backend เชื่อมต่อได้

```bash
cd backend
npm install
cp .env.example .env
```

แก้ค่าฐานข้อมูลและตั้ง `OWNER_PASSWORD` กับ `JWT_SECRET` ใน `.env` แล้วรัน:

```bash
npm run db:migrate
npm run dev
```

API จะอยู่ที่ `http://localhost:3000/api` ส่วน `GET /api/health` ใช้ตรวจการเชื่อมต่อฐานข้อมูล

## รัน Frontend

```bash
cd frontend
npm install
npm start
```

เปิด `http://127.0.0.1:4200` ค่าเริ่มต้นจะเรียก backend production ผ่าน proxy ที่ `proxy.conf.json` หากต้องการใช้ backend ในเครื่อง ให้เปิด backend ก่อน แล้วใช้ `npm run start:local` ซึ่งเปิด frontend ที่พอร์ต `4201` และส่ง `/api` ไป `localhost:3000`

## Deploy Frontend

Frontend ใช้ Angular และตั้ง Vercel output directory ไว้ที่ `dist/frontend/browser` ใน `frontend/vercel.json` เส้นทาง `/api/*` จะ proxy ไป backend production
