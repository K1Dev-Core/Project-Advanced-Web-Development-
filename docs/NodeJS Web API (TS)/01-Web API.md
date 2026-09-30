# ทำไมต้องใช้ TypeScript ?
- ช่วยเช็กประเภทข้อมูล (Static Typing) ตั้งแต่ตอนเขียนโค้ด ลดโอกาสเกิด Error ตอนใช้งานจริง
- Auto-complete ดีเยี่ยม พิมพ์โค้ดปุ๊บ ตัวช่วยขึ้นปั๊บ
- อ่านง่าย เข้าใจโค้ดคนอื่นหรือโค้ดตัวเองในอนาคตได้ง่ายขึ้น
- แหล่งอ้างอิงวิธีติดตั้งเพิ่มเติม: https://dev.to/cristain/how-to-set-up-typescript-with-nodejs-and-express-2023-gf

# ซอฟต์แวร์ที่ต้องใช้
- NodeJS (แนะนำเวอร์ชัน LTS ล่าสุด)
- VS Code

# เริ่มต้นสร้างโปรเจกต์
## 1. สร้างโฟลเดอร์สำหรับ NodeJS
เปิด Terminal แล้วรันคำสั่งพวกนี้เพื่อสร้างโฟลเดอร์และเริ่มต้นโปรเจกต์:
```shell
mkdir node-express-mysql
cd node-express-mysql
npm init --yes
```

![[Pasted image 20250613062621.png]]

## 2. ตั้งค่า TypeScript
ติดตั้งตัวช่วยทำพัฒนาลงไปในโปรเจกต์:
```shell
npm install -D typescript@5 ts-node-dev
npm install -D @types/node
npx tsc --init
```
*(ts-node-dev ช่วยรันไฟล์ TypeScript และรีสตาร์ตเซิร์ฟเวอร์ให้อัตโนมัติเวลาเรากดเซฟ)*

อัปเดตไฟล์ `tsconfig.json` ในส่วนที่จำเป็นเพื่อให้คอมไพล์ทำงานได้ดีขึ้น:
```json
"types": ["node"],
"outDir": "./dist",
"verbatimModuleSyntax": false,
```

![[Pasted image 20250903214559.png]]

![[Pasted image 20250903214702.png]]

## 3. ติดตั้ง Express และ Types
```shell
npm install express
npm install -D @types/express
```

## 4. สร้างไฟล์หลักเพื่อเริ่มรันเซิร์ฟเวอร์
สร้างไฟล์ `server.ts` เพื่อเปิดพอร์ตให้เซิร์ฟเวอร์พร้อมรอรับ Request:

![[Pasted image 20250613063229.png]]

`server.ts`
```ts
import http from "http";

// ใช้ PORT ตัวพิมพ์ใหญ่ตามมาตรฐานสากล (เพราะพวกบริการโฮสติ้ง เช่น Render จะส่งค่ามาเป็นตัวพิมพ์ใหญ่เท่านั้น)
const port = process.env.PORT || 3000;
const server = http.createServer();

server.listen(port, () => {
  console.log(`Server is started on port ${port}`);
}).on("error", (error) => {
  console.error(error);
});
```

## 5. รันเซิร์ฟเวอร์ครั้งแรก
ลองรันเซิร์ฟเวอร์ผ่านคำสั่งนี้:
```shell
npx ts-node server.ts 
```

![[Pasted image 20250613063604.png]]

*เมื่อรันเซิร์ฟเวอร์แล้ว ตัวระบบจะทำงาน แต่ถ้าเข้าผ่านเบราว์เซอร์จะยังไม่เจออะไร เพราะเรายังไม่ได้สร้าง Route มารองรับ Request*
![[Pasted image 20250613064128.png]]

## 6. สร้าง Express App
สร้างไฟล์ `app.ts` เพื่อแยกส่วนกำหนด Route ออกมาจาก `server.ts` จะได้ไม่รก

![[Pasted image 20250613064210.png]]

`app.ts`
```ts
import express from "express";

export const app = express();

app.use("/", (req, res) => {
  res.send("Hello World!!!");
});
```

เอา Express App เข้ามาร่วมงานกับ `server.ts`
`server.ts`
```ts
import http from "http";
import { app } from "./app";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is started on port ${port}`);
});
```

![[Pasted image 20250613064428.png]]

## 7. รีสตาร์ตเซิร์ฟเวอร์
ปิดด้วย `Ctrl + C` แล้วรันใหม่เพื่อดูผลลัพธ์:

![[Pasted image 20250613064515.png]]

![[Pasted image 20250613064533.png]]
