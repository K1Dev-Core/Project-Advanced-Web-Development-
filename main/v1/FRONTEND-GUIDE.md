# คู่มืออธิบาย Frontend — ข้าวกล่อง v1

เอกสารนี้ใช้ประกอบการอ่านและพรีเซนต์โค้ดใน `main/v1/frontend/` โค้ดใช้ Angular แบบ standalone component: แต่ละหน้าหรือ UI component ระบุ dependency ของตัวเอง, ใช้ Angular Router โหลดหน้า, ใช้ `Api` ติดต่อ backend และเก็บสถานะหน้าจอด้วย signals

## 1. Frontend ทำหน้าที่อะไร

Frontend เป็นเว็บแอปของ 3 กลุ่มการใช้งาน ได้แก่ หน้าทางเข้า, เจ้าของร้าน และไรเดอร์ เจ้าของร้านจัดการลูกค้า/ไรเดอร์/รายการอาหาร ตั้งค่าร้าน คำนวณเส้นทาง เลือกไรเดอร์ และยืนยันแผน ส่วนไรเดอร์ใช้เลขใบงานเพื่อดูจุดส่งและอัปเดตสถานะการจัดส่ง ข้อมูลธุรกิจและการคำนวณหลักอยู่ที่ backend; browser ทำหน้าที่รับ input แสดงผล และส่งคำขอ HTTP

การเรียกหน้า admin ใช้ token เจ้าของร้านใน session storage และส่งเป็น Bearer token สำหรับ API ที่มีสิทธิ์ ส่วนใบงานไรเดอร์กับหน้าทางเข้าเป็น public route ตามขอบเขตระบบ

## 2. โครงสร้างไฟล์

```text
frontend/
├── angular.json                 # Angular application target และ build options
├── package.json                 # คำสั่ง start/build/typecheck และ dependency
├── proxy.conf.json              # proxy /api สำหรับ dev server ปกติ
├── proxy.local.conf.json        # proxy /api ไป backend ที่รันในเครื่อง
├── vercel.json                  # output directory, SPA fallback และ API proxy บน Vercel
├── public/
│   ├── app-config.js            # URL backend ที่กำหนดตอน runtime ได้
│   └── brand/                   # logo และ favicon
└── src/
    ├── index.html               # HTML host ที่ Angular mount แอป
    └── app/
        ├── main.ts              # bootstrap Angular และ providers ระดับแอป
        ├── app.ts / app.html    # shell, เมนูหลัก, router outlet และ Dev tools
        ├── app.routes.ts        # URL, lazy loading และ owner route guard
        ├── styles.css           # design tokens, layout, responsive และพื้นหลัง
        ├── material.scss        # ธีม Angular Material
        ├── components/
        │   ├── ui/              # icon, page title, status, request state
        │   ├── map/             # Leaflet map component
        │   └── delivery-stop-card/ # บัตรขั้นตอนส่งที่รับข้อมูลจาก page
        ├── pages/               # หน้าหนึ่งโฟลเดอร์ต่อหนึ่ง workflow
        │   ├── home/            # home.ts + home.html
        │   ├── login/           # login.ts + login.html
        │   ├── overview/        # overview.ts + overview.html
        │   ├── records/         # records.ts + records.html + record-fields.ts
        │   ├── plans/           # plans.ts + plans.html
        │   ├── rider/           # rider.ts + rider.html + rider.css
        │   └── settings/        # settings.ts + settings.html
        ├── services/            # การติดต่อ API
        ├── models/              # รูปแบบข้อมูล TypeScript
        └── shared/              # controls, dialog, state helper และ UI ย่อย
```

### ทำไมจัดแบบนี้

การจัดนี้นำหลักจากบทเรียนใน `Angular (2).zip` มาใช้: แยก page/component เป็นไฟล์ TypeScript กับ template, สร้าง component ไว้ในโฟลเดอร์ตามหน้าที่, ใช้ Router เลือกหน้า, ส่งข้อมูล parent → child ผ่าน input และส่ง action กลับด้วย output, เก็บ API ใน service และ response types ไว้ใน models แทนการเขียนทั้งหมดใน app component เดียว

โค้ดใช้ Angular standalone components ตาม Angular รุ่นที่ติดตั้งในโปรเจกต์ จึงไม่ต้องสร้าง NgModule แบบตัวอย่างเก่าบางบทเรียน แต่แนวคิดการ import component และเรียก selector ใน template ยังเหมือนเดิม

### จุดเริ่มต้นและการตั้งค่า

- `src/index.html` กำหนดเอกสาร HTML หลักและ metadata ก่อน Angular ทำงาน
- `src/app/main.ts` เรียก `bootstrapApplication(AppComponent, ...)`, ติดตั้ง Router, การคืนตำแหน่ง scroll และ `DialogOverlayContainer` เพื่อให้ popup ของ Material วางตำแหน่งถูกต้องเมื่อเปิด dialog
- `src/app/app.ts` เป็น `AppComponent` และกำหนดเมนู owner/public, ตรวจการเปลี่ยน route เพื่อย้าย keyboard focus, แสดง Dev tools และเชื่อม API service
- `src/app/app.html` เป็น shell ที่คง header/navigation และ router outlet ไว้ ขณะที่ route เปลี่ยนเฉพาะเนื้อหาหน้า
- `angular.json` ตั้งชื่อ Angular target `app`, entry point, stylesheet, assets, production budget และ output `dist/frontend/browser`
- `tsconfig.app.json` เลือกไฟล์เริ่มต้นสำหรับ type checking/build; `tsconfig.json` เก็บ compiler options กลาง
- `proxy.conf.json` กับ `proxy.local.conf.json` ให้ browser เรียก `/api` โดยไม่ hard-code host API ใน component; ตรวจ target ในไฟล์ก่อนเริ่มใช้งาน
- `public/app-config.js` เป็น runtime config สำหรับ URL API สาธารณะ ห้ามใส่ password, JWT secret หรือ credential
- `vercel.json` ส่ง `/api/*` ไป backend ที่ตั้งไว้ และส่ง URL frontend ที่ไม่ใช่ไฟล์ไป `index.html` เพื่อให้ Angular Router รองรับ deep link

### Routing และสิทธิ์ — `app.routes.ts`

ทุกหน้าถูกโหลดด้วย `loadComponent()` ทำให้ Angular แยก chunk ตามหน้าและไม่ต้องโหลด component ทุกหน้าตั้งแต่เริ่ม

| Route | Page | การทำงาน |
|---|---|---|
| `/` | redirect | ไป `/customer` |
| `/customer` | `HomePage` | ทางเข้าร้านและไรเดอร์ |
| `/admin/login` | `LoginPage` | เข้าระบบ owner |
| `/admin` | `OverviewPage` | ภาพรวมร้าน (ต้องมี owner token) |
| `/admin/customers`, `/admin/orders`, `/admin/riders` | `RecordsPage` | ใช้ page component ร่วมกัน แต่ส่ง `kind` ผ่าน route data |
| `/admin/plans` | `PlansPage` | คำนวณและจัดการแผนส่ง |
| `/admin/settings` | `SettingsPage` | ข้อมูลร้านและค่าที่ใช้คำนวณ |
| `/rider` | `RiderPage` | กรอกเลขใบงาน |
| `/rider/jobs/:code` | `RiderPage` | เปิดใบงานตามเลข code |
| route อื่น | redirect | กลับ `/customer` |

`owner` guard ตรวจว่ามี token ใน `Api.token()` ก่อนเปิดหน้าร้าน และส่งผู้ใช้ไปหน้า login หากไม่มี token การตรวจ JWT จริงยังเป็นหน้าที่ backend ทุกครั้งที่เรียก protected endpoint; การซ่อนหน้าใน frontend ไม่ใช่ระบบรักษาความปลอดภัยแทน API

## 3. Pages — หน้าจอและ workflow

page component แต่ละตัวแยก TypeScript สำหรับ state/เหตุการณ์ ออกจาก HTML template เพื่อให้อธิบาย UI และ logic ได้แยกกัน

- `pages/home/home.ts` + `home.html` — ทางเข้าระบบ มี link ไปหน้าร้านและไรเดอร์ ไม่มีการสร้าง order สาธารณะ
- `pages/login/login.ts` + `login.html` — รับ username/password, ตรวจค่าว่าง, เรียก `Api.login()` และ navigate ไป `/admin` เมื่อสำเร็จ ใช้ `Task` ป้องกันกดซ้ำและรายงาน error
- `pages/overview/overview.ts` + `overview.html` — เลือกวันที่แล้วเรียก `GET /dashboard`; แสดงข้อมูลร้าน จำนวนลูกค้า/ไรเดอร์ สรุปยอดและแผนประจำวัน รับ event `dev-data-created` เพื่อ refresh หลังสร้างข้อมูล
- `pages/records/records.ts` + `records.html` — CRUD สำหรับ customer/order/rider ใช้ route `data.kind` เปลี่ยน schema, filter, query, label และ API path มี pagination/search, editor dialog, confirmation ก่อนลบ และแผนที่แก้พิกัดลูกค้า
- `pages/records/record-fields.ts` — นิยาม `RecordKind`, ชื่อเมนู และ field config ของ customer/rider ให้ form renderer ใช้ร่วมกัน
- `pages/plans/plans.ts` + `plans.html` — โหลด plan และ rider, ขอ preview, บันทึกร่าง, เปิดแผน, เปลี่ยนไรเดอร์, คำนวณใหม่, ยืนยันหรือยกเลิก ใช้ `RouteCard` กับ `ParcelMap` แสดงเส้นทางและสถานะ
- `pages/settings/settings.ts` + `settings.html` — โหลดค่าร้าน, แสดง field ตามกลุ่ม, แก้พิกัดบนแผนที่ และส่งเฉพาะ field ที่อนุญาตให้แก้ผ่าน `PATCH /settings`
- `pages/rider/rider.ts` + `rider.html` — อ่าน code จาก URL หรือช่องกรอก, โหลด `GET /jobs/:code`, แสดงแผนที่/จุดส่ง แล้วเรียก start, deliver หรือ undo ตาม action
- template ของแต่ละหน้า เช่น `home.html`, `records.html` และ `rider.html` — markup ของ form, state, buttons, list และ child components; event binding เรียก method ของ class ที่เป็นเจ้าของ template นั้น

`RecordsPage` รวม 3 เมนูที่มีงานตารางและ CRUD คล้ายกันเพื่อลด logic ซ้ำ โดย route ระบุ resource ที่ต้องแสดงและ `record-fields.ts` ระบุ field ของแต่ละชนิด หน้าแผน/ตั้งค่า/ใบงานแยก page เพราะ workflow แตกต่างกันชัดเจน

## 4. Reusable components — `components/`

- `components/ui/icon.ts` — wrapper ของ Lucide Angular ใช้ชื่อเชิงความหมาย เช่น `home`, `truck`, `route` แทนการเขียน SVG/icon import ซ้ำในทุกหน้า
- `components/map/parcel-map.ts` — wrapper ของ Leaflet สำหรับแสดง OSM tiles, markers, route geometry, zoom/fit/expand และการเลือกตำแหน่ง รองรับโหมดแก้ไขพิกัดด้วย event `pointChange`; geometry จาก API คือเส้นทางถนน ถ้าไม่มี geometry จะแสดงข้อมูลเส้นทางตาม fallback ที่ได้รับ แผนที่ไม่แสดง GPS สด
- `components/ui/page-title.ts` — รับ `title`/`description` และ `ng-content` สำหรับ action ที่อยู่ในแนวเดียวกับหัวข้อ
- `components/ui/request-state.ts` — รับ busy/error/success แสดง skeleton และ Notice; ซ่อน success หลังเวลาที่กำหนดและให้ผู้ใช้ปิดข้อความได้
- `components/ui/delivery-status.ts` — แปลง status code เป็น label ภาษาไทยจาก model และใส่ `data-status` ให้ CSS กำหนดรูปลักษณ์ตามสถานะ
- `components/delivery-stop-card/` — แสดงข้อมูลและ action ของจุดส่งหนึ่งจุด รับ `Stop`, job status และ busy state ผ่าน input; ส่ง `deliver`/`undo` กลับด้วย output เพื่อให้ page ยังเป็นผู้เรียก API เอง

## 5. Shared controls, dialogs และสถานะ

- `shared/fields.ts` — `Field` เป็น metadata ของช่องกรอก และ `FormFields` แปลง config เป็น input, checkbox, select หรือ date control; หน้าจอใช้ renderer เดียวกับหลายฟอร์ม
- `shared/date-control.ts` — Angular Material datepicker ที่ implement `ControlValueAccessor`; แปลงระหว่างวันที่ที่แสดงกับ string `YYYY-MM-DD` ที่ส่ง API โดยสร้าง local date เพื่อป้องกันวันเลื่อนจาก UTC
- `shared/material.ts` — date adapter, locale/format และป้ายคำสั่งปฏิทินภาษาไทย
- `shared/overlay-container.ts` — ย้ายตำแหน่ง CDK overlay ให้ทำงานกับ native `<dialog>` และ popup ภายใน editor
- `shared/confirm.ts` — `Confirm` เปิด `ConfirmDialog` แบบ Promise; caller จะทำ destructive action ต่อเมื่อได้ `true`
- `shared/notice.ts` — toast/notice ที่ปิดได้ รับข้อความและสถานะ error/success
- `shared/task.ts` — state machine ขนาดเล็กต่อหน้า: busy, error, success; ไม่เริ่ม request ซ้ำระหว่างที่ request เดิมยังทำงานและจับ exception ให้ UI
- `shared/data.ts` — `allRecords()` วนอ่าน pagination ต่อเนื่องจนได้ข้อมูลทั้งหมด ใช้กับ dropdown ที่ต้องเห็นลูกค้าหรือไรเดอร์ครบทุกหน้า
- `shared/route-card.ts` — แสดงสรุปเส้นทาง จุดส่ง และสถานะ พร้อมเลือก rider ผ่าน input/output bindings
- `shared/dev-tools.ts/html/css` — ปุ่มลอย/หน้าต่างสำหรับสร้างลูกค้า รายการ และไรเดอร์ผ่าน endpoint simulation ที่ต้องผ่าน owner login; validate จำนวนก่อนส่ง และส่ง event ให้หน้าปัจจุบัน refresh หลังมีข้อมูลใหม่

## 6. API client และ data model

### `services/api.ts`

`Api.request<T>()` เป็นจุดเรียก HTTP กลาง รับ path, method, body และ flag ว่าต้องใช้สิทธิ์หรือไม่ จากนั้น:

1. ถ้าเป็น protected request และไม่มี token ให้หยุดก่อนส่ง network request
2. สร้าง `fetch` พร้อม `Authorization: Bearer ...` และ JSON body เมื่อมีข้อมูล
3. จำกัดเวลารอ request และแปลง HTTP/network errors เป็นข้อความที่ UI เข้าใจ
4. เมื่อได้ `401` จาก protected request ให้ลบ token แล้วพากลับหน้า login
5. คืน response envelope `{ data, meta? }`

`Api.login()` เรียก login endpoint, ตรวจ role owner และเก็บ token ใน `sessionStorage`; `logout()` ล้าง token; `toast()` ส่งข้อความแจ้งเตือนให้ app shell การแบ่ง client กลางทำให้ page ไม่ต้องจัด header, token, error mapping และ base URL เอง

### `models/models.ts`

เก็บ contract ฝั่ง frontend เช่น `Point`, `Customer`, `Rider`, `Order`, `Stop`, `DeliveryRoute`, `Plan`, `Proposal`, `Job`, `Settings`, `Dashboard`, `TrackingSnapshot` และ generic `Envelope<T>` ชนิดเหล่านี้ช่วยให้ Angular/TypeScript ตรวจการใช้ property ข้าม API, component และ template ได้ ส่วนข้อมูลจริงและกฎที่เชื่อถือได้ยังมาจาก backend ไม่ใช่ interface ฝั่ง browser

## 7. หน้าตาและ responsive

- `styles.css` เป็น global style สำหรับสี/spacing, content width, panel, form, table, dialog, navigation, skeleton และ breakpoints มือถือ/แท็บเล็ต/desktop รวมพื้นหลัง halftone โทนอ่อน
- `material.scss` ตั้ง theme ให้ MatSelect, MatDatepicker และ MatDialog เข้ากับชุด UI
- `dev-tools.css` แยกสไตล์ของ Dev tools ออกจาก global layout
- icon, button, input และ map มี aria labels/focus behavior ที่ต้องการสำหรับ keyboard และ screen reader
- assets อยู่ใน `public/brand/`; Angular คัดลอก public assets ไป build output ตาม `angular.json`

## 8. ตัวอย่างการไหลของข้อมูล

### บันทึก order

```text
RecordsPage (form)
  → Task.run() ป้องกันส่งซ้ำ/เปิดสถานะกำลังบันทึก
  → Api.request('/orders', 'POST', body)
  → HTTP /api/orders พร้อม owner JWT
  → Backend ตรวจ schema และ business rules
  → Response { data: order }
  → ปิด dialog, แจ้งสำเร็จ, โหลดรายการใหม่
```

### วางแผนและส่งงาน

```text
PlansPage → POST /plans/preview → แสดง candidates และ map
           → POST /plans         → บันทึก draft
           → PATCH /plans/:id/routes/:routeId/rider
           → POST /plans/:id/confirm → backend lock orders + สร้าง job codes
RiderPage  → GET /jobs/:code → POST start/deliver/undo → โหลด job sheet ใหม่
```

## 9. รัน ตรวจ และ deploy

```bash
cd main/v1/frontend
npm ci
npm start           # http://127.0.0.1:4200 ใช้ proxy.conf.json
npm run typecheck
npm run build
```

ถ้าต้องการเรียก backend ในเครื่อง ให้ backend เปิด port ที่ตั้งไว้ใน `proxy.local.conf.json` ก่อน แล้วใช้ `npm run start:local` (port 4201) ตรวจค่า target ใน proxy config ทุกครั้งก่อนรัน

Vercel สำหรับชุดย่อยนี้ตั้ง Root Directory เป็น `main/v1/frontend`, Build Command `npm run build`, Output Directory `dist/frontend/browser`; `vercel.json` มี SPA fallback และ proxy API อยู่แล้ว อย่าใส่ secret ลง frontend เพราะไฟล์และ bundle ถูกส่งไป browser

## 10. แนวพูดพรีเซนต์ Frontend

> “Frontend แบ่งเป็น pages, reusable components, services และ models ตามหน้าที่ หน้าต่างานแต่ละหน้ามี state และ template ของตัวเอง ส่วน API client กลางจัดการ token, HTTP และ error รูปแบบเดียวกัน หน้าร้านกับไรเดอร์จึงใช้ API เดียวกันแต่สิทธิ์ไม่เหมือนกัน ตัวอย่าง workflow คือร้านบันทึกรายการส่ง ขอ preview แผน เลือกไรเดอร์และยืนยัน จากนั้นไรเดอร์เปิดใบงานด้วย code แล้วอัปเดตการส่งผ่าน backend”

### คำถามที่มักถูกถาม

- **ทำไมไม่เขียนทุกอย่างใน component เดียว?** แยก page logic, UI ที่ใช้ซ้ำ และ API service ทำให้ตาม data flow และแก้ส่วนหนึ่งได้โดยไม่ปนกัน
- **ทำไม RecordsPage ใช้สามเมนู?** ทั้งสาม resource ใช้ list/search/pagination/editor รูปแบบเดียวกัน ต่างกันที่ field และ payload ซึ่งกำหนดไว้แยก จึงลดความซ้ำโดยยังอ่านเข้าใจได้
- **token ปลอดภัยจาก frontend อย่างไร?** เก็บใน session storage และส่งเฉพาะ request ที่ต้องใช้สิทธิ์ แต่การอนุญาตจริงอยู่ที่ backend guard; XSS ยังคงเป็นความเสี่ยงของการเก็บ token ฝั่ง browser จึงต้องป้องกัน script injection
- **เวลา ETA เป็นตำแหน่งสดไหม?** ไม่ใช่ เป็นเวลาตามแผนจากระยะทาง/เวลาให้บริการ ไม่มีการจำลองหรือส่งตำแหน่ง GPS สด
