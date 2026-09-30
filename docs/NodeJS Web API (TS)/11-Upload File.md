# การอัปโหลดไฟล์ (File Upload)

เราสามารถใช้แพ็กเกจ `multer` ในการจัดการไฟล์ที่ส่งมา และใช้ `uuid` ช่วยตั้งชื่อไฟล์ใหม่ให้ไม่มีโอกาสซ้ำกัน

## 1. ติดตั้งแพ็กเกจที่จำเป็น
```shell
npm install multer @types/multer
npm install uuid @types/uuid
```

อย่าลืมสร้างโฟลเดอร์สำหรับเก็บไฟล์อัปโหลดไว้ด้วย (เช่น โฟลเดอร์ `uploads`):
![[Pasted image 20250617071459.png]]

---

## 2. เขียนส่วนตั้งค่าอัปโหลดและอัปโหลดไฟล์

`controller/upload.ts`
```ts
import express from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs";

export const router = express.Router();

class FileMiddleware {
  constructor() {
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      // สร้างโฟลเดอร์สำหรับอัปโหลดอัตโนมัติหากยังไม่มีอยู่
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  public readonly diskLoader = multer({
    storage: multer.diskStorage({
      // กำหนดปลายทางเก็บไฟล์
      destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
      },
      // กำหนดชื่อไฟล์ใหม่ให้ไม่ซ้ำโดยใช้ UUID ร่วมกับนามสกุลไฟล์เดิม
      filename: (_req, file, cb) => {
        const uniqueSuffix = uuidv4();      
        const ext = file.originalname.split(".").pop();
        cb(null, `${uniqueSuffix}.${ext}`);
      },
    }),
    limits: {
      fileSize: 67108864, // จำกัดขนาดไฟล์ไม่เกิน 64 MByte
    },
  });
}

const fileUpload = new FileMiddleware();

// เส้นอัปโหลดไฟล์เดี่ยว
router.post("/", fileUpload.diskLoader.single("file"), (req, res) => {
  // ดึงชื่อไฟล์จาก req.file.filename (ระวังอย่าเก็บชื่อไฟล์ไว้ในตัวแปรคลาส เพราะอาจจะเกิด Race Condition สลับชื่อไฟล์หากมีการอัปโหลดพร้อมกันหลายคน!)
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ filename: req.file.filename });
});
```

เชื่อมโยงใน `app.ts` เพื่อเปิดโฟลเดอร์ให้เข้าถึงได้โดยตรงผ่านเว็บ (Static Folder):
`app.ts`
```ts
app.use("/upload", upload);
app.use("/uploads", express.static("uploads"));
```

![[Pasted image 20250617072818.png]]

![[Pasted image 20250617072906.png]]

---

## 3. เส้นสำหรับดาวน์โหลดหรือส่งไฟล์กลับ

`controller/upload.ts`
```ts
// เส้นทางดึงไฟล์หรือดาวน์โหลดไฟล์กลับ
router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const download = req.query.download || undefined;
  
  if (download === "true") {
    // บังคับให้ดาวน์โหลดลงเครื่อง
    res.download(path.join(__dirname, "../uploads", filename));
  } else {
    // แสดงผลไฟล์บนเบราว์เซอร์ปกติ (เช่น แสดงรูปภาพ)
    res.sendFile(path.join(__dirname, "../uploads", filename));
  }
});
```

![[Pasted image 20250617074426.png]]

![[Pasted image 20250617074458.png]]

![[Pasted image 20250617074521.png]]



# การสร้าง Web API ที่ดี

https://www.youtube.com/watch?v=-40xErgJIBg

# สรุปวิดีโอ: 8 กฎการออกแบบ API ของ Senior Backend Developer

**แหล่งที่มา:** [YouTube - 8 API Laws of Senior Backend Developer](https://www.youtube.com/watch?v=-40xErgJIBg)
**ผู้บรรยาย:** Cloud X Berry
**ความยาว:** ประมาณ 9 นาที

## แนวคิดหลัก

วิดีโอนี้อธิบายหลักการออกแบบ REST API ในรูปแบบที่เข้าใจง่าย เหมาะสำหรับผู้เริ่มต้น โดยตั้งต้นจากคำถามว่า ทำไมเมื่อเราเปิด API ที่ไม่เคยใช้มาก่อน โดยไม่ต้องอ่านเอกสารเลย เราก็ยังเดาได้ทันทีว่า `GET /v2/orders/order_id` ใช้ดึงข้อมูลออเดอร์หนึ่งรายการ, `DELETE` บน URL เดียวกันใช้ลบออเดอร์นั้น และรหัส `404` หมายถึงไม่พบข้อมูล

คำตอบคือ นี่ไม่ใช่เรื่องบังเอิญ แต่เป็นผลจาก **8 หลักการออกแบบ** ที่ทำให้ API หนึ่งเดา-ใช้งานได้ง่าย ในขณะที่อีก API หนึ่งต้องคอยเปิดเอกสารดูตลอดเวลา

## กลุ่มเป้าหมาย

- นักพัฒนาที่เคยสร้าง endpoint มาบ้างแล้ว และอยากมีชุดกฎที่อธิบายเหตุผลได้ตอน code review
- Backend engineer ที่ต้องรับช่วงดูแล API ที่ทีมต้องคอยเปิดดูเอกสารตลอด
- ผู้ที่กำลังเตรียมสัมภาษณ์งานสายที่ต้องพูดเรื่อง API design หรือ system design

# สรุปวิดีโอ: 8 กฎการออกแบบ API ของ Senior Backend Developer

**แหล่งที่มา:** [YouTube - 8 API Laws of Senior Backend Developer](https://www.youtube.com/watch?v=-40xErgJIBg)
**ผู้บรรยาย:** Cloud X Berry
**ความยาว:** ประมาณ 9 นาที 

## แนวคิดหลัก

วิดีโอนี้อธิบายหลักการออกแบบ REST API ในรูปแบบที่เข้าใจง่าย เหมาะสำหรับผู้เริ่มต้น โดยตั้งต้นจากคำถามว่า ทำไมเมื่อเราเปิด API ที่ไม่เคยใช้มาก่อน โดยไม่ต้องอ่านเอกสารเลย เราก็ยังเดาได้ทันทีว่า `GET /v2/orders/order_id` ใช้ดึงข้อมูลออเดอร์หนึ่งรายการ, `DELETE` บน URL เดียวกันใช้ลบออเดอร์นั้น และรหัส `404` หมายถึงไม่พบข้อมูล

คำตอบคือ นี่ไม่ใช่เรื่องบังเอิญ แต่เป็นผลจาก **8 หลักการออกแบบ** ที่ทำให้ API หนึ่งเดา-ใช้งานได้ง่าย ในขณะที่อีก API หนึ่งต้องคอยเปิดเอกสารดูตลอดเวลา

## กลุ่มเป้าหมาย

- นักพัฒนาที่เคยสร้าง endpoint มาบ้างแล้ว และอยากมีชุดกฎที่อธิบายเหตุผลได้ตอน code review
- Backend engineer ที่ต้องรับช่วงดูแล API ที่ทีมต้องคอยเปิดดูเอกสารตลอด
- ผู้ที่กำลังเตรียมสัมภาษณ์งานสายที่ต้องพูดเรื่อง API design หรือ system design

## 8 กฎการออกแบบ API

### 1. ออกแบบตาม "ทรัพยากร" (Resource) ไม่ใช่ "การกระทำ" (Action)
URL ควรแทนสิ่งที่เป็นทรัพยากร เช่น `/orders` แทนที่จะเป็นชื่อฟังก์ชันการกระทำ เช่น `/createOrder` หรือ `/getOrderById`

```
❌ ไม่ควร
GET  /getAllOrders
POST /createOrder
POST /deleteOrder?id=123

✅ ควรเป็น
GET    /orders          → ดึงรายการออเดอร์ทั้งหมด
POST   /orders          → สร้างออเดอร์ใหม่
DELETE /orders/123      → ลบออเดอร์ id 123
```

### 2. ทำให้ URL คาดเดาได้
โครงสร้าง URL ควรมีรูปแบบที่สม่ำเสมอ เพื่อให้ผู้ใช้เดาพาธของ endpoint อื่น ๆ ได้จากรูปแบบเดิม โดยไม่ต้องเปิดเอกสารทุกครั้ง

```
/v2/orders            → รายการออเดอร์ทั้งหมด
/v2/orders/{id}        → ออเดอร์เดียว
/v2/orders/{id}/items  → รายการสินค้าภายในออเดอร์นั้น

เมื่อเห็นรูปแบบนี้แล้ว ผู้ใช้จะเดาต่อได้เองว่า
/v2/customers/{id}/orders  ก็ควรมีอยู่จริงเช่นกัน
```

### 3. ใช้ HTTP Method ให้ตรงตามหน้าที่ของมัน
`GET`, `POST`, `PUT`/`PATCH`, `DELETE` แต่ละตัวมีความหมายเฉพาะตัว การใช้ให้ถูกต้องตามความหมายมาตรฐานช่วยให้ API เข้าใจง่ายและคาดเดาพฤติกรรมได้

```
GET    /orders/123   → อ่านข้อมูล (ไม่มีผลข้างเคียง, เรียกซ้ำได้)
POST   /orders       → สร้างข้อมูลใหม่
PUT    /orders/123   → แทนที่ข้อมูลทั้งชุด
PATCH  /orders/123   → แก้ไขบางฟิลด์
DELETE /orders/123   → ลบข้อมูล
```

### 4. ทำให้ Status Code สื่อความหมายจริง
เลือกใช้รหัสสถานะ HTTP ให้สะท้อนผลลัพธ์จริง (เช่น 200, 201, 404, 400, 500 ฯลฯ) แทนการตอบ 200 ทุกกรณีแล้วซ่อน error ไว้ใน body

```
❌ ไม่ควร
HTTP 200 OK
{ "success": false, "error": "Order not found" }

✅ ควรเป็น
HTTP 404 Not Found
{ "error": "Order not found" }

201 Created   → สร้างข้อมูลสำเร็จ
400 Bad Request → ข้อมูลที่ส่งมาไม่ถูกต้อง
401/403        → ไม่ได้รับอนุญาต
500            → เซิร์ฟเวอร์ผิดพลาด
```

### 5. ทำให้ Error Response มีรูปแบบสม่ำเสมอ
ทุก error ที่ API ส่งกลับควรมีโครงสร้างเดียวกัน เพื่อให้ฝั่ง client จัดการ error ได้ง่ายโดยไม่ต้องเขียนโค้ดแยกเป็นกรณี ๆ

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with id 123 does not exist",
    "field": null
  }
}
```
ไม่ว่าจะเป็น error จาก endpoint ไหน โครงสร้าง `error.code` / `error.message` ควรเหมือนกันหมด

### 6. ไม่ใช่ทุกอย่างควรอยู่ใน Path
ข้อมูลบางอย่าง เช่น ตัวกรอง (filter), การเรียงลำดับ (sort), หรือพารามิเตอร์เสริม ควรอยู่ใน query string แทนที่จะยัดทุกอย่างลงใน URL path

```
❌ ไม่ควร
/orders/status/pending/sort/date/desc

✅ ควรเป็น
/orders?status=pending&sort=date&order=desc
```

### 7. จัดการการเปลี่ยนแปลง API อย่างระมัดระวัง
เมื่อ API ต้องมีการเปลี่ยนแปลง (breaking change) ควรมีแนวทางจัดการ เช่น การทำ versioning เพื่อไม่ให้กระทบผู้ใช้งานเดิม

```
/v1/orders   → เวอร์ชันเดิม ยังใช้งานได้ตามปกติ
/v2/orders   → เวอร์ชันใหม่ที่มีการเปลี่ยนโครงสร้าง response

หรือใช้ header แทน:
Accept: application/vnd.myapi.v2+json
```

### 8. รักษารูปแบบข้อมูล (Format) ให้สม่ำเสมอ
รูปแบบของ request/response (เช่น การตั้งชื่อ field, รูปแบบวันที่, โครงสร้าง JSON) ควรสอดคล้องกันทั้งระบบ ไม่ใช่แต่ละ endpoint ใช้คนละแบบ

```
❌ ไม่ควร
orders → { "orderId": 1, "created_at": "..." }
users  → { "user_id": 1, "createdAt": "..." }

✅ ควรเป็น (เลือกมาตรฐานเดียวแล้วใช้ทั้งระบบ)
orders → { "id": 1, "createdAt": "2026-09-13T10:00:00Z" }
users  → { "id": 1, "createdAt": "2026-09-13T10:00:00Z" }
```

## สรุปท้ายวิดีโอ (Recap)

ทั้ง 8 ข้อนี้คือสิ่งที่ทำให้ API หนึ่ง "ใช้งานง่าย เดาทางได้" ในขณะที่อีก API หนึ่งกลายเป็นสิ่งที่ทีมต้องคอยเปิดเอกสารดูซ้ำ ๆ การยึดหลักการเหล่านี้ตั้งแต่ต้นจะช่วยให้ API มีความสม่ำเสมอ บำรุงรักษาง่าย และเป็นมิตรกับนักพัฒนาที่มาใช้งานต่อ

---
*หมายเหตุ: สรุปนี้จัดทำจากคำอธิบายและสารบัญของวิดีโอต้นฉบับ สำหรับรายละเอียดเชิงลึกและตัวอย่างโค้ดแนะนำให้ดูวิดีโอฉบับเต็ม*

