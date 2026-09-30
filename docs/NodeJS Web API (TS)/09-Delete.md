# การลบข้อมูล (Delete Data)

ส่งคำขอผ่าน HTTP DELETE Method เพื่อนำไอดีไปสั่งลบข้อมูลออกจากฐานข้อมูล

## 1. เขียนคำสั่งลบข้อมูล
ดึงไอดีออกจาก Path parameters แล้วใช้คำสั่ง SQL `DELETE` เพื่อลบข้อมูลให้เรียบร้อย:

`controller/trip.ts`
```ts
router.delete("/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const [result] = await conn.query("DELETE FROM trip WHERE idx = ?", [id]);
    const deleteResult = result as any;
    
    // ตรวจเช็กสักนิดว่ามีแถวถูกลบจริงไหม หากไม่มีแสดงว่าไม่พบไอดีในฐานข้อมูล ส่งกลับรหัส 404
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }
    
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
```

![[Pasted image 20250617065432.png]]
