# การเชื่อมต่อฐานข้อมูล (MySQL Connection)

## 1. ติดตั้ง Driver ของ MySQL
เราจะใช้แพ็กเกจ `mysql2` ซึ่งรองรับการเขียนแบบ Promise (สามารถใช้ `async/await` ได้ สะดวกสุดๆ):
```shell
npm install mysql2
```

## 2. แหล่งฐานข้อมูล (Database Server)
เราเลือกใช้ได้หลายแบบ:
- บริการโฮสต์ฟรีทั่วไป (เช่น aiven.io)
- เครื่องตัวเอง (localhost)

![[tripbooking 1.sql]]


![[Pasted image 20260913090643.png]]

---

## 3. สร้าง Connection Pool
แทนที่จะเปิดปิดการเชื่อมต่อทุกรอบที่เรียกใช้งาน การทำ **Pooling** จะเปิดท่อทางเชื่อมต่อค้างเอาไว้ล่วงหน้า (ในที่นี้เปิดไว้ 10 ท่อ) เมื่อมีคำขอเข้ามาก็นำท่อเก่ามาเวียนใช้ใหม่ ช่วยเพิ่มประสิทธิภาพให้ระบบไวขึ้นอย่างมหาศาล!

สร้างไฟล์ `dbconnect.ts` ไว้ที่โฟลเดอร์หลัก:
`dbconnect.ts`
```ts
import { createPool } from 'mysql2/promise';

export const conn = createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: 3306,
    user: 'tripbooking',
    password: 'tripbooking@csmsu',
    database: 'tripbooking'
});
```

---

## 4. ทดลองเรียกดูข้อมูลผ่าน API
นำเข้า `conn` เพื่อเขียนคำสั่งคิวรีดึงข้อมูลออกมา แล้วส่งกลับออกไปเป็นข้อความ:
`controller/trip.ts`
```ts
import { conn } from "../dbconnect";

// ...

router.get("/", async (req, res) => {
    const [rows] = await conn.query("SELECT * FROM trip");
    res.send(rows);
});
```

![[Pasted image 20250616205045.png]]
  