# การตอบกลับผลลัพธ์ (Response Handler)

หลังจากได้รับและประมวลผลคำขอเสร็จแล้ว เซิร์ฟเวอร์จำเป็นต้องส่งข้อมูลหรือสถานะกลับไปให้ผู้เรียก (Response)

## 1. HTTP Status Code (สถานะการทำรายการ)
เราสามารถกำหนดเลขรหัสสถานะเพื่อให้ผู้เรียกเข้าใจได้ทันทีว่าผลลัพธ์เป็นอย่างไร เช่น:
- **200 (OK):** ดึงข้อมูลหรือทำรายการสำเร็จ
- **201 (Created):** บันทึกหรือสร้างข้อมูลใหม่สำเร็จ
- **400 (Bad Request):** ส่งคำขอผิดรูปแบบ ป้อนข้อมูลไม่ครบ
- **404 (Not Found):** ไม่พบหน้าที่ระบุ หรือไม่พบข้อมูลในระบบ
- **500 (Internal Server Error):** เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์ (เช่น ลิงก์ฐานข้อมูลหลุด)

กำหนดผ่านคำสั่ง `res.status(เลขรหัส)`:
`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body;
  res.status(201);
  res.send("Get in trip.ts body: " + JSON.stringify(body));
});
```

![[Pasted image 20250616155522.png]]

---

## 2. ส่งคำตอบในรูปแบบ JSON
แทนที่จะแปลงวัตถุเป็นข้อความธรรมดาๆ ส่งกลับเป็นข้อมูล JSON จะเป็นมิตรกับการนำไปใช้งานต่อมากกว่า

ลองแบบดั้งเดิม (ต้องแปลงข้อมูลเป็นตัวพิมพ์):
`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body;
  res.status(201);
  res.send(JSON.stringify(body));
});
```

![[Pasted image 20250616155747.png]]

![[Pasted image 20250616155816.png]]

เปลี่ยนมาใช้ `res.json()` ดีกว่าเยอะ เพราะระบบจะระบุประเภทข้อมูลว่าส่งเป็น JSON ให้อัตโนมัติ (ไม่ต้องห่วงเรื่องการแปลงข้อมูลเอง):
`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body;
  res.status(201);
  res.json(body);
});
```

![[Pasted image 20250616160038.png]]

![[Pasted image 20250616155938.png]]

---

## 3. วิธีเขียนสไตล์โปร: Method Chaining (ต่อคำสั่ง)
เขียนต่อคำสั่งรวมกันบรรทัดเดียวได้เลย สั้น กระชับ และเป็นที่นิยมที่สุด:
`controller/trip.ts`
```ts
router.post("/", (req, res) => {
  let body = req.body;
  res.status(201).json(body);
});
```
