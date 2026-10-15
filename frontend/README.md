# ข้าวกล่อง · ส่งด่วนมื้อเที่ยง — Angular frontend

Frontend เดียวของโปรเจกต์ ภาษาไทยธีม iOS เรียบง่าย สำหรับเจ้าของร้านและไรเดอร์ รองรับมือถือ แท็บเล็ต และเดสก์ท็อป ใช้ Lucide และ Leaflet/OpenStreetMap

## รัน

ใช้ frontend เพียงเวอร์ชันเดียวใน `src/simple/` เชื่อม backend ของโปรเจกต์ หากต้องการฐานข้อมูลทดสอบแยก ใช้ `npm run start:local` จาก root โปรเจกต์ เปิดเว็บที่พอร์ต 4201 ดู [คู่มือหลัก](../README.md)

เปิดเว็บหลัก:

```bash
npm ci
npm start
```

เปิด http://127.0.0.1:4200. Dev server proxy `/api` ไป `https://khaokong-apii.vercel.app` ซึ่งเป็น backend ของโปรเจกต์ เช่นเดียวกับ Vercel proxy. บัญชีใน `.local/ACCESS.md` ใช้เฉพาะพอร์ต 4201 ไม่สามารถเข้าสู่ backend ออนไลน์ได้.

หากใช้ API อื่น ให้แก้ `public/app-config.js` (เฉพาะ URL สาธารณะ ห้ามใส่รหัสผ่าน/token):

```js
window.__PARCEL_CONFIG__ = { apiUrl: 'https://your-api.example/api' };
```

ใช้ค่า URL ว่างเพื่อใช้ `/api` ที่ origin เดียวกัน หากข้าม origin ต้องตั้ง `CORS_ORIGINS` ของ backend ให้ถูกต้อง

## หน้าใช้งาน

| Route                      | การเข้าถึง         | ความสามารถ                                                                  |
| -------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `/customer`                | สาธารณะ            | ทางเข้าจัดการร้าน ใบงานไรเดอร์ และขั้นตอนใช้งาน                                 |
| `/rider`                   | สาธารณะ            | กรอกเลขใบงาน                                                                |
| `/rider/jobs/:code`        | เลขใบงานเดิม       | ดูเส้นทางถนนจริง, เริ่มส่ง, ส่งสำเร็จ/ย้อนสถานะ, โทรและเปิดนำทาง            |
| `/admin/login`             | สาธารณะ            | เข้าระบบเจ้าของร้าน                                  |
| `/admin`                   | Owner JWT          | สรุปวันส่ง จำนวนอาหาร ต้นทุน กำไร และเส้นทาง                                |
| `/admin/orders`            | Owner JWT          | ค้นหา กรองสถานะ เพิ่ม/แก้/ลบ ดูรายละเอียด                 |
| `/admin/customers`         | Owner JWT          | จัดการลูกค้า เลือกพิกัดบ้านด้วยแผนที่จริง                                   |
| `/admin/riders`            | Owner JWT          | จัดการไรเดอร์และสถานะพร้อมรับงาน                                            |
| `/admin/plans`             | Owner JWT          | เปรียบเทียบแผน บันทึก คำนวณใหม่ ผูกไรเดอร์ ยืนยัน/ยกเลิก เปิดใบงาน          |
| `/admin/settings`          | Owner JWT          | ข้อมูลร้าน พิกัด เวลา ข้อจำกัด ราคา และต้นทุน                               |

Tokens ของ owner อยู่ใน `sessionStorage` และส่งเฉพาะ endpoint ฝั่งจัดการ เมื่อหมดอายุจะกลับหน้า login. ไรเดอร์และลูกค้าไม่ต้องมี token owner

## แผนที่และข้อมูล

- พื้นแผนที่และหมุดอยู่บนพิกัดภูมิศาสตร์จริง ซูม เลื่อน แสดงทุกจุด และขยายแผนที่ได้
- เส้นทางแผนและไรเดอร์ใช้ `geometry` ถนนจาก backend ถ้าไม่มี geometry จะแสดงเส้นประและบอกชัดว่าเป็นระยะตรง
- แผนที่ลูกค้าแสดงเฉพาะต้นทางและปลายทางของอาหาร ไม่แสดงจุดส่งของลูกค้าคนอื่น
- เวลาถึงเป็นเวลาตามแผน ไม่มีการจำลองตำแหน่ง GPS หรืออ้างว่าระบุตำแหน่งไรเดอร์สด
- ลูกค้ารับลิงก์จากร้านผู้ส่ง ยังไม่มีการสมัครบัญชีหรือสร้างออเดอร์สาธารณะ เพื่อรักษาสิทธิ์เดิมของระบบ
- แผนที่/OSRM และ Google Fonts ต้องใช้อินเทอร์เน็ต แผนที่มีสถานะผิดพลาดและปุ่มลองใหม่

## ตรวจสอบ

```bash
npm run build
npm run typecheck
npx playwright install chromium
npm test
npm run test:live
```

`npm test` ตรวจ UI/API contract ของ frontend หลักด้วย fixtures; `test:live` ตรวจ backend + MySQL จริง และรับรองว่าไม่ได้ชี้ไปฐานข้อมูลออนไลน์ก่อนเริ่มแก้ข้อมูล ทดสอบรหัสติดตาม รูปแบบ payload สิทธิ์ CRUD เส้นทางถนน และการอัปเดตสถานะลูกค้าหลังไรเดอร์ส่งสำเร็จ

ภาพล่าสุดจากระบบจริง: `review/live-*.png`. สร้างใหม่ด้วย `node scripts/capture-live.mjs` ขณะระบบในเครื่องเปิดอยู่

## Deploy

Vercel: Root Directory `frontend`, Build `npm run build`, Output `dist/frontend/browser`. คำสั่ง build สร้าง frontend หลักเวอร์ชันเรียบง่าย `vercel.json` มี API proxy ไป backend ออนไลน์เดิม ต้อง deploy backend รุ่นที่มี migration 3 และ `/api/tracking/:code` ด้วยจึงใช้งานติดตามลูกค้าได้ครบ Backend ออนไลน์ปัจจุบันยังไม่มี endpoint ติดตามลูกค้า จึงไม่มีเมนูนี้ในทางเข้าหลัก และซ่อนปุ่มแชร์รายการที่ไม่มี trackingCode สำหรับระบบทดสอบในเครื่องใช้ `npm run start:local` กับ proxy.local.conf.json

## ตรวจแนวจัดวางทุกหน้า

ระบบ spacing, alignment, form controls และ responsive layout ใช้ `src/simple/styles.css` ร่วมกัน ตรวจภาพจริง 80 มุมมองและมี layout regression tests ดู [รายงาน UX/UI](review/LAYOUT-REVIEW.md)
