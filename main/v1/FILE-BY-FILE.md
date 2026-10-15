# หน้าที่ของไฟล์ในชุดนำเสนอ

อธิบายไฟล์ที่ส่งไว้ใน `main/v1/` แบบสั้น ๆ เรียงตามโฟลเดอร์ เพื่อใช้เปิดดูระหว่างพรีเซนต์ รายการนี้ครอบคลุมไฟล์โปรเจกต์ที่ติดตามใน Git; ไม่รวม `node_modules/`, `dist/`, cache และไฟล์ชั่วคราวที่สร้างตอนติดตั้งหรือ build

## เอกสารชุดนำเสนอ

- `.gitignore` — ระบุไฟล์ในชุดนำเสนอที่ Git ไม่ควรเก็บ
- `README.md` — ภาพรวมระบบ วิธีรัน และลิงก์ไปคู่มือต่าง ๆ
- `FRONTEND-GUIDE.md` — อธิบายโครงสร้างและการทำงานของ Angular แบบละเอียด
- `BACKEND-QUICK-GUIDE.md` — เส้นทาง request แบบสั้นสำหรับไล่โค้ดหน้าห้อง
- `BACKEND-GUIDE.md` — รายละเอียด API, ฐานข้อมูล, สิทธิ์ และตัวคำนวณเส้นทาง
- `TECHNICAL-PRESENTATION.md` — โครงเรื่องนำเสนอ, demo, คำถาม และ checklist
- `postman/README.md` — วิธีนำเข้า collection/environment และลำดับทดลอง API อย่างปลอดภัย
- `postman/Khaokong-API.postman_collection.json` — คำขอ Postman สำหรับทดสอบ API ทุก route/method
- `postman/Khaokong-Local.postman_environment.json` — ตัวแปรเชื่อม API ในเครื่อง โดยไม่มีรหัสผ่านหรือ token จริง

## Backend

### การตั้งค่าและคำสั่ง

- `backend/.gitignore` — กัน `.env`, `dist` และ `node_modules` ไม่ให้ขึ้น Git
- `backend/.env.example` — รายชื่อตัวแปรตั้งค่าที่ต้องกำหนด โดยไม่มีค่าลับจริง
- `backend/package.json` — dependency และคำสั่ง dev, build, start, typecheck, migrate
- `backend/package-lock.json` — ล็อกเวอร์ชัน dependency เพื่อให้ติดตั้งซ้ำได้
- `backend/tsconfig.json` — ตั้งค่า TypeScript แบบ strict และโฟลเดอร์ output
- `backend/src/server.ts` — จุดเริ่มต้น สร้าง Express app และเปิด HTTP server
- `backend/src/config/AppConfig.ts` — อ่าน environment แล้วสร้างค่าตั้งระบบแบบมี type

### App และ core

- `backend/src/app/App.ts` — ติดตั้ง middleware, routes, auth และ error handling
- `backend/src/app/Container.ts` — สร้างและเชื่อม Database, Repository, Service และ Controller
- `backend/src/core/errors/ErrorHandler.ts` — แปลง error เป็น JSON response รูปแบบเดียว
- `backend/src/core/errors/HttpError.ts` — error ที่ระบุ HTTP status, code และข้อความได้
- `backend/src/core/http/BaseController.ts` — helper สำหรับประกาศ route, ส่ง response และจัดการ async error
- `backend/src/core/http/Pagination.ts` — คำนวณหน้ารายการและ metadata pagination
- `backend/src/core/validation/CommonSchemas.ts` — schema กลาง เช่น วันที่ เวลา พิกัด และ query pagination

### Database

- `backend/src/database/Database.ts` — สร้าง MySQL connection pool และ transaction
- `backend/src/database/SqlExecutor.ts` — interface สำหรับสั่ง query/execute SQL
- `backend/src/database/TransactionRunner.ts` — ขอบเขต transaction ให้ service ใช้
- `backend/src/database/Migrator.ts` — ตรวจและรัน migration ที่ยังไม่เคยใช้
- `backend/src/database/migrations.ts` — คำสั่งสร้าง/ปรับตารางแบบมีเวอร์ชัน
- `backend/src/database/scripts/migrate.ts` — คำสั่ง CLI สำหรับ migrate ฐานข้อมูล

### Features: แต่ละโฟลเดอร์รวมไฟล์ของงานเดียวกัน

**Auth — การเข้าสู่ระบบและสิทธิ์**

- `modules/auth/AuthController.ts` — endpoint login และตรวจข้อมูลผู้ใช้ปัจจุบัน
- `modules/auth/AuthGuard.ts` — ตรวจ Bearer JWT ก่อนเข้าถึง route ที่ต้องใช้สิทธิ์
- `modules/auth/AuthService.ts` — ตรวจรหัสผ่านและออก/ตรวจ token

**Customers — ลูกค้า**

- `modules/customers/Customer.ts` — type ของลูกค้า, input และ query
- `modules/customers/CustomerController.ts` — route เพิ่ม/อ่าน/แก้/ลบ/ค้นลูกค้า
- `modules/customers/CustomerSchemas.ts` — ตรวจ body และ query ของลูกค้า
- `modules/customers/CustomerService.ts` — ใช้กฎธุรกิจและประสานข้อมูลลูกค้า/ออเดอร์
- `modules/customers/CustomerRepository.ts` — SQL ของลูกค้าและแปลง row เป็น model

**Orders — รายการจัดส่ง**

- `modules/orders/Order.ts` — type ของ order และข้อมูลที่ใช้ค้นหา
- `modules/orders/OrderController.ts` — route จัดการและค้นหารายการส่ง
- `modules/orders/OrderSchemas.ts` — ตรวจข้อมูลสร้าง/แก้ไข/ค้นหา order
- `modules/orders/OrderService.ts` — ตรวจข้อกำหนดก่อนสร้าง แก้ หรือลบ order
- `modules/orders/OrderRepository.ts` — SQL อ่าน/เขียน order และสถานะจัดส่ง

**Riders — ไรเดอร์**

- `modules/riders/Rider.ts` — type และ input ของไรเดอร์
- `modules/riders/RiderController.ts` — route จัดการไรเดอร์
- `modules/riders/RiderSchemas.ts` — ตรวจข้อมูลไรเดอร์
- `modules/riders/RiderService.ts` — กฎการเพิ่ม/แก้/ปิดใช้งานไรเดอร์
- `modules/riders/RiderRepository.ts` — SQL ของไรเดอร์

**Settings และ Dashboard — ตั้งค่าร้านและภาพรวม**

- `modules/settings/ShopSettings.ts` — type ของค่าร้านและกติกาวางแผน
- `modules/settings/SettingsController.ts` — route อ่าน/แก้ค่าร้าน
- `modules/settings/SettingsSchemas.ts` — ตรวจค่าที่อนุญาตให้แก้
- `modules/settings/SettingsService.ts` — อ่านค่าเริ่มต้นและจัดการกฎการตั้งค่า
- `modules/settings/SettingsRepository.ts` — SQL ของค่าร้าน
- `modules/dashboard/DashboardController.ts` — route ภาพรวมหน้าเจ้าของร้าน
- `modules/dashboard/DashboardService.ts` — รวมสถิติจากลูกค้า ออเดอร์ ไรเดอร์ และแผน

**Plans และ Jobs — วางแผนและใบงานไรเดอร์**

- `modules/plans/DeliveryPlan.ts` — type ของแผน รอบส่ง และจุดส่ง
- `modules/plans/PlanController.ts` — route preview, บันทึก, มอบหมาย, ยืนยัน และยกเลิกแผน
- `modules/plans/PlanSchemas.ts` — ตรวจข้อมูลและตัวเลือกการวางแผน
- `modules/plans/PlanService.ts` — จัด workflow แผนและ transaction ตอนยืนยัน
- `modules/plans/PlanRepository.ts` — SQL บันทึก/อ่านแผน รอบส่ง จุดส่ง และ job code
- `modules/jobs/JobSheet.ts` — รูปแบบข้อมูลใบงานที่ส่งให้ไรเดอร์
- `modules/jobs/JobController.ts` — route เปิดใบงานและอัปเดตการส่ง
- `modules/jobs/JobService.ts` — ตรวจสิทธิ์ใบงานและเปลี่ยนสถานะส่งอย่างสอดคล้อง

**Planning และ Routing — คำนวณเส้นทาง**

- `modules/planning/DeliveryPlanner.ts` — สร้างตัวเลือกแบ่งและจัดลำดับรอบส่ง
- `modules/planning/DistanceMatrix.ts` — เก็บระยะทางระหว่างร้านและจุดส่ง
- `modules/planning/PlanBuilder.ts` — รวมผลคำนวณเป็นแผนพร้อมข้อมูลสรุป
- `modules/planning/PlanningParametersFactory.ts` — สร้างพารามิเตอร์จากค่าร้านและคำขอ
- `modules/planning/PlanningTypes.ts` — type สำหรับ input/output ของ planner
- `modules/planning/RouteColorPalette.ts` — สีประจำ route ที่แสดงบนแผนที่
- `modules/planning/RouteEvaluation.ts` — type/ผลการประเมิน route
- `modules/planning/RouteEvaluator.ts` — คำนวณเวลา ระยะ ค่าใช้จ่าย และความตรงเวลา
- `modules/planning/RouteOptimizer.ts` — ปรับการแบ่งกลุ่มและลำดับจุดให้ได้แผนที่ดีขึ้น
- `modules/planning/objectives/ObjectiveStrategy.ts` — interface ของวิธีให้คะแนนแผน
- `modules/planning/objectives/ObjectiveFactory.ts` — เลือกวิธีให้คะแนนตาม objective
- `modules/planning/objectives/CostObjective.ts` — ให้คะแนนโดยเน้นต้นทุนต่ำ
- `modules/planning/objectives/DistanceObjective.ts` — ให้คะแนนโดยเน้นระยะทางสั้น
- `modules/planning/objectives/TimeObjective.ts` — ให้คะแนนโดยเน้นเวลาส่ง
- `modules/planning/objectives/BalancedObjective.ts` — สมดุลค่าใช้จ่าย ระยะ และเวลา
- `modules/routing/RoutingProvider.ts` — interface กลางของผู้ให้บริการเส้นทาง
- `modules/routing/OsrmRoutingProvider.ts` — ขอระยะถนนและ geometry จาก OSRM
- `modules/routing/EstimatedRoutingProvider.ts` — คำนวณระยะประมาณเมื่อไม่มีข้อมูลถนน
- `modules/routing/RoutingService.ts` — เรียก provider, คุม timeout และ fallback

**ฟีเจอร์อื่น**

- `modules/simulation/SimulationController.ts` — route สำหรับสร้าง/ล้างข้อมูลจำลองของ Dev tools
- `modules/simulation/SimulationSchemas.ts` — ตรวจจำนวนและชนิดข้อมูลจำลอง
- `modules/simulation/SimulationService.ts` — สร้างชุดลูกค้า ออเดอร์ และไรเดอร์ตัวอย่าง
- `modules/simulation/ThaiProfileGenerator.ts` — สร้างชื่อ/ที่อยู่/เบอร์ตัวอย่างภาษาไทย
- `modules/system/SystemController.ts` — endpoint หน้าแรก API และ health check
- `modules/tracking/TrackingController.ts` — endpoint ติดตามรายการด้วย tracking code
- `modules/tracking/TrackingService.ts` — สร้าง snapshot สถานะและเวลาตามแผน

### Shared — ส่วนที่หลาย feature ใช้ร่วมกัน

- `backend/src/shared/geo/GeoPoint.ts` — type และฟังก์ชันระยะทาง/พิกัด
- `backend/src/shared/geo/MapLinkBuilder.ts` — สร้างลิงก์นำทางจากพิกัด
- `backend/src/shared/random/SeededRandom.ts` — random แบบ seed เพื่อให้จำลองซ้ำได้
- `backend/src/shared/time/BusinessCalendar.ts` — จัดการวันทำงานตาม timezone
- `backend/src/shared/time/TimeOfDay.ts` — แปลงและคำนวณเวลา HH:mm
- `backend/src/shared/utils/JobCodeGenerator.ts` — สร้างรหัสใบงาน/ติดตามแบบสุ่ม
- `backend/src/shared/utils/Money.ts` — ปัดเศษและคำนวณจำนวนเงิน
- `backend/src/shared/utils/RowParser.ts` — แปลงชนิดข้อมูลที่ได้จาก MySQL

## Frontend

### การตั้งค่าและ assets

- `frontend/.gitignore` — กัน dependency, build และไฟล์ local จาก Git
- `frontend/.vercelignore` — ระบุไฟล์ที่ไม่ต้องส่งให้ Vercel ตอน deploy
- `frontend/angular.json` — ตั้งค่า Angular build, assets, styles และ output
- `frontend/package.json` — dependency และคำสั่ง start/build/test
- `frontend/package-lock.json` — ล็อกเวอร์ชัน dependency
- `frontend/proxy.conf.json` — ส่ง `/api` ไป backend production ระหว่างพัฒนา
- `frontend/proxy.local.conf.json` — ส่ง `/api` ไป backend บนเครื่อง
- `frontend/vercel.json` — ตั้ง SPA fallback, API proxy และ output ของ Vercel
- `frontend/public/app-config.js` — ค่าตั้ง frontend ที่อ่านตอน runtime
- `frontend/public/brand/khaokong-logo.png` — โลโก้แอป
- `frontend/public/favicon.ico` — ไอคอน browser tab
- `frontend/src/index.html` — HTML host และ metadata ของเว็บ
- `frontend/src/app/main.ts` — bootstrap Angular และติดตั้ง providers กลาง
- `frontend/tsconfig.json` — TypeScript config หลักของ Angular
- `frontend/tsconfig.app.json` — TypeScript config สำหรับ source แอป

### App shell, routes และ styles

- `frontend/src/app/app.ts` — shell component และ state เมนู/Dev tools
- `frontend/src/app/app.html` — layout หลักและตำแหน่งแสดงหน้าตาม route
- `frontend/src/app/app.routes.ts` — จับคู่ URL กับหน้า, lazy load และตรวจสิทธิ์
- `frontend/src/app/styles.css` — global theme, layout และ responsive styles
- `frontend/src/app/material.scss` — theme ของ Angular Material

### Components, models และ API

- `frontend/src/app/components/ui/icon.ts` — รวมไอคอน Lucide ที่หน้าเว็บใช้
- `frontend/src/app/components/ui/page-title.ts` — หัวข้อหน้าที่ใช้ซ้ำ
- `frontend/src/app/components/ui/delivery-status.ts` — แสดงสถานะจัดส่งเป็น label
- `frontend/src/app/components/ui/request-state.ts` — loading, error และ skeleton
- `frontend/src/app/components/map/parcel-map.ts` — แผนที่ Leaflet, marker และเส้นทาง
- `frontend/src/app/components/delivery-stop-card/delivery-stop-card.ts` — logic การ์ดจุดส่ง รับ input และส่ง action output
- `frontend/src/app/components/delivery-stop-card/delivery-stop-card.html` — หน้าตาการ์ดจุดส่ง
- `frontend/src/app/components/delivery-stop-card/delivery-stop-card.css` — สไตล์การ์ดจุดส่ง
- `frontend/src/app/models/models.ts` — TypeScript types ของข้อมูล API และหน้าจอ
- `frontend/src/app/services/api.ts` — HTTP client กลาง จัดการ token, response และ error

### Pages — หน้าตาม workflow

- `frontend/src/app/pages/home/home.ts` — logic หน้าทางเข้าระบบ
- `frontend/src/app/pages/home/home.html` — template หน้าทางเข้า
- `frontend/src/app/pages/login/login.ts` — ตรวจข้อมูลและส่งคำขอล็อกอิน
- `frontend/src/app/pages/login/login.html` — ฟอร์มล็อกอิน
- `frontend/src/app/pages/overview/overview.ts` — โหลดข้อมูลสรุป
- `frontend/src/app/pages/overview/overview.html` — dashboard เจ้าของร้าน
- `frontend/src/app/pages/records/records.ts` — จัดการรายการลูกค้า/ไรเดอร์/ออเดอร์
- `frontend/src/app/pages/records/records.html` — ตารางและฟอร์มรายการ
- `frontend/src/app/pages/records/record-fields.ts` — กำหนด field สำหรับแต่ละชนิดข้อมูล
- `frontend/src/app/pages/plans/plans.ts` — preview, แก้ route และยืนยันแผน
- `frontend/src/app/pages/plans/plans.html` — หน้าวางแผนจัดส่ง
- `frontend/src/app/pages/rider/rider.ts` — โหลดใบงานและส่ง action ของไรเดอร์
- `frontend/src/app/pages/rider/rider.html` — แผนที่ สรุปกล่อง และลำดับจุดส่ง
- `frontend/src/app/pages/rider/rider.css` — layout เฉพาะหน้าใบงาน
- `frontend/src/app/pages/settings/settings.ts` — โหลด/บันทึกการตั้งค่าร้าน
- `frontend/src/app/pages/settings/settings.html` — ฟอร์มตั้งค่าร้านและพิกัด

### Shared UI และ controls

- `frontend/src/app/shared/confirm.ts` — dialog ยืนยันก่อนทำรายการสำคัญ
- `frontend/src/app/shared/data.ts` — helper โหลดข้อมูลหลายหน้าจนได้ครบ
- `frontend/src/app/shared/date-control.ts` — datepicker ที่เชื่อมกับ Angular forms
- `frontend/src/app/shared/dev-tools.ts` — สร้างข้อมูลตัวอย่างผ่าน backend API
- `frontend/src/app/shared/dev-tools.html` — หน้าต่าง Dev tools
- `frontend/src/app/shared/dev-tools.css` — สไตล์ Dev tools
- `frontend/src/app/shared/fields.ts` — renderer ของ input ที่ใช้ซ้ำในฟอร์ม
- `frontend/src/app/shared/material.ts` — locale และ date formats ของ Material
- `frontend/src/app/shared/notice.ts` — toast แจ้งผลสำเร็จ/ข้อผิดพลาด
- `frontend/src/app/shared/overlay-container.ts` — จัดตำแหน่ง dialog/menu overlay
- `frontend/src/app/shared/route-card.ts` — สรุป route และจุดส่ง พร้อม action เลือกไรเดอร์
- `frontend/src/app/shared/task.ts` — helper คุม loading/error/success ระหว่าง request
