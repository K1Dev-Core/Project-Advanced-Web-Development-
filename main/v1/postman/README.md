# ทดสอบ API ด้วย Postman

นำเข้าไฟล์ทั้งสองใน Postman ผ่าน **Import → Files**:

1. `Khaokong-API.postman_collection.json` — collection รวม 57 requests ครบ route และ HTTP method ของ API
2. `Khaokong-Local.postman_environment.json` — environment สำหรับ backend ในเครื่อง

ก่อนทดสอบ ให้เปิด MySQL และ backend แล้วเลือก Environment `Khaokong API — Local` จากนั้นตรวจ `baseUrl` (`http://127.0.0.1:3000/api`) และกรอก `ownerPassword` ให้ตรงกับ `OWNER_PASSWORD` ใน `backend/.env` ถ้า backend อยู่บนเครื่องอื่นหรือ Vercel ให้เปลี่ยน `baseUrl` และ `serverRoot` ให้ตรงกับ server นั้น

เริ่มจากโฟลเดอร์ **System** เช็ก Health แล้วเรียก **Authentication → Login**; test script จะบันทึก JWT ลง `accessToken` ให้อัตโนมัติ คำขอ owner จะใช้ token นี้ ส่วน Jobs, Tracking และ System เป็น public ตาม API

คำขอสร้างลูกค้า ไรเดอร์ ออเดอร์ และแผนจะบันทึก id/code ลง environment ให้ ใช้ทดสอบต่อได้ตามลำดับนี้:

```text
Login → Create customer → Create rider → Create order
      → Preview plan → Create draft plan → Assign rider → Confirm plan
      → Get job → Start route → Deliver stop → Track order
```

ไม่จำเป็นต้องกด **Run collection** ทั้งชุด เพราะบางคำขอแก้ไข/ลบข้อมูล หรือเปลี่ยนสถานะออเดอร์และแผน ให้ส่งทีละรายการและใช้ฐานข้อมูลทดสอบเท่านั้น โดยเฉพาะ requests ที่มีคำว่า **Delete**, **Reset**, **Confirm**, และการแก้ **Settings**

ตัวแปร `customerId`, `riderId`, `orderId`, `planId`, `routeId`, `jobCode`, `stopId`, `trackingCode` ถูกกรอกหลังเรียก request ที่เกี่ยวข้อง หากไม่มีค่า ให้สร้างข้อมูลจาก collection ก่อน
