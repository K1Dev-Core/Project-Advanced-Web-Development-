# การเพิ่มข้อมูลลงในระบบ (Insert Data)

ส่งข้อมูลใหม่ที่จะสร้างผ่าน Request Body ในรูปแบบ JSON เพื่อบันทึกลงในฐานข้อมูล

## 1. เขียนคำสั่งบันทึกข้อมูล
รับค่าจาก `req.body` เข้ามาแปลงให้เข้ากับ Interface แล้วสั่ง `INSERT` ลงในตารางข้อมูล:

`controller/trip.ts`
```ts
import { conn } from "../dbconnect";
import { TripPostRequest } from "../model/trip"; // แนบ Interface ของข้อมูลฝั่งรับเข้า

// ...

router.post("/", async (req, res) => {
  try {
    let trip: TripPostRequest = req.body;
    console.log(req.body);
    
    let sql =
      "INSERT INTO `trip`(`name`, `country`, `destinationid`, `coverimage`, `detail`, `price`, `duration`) VALUES (?,?,?,?,?,?,?)";
      
    const [result] = await conn.query(sql, [
      trip.name,
      trip.country,
      trip.destinationid,
      trip.coverimage,
      trip.detail,
      trip.price,
      trip.duration,
    ]);
    
    // แปลงผลลัพธ์เพื่อนำมาสกัดหาข้อมูลแถวที่ทำรายการสำเร็จ
    const insertResult = result as any;
    res.status(201).json({
      affected_row: insertResult.affectedRows, // จำนวนแถวที่ได้รับผลกระทบ (สำเร็จ = 1)
      last_idx: insertResult.insertId // รหัสไอดีล่าสุดที่ระบบสร้างขึ้นให้อัตโนมัติ (Auto increment id)
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
```

![[Pasted image 20250617065022.png]]

![[Pasted image 20250617065104.png]]
