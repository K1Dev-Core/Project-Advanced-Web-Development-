# การใช้งาน JSON Web Token (JWT)

## 1. JWT คืออะไร?
เป็นระบบตั๋วผ่านทางเพื่อยืนยันตัวตน (Authentication) และสิทธิ์การใช้งาน (Authorization)
- เมื่อล็อกอินผ่าน เซิร์ฟเวอร์จะออกตั๋ว JWT ให้ตัวหนึ่ง (Token)
- หลังจากนั้น ทุกครั้งที่ไคลเอนต์ต้องการยิงขอข้อมูล API ที่สำคัญ จะต้องส่งตั๋วนี้แนบไปใน Header ด้วยเสมอ

---

## 2. ติดตั้งคลังไลบรารี
```shell
npm install jsonwebtoken express-jwt
npm install -D @types/jsonwebtoken
```

---

## 3. สร้างระบบตรวจสอบโทเคน (JWT Middleware)
สร้างไฟล์แยกมาจัดการสร้างและตรวจสอบความถูกต้องของโทเคน:

`jwtauth.ts`
```ts
import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";

export const secret = "this-is-top-secret"; // ควรเป็นค่าสุ่มยาวๆ และเก็บเป็นตัวแปร env

// มิดเดิลแวร์สำหรับดักตรวจสอบ JWT ก่อนเปิดให้เข้าใช้งาน API ย่อย
export const jwtAuthen = expressjwt({
  secret: secret,
  algorithms: ["HS256"],
}).unless({
  // ระบุ Path ที่ไม่ต้องเช็กตั๋ว (เช่น หน้า Login/Register หรือหน้าแรก)
  path: ["/", "/register", "/login", "/testtoken"],
});

// ฟังก์ชันช่วยสร้างตั๋ว JWT ใหม่
export function generateToken(payload: any, secretKey: string): string {
  return jwt.sign(payload, secretKey, {
    expiresIn: "30d", // ให้ตั๋วหมดอายุใน 30 วัน
    issuer: "CS-MSU"
  });
}

// ฟังก์ชันดึงค่าและตรวจสอบตั๋วแบบแมนนวล (หากต้องการใช้ตรวจส่วนอื่น)
export function verifyToken(
  token: string,
  secretKey: string
): { valid: boolean; decoded?: any; error?: string } {
  try {
    const decodedPayload = jwt.verify(token, secretKey);
    return { valid: true, decoded: decodedPayload };
  } catch (error) {
    return { valid: false, error: JSON.stringify(error) };
  }
}
```

---

## 4. ใช้งานร่วมกับ Express App

`app.ts`
```ts
import { generateToken, jwtAuthen, secret } from "./jwtauth";

// ...

// 1. เรียกใช้มิดเดิลแวร์เพื่อดักตรวจสอบทุกความร้องขอ
app.use(jwtAuthen);

// 2. ดักรับ Error กรณียิงตั๋วปลอม/ตั๋วหมดอายุ (ต้องไว้ถัดจาก jwtAuthen)
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    res.status(err.status).json({ message: err.message });
    return;
  }
  next(err);
});

// 3. สร้างเส้นทางสำหรับรับตั๋วทดสอบ
app.use("/testtoken", (req, res) => {
  const payload = { username: "Aj.M" }; 
  const jwttoken = generateToken(payload, secret);
  res.status(200).json({
    token: jwttoken,
  });
});
```

![[Pasted image 20250617102920.png]]

![[Pasted image 20250617102959.png]]

หากยิงมาโดยไม่ได้ส่ง Token หรือตั๋วไม่ถูกต้อง ก็จะเจอข้อความฟ้องปฏิเสธสิทธิ์ (Unauthorized):
![[Pasted image 20250617103027.png]]

![[Pasted image 20250617103640.png]]

---

## 5. การทดสอบส่งโทเคนผ่านตัวหน้าบ้าน
ที่ส่วน Headers ของคำร้องขอ จะต้องระบุค่าเป็น `Authorization` และค่าตั๋วขึ้นต้นด้วยคำว่า `Bearer ` เว้นวรรคตามด้วยรหัสตั๋ว:

`test/test.js`
```js
document.getElementById('getAllTrips').addEventListener('click', async () => {
    try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            // แนบตั๋วไปด้วยตรงนี้
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
          },
        });
        const data = await response.json();
        displayResponse(data);
    } catch (error) {
        displayResponse({ error: error.message });
    }
});
```

![[Pasted image 20250617104022.png]]

![[Pasted image 20250617104207.png]]