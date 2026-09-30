# การดึงข้อมูลแบบมีเงื่อนไข (SQL Query)

## 1. ดึงข้อมูลด้วย Id เจาะจง
ส่งค่า `idx` ผ่าน Path parameter แล้วนำมาเป็นเงื่อนไขในการค้นหา:

`controller/trip.ts`
```ts
router.get("/:idx", async (req, res) => {
  // ใช้เครื่องหมาย ? (Placeholder) เสมอ เพื่อส่งตัวแปรไปแทนค่าในคำสั่ง SQL ป้องกันภัยความปลอดภัย SQL Injection
  const [rows] = await conn.query("SELECT * FROM trip WHERE idx = ?", [
    req.params.idx,
  ]);
  res.json(rows);
});
```

![[Pasted image 20250616205629.png]]

---

## 2. ค้นหาข้อมูลแบบยืดหยุ่นด้วย Query Parameters
ถ้าเราต้องการทำระบบค้นหาแบบออปชันเสริม เช่น ส่ง id หรือส่ง name ค้นหาก็ได้ ให้แยกค่าออกมาจาก `req.query`:

`controller/trip.ts`
```ts
router.get("/search/fields", async (req, res) => {
  try {
    const [rows] = await conn.query(
      "SELECT * FROM trip WHERE (idx IS NULL OR idx = ?) OR (name IS NULL OR name LIKE ?)",
      [req.query.id, "%" + req.query.name + "%"]
    );
    res.json(rows);
  } catch (error) {
    // ดักจับ Error กรณีทำงานผิดพลาด เพื่อไม่ให้ระบบหลังบ้านพังล่มไปดื้อๆ
    res.status(500).json({ error: "Internal server error" });
  }
});
```

![[Pasted image 20250616205909.png]]
