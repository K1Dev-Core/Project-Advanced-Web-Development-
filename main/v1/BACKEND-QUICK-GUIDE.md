# Backend ฉบับไล่โค้ดง่าย

คู่มือนี้สรุป backend ใน `main/v1/backend/` โดยใช้แนวคิดเดียวกับบทเรียน NodeJS Web API: แยกไฟล์เปิด server, Express app, controller, validation, business logic และฐานข้อมูล แต่จัดไฟล์ตาม feature เพื่อให้โค้ดของลูกค้า/ออเดอร์/แผนอยู่ใกล้กัน

## จำการไหลของ request

```text
Frontend
  → server.ts เปิด Express app
  → app/App.ts ติดตั้ง middleware, auth และ routes
  → modules/<feature>/<Feature>Controller.ts อ่าน request และส่ง response
  → <Feature>Schemas.ts ตรวจและแปลง input
  → <Feature>Service.ts ใช้กฎธุรกิจ
  → <Feature>Repository.ts สั่ง SQL
  → database/Database.ts ติดต่อ MySQL
  → ส่ง JSON กลับ frontend
```

### โฟลเดอร์มีไว้ทำอะไร

| โฟลเดอร์ | อธิบายง่าย ๆ | ตัวอย่าง |
|---|---|---|
| `src/server.ts` | จุดเริ่มเปิดเว็บเซิร์ฟเวอร์ | เรียก `App.create()` และ listen |
| `src/app/` | ประกอบ Express กับของที่ระบบต้องใช้ | `App.ts`, `Container.ts` |
| `src/modules/` | งานแต่ละส่วนของระบบ | `customers/`, `orders/`, `plans/`, `jobs/` |
| `src/core/` | เครื่องมือกลางที่หลาย feature ใช้ | HTTP error, pagination, schema กลาง |
| `src/database/` | การเชื่อมต่อ ตาราง และ transaction | pool, migration, SQL executor |
| `src/config/` | อ่านค่าจาก environment | port, database, JWT, OSRM |
| `src/shared/` | ฟังก์ชัน/ชนิดข้อมูลกลาง | พิกัด, เวลา, เงิน, job code |

ในแต่ละ feature ให้จำบทบาท 4 แบบ: **Controller รับ HTTP**, **Schema ตรวจข้อมูล**, **Service ตัดสินกฎ**, **Repository คุย SQL**. ตัวอย่างเช่น `modules/customers/` รวมไฟล์ของลูกค้าไว้ด้วยกัน ไม่ต้องเปิดโฟลเดอร์ controller/service กลางที่ยาวไปทุก feature

## ไล่ตัวอย่าง: เพิ่มลูกค้า

เปิดไฟล์ตามลำดับนี้:

1. [`server.ts`](backend/src/server.ts) สร้าง Express app และเปิดพอร์ตเมื่อรันในเครื่อง
2. [`App.ts`](backend/src/app/App.ts) ติดตั้ง JSON parser, CORS, auth, route และ error handler
3. [`Container.ts`](backend/src/app/Container.ts) สร้าง Database, CustomerRepository, CustomerService และ CustomerController แล้วเชื่อม dependency เข้าด้วยกัน
4. [`CustomerController.ts`](backend/src/modules/customers/CustomerController.ts) รับ `POST /api/customers`, อ่าน body, เรียก schema และ service แล้วตอบ `201`
5. [`CustomerSchemas.ts`](backend/src/modules/customers/CustomerSchemas.ts) ตรวจชื่อ เบอร์ ที่อยู่ และพิกัดด้วย Zod
6. [`CustomerService.ts`](backend/src/modules/customers/CustomerService.ts) ใช้กฎธุรกิจและเรียก repository
7. [`CustomerRepository.ts`](backend/src/modules/customers/CustomerRepository.ts) บันทึก SQL แบบ parameterized และแปลงแถวฐานข้อมูลเป็นข้อมูลลูกค้า
8. [`Database.ts`](backend/src/database/Database.ts) จัดการ MySQL pool; Repository รับ `SqlExecutor` จึงส่ง SQL โดยไม่ต้องรู้การตั้งค่าเชื่อมต่อ

รูปแบบสำเร็จคือ `{ "data": ... }`; ถ้าเกิดข้อผิดพลาด Controller ส่งต่อให้ [`ErrorHandler.ts`](backend/src/core/errors/ErrorHandler.ts) ซึ่งแปลงเป็น `{ "error": { "code", "message" } }` ด้วย HTTP status ที่เหมาะสม

## ไฟล์หลักที่ควรเปิดตอนพรีเซนต์

- **การตั้ง server และ route:** `backend/src/server.ts`, `backend/src/app/App.ts`
- **เส้นทาง request ลูกค้า:** `backend/src/modules/customers/CustomerController.ts` → `CustomerSchemas.ts` → `CustomerService.ts` → `CustomerRepository.ts`
- **JWT และสิทธิ์:** `backend/src/modules/auth/AuthService.ts`, `AuthGuard.ts`; backend เป็นผู้ตรวจสิทธิ์จริง
- **ฐานข้อมูลและ transaction:** `backend/src/database/Database.ts`, `TransactionRunner.ts`, `migrations.ts`
- **การคำนวณแผน:** `backend/src/modules/planning/DeliveryPlanner.ts` และ `RouteOptimizer.ts`
- **การยืนยันแผน:** `backend/src/modules/plans/PlanController.ts`, `PlanService.ts`, `PlanRepository.ts`
- **ใบงานไรเดอร์:** `backend/src/modules/jobs/JobController.ts`, `JobService.ts`

## ส่วนไหนจำเป็นและส่วนไหนเป็นเครื่องมือช่วย

- ไฟล์ใน `src/modules/`, `src/app/`, `src/core/`, `src/database/`, `src/config/` และ `src/shared/` เป็นส่วนประกอบการทำงานของ API อย่าลบเพียงเพราะมีหลายไฟล์ แต่ละส่วนมีหน้าที่แยกกัน
- `modules/simulation/` เป็น API ที่ Dev tools เรียกเพื่อสร้างข้อมูลสำหรับสาธิต จึงยังเป็นฟีเจอร์ที่ใช้งานจริงในแอป
- `database/scripts/seed.ts`, `bootstrap-local.ts` และโฟลเดอร์ `tests/` ใน backend หลักใช้เตรียมฐานข้อมูล local/ตรวจพฤติกรรม ไม่จำเป็นต่อการรัน production และไม่ถูกใส่ในชุด `main/v1` สำหรับนำเสนอ
- `dist/`, `node_modules/` และ `.env` เป็น output, dependency และค่าลับเฉพาะเครื่อง ไม่ควรคัดลอกเข้า source สำหรับส่งงาน
- `planning/objectives/` แยกวิธีให้คะแนน cost/distance/time/balanced เพราะเป็นตัวเลือกที่หน้าวางแผนใช้งาน ไม่ใช่ไฟล์ทดลองที่ลบทิ้งได้

## คำสั่งที่ใช้

```bash
cd main/v1/backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

ก่อนนำเสนอ ให้ตรวจค่า MySQL, `OWNER_PASSWORD`, `JWT_SECRET` ใน `.env` แล้วเปิด `GET /api/health` เพื่อยืนยันว่า API ติดต่อฐานข้อมูลได้ ห้ามนำ `.env` จริงขึ้น Git

**คำอธิบายสั้นสำหรับพูด:** “Backend แยกตาม feature และหน้าที่ Controller รับ HTTP, Schema ตรวจข้อมูล, Service ใช้กฎธุรกิจ, Repository ติดต่อ MySQL ส่วน App เชื่อม route และ middleware เข้าด้วยกัน ทำให้ตามข้อมูลจาก request ไปจนถึงฐานข้อมูลและ response ได้เป็นลำดับครับ”
