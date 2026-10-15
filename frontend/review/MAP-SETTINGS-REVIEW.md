# แผนที่ การตั้งค่า และสถานะการโหลด — 15 ตุลาคม 2026

## สิ่งที่แก้

- แผนที่ Leaflet ใช้ถนน/อาคารจริงจาก OpenStreetMap โดยไม่ต้องใช้ API key; คงเครดิตแหล่งข้อมูลไว้ตาม [นโยบาย tile](https://operations.osmfoundation.org/policies/tiles/). ไม่มีการดาวน์โหลดล่วงหน้าหรือเก็บแผนที่แบบ offline
- แก้สไตล์หมุดที่ขาดใน simple frontend: พื้นที่กด 48×56 px, หมุดสีส้มสำหรับเลือกตำแหน่ง, หมุดร้านและเลขจุดส่งสำหรับดูเส้นทาง
- เลือกตำแหน่งด้วยการแตะ ลากหมุด ปุ่มปักตรงกลาง หรือใช้ตำแหน่งปัจจุบัน; Shift+ลูกศรขยับหมุดที่โฟกัสได้ ไม่ซูมกลับทุกครั้งที่แก้พิกัด
- ซ่อนช่องละติจูด/ลองจิจูดในฟอร์มร้านและลูกค้า แต่ยังเก็บพิกัดตัวเลขจริงใน API payload
- แก้ PATCH /settings ที่เคยส่ง updatedAt กลับไปจน schema แบบ strict ปฏิเสธ และปรับเวลา HH:mm:ss จากฐานข้อมูลเป็น HH:mm ก่อนแก้ไข/บันทึก
- ข้อผิดพลาด validation บอกชื่อช่องเป็นภาษาไทย ส่วนแจ้งเตือนสำเร็จ/ผิดพลาดใช้แบนเนอร์ลอยพื้นโปร่ง ขอบมน มีปุ่มปิดและรองรับ reduced motion; ข้อผิดพลาดไม่หายเอง
- RequestState แสดง skeleton ระหว่างรอในหน้าที่มีคำขอข้อมูล รวมหน้าภาพรวม รายการ ลูกค้า ไรเดอร์ แผน การตั้งค่า เข้าสู่ระบบ และใบงาน
- ค้นหารายการส่งครั้งถัดไปใช้ข้อมูลร้านและรายชื่อลูกค้าที่โหลดไว้ในหน้านั้น ลดจาก 3 GET เป็น 1 GET; ล้างข้อมูลอ้างอิงเมื่อเปลี่ยนหมวด หน้าไรเดอร์ไม่โหลด settings ที่ไม่ได้ใช้

## Test cases

| ส่วน | สิ่งที่ตรวจ |
| --- | --- |
| การตั้งค่า | GET มี updatedAt/เวลามีวินาที → PATCH ผ่าน strict SettingsSchemas, ไม่ส่งฟิลด์อ่านอย่างเดียว, ไม่มีช่องพิกัด, แจ้งสำเร็จ |
| พิกัดจริง | หมุดขนาดกด ≥44 px, ลากได้, Shift+ลูกศรเปลี่ยนพิกัด, บันทึกส่งตำแหน่งใหม่ |
| แผนที่ | ปักตรงกลาง, ขยาย/ย่อ, ปฏิเสธสิทธิ์ตำแหน่ง, tile ล้มเหลว, ปุ่มลองใหม่ไม่ถูกข้อความอื่นบัง |
| สถานะ UI | skeleton ระหว่าง pending, หายเมื่อเสร็จ, validation เป็นไทย, ปิดแจ้งเตือนได้ |
| จำนวนคำขอ | ค้นหา orders ซ้ำไม่โหลด customers/settings ซ้ำ; riders ไม่ขอ settings |
| ฟอร์มทั่วไป | required/min/max, boolean payload, numeric IDs, ISO dates, keyboard dropdown, calendar ใน mobile dialog |
| การยืนยัน | ยกเลิกไม่เขียนข้อมูล; ยืนยันลบเรียก DELETE ครั้งเดียว |
| สิทธิ์ | owner route guards, credentials ผิด, Dev tools เคารพสิทธิ์และไม่แสดง token |
| Responsive | หน้าหลักทั้งหมด 320/390/768/1024/1440/1920 px, navigation 2560 px และแนวนอน, ไม่ล้นจอ, ปุ่มบันทึก dialog เข้าถึงได้ |
| Accessibility | scoped axe WCAG A/AA ในหน้าหลักที่ชุดทดสอบระบุ, การคืนโฟกัส, keyboard controls |
| Backend | JWT, planner/capacity/profit/determinism, OSRM geometry/table/fallback, tracking scope |
| Live integration | สร้างลูกค้า/ไรเดอร์/รายการจริง → เส้นทางถนน → ยืนยันแผน → ไรเดอร์ส่งสำเร็จ |
| Live settings | UI บันทึกจริง → อ่านกลับจาก API → reload ยังได้ค่าใหม่ → คืนค่าเดิมใน finally |

## ขอบเขต

ชุด UI ใช้ fixtures เพื่อทดสอบข้อผิดพลาดและหน้าจอได้ซ้ำ ชุด live ใช้ API localhost:3000 และฐานข้อมูล songsook_local ที่แยกบนพอร์ต 33307 พร้อมลบข้อมูลทดสอบ/คืนค่าร้าน ไม่แก้ข้อมูล production ระหว่างการตรวจนี้

ทดสอบอัตโนมัติด้วย Chromium; ไม่อ้างว่าได้ตรวจ Safari/iPhone จริงหรือทุกเงื่อนไขธุรกิจที่เป็นไปได้ ความเร็ว backend ภายนอกและการโหลด tile ขึ้นกับเครือข่าย การลดคำขอข้างต้นยืนยันด้วยการนับ request ไม่ใช่ผลวัด latency ของ production

ภาพประกอบ: `map-settings-mobile.png`, `notification-success.png`, `simple/`

## ผลตรวจสุดท้าย

- Simple UI: **22/22 ผ่าน** (`npm test`)
- Backend unit: **18/18 ผ่าน** (`npm test --prefix backend`)
- Local integration: **2/2 ผ่าน** (`npm run test:live`) รวมบันทึก/อ่านกลับการตั้งค่าจริง
- Original frontend API regression: **3/3 ผ่าน** (owner payload/auth, rider public start/deliver/undo, errors/session expiry)
- TypeScript: simple และ original ผ่าน; simple production build ผ่าน; `git diff --check` ผ่าน
- Initial bundle **509.44 kB raw / 109.05 kB estimated transfer**: มี advisory เกิน warning budget 500 kB อยู่ 9.44 kB และคำเตือน Leaflet CommonJS เดิม ไม่ใช่ build error

ไม่มี test case ที่ยังล้มเหลวในชุดตรวจสุดท้ายข้างต้น
