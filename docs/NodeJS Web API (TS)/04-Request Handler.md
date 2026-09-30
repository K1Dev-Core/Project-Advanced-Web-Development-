# การรับข้อมูลใน Request (Request Handler)

เมื่อ Client ส่งคำขอ (Request) มาหาเซิร์ฟเวอร์ของเรา เราสามารถแนบข้อมูลมาด้วยได้ 3 วิธีหลักๆ ดังนี้:

![[Pasted image 20250613070347.png]]

![[Pasted image 20250613070227.png]]

---

## 1. Path Parameters (ค่าที่ระบุตรงๆ บน URL Path)
ใช้เมื่อต้องการระบุเจาะจงทรัพยากรตัวใดตัวหนึ่ง (เช่น ดึงข้อมูลทริปไอดี 5)
- รับข้อมูลผ่าน: `req.params.ชื่อตัวแปร`
- ชื่อตัวแปรต้องตรงกับชื่อที่เราตั้งใน Route (เช่น `/:id`)

`controller/trip.ts`
```ts
router.get("/:id", (req, res) => {
  res.send("Get in trip.ts id: " + req.params.id);
});
```

![[Pasted image 20250613070632.png]]
![[Pasted image 20250613070529.png]]

---

## 2. Query Parameters (ระบุค่าผ่านเครื่องหมาย `?` ท้าย URL)
นิยมใช้สำหรับการค้นหา ตัวกรอง หรือการแบ่งหน้า (Pagination)
- รับข้อมูลผ่าน: `req.query.ชื่อตัวแปร`

`controller/trip.ts`
```ts
router.get("/", (req, res) => {
  if (req.query.id) {
    res.send("Get in trip.ts Query id: " + req.query.id);
  } else {
    res.send("Get in trip.ts");
  }
});
```

![[Pasted image 20250613070858.png]]

![[Pasted image 20250613070820.png]]

---

## 3. Request Body (ส่งข้อมูลมาในเนื้อหาหลัก)
นิยมใช้กับการสร้างข้อมูลใหม่ (POST) หรือการแก้ไขข้อมูล (PUT) โดยจะส่งข้อมูลในรูปแบบของข้อความหรือ JSON

`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body; 
  res.send("Get in trip.ts body: " + body);
});
```

![[Pasted image 20250613071439.png]]

### ปัญหาคือทำไมรันแล้วได้ `undefined`?
นั่นเป็นเพราะ Express ปกติจะไม่ได้อ่านและแปลงข้อมูลใน Body ให้อัตโนมัติ เราจำเป็นต้องผ่านสิ่งที่เรียกว่า "Parser" เสียก่อน

> [!IMPORTANT]
> **อัปเดตสำหรับ Express ยุคปัจจุบัน:** 
> สมัยก่อนเราอาจจำเป็นต้องใช้โมดูลเสริมภายนอกอย่าง `body-parser` แต่ปัจจุบัน Express ได้พัฒนาจนมีฟังก์ชันช่วยแปลงข้อมูลใน Body มาให้เลยในตัว (Built-in Middleware) จึง**ไม่ต้องลงโมดูลเพิ่ม**แล้ว!

แก้ปัญหาได้โดยการเพิ่มคำสั่งพวกนี้เข้าไปใน `app.ts` (โดยต้องวางไว้**ก่อน**ระบุคำสั่งเรียกใช้งานพวก Controller เสมอ):

`app.ts`
```ts
import express from "express";
import { router as index } from "./api/index";
import { router as trip } from "./api/trip";

export const app = express();

// แปลงข้อมูลแบบข้อความทั่วไป (Text Body)
app.use(express.text());

// แปลงข้อมูลรูปแบบ JSON (JSON Body)
app.use(express.json());

app.use("/", index);
app.use("/trip", trip);
```



![[Pasted image 20250613071819.png]]

### ลองทดสอบแปลง JSON เป็นข้อความตอบกลับ:
`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body; 
  res.send("Get in trip.ts body: " + JSON.stringify(body));
});
```

![[Pasted image 20250613071954.png]]

![[Pasted image 20250613072112.png]]
