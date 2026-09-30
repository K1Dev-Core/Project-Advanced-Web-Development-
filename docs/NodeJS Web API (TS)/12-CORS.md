# ความปลอดภัยเว็บด้วย CORS (Cross-Origin Resource Sharing)

## 1. CORS คืออะไร?
เป็นระบบความปลอดภัยบนเว็บเบราว์เซอร์ ซึ่งจะป้องกันไม่ให้เว็บเพจที่รันจากโดเมนหนึ่ง (เช่น localhost:5500) ไปยิงเรียกใช้งาน API จากอีกโดเมนหนึ่ง (เช่น localhost:3000) นอกเสียจากว่าเซิร์ฟเวอร์จะระบุอนุญาตไว้!

![[Pasted image 20250617074804.png]]

---

## 2. การสร้างหน้าทดสอบเรียกใช้งานข้ามโดเมน
สร้างเว็บเพจเพื่อลองกดเรียกใช้งาน API ผ่านเครื่องพอร์ตอื่น:

`test/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip API Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        #response { margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>Trip API Test</h1>
    <div class="form-group">
        <h2>Get All Trips</h2>
        <button id="getAllTrips">Get All Trips</button>
    </div>
    <div id="response"></div>
    <script src="test.js"></script>
</body>
</html> 
```

`test/test.js`
```js
const API_BASE_URL = 'http://localhost:3000/trip';
const responseDiv = document.getElementById('response');

function displayResponse(data) {
    responseDiv.textContent = JSON.stringify(data, null, 2);
}

document.getElementById('getAllTrips').addEventListener('click', async () => {
    try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        displayResponse(data);
    } catch (error) {
        displayResponse({ error: error.message });
    }
});
```

*เมื่อทดสอบยิง จะเจอบล็อกโดยเว็บเบราว์เซอร์ทันทีด้วย Error สีแดงยาวๆ ใน Console:*
![[Pasted image 20250617084542.png]]

![[Pasted image 20250617084612.png]]

![[Pasted image 20250617084732.png]]

---

## 3. วิธีการปลดบล็อก CORS ในโปรเจกต์
เราสามารถติดตั้งแพ็กเกจ `cors` เพื่อช่วยกรองและระบุรายชื่อโดเมนที่สามารถเข้าถึงระบบเราได้:

```shell
npm install cors
npm install -D @types/cors
```

### แนวทางที่ 1: อนุญาตเฉพาะบางเว็บไซต์ (แนะนำสำหรับความปลอดภัย)
`app.ts`
```ts
import cors from "cors";

// ... 

// วางไว้เป็นคำสั่งแรกๆ ในการโหลดของ Express
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // ระบุโดเมนเว็บหน้าบ้านตรงนี้
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

![[Pasted image 20250617085112.png]]

หากโดเมนหน้าบ้านเปลี่ยนพอร์ต (เช่น เป็น 5501) ก็จะติดบล็อกทันทีเหมือนเดิม:
![[Pasted image 20250617085252.png]]

### แนวทางที่ 2: อนุญาตจากหลายโดเมนหลักผ่าน Whitelist
`app.ts`
```ts
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "https://your-production-frontend.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // เช็กหากว่าไม่มี origin (ยิงผ่าน Postman หรือเบื้องหลัง) หรือโดเมนตรงกับ whitelist
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

![[Pasted image 20250617090001.png]]

### แนวทางที่ 3: อนุญาตให้ใครเรียกใช้ก็ได้ทั้งหมด (ระบุเครื่องหมายดอกจัน `*`)
ใช้บ่อยตอนกำลังพัฒนาในเครื่องตัวเอง หรือ API สาธารณะที่ไม่กังวลเรื่องความปลอดภัยโดเมน:
`app.ts`
```ts
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

![[Pasted image 20250617085343.png]]
