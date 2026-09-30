# Lunch Route API (Backend)

ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง): Node.js, TypeScript, Express 5, MySQL พร้อม deploy ขึ้น Vercel

## โครงสร้างโปรเจกต์

```
backend/
├── src/
│   ├── server.ts                 จุดเข้าหลัก: export default app ให้ Vercel และ listen เมื่อรันในเครื่อง
│   ├── app/                      App (ประกอบ Express) และ Container (Dependency Injection)
│   ├── config/                   AppConfig อ่านค่าจาก .env
│   ├── core/                     BaseController, HttpError, ErrorHandler, Pagination, CommonSchemas
│   ├── database/                 Database (pool + transaction), Migrator, migrations, scripts
│   ├── shared/                   GeoMath, MapLinkBuilder, TimeOfDay, SeededRandom, Money ...
│   └── modules/
│       ├── settings/             ตั้งค่าร้าน (ราคา ต้นทุน ค่าไรเดอร์ ความเร็ว เวลาออก)
│       ├── customers/            จัดการลูกค้า + ค้นหา + ค้นในรัศมี
│       ├── orders/               จัดการออเดอร์ + แก้จำนวนกล่อง + ล้างทั้งหมด + ค้นในรัศมี
│       ├── riders/               จัดการรายชื่อไรเดอร์
│       ├── planning/             เอนจินคำนวณเส้นทาง (VRP) แยก Strategy ตามเป้าหมาย
│       ├── plans/                บันทึก / คำนวณใหม่ / ยืนยัน / ยกเลิก แผนจัดส่ง
│       ├── jobs/                 ใบงานไรเดอร์ (เปิดด้วยเลขใบงาน)
│       ├── simulation/           จำลองลูกค้า ออเดอร์ ไรเดอร์
│       ├── dashboard/            ภาพรวมประจำวัน
│       └── system/               หน้าแรก API และ health check
└── tests/                        Unit test ของเอนจินจัดเส้นทาง
```

แต่ละโมดูลแยกไฟล์ตามหน้าที่ Model, Repository (SQL), Service (business logic), Schemas (validation ด้วย zod) และ Controller (HTTP) ถ้าจะเพิ่มฟีเจอร์ใหม่ ให้สร้างโมดูลตามแบบเดียวกันแล้วลงทะเบียนใน `src/app/Container.ts`

## กติกาธุรกิจที่ระบบใช้

| ค่า | ค่าเริ่มต้น | ความหมาย |
| --- | --- | --- |
| `boxPrice` | 65 | ราคาขายต่อกล่อง |
| `boxCost` | 40 | ต้นทุนต่อกล่อง |
| `riderBaseFee` | 15 | ค่าเรียกไรเดอร์ต่อรอบ |
| `riderFeePerKmPerBox` | 2 | บาท / กม. / กล่อง |
| `riderSpeedKmh` | 30 | ความเร็วไรเดอร์ |
| `maxOrdersPerRider` | 3 | ไรเดอร์รับได้ไม่เกินคนละ 3 ออเดอร์ |
| `maxBoxesPerOrder` | 3 | ออเดอร์ละไม่เกิน 3 กล่อง |
| `departureTime` | 11:30 | เวลาออกจากร้าน |
| `deliveryWindowMinutes` | 60 | ต้องถึงมือลูกค้าภายใน 60 นาที (12:30) |
| `serviceMinutesPerStop` | 2 | เวลาส่งของแต่ละจุด |
| `roadDistanceFactor` | 1.3 | ตัวคูณแปลงระยะเส้นตรงเป็นระยะถนนโดยประมาณ |
| `serviceRadiusKm` | 3 | รัศมีพื้นที่ให้บริการ (ใช้ตอนจำลองลูกค้า) |

ค่าไรเดอร์ต่อรอบ = `riderBaseFee + riderFeePerKmPerBox × จำนวนกล่องในรอบ × ระยะทางรอบนั้น (กม.)`
กำไรสุทธิ = `ยอดขาย - ต้นทุนอาหาร - ค่าไรเดอร์ทั้งหมด`

## อัลกอริทึมจัดเส้นทาง

ปัญหานี้คือ Capacitated Vehicle Routing Problem ที่มีกรอบเวลา เอนจินใน `src/modules/planning` ทำงานแบบนี้

1. `DistanceMatrix` คำนวณระยะ Haversine ระหว่างร้านกับบ้านลูกค้าทุกคู่ แล้วคูณด้วย `roadDistanceFactor`
2. `RouteEvaluator` หาลำดับส่งที่ดีที่สุดของแต่ละรอบด้วยการลองทุกลำดับ (ไม่เกิน 3 จุดต่อรอบ) และคำนวณ ETA, ค่าไรเดอร์ และจุดที่ส่งช้า
3. `RouteOptimizer` สร้างคำตอบตั้งต้นด้วย Clarke-Wright Savings แล้วปรับปรุงด้วย Local Search (Relocate, Swap, Merge)
4. `DeliveryPlanner` รันซ้ำหลายรอบแบบ multi-start ด้วย seed คำตอบจึงทำซ้ำได้ แล้วคืนตัวเลือกที่ดีที่สุดหลายแบบ
5. `ObjectiveStrategy` มี 4 เป้าหมายให้เลือก: `cost` (ค่าส่งถูกสุด), `distance` (ระยะรวมสั้นสุด), `time` (ถึงมือลูกค้าเร็วสุด), `balanced` (สมดุล) จุดที่ส่งเกิน 12:30 โดนปรับคะแนนหนักมาก ระบบจึงเลี่ยงการส่งช้าก่อนเสมอ

ปุ่ม "คำนวณใหม่" (`POST /api/plans/:id/recalculate`) จะจำเส้นทางที่เคยเสนอไปแล้ว และหาแบบใหม่ที่ไม่ซ้ำเดิมมาให้ทุกครั้ง

## เริ่มต้นใช้งานในเครื่อง

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

API จะเปิดที่ `http://localhost:3000/api` ส่วน `npm run db:seed` สร้างไรเดอร์ 10 คน ลูกค้า 40 คน และออเดอร์ของวันนี้ 20-30 รายการ

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | รันแบบ watch ด้วย tsx |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm test` | รัน unit test ของเอนจินจัดเส้นทาง |
| `npm run compile` แล้ว `npm start` | build เป็น JavaScript ใน `dist/` แล้วรัน |
| `npm run db:migrate` | สร้างหรืออัปเดตตาราง |
| `npm run db:seed` | สร้างข้อมูลจำลอง |

## Deploy ขึ้น Vercel

1. เตรียมฐานข้อมูล MySQL บน cloud ที่ Vercel ต่อได้ เช่น Aiven (MySQL ฟรี), TiDB Cloud Serverless หรือ Railway
2. ที่ Vercel ให้ Import repository นี้ แล้วตั้งค่า
   - **Root Directory**: `backend`
   - **Framework Preset**: `Express` (Vercel ตรวจเจอให้เอง)
   - Build Command / Output Directory ปล่อยว่างไว้ (Vercel ใช้ `src/server.ts` เป็น Serverless Function เอง)
3. ใส่ Environment Variables

| ตัวแปร | ตัวอย่าง | หมายเหตุ |
| --- | --- | --- |
| `DATABASE_URL` | `mysql://user:pass@host:port/dbname` | ใช้ตัวนี้ตัวเดียวแทน `DB_HOST`/`DB_USER`/... ได้ |
| `DB_SSL` | `true` | ผู้ให้บริการ cloud ส่วนใหญ่บังคับ SSL |
| `DB_SSL_CA` | เนื้อหาไฟล์ `ca.pem` | ถ้าผู้ให้บริการมี CA certificate ให้ (เช่น Aiven) วางทั้งไฟล์ได้เลย |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | ถ้าไม่มี CA ให้ตั้งเป็น `false` |
| `DB_CONNECTION_LIMIT` | `3` | serverless ควรตั้งต่ำ |
| `DB_AUTO_MIGRATE` | `true` | สร้างตารางอัตโนมัติเมื่อมี request แรก |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | คั่นหลายค่าด้วย `,` หรือใช้ `*` |
| `APP_TIMEZONE` | `Asia/Bangkok` | ใช้หา "วันนี้" ของออเดอร์ |

4. กด Deploy แล้วเปิด `https://<project>.vercel.app/api/health` ต้องได้ `"database": "up"`
5. ถ้าอยากได้ข้อมูลตัวอย่าง ให้ยิง `POST /api/simulations/riders`, `POST /api/simulations/orders` หรือรัน `npm run db:seed` จากเครื่องโดยตั้ง `.env` ให้ชี้ไปที่ฐานข้อมูลจริง

บน Vercel ทุก endpoint อยู่ใต้ `/api/...`

## รูปแบบ Response

ถ้าสำเร็จ: `{ "data": ..., "meta": { ... } }` (`meta` มีเฉพาะรายการที่แบ่งหน้าหรือผลค้นหา)

ถ้าผิดพลาด: `{ "error": { "code": "ORDER_LOCKED", "message": "...", "details": ... } }` พร้อม status ที่ตรงความหมาย เช่น 400 ข้อมูลไม่ถูกต้อง, 404 ไม่พบ, 409 สถานะไม่อนุญาต, 422 ทำตามกติกาธุรกิจไม่ได้, 503 ต่อฐานข้อมูลไม่ได้

ฟิลด์ทั้งหมดเป็น camelCase พิกัดใช้รูปแบบ `{ "latitude": 16.24, "longitude": 103.25 }` วันที่ใช้ `YYYY-MM-DD` เวลาใช้ `HH:mm`

## รายการ API

### ระบบ
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api` | ข้อมูล API และรายการ endpoint ทั้งหมด |
| GET | `/api/health` | ตรวจสถานะเซิร์ฟเวอร์และฐานข้อมูล |
| GET | `/api/dashboard?date=` | ภาพรวมของวัน: ลูกค้า ไรเดอร์ ออเดอร์ แผนล่าสุด |

### ตั้งค่าร้าน
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/settings` | ดูค่าตั้งร้าน |
| PUT/PATCH | `/api/settings` | แก้บางค่าได้ เช่น `{ "departureTime": "11:30", "boxPrice": 65 }` |

### ลูกค้า
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/customers?search=&firstName=&lastName=&sort=id\|name\|createdAt&order=asc\|desc&page=&limit=` | แสดงทั้งหมด ค้นจากส่วนหนึ่งของชื่อ นามสกุล เบอร์ หรือที่อยู่ |
| GET | `/api/customers/nearby?lat=&lng=&radius=1` | ลูกค้าในรัศมี (ค่าเริ่มต้น 1 กม.) เรียงจากใกล้สุด พร้อม `distanceKm` |
| GET | `/api/customers/:id` | ดูลูกค้า 1 คน |
| GET | `/api/customers/:id/orders` | ออเดอร์ของลูกค้าคนนั้น |
| POST | `/api/customers` | `{ firstName, lastName, phone, address, location: { latitude, longitude }, note }` (ส่ง `latitude`/`longitude` แบบไม่ซ้อนก็ได้) |
| PUT/PATCH | `/api/customers/:id` | แก้ข้อมูลบางส่วน |
| DELETE | `/api/customers/:id?force=true` | ลบลูกค้า (ถ้ามีออเดอร์ต้องใส่ `force=true` ส่วนออเดอร์ที่อยู่ในแผนยืนยันแล้วลบไม่ได้) |

### ออเดอร์
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/orders?date=&status=&customerId=&search=&page=&limit=` | แสดงออเดอร์พร้อมข้อมูลลูกค้า |
| GET | `/api/orders/summary?date=` หรือ `?all=true` | สรุปจำนวนออเดอร์ กล่อง และยอดขาย แยกตามสถานะ |
| GET | `/api/orders/nearby?lat=&lng=&radius=2&date=&status=` | ออเดอร์ในรัศมี (ค่าเริ่มต้น 2 กม.) |
| GET | `/api/orders/:id` | ดูออเดอร์ |
| POST | `/api/orders` | `{ customerId, boxes, deliveryDate?, note? }` (ไม่ใส่วันที่ = วันนี้) |
| PUT/PATCH | `/api/orders/:id` | แก้ `boxes`, `customerId`, `deliveryDate`, `note`, `status` (`pending`/`cancelled`/`delivered`) |
| PATCH | `/api/orders/:id/boxes` | แก้จำนวนกล่อง `{ "boxes": 2 }` หรือเพิ่ม/ลด `{ "change": 1 }`, `{ "change": -1 }` |
| DELETE | `/api/orders/:id` | ลบออเดอร์ |
| DELETE | `/api/orders?date=&status=` | ล้างออเดอร์ทั้งหมด (ถ้าไม่ระบุ status จะลบแผนของวันนั้นด้วย) |

สถานะออเดอร์: `pending` → `assigned` (ตอนยืนยันแผน) → `delivered` หรือ `cancelled`

### ไรเดอร์
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/riders?search=&active=` | รายชื่อไรเดอร์ |
| GET | `/api/riders/:id` | ดูไรเดอร์ |
| POST | `/api/riders` | `{ name, phone, vehiclePlate, active }` |
| PUT/PATCH | `/api/riders/:id` | แก้ไข |
| DELETE | `/api/riders/:id` | ลบ |

### แผนจัดส่ง (หน้าจอจัดเส้นทาง)
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/plans/objectives` | เป้าหมายการคำนวณที่เลือกได้ |
| POST | `/api/plans/preview` | ดูตัวเลือกเส้นทางโดยยังไม่บันทึก `{ objective, alternatives: 3, seed?, deliveryDate?, orderIds? }` |
| POST | `/api/plans` | คำนวณและบันทึกเป็นแผนร่าง (เลือกตัวเลือกจาก preview ได้ด้วย `seed` + `alternativeIndex`) |
| GET | `/api/plans?date=&status=` | รายการแผน |
| GET | `/api/plans/latest?date=` | แผนล่าสุดของวัน (ใช้แผนยืนยันแล้วก่อน ถ้าไม่มีจึงใช้แผนร่าง) |
| GET | `/api/plans/:id` | รายละเอียดแผน: สรุปกำไรขาดทุน เวลา และเส้นทางแต่ละสีพร้อมจุดส่ง |
| POST | `/api/plans/:id/recalculate` | คำนวณใหม่ให้ได้เส้นทางแบบอื่น `{ objective?, seed?, includeNewOrders? }` |
| POST | `/api/plans/:id/confirm` | ยืนยันแผน ออเดอร์เปลี่ยนเป็น `assigned` และใบงานพร้อมให้ไรเดอร์เปิด |
| POST | `/api/plans/:id/cancel` | ยกเลิกแผน ออเดอร์ที่ยังไม่ส่งกลับเป็น `pending` |
| PATCH | `/api/plans/:id/routes/:routeId/rider` | ผูกไรเดอร์กับเส้นทาง `{ "riderId": 3 }` หรือ `null` |
| DELETE | `/api/plans/:id` | ลบแผน (แผนที่ยืนยันแล้วต้องยกเลิกก่อน) |

ข้อมูลแต่ละเส้นทางมี `color`, `colorName`, `jobCode`, `stops[]` (ลำดับ, ETA, `mapUrl`), `path[]` (พิกัดสำหรับวาดเส้นบนแผนที่), `navigationUrl` (Google Maps นำทางทั้งเส้น), `distanceKm`, `durationMinutes`, `riderFee`, `profit`

`summary` ของแผนมี `riderCount`, `totalDistanceKm`, `totalRiderFee`, `revenue`, `foodCost`, `netProfit`, `profitMarginPercent`, `isProfitable`, `latestArrivalTime`, `lateStops`, `onTime`

### ใบงานไรเดอร์ (หน้าจอมือถือ)
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/jobs/:code` | เปิดใบงานด้วยเลขใบงาน: จำนวนกล่องที่ต้องหยิบ, ลำดับ "จุดที่ 1 → จุดที่ 2", ลิงก์แผนที่ และลิงก์โทรหาลูกค้า |
| POST | `/api/jobs/:code/start` | เริ่มออกส่ง |
| POST | `/api/jobs/:code/stops/:stopId/deliver` | กดส่งสำเร็จทีละจุด (ครบทุกจุดแล้วเส้นทาง/แผนจะปิดให้เอง) |
| POST | `/api/jobs/:code/stops/:stopId/undo` | ยกเลิกการกดส่งสำเร็จ |

### จำลองข้อมูล
| Method | Path | คำอธิบาย |
| --- | --- | --- |
| POST | `/api/simulations/customers` | `{ count: 30, radiusKm?: 3, seed? }` สร้างลูกค้ากระจายรอบร้าน |
| POST | `/api/simulations/orders` | `{ count?, minCount: 20, maxCount: 30, deliveryDate?, clearExisting: false, seed? }` สร้างออเดอร์ 20-30 รายการ รายการละ 1-3 กล่อง (ลูกค้าไม่พอจะสร้างเพิ่มให้) |
| POST | `/api/simulations/riders` | `{ count: 10 }` สร้างไรเดอร์ |
| DELETE | `/api/simulations?includeRiders=false` | ล้างข้อมูลทั้งหมด (แผน ออเดอร์ ลูกค้า และไรเดอร์ถ้าระบุ) |

## ตัวอย่างลำดับการใช้งาน

```bash
API=http://localhost:3000/api
curl -X POST $API/simulations/orders -H "Content-Type: application/json" -d '{"clearExisting":true}'
curl -X POST $API/plans/preview -H "Content-Type: application/json" -d '{"objective":"cost","alternatives":3}'
curl -X POST $API/plans -H "Content-Type: application/json" -d '{"objective":"cost"}'
curl -X POST $API/plans/1/recalculate -H "Content-Type: application/json" -d '{}'
curl -X POST $API/plans/1/confirm
curl $API/jobs/<jobCode>
```
