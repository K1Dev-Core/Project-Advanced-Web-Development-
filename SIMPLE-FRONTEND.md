# ข้าวกล่อง — frontend หลัก

Frontend แบบเรียบง่ายสำหรับใช้งานจริง ใช้ Angular พื้นขาว เมนูด้านบน ตารางข้อมูล ฟอร์มมาตรฐาน และสีส้มเฉพาะปุ่มหลัก ไม่ใช้แบนเนอร์การตลาด ข้อมูลจำลองแยกไว้ในชุดทดสอบ ส่วน Dev tools เป็นปุ่มลอยสำหรับสร้างข้อมูลทดสอบโดยเรียก API จริง

## เปิดใช้งาน

จาก root โปรเจกต์:

```bash
npm start --prefix frontend
```

เปิด http://127.0.0.1:4200/customer เชื่อม backend ของโปรเจกต์ที่ `https://khaokong-apii.vercel.app/api` ผ่าน proxy ใช้บัญชีเจ้าของร้านของ backend นั้น

## โครงสร้างที่ใช้อธิบายโค้ด

โค้ดแอปอยู่ใน `frontend/src/app/` แบ่งตามหน้าที่แบบ Angular: `pages/` สำหรับหน้าและ template, `components/` สำหรับ UI ที่ใช้ซ้ำ, `services/` สำหรับเรียก API, `models/` สำหรับชนิดข้อมูล, `shared/` สำหรับ controls และตัวช่วยร่วมกัน แต่ละหน้ามีไฟล์ `.ts` (ข้อมูลและการทำงาน) กับ `.html` (หน้าจอ) ส่วนธีมกลางอยู่ใน `styles.css` และ `material.scss`

| ส่วน | ตำแหน่ง | หน้าที่ |
| --- | --- | --- |
| จุดเริ่มต้นและโครงหน้า | `main.ts`, `app.ts`, `app.html` | เปิด Angular, เมนูหลัก และพื้นที่แสดงหน้า |
| เส้นทาง | `app.routes.ts` | URL, lazy loading และตรวจสิทธิ์เจ้าของร้าน |
| หน้าจอ | `pages/` | หน้าแรก, เข้าสู่ระบบ, ภาพรวม, รายการ, แผน, ตั้งค่า และใบงานไรเดอร์ |
| คอมโพเนนต์ใช้ซ้ำ | `components/` | ไอคอน, แผนที่, หัวข้อหน้า, สถานะคำขอ และสถานะจัดส่ง |
| API | `services/api.ts` | HTTP, JWT, login, ข้อความ error และเชื่อม backend |
| แบบข้อมูล | `models/models.ts` | TypeScript interfaces และค่ากลางของระบบ |
| controls / helpers | `shared/` | ช่องกรอก, date picker, dialog, notification, task state และ dev tools |
| CSS | `styles.css`, `material.scss` | ธีม, layout, responsive และ controls ของ Angular Material |

`RecordsPage` ใช้กับเมนูลูกค้า รายการสั่ง และไรเดอร์ เพราะใช้ตารางและ CRUD รูปแบบเดียวกัน โดยเลือก field/payload ตาม route; ส่วนที่มี workflow เฉพาะมี component/page แยกต่างหาก

## ลำดับการทำงานแบบสั้น

1. ผู้ใช้กดปุ่มใน `.html`
2. เรียกเมธอดใน `.ts` ของหน้านั้น
3. `Task.run()` เปิดสถานะกำลังทำงานและจับข้อผิดพลาด
4. `Api.request()` ส่ง HTTP พร้อม JWT เฉพาะงานเจ้าของร้าน
5. เก็บผลใน signal แล้ว Angular อัปเดตหน้าจอ

หน้า `records` ใช้ร่วมกัน 3 เมนูเพราะมีโครงสร้างตารางและ CRUD เหมือนกัน แยกเฉพาะช่องกรอกกับรูปแบบ payload ตามชนิดข้อมูล จึงลดโค้ดที่ซ้ำโดยไม่สร้าง framework เพิ่ม

การตรวจ required / min / max ใช้ native HTML validation ส่วนเงื่อนไขธุรกิจและสิทธิ์ยังตรวจที่ backend แผนที่แสดงพิกัดจริง เส้นทางถนนใช้ geometry จาก API และแสดงเส้นประเมื่อไม่มี geometry ไม่มี GPS ไรเดอร์จำลอง

## ทดสอบกับ backend ในเครื่อง

เริ่มฐานข้อมูลและ backend แยกด้วย `npm run start:local -- --detach` จาก root จากนั้น:

```bash
cd frontend
npm run start:local
```

เปิด http://127.0.0.1:4201 ใช้ API บนพอร์ต 3000 และฐานข้อมูล `songsook_local` บนพอร์ต 33307 บัญชีอยู่ใน `.local/ACCESS.md` ใช้กับระบบในเครื่องเท่านั้น

```bash
npm run typecheck
npm run build
npm test
npm run test:live
```

ชุด UI ใช้ API fixtures เพื่อทดสอบหน้าและขนาดจอ ชุด live ใช้ Express + MySQL จริงในเครื่อง สร้างข้อมูลของตัวเอง ทดสอบจนไรเดอร์ส่งสำเร็จ แล้วลบข้อมูลทดสอบ ห้ามชี้ชุด live ไป production

## Deploy เวอร์ชันนี้

ใช้ Root Directory `frontend`, Build Command `npm run build`, Output Directory `dist/frontend/browser` และใช้ API / SPA rewrites จาก `frontend/vercel.json` เหมือนเดิม

Frontend มีเพียงเวอร์ชันเรียบง่ายเดียว พร้อม Dev tools แบบปุ่มลอยสำหรับสร้างข้อมูลทดสอบ

## โลโก้ ไอคอน และหน้าจอมือถือ

โลโก้ที่ผู้ใช้เลือกอยู่ที่ `frontend/public/brand/khaokong-logo.png` ใช้ร่วมกันทั้งหัวเว็บ หน้าล็อกอิน และ favicon เมนูใช้ไอคอน Lucide คู่กับป้ายภาษาไทย บนมือถือเมนูเป็นกริด 3 คอลัมน์เพื่อให้เห็นครบทุกเมนูโดยไม่เลื่อนด้านข้าง ปุ่มกดสูงอย่างน้อย 44 px และช่องกรอกมือถือใช้ตัวอักษร 16 px เพื่อหลีกเลี่ยงการซูมอัตโนมัติบน iPhone รวม safe area สำหรับจอมีรอยบาก

หน้าจอไม่แสดงป้ายเวอร์ชันทดลองหรือเมนูจำลองข้อมูล เครื่องมือทดสอบแยกจากเมนูหลัก โดยเปิดผ่านไอคอน Dev tools แบบลอยมุมขวาล่าง

## Dev tools

ปุ่มประกายมุมขวาล่างเปิดเครื่องมือ **สร้างข้อมูลทดสอบ** ใช้บัญชีเจ้าของร้านและ API/backend เดียวกับแอป

- **ชุดพร้อมลอง**: สร้างลูกค้าและไรเดอร์ แล้วสร้างรายการสั่งอาหารเพื่อนำไปวางแผนจัดส่ง
- **ลูกค้า**: เลือกจำนวนและรัศมีรอบร้าน ใช้ข้อมูลร้านจริงเป็นจุดตั้งต้น
- **รายการสั่งอาหาร**: เลือกจำนวนและวันที่จัดส่ง จำนวนกล่อง/ราคาใช้การตั้งค่าร้าน ถ้าลูกค้าไม่พอ backend สร้างเพิ่มให้
- **ไรเดอร์**: สร้างชื่อ เบอร์โทร ทะเบียนรถ และสถานะพร้อมรับงาน
- Seed เป็นตัวเลือกเพิ่มเติมสำหรับการสุ่มรูปแบบเดิม แสดงจำนวนที่จะสร้างก่อนกดปุ่ม และจำนวนที่สร้างสำเร็จพร้อม seed หลัง API ตอบกลับ

เรียก POST `/simulations/customers`, `/simulations/riders`, `/simulations/orders` โดยส่ง JWT เจ้าของร้านตามเดิม ไม่ล้างข้อมูลเก่า (`clearExisting: false`) ข้อมูลลูกค้าและรายการสั่งที่สร้างผ่าน Dev tools เก็บ simulated=true แต่แสดงในหน้าจอเหมือนรายการทั่วไป ไรเดอร์ใช้โมเดลเดิมซึ่งไม่มี simulated flag

ขณะบันทึกปิดหน้าต่างและกดสร้างซ้ำไม่ได้ หากขั้นตอนหนึ่งล้มเหลวจะหยุดขั้นตอนที่เหลือและแสดงผลส่วนที่สำเร็จ ไม่ retry อัตโนมัติ เมื่อปิดจะรีเฟรชหน้าข้อมูลปัจจุบัน ปุ่มดูรายการส่งเปิดวันที่ที่เพิ่งสร้างไว้

คอมโพเนนต์อยู่ใน `src/app/shared/dev-tools.ts`, `.html`, `.css` ชุดทดสอบ UI อยู่ใน `simple-e2e/dev-tools.spec.ts` และชุดทดสอบ backend/MySQL จริงในเครื่องอยู่ใน `simple-e2e/dev-seeding.live.spec.ts`

## Dropdown ปฏิทิน และกล่องยืนยัน

ใช้ Angular Material/CDK 22.2.3 สำหรับ MatSelect, MatDatepicker และ MatDialog โดยกำหนดสีส้ม #C24716 พื้นขาว/พีช และฟอนต์ Noto Sans Thai ร่วมกันใน `src/app/material.scss`

- ทุก dropdown รวม Dev tools ใช้ MatSelect และเก็บชนิด value เดิม เช่น customerId / riderId เป็น number
- `shared/date-control.ts` เป็น ControlValueAccessor ใช้ปฏิทินภาษาไทย รับการพิมพ์ วว/ดด/ปปปป หรือ ISO และส่งออก yyyy-MM-dd เสมอ จึงไม่เปลี่ยน API payload และไม่แปลงผ่าน UTC จนวันเลื่อน
- `shared/material.ts` รวม DateAdapter / ชื่อปุ่มปฏิทินภาษาไทย ส่วน `shared/overlay-container.ts` ทำให้ popup แสดงเหนือฟอร์ม native dialog ได้และกลับไป body เมื่อปิด dialog
- `shared/confirm.ts` รวมกล่องยืนยันลบข้อมูลและยกเลิกแผน ใช้ปุ่มยกเลิกเป็นจุดโฟกัสเริ่มต้น ไม่เรียก API เปลี่ยนข้อมูลจนกดปุ่มยืนยัน

ชุดทดสอบ `simple-e2e/controls.spec.ts` ตรวจคีย์บอร์ด, dropdown ใน dialog, ปฏิทินมือถือ, ชนิดข้อมูล API และการยืนยัน/ยกเลิก ส่วนชุด live ตรวจงานจริงบนฐานข้อมูลในเครื่องอีกครั้ง

## แผนที่ การตั้งค่า และการแจ้งเตือน

แผนที่ใช้ OpenStreetMap ผ่าน Leaflet พร้อมหมุดที่ลากได้ ปักหมุดตรงกลาง ใช้ตำแหน่งปัจจุบัน และขยายแผนที่ ซ่อนช่องพิกัดในฟอร์มแต่ยังส่ง location/shopLocation ให้ backend ตามเดิม ต้องเปิดสิทธิ์ตำแหน่งใน browser จึงใช้ GPS อุปกรณ์ได้

การตั้งค่าส่งเฉพาะ field ที่แก้ไขได้ ไม่ส่ง updatedAt และแปลงเวลาเป็น HH:mm ส่วนข้อผิดพลาด validation แสดงชื่อช่องภาษาไทย `shared/notice.ts` แสดงการแจ้งเตือน และ `components/ui/request-state.ts` รวม skeleton กับสถานะคำขอ

ข้อมูลอ้างอิงสำหรับค้นหารายการส่งใช้ซ้ำภายในหน้าปัจจุบัน เพื่อลดการขอข้อมูลทั้งรายชื่อลูกค้าและ settings ซ้ำ เมื่อต้องการรับการแก้ไขจากอุปกรณ์อื่นให้เปลี่ยนหน้าแล้วกลับมา หรือ reload

ดูรายละเอียด test cases และขอบเขตที่ [MAP-SETTINGS-REVIEW.md](frontend/review/MAP-SETTINGS-REVIEW.md)
