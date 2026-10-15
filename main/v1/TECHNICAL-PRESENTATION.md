# คู่มือเตรียมพรีเซนต์ Khaokong: Frontend, Backend และ Infrastructure

เอกสารนี้เป็นคู่มือพูดและสาธิตระบบสำหรับนำเสนอความก้าวหน้ากับอาจารย์ ครอบคลุมภาพรวมโครงงาน การทำงานของหน้าเว็บ API ฐานข้อมูล การจัดเส้นทาง การติดตั้ง และคำถามที่อาจถูกถาม เนื้อหาอ้างอิง implementation ใน repository ณ commit `09a6194` (16 ตุลาคม 2026) ควรเปิด dashboard ตรวจสถานะ deployment และ health ของบริการจริงก่อนพูดว่า production พร้อมใช้งาน

## สรุปจำง่ายใน 30 วินาที

> “Khaokong ช่วยร้านจัดการลูกค้า ออเดอร์ และไรเดอร์ จากนั้นคำนวณการแบ่งออเดอร์เป็นเส้นทางตามจำนวนจุดสูงสุดต่อไรเดอร์และเวลาส่ง ร้านตรวจแผน เลือกไรเดอร์ และยืนยันเพื่อสร้างใบงาน ไรเดอร์เปิดใบงานจากมือถือ เห็นจำนวนกล่อง ลำดับจุดส่ง และบันทึกผลส่ง ระบบแยก Angular frontend, Express API และ MySQL ส่วน OSRM/OpenStreetMap ให้ข้อมูลเส้นทางและแผนที่”

## 1. โครงงานแก้ปัญหาอะไร

โจทย์ใน [`docs/Project.pdf`](../../docs/Project.pdf) เล่าถึงร้านอาหารที่มีออเดอร์เข้าพร้อมกันหลายรายการในช่วงก่อนเที่ยง ลูกค้าอยู่รอบมหาวิทยาลัยมหาสารคาม และมีเงื่อนไขสำคัญ เช่น เริ่มจัดส่งราว 11:30 น. ส่งให้ทัน 12:30 น. และไรเดอร์รับได้ไม่เกิน 3 ออเดอร์ต่อรอบ ถ้าเจ้าของร้านแบ่งงานและเรียงจุดเอง อาจขับอ้อม ส่งช้า และเสียค่าส่งมากเกินไป

ระบบจึงช่วยทำ 4 เรื่อง:

1. เก็บข้อมูลร้าน ลูกค้า พิกัด ไรเดอร์ และรายการสั่งซื้อ
2. สร้างตัวเลือกแผนจัดส่ง โดยคำนึงถึงระยะทาง เวลา ต้นทุน และจำนวนออเดอร์ที่รับได้
3. ให้ร้านตรวจแผน แก้ผู้รับงาน และยืนยันแผนก่อนผูกออเดอร์เข้ากับใบงาน
4. ให้ไรเดอร์เปิดใบงานบนมือถือ เห็นจำนวนกล่องรวม ลำดับจุดส่ง จำนวนกล่องต่อจุด และทำเครื่องหมายส่งสำเร็จ

### คำอธิบายง่าย ๆ

คิดว่าระบบเป็น “ผู้ช่วยจัดรอบส่ง” ร้านป้อนข้อมูลและตรวจคำแนะนำ ระบบช่วยแบ่งของกับเรียงจุด ไรเดอร์ได้รายการงานที่อ่านง่าย ส่วนเจ้าของร้านยังเป็นผู้ตรวจและยืนยันแผน

## 2. สถาปัตยกรรมที่พูดบนสไลด์

```text
เจ้าของร้าน / ไรเดอร์
        │ เปิดเว็บผ่าน HTTPS
        ▼
Angular SPA — frontend/ (Vercel static output)
        │ JSON API, /api/*
        ▼
Express 5 + TypeScript — backend/
        ├── MySQL — ข้อมูลธุรกิจและ snapshot ของแผน
        └── RoutingService
              ├── OSRM — ระยะถนนและ geometry ของเส้นทาง
              └── EstimatedRoutingProvider — fallback เมื่อ OSRM ใช้ไม่ได้

แผนที่ใน browser: Leaflet + OpenStreetMap tiles
```

**พูดประกอบ:** “แบ่งระบบตามหน้าที่ครับ Angular ดูแลหน้าจอและเรียก API; Express ตรวจ request และกฎธุรกิจ; MySQL เก็บข้อมูล; OSRM ช่วยคำนวณระยะทางถนนและแนวเส้นทาง ส่วน Leaflet แสดงแผนที่ในหน้าเว็บ การแบ่งแบบนี้ทำให้เปลี่ยนหน้าจอหรือผู้ให้บริการเส้นทางได้โดยไม่เอากฎธุรกิจไปไว้ใน UI”

**หมายเหตุเรื่อง deploy:** source ของ frontend ตั้ง output directory เป็น `dist/frontend/browser` และ rewrite `/api/*` ไป backend production ใน `frontend/vercel.json` ตามค่าที่เห็นใน source ส่วน `backend/.env.example` แสดงรูปแบบ configuration เท่านั้น ไม่ใช่หลักฐานว่าค่า production ทุกตัวถูกตั้งแล้ว ก่อนรายงานสถานะจริงให้เปิด Vercel deployment และ `GET /api/health` ตรวจในวันนำเสนอ

## 3. ลำดับการสาธิตที่แนะนำ (ประมาณ 8–10 นาที)

ใช้ข้อมูลสาธิตที่เตรียมไว้และบัญชีที่ได้รับอนุญาต อย่าลบข้อมูลหรือเปลี่ยนแปลง production ระหว่างสาธิต

### นาที 0–1: โจทย์และประโยชน์

พูดสรุปปัญหา: หลายออเดอร์, หลายจุด, เวลาเที่ยงมีกรอบจำกัด และไรเดอร์รับได้ไม่เกิน 3 ออเดอร์ จากนั้นชี้ว่าระบบช่วยจัดงานและให้คนตรวจแผนก่อนเริ่มส่ง

### นาที 1–2: ภาพรวมหน้าร้าน

เปิด `/admin` ชี้ตัวเลขภาพรวมประจำวัน แล้วเปิดลูกค้าหรือออเดอร์เพื่ออธิบายว่าตำแหน่งลูกค้าถูกเก็บเป็นพิกัด และแต่ละออเดอร์มีจำนวนกล่อง/สถานะ

### นาที 2–4: สร้างและตรวจแผน

เปิด `/admin/plans` เลือกวันที่และเป้าหมายการคำนวณ แสดงตัวเลือกแผนบนแผนที่ อธิบายสีของแต่ละ route, ลำดับจุดรวมบนภาพรวม, จำนวนออเดอร์และกล่อง, ระยะทาง, เวลา และตัวเลขรายรับ/ต้นทุน/กำไรตามสมมติฐานของร้าน กดคำนวณใหม่เพื่อให้เห็นทางเลือก จากนั้นเลือกไรเดอร์และยืนยันแผน

**อธิบายขั้นยืนยัน:** ก่อนเปลี่ยนเป็น confirmed ระบบตรวจว่าแผนยังเป็น draft, ส่งทันเวลา และออเดอร์ยัง pending/ข้อมูลตรงกับตอนคำนวณ ถ้าออเดอร์เปลี่ยน ระบบจะปฏิเสธและให้คำนวณใหม่

### นาที 4–6: มุมมองไรเดอร์

เปิดใบงานด้วย job code สำหรับการสาธิต ตรวจให้เห็นจำนวนกล่องทั้งหมด, ความคืบหน้า, ขั้นตอนถัดไป, แผนที่ และบัตรจุดส่งเรียงลำดับ แต่ละบัตรแสดงจำนวนกล่องและเวลาถึงตามแผน กดเริ่มออกส่ง แล้วสาธิตส่งสำเร็จหนึ่งจุดเฉพาะข้อมูลที่เตรียมไว้

**หมายเหตุ:** ETA เป็นเวลาตามแผน ไม่ใช่ GPS สด และตำแหน่ง/ความคืบหน้าสดของไรเดอร์ไม่ได้ถูกติดตามในระบบนี้

### นาที 6–8: เปิดโค้ดอธิบายชั้นระบบ

แสดง route config → `Api` service → Express `App`/`Container` → `PlanService` → `DeliveryPlanner`/routing → repository/database ใช้ภาพ flow ในหัวข้อ 5 แทนการเปิดไฟล์จำนวนมากสลับไปมา

### นาที 8–10: Infrastructure และข้อจำกัด

อธิบายการ deploy แยก static frontend/API, environment variables และ MySQL จากนั้นแยกให้ชัดว่า “โค้ดมีความสามารถอะไร” กับ “บริการจริงตอนนี้พร้อมแค่ไหน” ปิดด้วยสิ่งที่ตรวจแล้ว/ยังต้องตรวจจาก checklist ท้ายเอกสาร

## 4. Frontend: หน้าเว็บทำงานอย่างไร

Frontend ใช้ Angular standalone components แบ่งหน้าตาม route, UI ที่ใช้ซ้ำเป็น component, เรียก API ผ่าน service กลาง และประกาศแบบข้อมูลด้วย TypeScript models หน้า admin ใช้ owner token ส่วนหน้าไรเดอร์รับ job code และเรียก endpoint ใบงาน

### หน้าหลักที่ควรจำ

| หน้าจอ | route | ใช้อธิบายอะไร |
|---|---|---|
| ทางเข้าร้าน | `/customer` | เลือกไปหน้าร้านหรือหน้าสำหรับไรเดอร์ |
| ภาพรวม | `/admin` | สรุปข้อมูลวันส่ง |
| ลูกค้า | `/admin/customers` | จัดการผู้รับ ที่อยู่ และพิกัดบนแผนที่ |
| ออเดอร์ | `/admin/orders` | เพิ่ม แก้ ดูสถานะ และจำนวนกล่อง |
| ไรเดอร์ | `/admin/riders` | จัดการผู้ขับและสถานะพร้อมทำงาน |
| แผนจัดส่ง | `/admin/plans` | คำนวณ เปรียบเทียบ ผูกไรเดอร์ ยืนยัน หรือยกเลิกแผน |
| ตั้งค่าร้าน | `/admin/settings` | พิกัด เวลา ราคา ต้นทุน และข้อจำกัดการจัดส่ง |
| ใบงาน | `/rider/jobs/:code` | ดูงาน เส้นทาง จำนวนกล่อง ลำดับจุด และบันทึกการส่ง |

### Frontend flow แบบง่าย

```text
ผู้ใช้กด/กรอกข้อมูล
  → Angular page ตรวจ input เบื้องต้น
  → Api.request() ส่ง HTTP JSON ไป /api
  → backend ส่ง { data: ... } หรือ { error: ... }
  → Angular อัปเดต signal แล้วแสดงผล/แจ้งข้อผิดพลาด
```

`app.routes.ts` ผูก URL กับหน้าและใช้ lazy `loadComponent` ส่วน owner guard ช่วยนำทางผู้ที่ไม่มี token ไปหน้า login แต่ guard ฝั่ง browser เป็นเพียงประสบการณ์ใช้งานที่ดี ไม่ใช่ตัวป้องกันความปลอดภัยแทน backend

### จุด UX ที่โชว์ได้

- แบ่งหน้าและเมนูตามงานจริงของร้านและไรเดอร์
- หน้าจอรองรับมือถือ/แท็บเล็ต/เดสก์ท็อป
- แผนที่ใช้หมุดและสีแยกเส้นทาง พร้อมเลขจุดส่งต่อเนื่องบนภาพรวม
- ใบงานไรเดอร์มีจำนวนกล่องรวม progress ขั้นตอนถัดไป และรายการแต่ละจุด
- สถานะ loading/error และข้อความไทยช่วยบอกผู้ใช้ว่าควรทำอะไรต่อ

## 5. Backend: request หนึ่งรายการเดินทางอย่างไร

```text
HTTP request
    → App / middleware (CORS, JSON, migration gate, error handling)
    → AuthGuard (เฉพาะ controller ที่ต้องใช้สิทธิ์ร้าน)
    → Controller (อ่าน path/query/body และ validate ด้วย Zod schema)
    → Service (กฎธุรกิจและลำดับ workflow)
    → Repository (SQL อ่าน/เขียน)
    → MySQL
    → response envelope { data: ... } หรือ error ที่มี code/message
```

**คำอธิบายง่าย ๆ:** Controller คือ “พนักงานรับคำขอ”, Service คือ “คนตัดสินตามกฎร้าน”, Repository คือ “คนคุยกับสมุดบัญชี/ฐานข้อมูล” แยกกันเพื่อให้หาและแก้ความรับผิดชอบได้ง่าย

### ตัวอย่าง: ยืนยันแผน

1. `PlanController` รับคำขอ `POST /api/plans/:id/confirm`
2. `PlanService.confirm()` ตรวจสถานะแผนและส่งทุกจุดทันเวลา
3. โหลดออเดอร์ปัจจุบันแล้วเทียบสถานะ จำนวนกล่อง และลูกค้ากับ snapshot
4. ถ้าข้อมูลครบและไม่เปลี่ยน จึงใช้ transaction ผูกออเดอร์กับแผนและเปลี่ยนสถานะ
5. ถ้าตรวจพบข้อมูลเปลี่ยน ให้ error `PLAN_STALE` เพื่อให้ร้านคำนวณแผนใหม่

### API ที่ควรจำสำหรับ demo

| Method | Endpoint | ใช้ทำอะไร |
|---|---|---|
| `POST` | `/api/auth/login` | เข้าระบบเจ้าของร้านและรับ token |
| `GET/POST/PATCH/DELETE` | `/api/customers`, `/api/orders`, `/api/riders` | จัดการข้อมูลหลัก |
| `POST` | `/api/plans/preview` | คำนวณตัวเลือกโดยยังไม่บันทึกเป็นแผน |
| `POST` | `/api/plans` | สร้างแผน draft |
| `POST` | `/api/plans/:id/recalculate` | คำนวณทางเลือกใหม่ |
| `POST` | `/api/plans/:id/confirm` | ตรวจและยืนยันแผน |
| `GET` | `/api/jobs/:code` | เปิดใบงานด้วย job code |
| `POST` | `/api/jobs/:code/start` | เริ่มงานส่ง |
| `POST` | `/api/jobs/:code/stops/:stopId/deliver` | บันทึกว่าส่งจุดนั้นแล้ว |
| `GET` | `/api/health` | ตรวจสถานะ API/ฐานข้อมูล |

เส้นทางจัดการร้านถูกครอบด้วย bearer token ส่วน endpoint ใบงานไรเดอร์เป็น public ตาม job code ในแบบระบบนี้ อย่าอธิบายว่าไรเดอร์มีบัญชี login หรือระบบ role แยก ถ้าไม่ได้พัฒนาส่วนนั้น

## 6. การคำนวณเส้นทาง: หลักคิดและขอบเขตที่ควรพูดให้ตรง

### ข้อมูลที่ใช้

- จุดเริ่มจากพิกัดร้าน
- จุดส่งจากพิกัดลูกค้า/ออเดอร์
- จำนวนกล่องแต่ละออเดอร์
- จำนวนออเดอร์สูงสุดต่อไรเดอร์ (ระบบบังคับไม่เกิน 3 ตามโจทย์)
- เวลาออกส่ง, เวลาส่งที่มี, ความเร็วประมาณของไรเดอร์ และเวลาจอดส่ง
- ราคาขาย ต้นทุนต่อกล่อง ค่าเริ่มต้นไรเดอร์ และค่าระยะทางต่อกล่อง

### ขั้นตอนคำนวณแบบไม่ใช้ศัพท์ยาก

1. ดึงออเดอร์ pending ของวันที่เลือกและตรวจข้อจำกัด
2. Routing service ขอ distance matrix จาก OSRM; ถ้าขอไม่สำเร็จใช้ระยะเส้นตรงคูณ road factor เป็นค่าประมาณ
3. Planner สร้างชุดการแบ่งออเดอร์หลายรอบด้วย seed ที่ทำซ้ำได้
4. Optimizer พยายามย้าย/สลับ/รวมจุดระหว่างรอบเมื่อคะแนนดีขึ้นและจำนวนจุดไม่เกิน capacity
5. Evaluator เรียงลำดับจุดและคำนวณระยะ เวลา ETA ค่าขนส่ง และ penalty เมื่อช้า
6. Objective เลือกวิธีให้คะแนน เช่น ต้นทุนต่ำ ระยะสั้น เวลารอรวมต่ำ หรือสมดุล
7. ร้านดูตัวอย่างก่อน แล้วจึงบันทึก draft เลือกไรเดอร์และยืนยัน

### อย่าพูดเกินจริงเรื่อง “เส้นทางดีที่สุด”

ตัว planner ใช้ heuristic/search หลายรอบ ไม่ได้พิสูจน์คำตอบที่ดีที่สุดทางคณิตศาสตร์สำหรับทุกจำนวนออเดอร์ การเรียงลำดับบางกรณีไล่ permutation เมื่อชุดเล็ก (ไม่เกิน 7 จุดใน `RouteEvaluator`) และใช้ nearest-neighbor พร้อม local improvement เมื่อใหญ่กว่า เป้าหมายคือหาคำตอบที่ดีภายใต้ข้อจำกัดและเวลาคำนวณที่เหมาะสม

**ประโยคตอบที่แนะนำ:** “ระบบค้นหาทางเลือกด้วย heuristic หลายรอบและให้คะแนนตามเป้าหมายที่เลือกครับ ไม่ได้อ้างว่าเป็น global optimum แต่ช่วยให้ร้านมีแผนที่คำนวณซ้ำได้และตรวจตัวเลขก่อนยืนยัน”

### แผนที่กับเวลา

- OSRM ให้ระยะถนนและ route geometry เมื่อบริการตอบได้
- Leaflet วาดเส้นบน tile จาก OpenStreetMap
- ถ้า OSRM ล้มเหลว ระบบคำนวณระยะประมาณจากพิกัด; เส้นอาจเป็นเส้นตรง/เส้นประ ไม่ใช่เส้นนำทางตามถนน
- ETA คือเวลาตามแผนที่คำนวณจากระยะ ความเร็ว และเวลาจอด ไม่ใช่ข้อมูล GPS สดหรือ traffic สด
- แผนรวมแสดงหมายเลขจุดส่งต่อเนื่องข้ามทุก route เพื่อให้ดูภาพรวมง่าย ส่วนเลขลำดับในใบงานแต่ละไรเดอร์เริ่มที่จุดส่ง 1 ของ route นั้น

## 7. ฐานข้อมูลและความถูกต้องของข้อมูล

ฐานข้อมูลเป็น MySQL ใช้ `mysql2/promise` และ `utf8mb4` ตารางหลักใน migration ได้แก่:

- `customers` — ผู้รับ ที่อยู่ เบอร์โทร พิกัด
- `orders` — รายการส่ง จำนวนกล่อง วันที่ สถานะ และลูกค้า
- `riders` — ข้อมูลและสถานะพร้อมรับงาน
- `settings` — ค่าเวลา ราคา ต้นทุน และข้อจำกัดร้าน
- `delivery_plans` — เป้าหมายการคำนวณ สถานะ เวลา และ snapshot/summary
- `plan_routes` — route ต่อไรเดอร์ job code สี ระยะ เวลา และค่าใช้จ่าย
- `plan_stops` — จุดส่ง ลำดับ จำนวนกล่อง ETA และสถานะ

**Transaction แบบง่าย:** เหมือนทำรายการหลายหน้าในสมุด ถ้าขั้นใดขั้นหนึ่งผิดให้ย้อนทั้งชุด ไม่เหลือข้อมูลครึ่ง ๆ กลาง ๆ การส่งสำเร็จจึงอัปเดต stop, order และ route/plan ที่เกี่ยวข้องใน transaction

Migration มี version เพื่อสร้าง/ปรับ schema อย่างเป็นขั้นตอน ตรวจ `backend/src/database/migrations.ts` ก่อนอธิบายว่ามีตารางหรือคอลัมน์ใดบ้าง

## 8. Infrastructure และการรัน

### ในเครื่องสำหรับพัฒนา

ข้อกำหนด: Node.js 22 และ MySQL ที่เข้าถึงได้

```bash
# terminal 1: backend
cd backend
npm ci
cp .env.example .env
# ตั้งค่า DB และตั้ง OWNER_PASSWORD / JWT_SECRET ที่ปลอดภัยใน .env
npm run db:migrate
npm run dev

# terminal 2: frontend
cd frontend
npm ci
npm run start:local
```

Frontend local ใช้พอร์ต `4201` เพื่อชี้ `/api` ไป backend local ที่ `3000`; อย่าสับสนกับ `npm start` ปกติซึ่ง proxy ไป API production ตาม README

### Deploy ที่อธิบายได้จาก source

- Frontend build ด้วย Angular และ Vercel เสิร์ฟ static browser output
- `frontend/vercel.json` ระบุ output directory และ rewrite API/SPA
- Backend ใช้ Node.js 22, Express และ environment configuration สำหรับ MySQL/JWT/CORS/OSRM
- `DB_AUTO_MIGRATE` ควบคุม migration gate; health endpoint ยกเว้น gate เพื่อรายงาน health ได้
- Secrets อยู่ฝั่ง backend environment; ห้ามใส่ password, JWT secret หรือ database URL ใน frontend, Git หรือสไลด์
- API health แสดงการตรวจ backend และฐานข้อมูล; health 200 เพียงครั้งเดียวไม่รับประกันว่าทุก workflow ถูกต้อง

### ต้องตรวจให้ได้ก่อนพรีเซนต์ว่า “พร้อมใช้งานจริง”

- [ ] Vercel frontend ล่าสุดของ commit ที่ต้องการเป็นสถานะ **Ready**
- [ ] เปิด frontend URL และ deep link เช่น `/admin/settings` ได้โดยตรง
- [ ] `GET https://khaokong-apii.vercel.app/api/health` ตอบปกติ และยืนยัน DB health
- [ ] เข้าระบบด้วยบัญชีที่ได้รับอนุญาตได้
- [ ] มีข้อมูล demo ที่ไม่ใช่ข้อมูลส่วนบุคคลจริง และมี job code ใช้ได้
- [ ] แผนที่โหลด tile ได้; ถ้าไม่โหลด มีภาพ/ผลตัวอย่างสำรอง
- [ ] ปิดแท็บที่มี credentials, token, `.env` หรือข้อมูลผู้ใช้จริงก่อนแชร์จอ

**อย่าพูดว่า** “ระบบมี CI/CD, backup, monitoring, SLA หรือ GPS สด” เว้นแต่ตรวจระบบ/เอกสารเพิ่มเติมและยืนยันว่ามีจริง

## 9. ความปลอดภัยและสิทธิ์

- Owner login คืน JWT; frontend ส่งเป็น `Authorization: Bearer ...` เมื่อเรียก endpoint ที่ป้องกัน
- Backend AuthGuard เป็นจุดตรวจสิทธิ์จริง; route guard ของ Angular ช่วย UX เท่านั้น
- Request body/query ผ่าน Zod schemas ก่อน service ประมวลผล
- SQL ใช้ parameterized query ผ่าน repository/mysql2
- job code ใช้เปิดใบงาน public ในขอบเขตของโจทย์ จึงไม่ควรแสดง code จริงหรือข้อมูลลูกค้าจริงต่อสาธารณะ
- environment secrets ตั้งใน platform ฝั่ง backend เท่านั้น; `.env.example` เป็น placeholder

ถ้าอาจารย์ถามเรื่อง production security ให้ตอบตาม implementation และยอมรับขอบเขต: ตรวจสิทธิ์ owner ที่ backend แล้ว แต่ใบงานใช้ job code แทนบัญชีไรเดอร์ในรุ่นนี้

## 10. ความคืบหน้าและหลักฐานที่มีใน repository

จาก source และ commit ล่าสุดมีหน้าจัดการข้อมูล, plan workflow, routing provider, rider job flow, migration, และการทดสอบที่เกี่ยวข้อง โค้ดล่าสุดแก้ให้หมายเลขจุดส่งบนแผนรวมต่อเนื่อง และหน้าใบงานแสดงกล่อง/ความคืบหน้า/ขั้นตอนอ่านง่ายขึ้น

สำหรับผลตรวจทางเทคนิค ให้ใช้หลักฐานจากการรันล่าสุดในเครื่องหรือ deployment dashboard ในวันนำเสนอ อย่าอาศัยคำบอกเล่าจากเอกสารเก่าแทนผลปัจจุบัน ตัวอย่างคำสั่ง:

```bash
npm run build
npm test --prefix backend
npm test --prefix frontend
```

E2E frontend ต้องมี Playwright browser dependencies และ config ที่เกี่ยวข้องพร้อมใช้งาน หากรันไม่ได้ให้บอกข้อเท็จจริงและใช้การสาธิต flow แทนการกล่าวว่า test ผ่าน

## 11. คำถามที่อาจารย์ถาม พร้อมคำตอบสั้นและคำอธิบายง่าย

### 1) ระบบนี้ช่วยแก้ปัญหาอะไร?

**ตอบ:** ช่วยจัดข้อมูลออเดอร์ แบ่งจุดส่งเป็น route ตามจำนวนที่รับได้ ช่วยคำนวณและแสดงผลให้ร้านตรวจ ก่อนออกใบงานให้ไรเดอร์ครับ

**เข้าใจง่าย:** ลดการนั่งแบ่งงานและเรียงจุดด้วยมือ

### 2) ทำไมต้องแยก Frontend กับ Backend?

**ตอบ:** Frontend ดูแลการโต้ตอบและแสดงผล ส่วน Backend ตรวจสิทธิ์ ใช้กฎธุรกิจ ติดต่อฐานข้อมูล และคำนวณแผน ทำให้ browser ไม่เป็นแหล่งตัดสินข้อมูลสำคัญครับ

**เข้าใจง่าย:** หน้าเว็บเป็นหน้าร้าน; backend เป็นหลังร้านที่ทำงานจริง

### 3) ทำไมใช้ Angular?

**ตอบ:** โครงสร้าง component, router, dependency injection และ TypeScript ช่วยจัดหน้าและ logic ที่ใช้ร่วมกัน และแยกโหลดหน้าตาม route ได้

### 4) Controller, Service, Repository ต่างกันอย่างไร?

**ตอบ:** Controller รับ HTTP, Service ใช้กฎธุรกิจ, Repository อ่านเขียน SQL ครับ

**จำง่าย:** รับเรื่อง → ตัดสินใจ → บันทึก

### 5) แผนได้คำตอบที่ดีที่สุดแน่นอนหรือไม่?

**ตอบ:** ไม่รับประกัน global optimum ครับ ระบบใช้ heuristic สร้างหลาย candidate แล้วปรับปรุงตาม objective และข้อจำกัด เพื่อได้ผลที่ดีและใช้คำนวณได้จริง

### 6) ระบบแบ่ง route โดยดูอะไร?

**ตอบ:** ระยะทาง/เวลา/ต้นทุนตาม objective, เวลาออกส่งและกรอบส่ง, จำนวนจุดสูงสุดต่อไรเดอร์ และข้อมูลพิกัดลูกค้าครับ

### 7) ถ้า OSRM ใช้ไม่ได้จะเกิดอะไรขึ้น?

**ตอบ:** RoutingService fallback ไปคำนวณระยะประมาณจากพิกัด และผลจะระบุ source ว่า estimated; ระยะและ geometry อาจไม่ตรงถนนจริงครับ

### 8) เส้นบนแผนที่เป็นตำแหน่ง GPS สดไหม?

**ตอบ:** ไม่ครับ เป็นเส้นทาง/geometry ที่คำนวณไว้และ ETA ตามแผน ไม่มีการติดตามตำแหน่งไรเดอร์สด

### 9) ทำไม preview ก่อน confirm?

**ตอบ:** ให้ร้านตรวจเส้นทาง เวลา และค่าใช้จ่ายก่อนผูกออเดอร์จริง การยืนยันจะตรวจอีกครั้งว่าออเดอร์ไม่เปลี่ยนและแผนยังทันเวลาครับ

### 10) ถ้าระหว่าง preview มีคนแก้ออเดอร์?

**ตอบ:** confirm เทียบสถานะและข้อมูลออเดอร์กับแผน ถ้าเปลี่ยนจะได้ `PLAN_STALE` และต้องคำนวณใหม่ ป้องกันส่งแผนที่ใช้ข้อมูลเก่าครับ

### 11) Transaction คืออะไรและใช้ตรงไหน?

**ตอบ:** ทำให้การอัปเดตหลายตารางสำเร็จพร้อมกัน หรือ rollback ทั้งชุดเมื่อผิดพลาด เช่น ตอนส่งสำเร็จที่ต้องอัปเดต stop/order/route ครับ

### 12) ทำไมเก็บทั้ง plan, route, stop?

**ตอบ:** Plan คือรอบคำนวณ, route คือชุดงานของไรเดอร์หนึ่งคน, stop คือจุดรับ/ส่งแต่ละจุด โครงสร้างนี้เก็บสถานะและลำดับแยกกันได้

### 13) ไรเดอร์ยืนยันตัวตนอย่างไร?

**ตอบ:** ในรุ่นนี้เปิดใบงานด้วย job code และ endpoint job ถูกออกแบบเป็น public จึงควรปกป้อง job code และข้อมูลส่วนบุคคล รุ่นนี้ไม่ได้อ้างว่ามี rider account/login

### 14) เลข 1, 2, 3 บนแผนรวมกับใบงานต่างกันไหม?

**ตอบ:** บนแผนรวมเลขต่อเนื่องข้าม route เพื่ออ่านภาพรวม ส่วนใบงานแสดงลำดับเฉพาะ route ของไรเดอร์คนนั้น เริ่มที่จุด 1 ครับ

### 15) ETA คำนวณจากอะไร?

**ตอบ:** ระยะทางตาม matrix, ความเร็วเฉลี่ยที่ตั้งไว้ และเวลาจอดส่งต่อจุด เป็นเวลาประมาณตามแผน ไม่ได้อ่านการจราจรสดครับ

### 16) ต้นทุน/กำไรคำนวณอย่างไร?

**ตอบ:** ใช้ราคาขายและต้นทุนต่อกล่องจากการตั้งค่า คำนวณรายรับและต้นทุนอาหาร แล้วหักค่ารอบไรเดอร์ที่คำนวณจากค่าเริ่มต้นบวกค่าระยะทางต่อกล่อง ตัวเลขขึ้นกับการตั้งค่าร้านครับ

### 17) ถ้าแผนขาดทุนทำอย่างไร?

**ตอบ:** เปลี่ยน objective หรือพารามิเตอร์ที่ร้านกำหนดแล้วคำนวณ preview ใหม่ เพื่อเปรียบเทียบต้นทุน เวลา และกำไร ก่อนยืนยันครับ

### 18) ข้อมูลตัวอย่างกับข้อมูลจริงแยกกันอย่างไร?

**ตอบ:** simulation records มี flag ระบุในข้อมูล และ API/UI รองรับกรอง/จัดการแยก แต่ก่อน demo ควรตรวจชุดข้อมูลและอย่าเปิดเผยข้อมูลส่วนบุคคลจริงครับ

### 19) ถ้า database ล่ม?

**ตอบ:** API ไม่สามารถอ่าน/บันทึก workflow ที่พึ่งฐานข้อมูลได้ health endpoint ใช้ตรวจการเชื่อมต่อ และ frontend แสดง error ให้ลองใหม่ ต้องแก้การเชื่อมต่อ/ฐานข้อมูลก่อนทำรายการต่อ

### 20) ข้อมูลถูกบันทึกถาวรหรือไม่?

**ตอบ:** source ใช้ MySQL และมี migrations แต่ความถาวร/backup จริงขึ้นกับ provider และการตั้งค่าฐานข้อมูล production ซึ่งต้องยืนยันจาก dashboard ครับ

### 21) ทำไม Vercel มี Framework Preset และ Output Directory?

**ตอบ:** preset บอกวิธี build; output directory ชี้โฟลเดอร์ไฟล์เว็บที่ build เสร็จ โปรเจกต์ Angular นี้ใช้ `dist/frontend/browser` ตาม config ต้องให้ Root Directory และ config สอดคล้องกันด้วย

### 22) API มีรูปแบบ response อย่างไร?

**ตอบ:** สำเร็จส่ง `{ data: ... }`; ผิดพลาดส่ง HTTP status พร้อม `{ error: { code, message } }` ทำให้ frontend แปลข้อความให้เหมาะกับผู้ใช้ได้

### 23) ถ้าพิกัดผิดหรือไม่มีออเดอร์?

**ตอบ:** validation และ business rules ตรวจข้อมูล/รายการที่จะนำเข้าคำนวณ และแจ้ง error ที่อธิบายได้ ระบบไม่ควรสร้างแผนจากพิกัดที่ไม่มีหรือ request ที่ไม่ผ่าน schema

### 24) จุดที่ยังพัฒนาต่อได้คืออะไร?

**ตอบ:** เพิ่มบัญชี/การยืนยันตัวตนเฉพาะไรเดอร์, traffic/GPS สดหากมี requirement, ทดสอบโหลดและ deployment pipeline, และวัดความแม่นของข้อมูลระยะทางกับพื้นที่ใช้งานจริง โดยต้องประเมินความเสี่ยงและค่าใช้บริการก่อนครับ

## 12. คำศัพท์พูดง่าย

| คำ | พูดง่าย ๆ |
|---|---|
| Frontend | หน้าจอที่ผู้ใช้เห็นและกดใช้งาน |
| Backend | บริการหลังบ้านที่ตรวจข้อมูลและทำกฎของระบบ |
| API | ช่องทางมาตรฐานที่หน้าเว็บใช้คุยกับหลังบ้าน |
| REST | รูปแบบ API ที่ใช้ HTTP method เช่น GET/POST/PATCH/DELETE |
| JSON | รูปแบบข้อความสำหรับส่งข้อมูลระหว่างเว็บกับ API |
| JWT/Bearer token | บัตรผ่านชั่วคราวที่พิสูจน์ว่าเจ้าของร้านเข้าสู่ระบบแล้ว |
| Database | ที่เก็บข้อมูลถาวร เช่น ลูกค้า ออเดอร์ และแผน |
| Migration | คำสั่งปรับโครงสร้างตารางอย่างมีเวอร์ชัน |
| Transaction | ชุดเปลี่ยนข้อมูลที่สำเร็จทั้งหมดหรือย้อนกลับทั้งหมด |
| Heuristic | วิธีค้นหาคำตอบที่ดีโดยไม่ลองทุกความเป็นไปได้ |
| Distance matrix | ตารางบอกระยะระหว่างร้านและจุดส่งทุกคู่ |
| Geometry | ชุดพิกัดที่ใช้วาดแนวเส้นทางบนแผนที่ |
| ETA | เวลาถึงโดยประมาณตามแผน |
| Fallback | วิธีสำรองเมื่อบริการหลักตอบไม่ได้ |
| Build | การแปลง source code ให้เป็นไฟล์พร้อมรัน/deploy |
| Environment variable | ค่าตั้งระบบที่ส่งให้โปรแกรมตอนรัน; secret ห้ามเผยแพร่ |

## 13. ไฟล์อ้างอิง: อ่านอะไร และเปิดไฟล์ไหนตอนพูด

### อ่านก่อน (ลำดับแนะนำ)

1. [`docs/Project.pdf`](../../docs/Project.pdf) — อ่านโจทย์และขอบเขตที่อาจารย์กำหนด
2. [`main/v1/README.md`](README.md) — เข้าใจชุดโค้ดสำหรับนำเสนอและวิธีรัน
3. [`main/v1/FRONTEND-GUIDE.md`](FRONTEND-GUIDE.md) — อ่านภาพรวม Angular และแต่ละหน้า
4. [`main/v1/BACKEND-GUIDE.md`](BACKEND-GUIDE.md) — อ่าน modules, API, DB และ planner
5. [`main/v1/TECHNICAL-PRESENTATION.md`](TECHNICAL-PRESENTATION.md) — ใช้เป็นบทพูด/คำถาม

### เปิดประกอบตอนพรีเซนต์

| ส่วนที่กำลังอธิบาย | ไฟล์สำหรับเปิด | จุดดู |
|---|---|---|
| Route และสิทธิ์หน้า | [`frontend/src/app/app.routes.ts`](../../frontend/src/app/app.routes.ts) | mapping URL, lazy page, owner guard |
| request จาก browser | [`frontend/src/app/services/api.ts`](../../frontend/src/app/services/api.ts) | `request()`, token, error handling |
| หน้ารายการ/แผน/ไรเดอร์ | [`records.ts`](../../frontend/src/app/pages/records.ts), [`plans.ts`](../../frontend/src/app/pages/plans.ts), [`rider.ts`](../../frontend/src/app/pages/rider.ts) | state และการเรียก API |
| map และเลขจุด | [`frontend/src/app/components/parcel-map.ts`](../../frontend/src/app/components/parcel-map.ts) | Leaflet, marker, route sequence |
| ใบงานที่ไรเดอร์เห็น | [`rider.html`](../../frontend/src/app/pages/rider.html), [`rider.css`](../../frontend/src/app/pages/rider.css) | จำนวนกล่อง progress และ step card |
| เส้นทาง request API | [`App.ts`](../../backend/src/app/App.ts), [`Container.ts`](../../backend/src/app/Container.ts) | middleware, auth, wiring controllers/services |
| ตัวอย่าง endpoint แผน | [`PlanController.ts`](../../backend/src/modules/plans/PlanController.ts) | preview/create/recalculate/confirm |
| กฎแผนและ transaction | [`PlanService.ts`](../../backend/src/modules/plans/PlanService.ts) | preview, draft, stale-check, confirm |
| ตัว planner | [`DeliveryPlanner.ts`](../../backend/src/modules/planning/DeliveryPlanner.ts) | candidate/restarts/seed |
| การแบ่ง/ปรับ route | [`RouteOptimizer.ts`](../../backend/src/modules/planning/RouteOptimizer.ts) | capacity, merge/relocate/swap |
| การคิด ETA/ค่าคะแนน | [`RouteEvaluator.ts`](../../backend/src/modules/planning/RouteEvaluator.ts), [`objectives/`](../../backend/src/modules/planning/objectives/) | distance, arrival, fee, objective, lateness |
| OSRM/fallback | [`OsrmRoutingProvider.ts`](../../backend/src/modules/routing/OsrmRoutingProvider.ts), [`RoutingService.ts`](../../backend/src/modules/routing/RoutingService.ts), [`EstimatedRoutingProvider.ts`](../../backend/src/modules/routing/EstimatedRoutingProvider.ts) | road route และ fallback estimate |
| rider job state | [`JobController.ts`](../../backend/src/modules/jobs/JobController.ts), [`JobService.ts`](../../backend/src/modules/jobs/JobService.ts) | public job code, start, deliver, transaction |
| Schema และ DB | [`migrations.ts`](../../backend/src/database/migrations.ts), [`Database.ts`](../../backend/src/database/Database.ts) | tables, connection pool, transaction |
| Auth/config | [`AuthService.ts`](../../backend/src/modules/auth/AuthService.ts), [`AuthGuard.ts`](../../backend/src/modules/auth/AuthGuard.ts), [`AppConfig.ts`](../../backend/src/config/AppConfig.ts) | JWT, protected route, environment |
| Deployment | [`frontend/vercel.json`](../../frontend/vercel.json), [`frontend/angular.json`](../../frontend/angular.json), [`backend/package.json`](../../backend/package.json), [`backend/.env.example`](../../backend/.env.example) | output/rewrite, build, runtime/env names |
| Requirement API อ้างอิงวิชา | [`docs/submission/Khaokong-WebAPI.pdf`](../../docs/submission/Khaokong-WebAPI.pdf) | ER diagram และ endpoint contract ที่ส่งประกอบ |

**แหล่งของตัว deploy:** Vercel project ที่ตั้ง Root Directory เป็น `frontend` ใช้ source `frontend/` และ API service ใช้ `backend/`; โฟลเดอร์ `main/v1/` เก็บชุดโค้ดหลักฉบับนำเสนอและคู่มือ ไม่ควรสลับไฟล์จากสองชุดโดยไม่ตรวจว่าเป็น revision เดียวกัน

## 14. Checklist ก่อนเข้าห้อง

- [ ] เปิดคู่มือและ PDF ไว้ล่วงหน้า; ตั้ง browser zoom ให้เห็นหน้าจอพอดี
- [ ] ทดสอบ login และ API health โดยไม่เปิดเผย username/password/token
- [ ] เตรียม demo orders/ลูกค้า/ไรเดอร์และ job code; ตรวจว่าแผนมีหลาย route หากต้องการโชว์เลขรวม 1,2,3
- [ ] เช็คแผนที่และอินเทอร์เน็ต; เตรียม screenshot/วิดีโอสั้นเป็นแผนสำรอง
- [ ] ปิด tab, console, database client และไฟล์ `.env` ที่อาจมี secret
- [ ] จำประโยคข้อจำกัด: “ETA เป็นตามแผน ไม่ใช่ GPS สด”; “OSRM ล้มได้และมีระยะประมาณสำรอง”; “heuristic ไม่รับประกัน optimum”
- [ ] เช็ค Vercel ว่า deployment ที่จะนำเสนอเป็น Ready และ frontend/API ใช้ environment ที่คาดไว้
- [ ] เปิดหน้า workflow ตามลำดับ: ภาพรวม → ออเดอร์ → แผน → ใบงานไรเดอร์

## ปิดการนำเสนอ

> “ระบบเชื่อม flow ตั้งแต่ข้อมูลลูกค้าและออเดอร์ ไปจนถึงการวางแผน แบ่งงาน และติดตามสถานะการส่งในใบงาน จุดเด่นคือมีการคำนวณตามข้อจำกัดที่โจทย์ให้ ร้านตรวจตัวเลขและยืนยันก่อน dispatch และไรเดอร์เห็นลำดับกับจำนวนกล่องชัดเจน ขั้นต่อไปคือทดสอบ workflow บน environment ที่ใช้ส่งจริงและยืนยันสถานะบริการภายนอกครับ”
