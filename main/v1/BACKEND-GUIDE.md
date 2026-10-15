# คู่มืออธิบาย Backend — ข้าวกล่อง v1

เอกสารนี้อธิบายโค้ดใน `main/v1/backend/` ตั้งแต่ Express entry point, middleware, validation, service/repository, MySQL, routing จนถึงการคำนวณแผน ใช้เป็นแนวอ่านโค้ดและบทพูดพรีเซนต์ได้

## 1. ขอบเขตและเทคโนโลยี

Backend ให้ REST API สำหรับร้านและไรเดอร์ พัฒนาด้วย TypeScript, Node.js 22, Express 5, MySQL และ Zod งานที่เปลี่ยนข้อมูลใช้ service ตรวจ business rules ก่อน repository คุย SQL ผ่าน connection pool ส่วนการเปลี่ยนข้อมูลหลายตารางใช้ transaction

ระบบแบ่งตามความรับผิดชอบ:

```text
HTTP request
  → App / route middleware
  → Controller: อ่าน request + parse schema + เลือก status code
  → Service: business rules และประสานหลาย repository
  → Repository: SQL และ map row เป็น model
  → MySQL
  → { data, meta? } หรือ { error }
```

การคำนวณเส้นทางแยก routing provider ออกจาก planner: OSRM ให้ระยะทางถนนและ geometry; หาก provider ใช้ไม่ได้ ระบบมี estimated-distance fallback และระบุ source เพื่อไม่ทำให้เข้าใจว่าเป็นถนนจริง

## 2. โครงสร้างโปรเจกต์

```text
backend/
├── .env.example
├── package.json / package-lock.json
├── tsconfig.json
└── src/
    ├── server.ts
    ├── app/                     # สร้าง Express app และประกอบ dependency
    ├── config/                  # อ่าน environment และสร้าง config ที่มี type
    ├── core/                    # error, controller base, pagination, schema กลาง
    ├── database/                # MySQL pool, transactions, migrations
    ├── modules/                 # business features แบ่งเป็น module
    └── shared/                  # utility ที่หลาย module ใช้
```

## 3. Entry point, composition และ request lifecycle

### `src/server.ts`

อ่าน `AppConfig`, สร้าง Express ด้วย `App.create(config)` และเปิด HTTP server เมื่อไฟล์ถูกรันโดยตรง เมื่อ platform import module จะ export Express app โดยไม่เปิด port เอง ซึ่งใช้กับ serverless adapter ได้

### `src/app/App.ts`

เป็น composition root ของ HTTP:

1. ปิด header `x-powered-by`, ตั้ง `trust proxy`
2. ติดตั้ง CORS, JSON body limit 1 MB และ URL-encoded parser
3. ติดตั้ง migration gate ก่อน route; ยกเว้น health check และปิดได้ด้วย `DB_AUTO_MIGRATE=false`
4. ขอ controller list จาก Container, ใส่ auth middleware ตาม `requiresAuth` แล้ว mount router ตาม `basePath`
5. ลงทะเบียน system endpoints และเก็บ endpoint catalog เพื่อคืนจาก API root
6. ติดตั้ง 404 handler และ error handler ไว้ท้ายสุด

System router mount ทั้ง root และ `/api` ทำให้มี root/health endpoint สำหรับตรวจระบบ โดย API ของ feature mount ใต้ `/api`

### `src/app/Container.ts`

สร้าง instance ของ Database, Migrator, BusinessCalendar, AuthService/AuthGuard, repositories และ services แล้วประกอบเป็น controllers รายการนี้เป็นที่รวม dependency ทำให้ module ไม่ต้องสร้าง connection เอง และทำให้เห็นภาพว่า service ไหนพึ่ง repository/service ใด

### รูปแบบ response และ error

- `core/http/BaseController.ts` เป็น router base class: `build()` เรียก `registerRoutes()`, `action()` ส่ง async error ไป Express, `ok()` คืน `{ data }` หรือ `{ data, meta }`, `created()` คืน HTTP 201 และ `idParam()` ตรวจ positive integer
- `core/errors/HttpError.ts` แทน error ที่รู้ HTTP status, code, message และ optional details พร้อม factory สำหรับ 400/404/409/422/503
- `core/errors/ErrorHandler.ts` แปลง `HttpError`, `ZodError`, JSON syntax/database connection error และ unknown error เป็น JSON รูปแบบเดียว `{ error: { code, message, details? } }`; ซ่อนรายละเอียดภายในเมื่อ production
- `core/http/Pagination.ts` คำนวณ SQL offset และ metadata `total/page/limit/totalPages`
- `core/validation/CommonSchemas.ts` รวม schema สำหรับวันที่ ISO, เวลา HH:mm, พิกัด, positive ID, boolean query flag, pagination และ nearby query

## 4. Environment และ configuration

`config/AppConfig.ts` อ่าน `.env` แล้วแปลง string เป็น typed configuration กลุ่ม server, database, routing และ auth โดยมีค่าเริ่มต้นสำหรับ development:

| ตัวแปร | จุดประสงค์ |
|---|---|
| `PORT`, `APP_TIMEZONE`, `CORS_ORIGINS` | port, timezone สำหรับวันทำงาน และ allowlist origin |
| `DATABASE_URL` หรือ `DB_HOST/PORT/USER/PASSWORD/NAME` | ที่อยู่ MySQL; ใช้ URL หรือ field แยก |
| `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `DB_SSL_CA` | TLS ของ MySQL |
| `DB_CONNECTION_LIMIT`, `DB_AUTO_MIGRATE` | ขนาด pool และเปิด migration อัตโนมัติ |
| `AUTH_ENABLED`, `OWNER_USERNAME`, `OWNER_PASSWORD`, `JWT_SECRET`, `JWT_TTL_HOURS` | การล็อกอินร้านและอายุ token |
| `ROUTING_PROVIDER`, `OSRM_URL`, `OSRM_PROFILE` | provider/host/profile สำหรับระยะทางถนน |
| `ROUTING_TIMEOUT_MS`, `ROUTING_CONCURRENCY` | timeout และจำนวน routing tasks ที่ทำพร้อมกัน |

ห้าม commit `.env` จริงหรือใส่ secret ลง README/Frontend ตัวอย่าง `.env.example` ใช้เป็นรายการตัวแปรเท่านั้น ใน deployment ควรตั้ง `CORS_ORIGINS` เฉพาะ origin ที่ใช้จริง, รหัสผ่านที่เดายาก และ secret แบบสุ่ม

## 5. Authentication และ permissions

- `modules/auth/AuthController.ts` ให้ `POST /auth/login` และ `GET /auth/me`; login รับ username/password แล้ว validate ด้วย Zod
- `modules/auth/AuthService.ts` ตรวจ credential แบบ timing-safe ผ่าน hash comparison, ออก JWT HS256 ที่มี issuer/subject/role และหมดอายุตาม TTL
- `modules/auth/AuthGuard.ts` อ่าน `Authorization: Bearer <token>`, verify algorithm/issuer/role และเก็บ user ใน `res.locals`
- Controller ทั้งหมดที่ไม่ได้ override `requiresAuth` จะถูกป้องกันด้วย owner guard ใน `App`; Auth, System, Jobs และ Tracking เป็น public ตามการตั้งค่าใน class (Auth `/me` ติด guard เฉพาะ route เอง)
- เมื่อ `AUTH_ENABLED=false` guard จะปล่อย request ผ่าน แต่ production ควรเปิด auth และตั้ง `OWNER_PASSWORD`/`JWT_SECRET`

## 6. Database, schema และ transaction

### Database implementation

- `database/SqlExecutor.ts` เป็น interface ที่มี `query`/`execute`; repository จึงไม่ผูกกับ concrete connection
- `database/Database.ts` สร้าง `mysql2/promise` pool, กำหนด UTF-8, UTC timezone, date/decimal handling, TLS option, ping/close และ transaction wrapper
- Transaction wrapper ขอ connection เดียว, begin → callback → commit; ถ้าล้มเหลว rollback แล้วคืน connection
- `database/TransactionRunner.ts` เปิด contract transaction ให้ service ใช้ และให้ repository สร้าง instance ที่ผูกกับ transaction executor ได้
- `database/Migrator.ts` สร้าง `schema_migrations`, เรียง migration ตาม version, รันเฉพาะ version ที่ยังไม่ถูกบันทึก และ `runOnce()` ป้องกันการรันซ้ำพร้อมกันใน process
- `database/scripts/migrate.ts` เป็น CLI entry point สำหรับสั่ง migration ด้วยมือ
- `database/migrations.ts` เก็บ migration แบบเรียง version: v1 สร้างตารางหลัก, v2 เพิ่ม route geometry และ simulated flags พร้อมแก้ข้อมูลเก่า, v3 เพิ่ม tracking code แบบสุ่มและ unique index

### ตารางหลักที่สร้างจาก migrations

| ตาราง | ใช้เก็บ |
|---|---|
| `settings` | ข้อมูลร้าน, พิกัด, ราคา/ต้นทุน, เวลา, capacity และพารามิเตอร์วางแผน (มี singleton row id=1) |
| `customers` | ชื่อ, เบอร์, ที่อยู่, พิกัด, note, simulated flag, timestamps |
| `riders` | ชื่อ, เบอร์, ทะเบียน, active flag, timestamps |
| `orders` | ลูกค้า, วันที่ส่ง, จำนวนกล่อง, ราคาต่อกล่อง, status, plan relation, delivered time, simulated flag และ tracking code |
| `delivery_plans` | วันที่, objective/seed/revision/status, เวลาออกและ deadline, snapshot settings, summary/signature และ lifecycle timestamps |
| `plan_routes` | route ต่อ plan, job code, rider, status, จำนวน order/กล่อง, ระยะ/เวลา/การเงิน และ path/geometry |
| `plan_stops` | จุดส่งเรียงลำดับ, snapshot ชื่อลูกค้า/ที่อยู่/พิกัด, ระยะ/ETA, late/status/delivered time |
| `schema_migrations` | version/name/time ของ schema migration ที่สำเร็จ |

Plan stops เก็บข้อมูล snapshot เพื่อให้ใบงานสะท้อนข้อมูลที่ใช้สร้างแผน หากลบ order/customer ตาม FK ได้โดยตั้ง null ใน stop แต่ route/plan lifecycle ยังคงตรวจผ่าน service

## 7. Modules — API, service และ repository

แต่ละ module แยกไฟล์ domain model, schema, controller, service และ repository ตามความจำเป็น Controller ไม่ควรเป็นที่ใส่ business logic; schema ตรวจรูปร่าง/ชนิด request; service ตรวจสิทธิ์และกฎธุรกิจ; repository เป็นผู้ query/update ข้อมูล

### Auth และ System

- `modules/auth/AuthController.ts`, `AuthService.ts`, `AuthGuard.ts` — login, ตรวจ token และ route guard
- `modules/system/SystemController.ts` — API catalog ที่ root และ `/health`; health ตรวจ MySQL ping และรายงาน latency/status

### Customers

- `Customer.ts` — Customer, input/query และผล nearby พร้อมระยะ
- `CustomerSchemas.ts` — Zod schemas create/update/list/remove; กำหนดรูปแบบเบอร์/พิกัด/ข้อความและ force delete
- `CustomerController.ts` — list, nearby, get, customer orders, create, update และ delete
- `CustomerService.ts` — merge partial update กับข้อมูลเดิม; ป้องกันลบ customer ที่ผูกกับ order ในแผนยืนยัน; force ลบได้เมื่อมี order ที่ไม่ถูกล็อก
- `CustomerRepository.ts` — SQL CRUD/list/search/sort, bulk insert, nearby distance query และ row-to-model mapping

### Orders

- `Order.ts` — สถานะ (`pending`, `assigned`, `delivered`, `cancelled`), model, query/filter/input/summary
- `OrderSchemas.ts` — parse create/update/boxes/list/filter/summary/nearby; normalize alias `date` เป็น `deliveryDate`
- `OrderController.ts` — list, summary, nearby, get, create, update, change boxes, clear และ delete
- `OrderService.ts` — ตั้ง unit price จาก settings, ตรวจ customer และกล่อง, ป้องกันแก้ข้อมูล routing ของ order ที่ assigned/delivered, ควบคุม status ที่แก้เองได้ และลบรายการ/แผนที่อ้างถึงผ่าน transaction
- `OrderRepository.ts` — SQL query/filter/pagination/search/nearby, insert/update/delete, assign/release plan, delivered timestamp และ map DB fields กลับเป็น domain object

### Riders

- `Rider.ts` — rider/input/query contracts
- `RiderSchemas.ts` — ตรวจชื่อ เบอร์ ทะเบียน active flag และ list filters
- `RiderController.ts` — list/get/create/update/delete
- `RiderService.ts` — ตรวจการมีอยู่และ merge partial update
- `RiderRepository.ts` — SQL CRUD, search, active filtering, pagination และ mapping

### Settings และ Dashboard

- `ShopSettings.ts` — settings domain contract และ partial update ที่ตัดค่าระบบ read-only ออก
- `SettingsSchemas.ts` — จำกัดพิกัด เวลา ราคา/ต้นทุน ความเร็ว จำนวนกล่อง/จุดส่ง และระยะบริการ
- `SettingsController.ts`, `SettingsService.ts`, `SettingsRepository.ts` — อ่าน/แก้ singleton config, สร้าง default row เมื่อไม่มีข้อมูล, update เฉพาะ fields ที่ schema อนุญาต
- `DashboardController.ts`, `DashboardService.ts` — รวมจำนวนลูกค้า/ไรเดอร์, สรุป order ตามวัน, เวลาออก/กำหนดส่ง และแผน active; ใช้ Promise.all สำหรับ query ที่เป็นอิสระ

### Plans และ Jobs

- `DeliveryPlan.ts` — plan/route/stop statuses และ model/snapshot สำหรับบันทึกผลการคำนวณ
- `PlanSchemas.ts` — list/generate/recalculate/assign rider; จำกัด objective, seed, alternatives และ ID
- `PlanController.ts` — list, objectives, latest, preview, create draft, get, recalculate, confirm, cancel, assign rider, delete
- `PlanRepository.ts` — อ่าน plan header/details, บันทึก snapshot, route/stop, เปลี่ยน status/rider, job code lookup และ signature ที่เคยคำนวณ
- `PlanService.ts` — สร้าง context, ขอ distance matrix, เรียก planner, สร้าง draft ใน transaction, เปลี่ยนทางเลือก, ตรวจ stale orders, assign riders และคุม plan lifecycle
- `JobSheet.ts` — รูปแบบข้อมูลที่ไรเดอร์ได้รับ พร้อมร้าน, route, stop list, เวลา, navigation link และสถานะ
- `JobController.ts`, `JobService.ts` — public read job, start route, mark stop delivered และ undo; transaction อัปเดต stop/order/route/plan ให้สอดคล้องกัน

### Tracking และ Simulation

- `TrackingController.ts`, `TrackingService.ts` — endpoint public ที่ใช้ tracking code แบบสุ่ม 48 hex; คืนเฉพาะข้อมูลรายการเดียว, สถานะ, ETA ตามแผน, ร้านและไรเดอร์ ไม่มีพิกัด GPS สด
- `SimulationSchemas.ts`, `SimulationController.ts`, `SimulationService.ts` — owner-only tools สำหรับสร้างลูกค้า/รายการ/ไรเดอร์และล้างข้อมูลจำลอง; รับ seed เพื่อทำซ้ำได้; แยก flag simulated ให้กรอง/ลบได้
- `ThaiProfileGenerator.ts` — ชื่อ/ที่อยู่/เบอร์ตัวอย่างในพื้นที่มหาสารคาม ใช้เฉพาะข้อมูลจำลอง

## 8. API reference

API ทุก response สำเร็จใช้ `{ "data": ... }`; list responses เพิ่ม `meta` สำหรับ pagination. Error ใช้ `{ "error": { "code", "message", "details?" } }`. Route ทุกตัวอยู่ใต้ `/api` ยกเว้น system root/health ที่ mount เพิ่มที่ root ตามที่ระบุ

| Method และ path | Auth | หน้าที่ |
|---|---|---|
| `GET /api` | public | ชื่อ/version และ endpoint catalog |
| `GET /api/health` (`GET /health`) | public | ตรวจฐานข้อมูลและ latency |
| `POST /api/auth/login` | public | เข้าระบบและรับ owner JWT |
| `GET /api/auth/me` | token | ตรวจ token และข้อมูล owner |
| `GET /api/dashboard?date=` | owner | สรุปภาพรวมรายวัน |
| `GET /api/settings` | owner | อ่านค่าร้าน |
| `PUT/PATCH /api/settings` | owner | แก้ค่าร้านบางส่วน |
| `GET /api/customers` | owner | ค้นหา/เรียง/แบ่งหน้าลูกค้า |
| `GET /api/customers/nearby?lat=&lng=&radius=` | owner | ลูกค้าในรัศมี |
| `GET /api/customers/:id` | owner | รายละเอียดลูกค้า |
| `GET /api/customers/:id/orders` | owner | order ของลูกค้า |
| `POST /api/customers` | owner | สร้างลูกค้า |
| `PUT/PATCH /api/customers/:id` | owner | แก้ลูกค้า |
| `DELETE /api/customers/:id?force=` | owner | ลบลูกค้า; force ใช้ลบ order ที่ไม่ถูกล็อกพร้อมกัน |
| `GET /api/riders` | owner | ค้นหา/กรอง/แบ่งหน้าไรเดอร์ |
| `GET /api/riders/:id` | owner | รายละเอียดไรเดอร์ |
| `POST /api/riders` | owner | สร้างไรเดอร์ |
| `PUT/PATCH /api/riders/:id` | owner | แก้ไรเดอร์ |
| `DELETE /api/riders/:id` | owner | ลบไรเดอร์; route FK จะถอด rider reference |
| `GET /api/orders` | owner | ค้นหา/กรอง/แบ่งหน้ารายการ |
| `GET /api/orders/summary?date=` | owner | ยอด order/กล่อง/รายได้แยกสถานะ |
| `GET /api/orders/nearby?lat=&lng=&radius=` | owner | order ในรัศมีและตัวกรองวันที่/status |
| `GET /api/orders/:id` | owner | รายละเอียด order |
| `POST /api/orders` | owner | สร้างรายการส่ง |
| `PUT/PATCH /api/orders/:id` | owner | แก้รายการตาม business rules |
| `PATCH /api/orders/:id/boxes` | owner | ตั้งจำนวนกล่องหรือเปลี่ยนตาม delta |
| `DELETE /api/orders?date=&status=&simulated=` | owner | ลบกลุ่มรายการตาม filter พร้อมจัดการ plan ที่อ้างถึง |
| `DELETE /api/orders/:id` | owner | ลบ order รายการเดียว |
| `GET /api/plans` | owner | list แผนตามวันที่/status |
| `GET /api/plans/objectives` | owner | ตัวเลือกวิธี optimize |
| `GET /api/plans/latest?date=` | owner | แผนล่าสุดที่ใช้ได้ในวันนั้น |
| `POST /api/plans/preview` | owner | คำนวณข้อเสนอโดยยังไม่บันทึก |
| `POST /api/plans` | owner | บันทึก proposal เป็น draft |
| `GET /api/plans/:id` | owner | แผนพร้อม routes/stops |
| `POST /api/plans/:id/recalculate` | owner | สร้างทางเลือกใหม่ของ draft |
| `POST /api/plans/:id/confirm` | owner | ตรวจความสด, lock orders และยืนยัน |
| `POST /api/plans/:id/cancel` | owner | ยกเลิก plan และคืน assigned orders |
| `PATCH /api/plans/:id/routes/:routeId/rider` | owner | มอบหมาย/ถอดไรเดอร์ |
| `DELETE /api/plans/:id` | owner | ลบแผนที่ยังไม่ active |
| `GET /api/jobs/:code` | public code | เปิดใบงานที่ยืนยันแล้ว |
| `POST /api/jobs/:code/start` | public code | เริ่มรอบส่ง |
| `POST /api/jobs/:code/stops/:stopId/deliver` | public code | บันทึกว่าส่งจุดนี้แล้ว |
| `POST /api/jobs/:code/stops/:stopId/undo` | public code | ย้อนสถานะจุดส่ง |
| `GET /api/tracking/:code` | public secret code | ติดตาม order เดียวโดยใช้ token 48 hex |
| `POST /api/simulations/customers` | owner | สร้างลูกค้าจำลอง |
| `POST /api/simulations/orders` | owner | สร้าง order จำลอง |
| `POST /api/simulations/riders` | owner | สร้างไรเดอร์จำลอง |
| `DELETE /api/simulations/orders?deliveryDate=` | owner | ลบเฉพาะ order จำลอง |
| `DELETE /api/simulations/customers` | owner | ลบข้อมูลจำลองที่ไม่ถูกใช้อยู่ |
| `DELETE /api/simulations?includeRiders=` | owner | reset ข้อมูลในฐานข้อมูลชุดที่ API นี้ชี้อยู่; ใช้อย่างระมัดระวัง |

`GET /api/auth/me` เป็นข้อยกเว้นใน `AuthController`: controller หลักเปิด public เพื่อให้ login ทำงาน แต่ route `/me` ใส่ guard โดยตรง ส่วน Jobs ใช้ job code เป็น capability สำหรับเปิด/แก้สถานะใบงาน ไม่มี JWT owner

## 9. กฎสำคัญของ workflow

### Order และ customer

- สร้าง order ต้องอ้างถึง customer ที่มีอยู่; จำนวนกล่องต้องอยู่ในข้อกำหนด settings และ upper bound ของระบบ
- สถานะ `assigned` เกิดจากการยืนยันแผน ไม่อนุญาตให้ผู้ใช้ตั้งเอง
- order ที่อยู่ในแผนยืนยันต้องยกเลิกแผนก่อนแก้ข้อมูล routing หรือลบ; delivered order แก้ routing ไม่ได้
- ลบ customer ที่ยังมี order ต้องส่ง force ตามที่ schema/controller อนุญาต; ห้ามลบถ้า order ถูก assign ในแผนยืนยัน

### Plan lifecycle

```text
pending orders → preview → draft plan → assign active riders → confirm
                                             ↓                    ↓
                                         recalculate         assigned orders
                                                                  ↓
                                                        rider job starts/delivers
                                                                  ↓
                                                        routes/plan completed
```

Preview ไม่เขียนฐานข้อมูล ส่วน create บันทึก plan snapshot, summary, route และ stop ใน transaction Plan ที่ confirm แล้วไม่แก้ย้อนหลังได้แบบ draft; cancel จะ release order กลับ pending

ก่อน confirm ระบบตรวจ deadline, สถานะปัจจุบันของ order, จำนวนกล่องและ customer ที่อยู่ใน snapshot ถ้ารายการเปลี่ยนหลังคำนวณจะตอบ `PLAN_STALE` เพื่อให้คำนวณใหม่ แผนยืนยันหนึ่งชุดจะยกเลิก draft อื่นในวันเดียวกันเพื่อหลีกเลี่ยงการจัด order ซ้ำ

### Rider job

Job code ถูกสร้างแบบสุ่มโดย `JobCodeGenerator` และตรวจไม่ซ้ำก่อน insert; เมื่อตั้ง route เริ่มส่ง สถานะ route เป็น in progress; เมื่อส่ง stop จะอัปเดต stop, order และอาจ route/plan ใน transaction; เมื่อย้อนรายการ ระบบเปิด route/plan กลับไปสถานะทำงานตาม logic ใน `JobService`

## 10. อัลกอริทึมวางแผนเส้นทาง

ไฟล์อยู่ใน `modules/planning/` และรับ order locations พร้อม settings เป็น input

1. `PlanService.buildContext()` อ่าน pending orders ของวันเดียวกันและ settings; ตรวจว่ามี order, วันตรงกัน และแต่ละ order ไม่เกิน box limit
2. `PlanningParametersFactory` แปลง settings เป็นพารามิเตอร์คำนวณ เช่น depot, price/cost, speed, capacity, เวลาออก และ delivery window
3. `RoutingService.table()` ขอระยะทางระหว่างร้านกับทุกจุดจาก provider; OSRM table ใช้ระยะทางถนนหน่วยเมตรแล้วแปลงเป็นกิโลเมตร ถ้าล้มเหลวใช้ haversine คูณ road factor และระบุ `estimated`
4. `DistanceMatrix` ทำให้ planner ขอระยะ depot→order หรือ order→order ได้ด้วย index คงที่
5. `ObjectiveFactory` เลือกหนึ่งใน `cost`, `distance`, `time`, `balanced`; ทุก objective เพิ่ม penalty สูงเมื่อมีจุดเกินเวลาส่ง
6. `RouteOptimizer` เริ่มจาก route แยก order แล้วใช้ savings merge ภายใต้ capacity; ปรับปรุงต่อด้วยย้าย order, swap ระหว่าง route และ merge หากคะแนนดีขึ้น
7. `RouteEvaluator` คำนวณทุกลำดับแบบ exhaustive เมื่อ route มีไม่เกิน 7 จุด; route ที่ใหญ่กว่านั้นเริ่มด้วย nearest-neighbor แล้วลองกลับลำดับช่วงเพื่อปรับให้ดีขึ้น; มี cache ผลประเมิน route
8. `DeliveryPlanner` ใช้ seeded random สร้างหลาย restart, ตัด signature ซ้ำ แล้วเลือก proposal คะแนนดีที่สุด/alternatives ที่ยังไม่ถูกสำรวจ
9. `PlanBuilder` จัดลำดับ routes, สร้าง ETAs ตามเวลาเดินทางและเวลาจอด, สรุประยะ/ต้นทุน/กำไร/late stops และสร้าง Google Maps links
10. `RoutingService.paths()` ขอ geometry สำหรับแต่ละ route เพื่อวาดบน map; จำกัด concurrency และ fallback เป็นเส้นเชื่อมพิกัดเมื่อ provider ล้มเหลว

Objective score โดยสรุป:

| Objective | คะแนนฐานที่ลดให้น้อยที่สุด |
|---|---|
| cost | rider fee + ตัวปรับระยะเล็กน้อย |
| distance | ระยะทางรวมถ่วงน้ำหนักสูง + ตัวปรับ fee เล็กน้อย |
| time | เวลารอรวมของลูกค้าถ่วงน้ำหนักสูง + ตัวปรับ fee เล็กน้อย |
| balanced | rider fee + เวลารอรวม × 0.5 |

ทุกแบบมี late penalty `10000` ต่อ late minute และ `100000` ต่อ late stop จึงให้ความสำคัญกับการส่งทันเวลาอย่างมากเมื่อเทียบกับคะแนนฐาน

### ไฟล์ planner แต่ละตัว

- `PlanningTypes.ts` — request, parameters, options, planned stop/route/summary/proposal
- `PlanningParametersFactory.ts` — map shop settings เป็นค่าที่ planner ต้องใช้และบังคับเพดานบางค่าของ domain
- `DistanceMatrix.ts` — matrix และ helper สำหรับอ่านระยะทางตาม index
- `RouteEvaluation.ts` — ผลวัด route เช่น stops, boxes, distances, arrival, fee, lateness และ score
- `RouteEvaluator.ts` — คำนวณเวลา/ราคา/late penalty และเรียง stop ที่ดีที่สุด
- `RouteOptimizer.ts` — สร้างกลุ่ม route และ local search (relocate, swap, merge)
- `DeliveryPlanner.ts` — multi-start/restarts, seeded choices, unique candidate, ranking
- `PlanBuilder.ts` — แปลงผล optimizer เป็น proposal ที่ frontend แสดงได้ พร้อม summary/map links
- `RouteColorPalette.ts` — สีและ label ของเส้นทาง
- `objectives/ObjectiveStrategy.ts` — contract และ late penalty กลาง
- `objectives/CostObjective.ts`, `DistanceObjective.ts`, `TimeObjective.ts`, `BalancedObjective.ts` — สูตรคะแนนรายเป้าหมาย
- `objectives/ObjectiveFactory.ts` — คืน objective strategy ตาม key หรือ list ตัวเลือกทั้งหมด

## 11. Routing providers และพิกัด

- `modules/routing/RoutingProvider.ts` — contract สำหรับ `table()` และ `path()` พร้อม distance source
- `OsrmRoutingProvider.ts` — เรียก OSRM Table API เพื่อสร้าง distance matrix และ Route API เพื่อรับ GeoJSON geometry; timeout และตรวจ response ก่อนแปลง longitude/latitude เป็น model
- `EstimatedRoutingProvider.ts` — คำนวณ Haversine × road factor; geometry เป็นจุดต้นทาง/ปลายทางที่มี ไม่ใช่ถนนจริง
- `RoutingService.ts` — เลือก provider, fallback เมื่อผิดพลาด และจำกัดงาน geometry พร้อมกัน
- `shared/geo/GeoPoint.ts` — Haversine, offset พิกัดสุ่ม, rounding และ SQL distance expression
- `shared/geo/MapLinkBuilder.ts` — Google Maps place/directions links

เวลา ETA เป็นเวลาคำนวณตามระยะและ settings เท่านั้น ระบบนี้ไม่ได้รับ GPS สดจากไรเดอร์

## 12. Shared utilities

- `shared/time/BusinessCalendar.ts` — หาวันปัจจุบัน/เติมวันที่ default ด้วย timezone ที่กำหนด
- `shared/time/TimeOfDay.ts` — parse HH:mm, บวกนาที และ normalize เวลาเมื่อข้ามเที่ยงคืน
- `shared/random/SeededRandom.ts` — random generator ที่สร้างผลซ้ำได้จาก seed ใช้ planner และ simulation
- `shared/utils/JobCodeGenerator.ts` — สุ่ม job code จาก alphabet ที่ตัดตัวอักษรสับสนและสร้างหลาย code ที่ไม่ซ้ำกันในชุด
- `shared/utils/Money.ts` — ปัดทศนิยมสองหลักและรวมจำนวนเงิน
- `shared/utils/RowParser.ts` — แปลง JSON/date/boolean จาก driver ให้เป็นค่าที่ domain ใช้

## 13. Simulation module

Simulation ใช้กับ Dev tools สำหรับสร้างข้อมูลที่หน้าตาเหมือนข้อมูลระบบจริง แต่ระบุ `simulated=true` ใน customer/order เพื่อแยกกรอง/ลบได้ การให้ seed ทำให้ชุดข้อมูลสุ่มเดิมสร้างซ้ำได้

- `ThaiProfileGenerator` สุ่มชื่อ ที่อยู่ และเบอร์ตัวอย่างภาษาไทยในบริเวณมหาวิทยาลัยมหาสารคาม
- `SimulationService.generateCustomers()` สุ่มระยะ/ทิศทางจากร้านภายใน service radius แล้วบันทึกแบบ bulk
- `generateOrders()` สุ่มลูกค้า/จำนวนกล่อง/วันส่ง และเลือกได้ว่าจะให้มี customer เพียงพอหรือใช้ลูกค้าไม่ซ้ำ
- `generateRiders()` สร้าง rider records ตามจำนวนที่ส่งมา
- `clearOrders()`/`clearCustomers()` กรองลบข้อมูลจำลอง; `reset()` เป็น destructive operation ที่ลบข้อมูลวงกว้างใน database ที่ API ใช้อยู่ จึงควรใช้กับฐานข้อมูลพัฒนา/ทดสอบเท่านั้น ไม่ใช้กับ production

## 14. วิธีติดตั้งและรัน

```bash
cd main/v1/backend
npm ci
cp .env.example .env
```

แก้ `.env` ให้ชี้ MySQL ที่ตั้งใจใช้ ตั้ง `OWNER_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS` และ routing provider ให้เหมาะสม จากนั้น:

```bash
npm run db:migrate  # สร้าง/อัปเดต schema
npm run dev         # development server, default port 3000
```

คำสั่งอื่น:

- `npm run typecheck` ตรวจ TypeScript โดยไม่สร้างไฟล์ output
- `npm run compile` สร้าง JavaScript ใน `dist/`
- `npm start` รันไฟล์ที่ compile แล้ว

ตรวจระบบด้วย `GET http://localhost:3000/api/health` และเปิด `GET /api` ดู endpoint catalog ห้ามใช้ `DELETE /api/simulations` บนฐานข้อมูลที่มีข้อมูลจริง

## 15. การพรีเซนต์ตัวอย่าง 5–7 นาที

1. เริ่มจาก `server.ts` แล้วชี้ `App.ts` เพื่ออธิบายว่า request เข้า middleware, auth guard, controller และ error handler อย่างไร
2. เปิด `Container.ts` ชี้การประกอบ dependency จาก DB → repository → service → controller
3. ยกตัวอย่าง customer/order CRUD เพื่อแยก schema (ตรวจรูปแบบ), service (กฎธุรกิจ), repository (SQL)
4. อธิบาย plan flow: preview ไม่บันทึก, create เป็น draft, confirm ตรวจ stale และ lock order ใน transaction
5. เปิด `DeliveryPlanner.ts` และ `RouteOptimizer.ts` เล่าการแบ่งกลุ่ม/จัดลำดับ โดยมี objective หลายแบบและ seed ที่ทำซ้ำได้
6. อธิบาย OSRM provider กับ estimated fallback และย้ำว่า ETA เป็นตามแผน ไม่ใช่ GPS สด
7. ปิดด้วย `JobService`: ไรเดอร์ใช้ job code ทำสถานะ stop; เมื่อครบทุกจุด route และ plan เปลี่ยนเป็น completed

## 16. ประเด็นจำกัดความที่ควรพูดให้ตรง

- Job code และ tracking code เป็น secret link/capability สำหรับเข้าถึง workflow เฉพาะ ไม่ใช่บัญชี rider พร้อม password
- frontend guide/UI package นี้ไม่มีระบบติดตามตำแหน่ง GPS สด
- OSRM เป็น external service; เมื่อเรียกไม่ได้ผลระยะทางอาจใช้ estimated fallback ซึ่งระบุ source ไว้
- plan optimization เป็น heuristic/การค้นหาหลาย candidate ไม่รับประกัน global optimum
- `main/v1` เป็นชุดโค้ดแบบย่อ ไม่มี test suite รวมอยู่ในโฟลเดอร์; ชุดทดสอบของโปรเจกต์เต็มอยู่ที่ `frontend/simple-e2e/` และ `backend/tests/` ที่ root repository
