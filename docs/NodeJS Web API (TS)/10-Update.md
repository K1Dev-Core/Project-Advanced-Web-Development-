# การอัปเดตข้อมูล (Update Data)

การอัปเดตข้อมูลมักจะทำผ่าน HTTP PUT (หรือ PATCH) โดยแบ่งเป็น 2 แบบหลักๆ ดังนี้:

---

## แบบที่ 1: อัปเดตข้อมูลทับไปทั้งหมดทุกฟิลด์ (PUT)
แบบนี้จะทำการส่งค่าข้อมูลฟิลด์ใหม่ทั้งหมดไปเขียนทับข้อมูลฟิลด์เดิม:

`controller/trip.ts`
```ts
router.put("/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let trip: Trip = req.body;
    let sql =
      "UPDATE `trip` SET `name`=?, `country`=?, `destinationid`=?, `coverimage`=?, `detail`=?, `price`=?, `duration`=? WHERE `idx`=?";
      
    const [result] = await conn.query(sql, [
      trip.name,
      trip.country,
      trip.destinationid,
      trip.coverimage,
      trip.detail,
      trip.price,
      trip.duration,
      id,
    ]);
    const updateResult = result as any;
    
    // หากไม่พบไอดีที่จะอัปเดต ส่งรหัส 404 กลับทันที
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.status(200).json({ affected_row: updateResult.affectedRows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
```

![[Pasted image 20250617065815.png]]

![[Pasted image 20250617065930.png]]

![[Pasted image 20250617065953.png]]

---

## แบบที่ 2: อัปเดตบางส่วนโดยผสมเข้ากับข้อมูลเดิม (Dynamic Merge)
หากส่งข้อมูลใหม่มาแค่บางส่วน (เช่น เปลี่ยนเฉพาะราคา แต่ชื่อทริปยังคงเดิม) เราจะดึงข้อมูลเก่าจากฐานข้อมูลมาพักไว้ก่อน แล้วนำข้อมูลใหม่มารวมเข้าด้วยกัน (Merge) โดยใช้ตัวดำเนินการ Spread (`...`) จากนั้นค่อยนำคำตอบที่รวมแล้วส่งไปอัปเดต:

`controller/trip.ts`
```ts
import { conn } from "../dbconnect";
import mysql from "mysql2"; // ใช้สำหรับการฟอร์แมตคำสั่ง SQL แบบปลอดภัย
import { Trip } from "../model/trip";

// ...

router.put("/:id", async (req, res) => {
  let id = +req.params.id; // แปลง id จากข้อความตัวอักษรให้เป็นตัวเลขด้วยสัญลักษณ์ + ข้างหน้า
  let trip: Trip = req.body;

  // 1. ค้นหาข้อมูลเก่าจากไอดีที่ต้องการอัปเดตก่อน
  let sql = mysql.format("SELECT * FROM trip WHERE idx = ?", [id]);
  let [response] = await conn.query(sql);
  let result = response as Trip[];

  if (result.length > 0) {
    let tripOriginal = result[0];

    // 2. นำข้อมูลเก่ามาทับด้วยข้อมูลใหม่ที่ส่งมา (ค่าไหนไม่ส่งมาก็จะใช้ค่าเก่าของเดิม)
    let updateTrip = { ...tripOriginal, ...trip };

    // 3. เขียนข้อมูลที่รวมสำเร็จแล้วกลับลงไปในฐานข้อมูล
    sql =
      "UPDATE `trip` SET `name`=?, `country`=?, `destinationid`=?, `coverimage`=?, `detail`=?, `price`=?, `duration`=? WHERE `idx`=?";
    sql = mysql.format(sql, [
      updateTrip.name,
      updateTrip.country,
      updateTrip.destinationid,
      updateTrip.coverimage,
      updateTrip.detail,
      updateTrip.price,
      updateTrip.duration,
      id,
    ]);
    
    const [records] = await conn.query(sql);
    const updateResult = records as any;
    res.status(200).json({ affected_row: updateResult.affectedRows });
  } else {
    res.status(404).json({ message: "Trip not found" });
  }
});
```

![[Pasted image 20250617071158.png]]
![[Pasted image 20250617071307.png]]
