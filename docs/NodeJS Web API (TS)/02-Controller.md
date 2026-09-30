# API Controller (ตัวจัดการ Route)

ทำไมต้องใช้ Controller? 
เพราะถ้าเราเขียนทุกอย่างลงใน `app.ts` ไฟล์จะยาวและรกมาก การแยกส่วนทำงานเป็น Controller แต่ละหน้า (เช่น หน้าแรก หน้าข้อมูลเที่ยวบิน) จะทำให้จัดการและอัปเดตโค้ดในอนาคตได้ง่ายขึ้นเยอะ!

![[Pasted image 20250613065049.png]]

## 1. สร้าง Controller หลัก
สร้างไฟล์ `controller/index.ts` เพื่อจัดการ Request หน้าแรกสุด:

`controller/index.ts`
```ts
import express from "express";

export const router = express.Router();

router.get('/', (req, res) => {
    res.send('Get in index.ts');
});
```

## 2. เชื่อมโยง app.ts กับ Controller หลัก
ดึงตัว Router มาใช้งานใน `app.ts` เพื่อส่งต่อ Request หน้าหลักไปให้ตัวย่อยจัดการ:

![[Pasted image 20250613065211.png]]

`app.ts`
```ts
import express from "express";
import { router as index } from "./controller/index";

export const app = express();

app.use("/", index);
// ปิดโค้ดเก่าทิ้งไป:
// app.use("/", (req, res) => {
//   res.send("Hello World!!!");
// });
```

![[Pasted image 20250613065250.png]]

## 3. สร้าง Controller อื่นเพิ่มเติม
ถ้ามีฟีเจอร์อื่นๆ เช่น ข้อมูลท่องเที่ยว (Trip) ให้สร้างแยกไฟล์ออกมา:

![[Pasted image 20250613065357.png]]

`controller/trip.ts`
```ts
import express from "express";

export const router = express.Router();

router.get("/", (req, res) => {
  res.send("Get in trip.ts");
});
```

## 4. เชื่อมโยง app.ts กับ Controller อันใหม่
นำเข้า Router ของ `trip` แล้วผูกเข้ากับ Path `/trip` ในไฟล์ `app.ts`:

`app.ts`
```ts
import express from "express";
import { router as index } from "./controller/index";
import { router as trip } from "./controller/trip";

export const app = express();

app.use("/", index);
app.use("/trip", trip);
```

![[Pasted image 20250613065626.png]]


> [!TIP]
> **ทางเลือกที่นิยมในปัจจุบัน:** นอกเหนือจาก nodemon แล้ว ตอนนี้หลายโปรเจกต์หันมาใช้ `tsx` ซึ่งสามารถรัน TypeScript ได้โดยไม่ต้องตั้งค่าคอมไพล์อะไรเลย และมีโหมดเฝ้าดู (watch) มาให้ในตัว:
> ```shell
> npx tsx watch server.ts
> ```
