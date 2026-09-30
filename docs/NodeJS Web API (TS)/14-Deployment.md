# การดีพลอยเซิร์ฟเวอร์ขึ้นใช้งานจริง (Deployment)

เมื่อพัฒนาแอปด้วย TypeScript เสร็จแล้ว เราไม่ควรรันรหัสต้นฉบับตรงๆ บนเครื่องจริง แต่เราจะต้องคอมไพล์แปลงรหัสให้เป็น JavaScript ปกติเสียก่อน เพื่อความรวดเร็วและประหยัดพื้นที่เครื่อง

## 1. วิธีคอมไพล์โครงการ (Build Project)
รันคำสั่งคอมไพล์โค้ด TypeScript ทั้งหมดในโฟลเดอร์โครงการให้ออกมาเป็นโค้ด JavaScript ลงโฟลเดอร์ที่ตั้งไว้ (ในที่นี้คือโฟลเดอร์ `/dist`):

```sh
npx tsc
```


![[Pasted image 20250617114353.png]]

---

## 2. อัปโหลดโค้ดขึ้น GitHub
อัปเดตโค้ดเข้าสู่ระบบจัดเก็บเวอร์ชัน:

![[Pasted image 20250617111351.png]]

![[Pasted image 20250617111445.png]]

![[Pasted image 20250617111518.png]]

![[Pasted image 20250617111624.png]]

![[Pasted image 20250617111704.png]]

---

## 3. ดีพลอยขึ้นบริการคลาวด์ Render
เชื่อมบัญชี GitHub เข้ากับ [Render](https://render.com/) แล้วเลือกโครงการของเรา:

![[Pasted image 20250617142810.png]]

![[Pasted image 20250617142846.png]]

![[Pasted image 20250617142932.png]]

ตั้งค่าคำสั่งรันระบบดังนี้:
- **Build Command (คำสั่งติดตั้งและคอมไพล์):**
  ```shell
  npm install && npx tsc
  ```
- **Start Command (คำสั่งเริ่มต้นรันเซิร์ฟเวอร์จริง):**
  ```shell
  node dist/server.js
  ```

![[Pasted image 20250617143054.png]]

![[Pasted image 20250617143116.png]]

![[Pasted image 20250617143150.png]]

![[Pasted image 20250617143405.png]]

### ทดสอบการเรียกใช้
เปิดหน้าเว็บเซิร์ฟเวอร์บนอินเทอร์เน็ตที่ Render จัดเตรียมให้:
https://node-express-5kuk.onrender.com

![[Pasted image 20250617144629.png]]

![[Pasted image 20250617144715.png]]

---

## 4. ดีพลอยด้วย Docker (ทางเลือกมาตรฐานสากล)
หากเครื่องปลายทางต้องการความยืดหยุ่นสูง แนะนำให้หุ้มระบบของเราไว้ในตู้คอนเทนเนอร์ (Container):

`Dockerfile`
```Dockerfile
# ใช้ NodeJS เวอร์ชัน 24 เป็นรากฐานระบบปฏิบัติการหลัก
FROM node:24

WORKDIR /usr/src/app

# คัดลอกและติดตั้ง Dependencies ต่างๆ
COPY package*.json ./
RUN npm install

# คัดลอกไฟล์ต้นฉบับทั้งหมดไปใน Container
COPY . .

# สั่งคอมไพล์ TypeScript เป็น JavaScript
RUN npx tsc

EXPOSE 3000

# รันแอปพลิเคชันเวอร์ชันคอมไพล์แล้ว
CMD ["node", "dist/server.js"]
```

### คำสั่งสร้างและรันตู้คอนเทนเนอร์:
1. **สร้างอิมเมจระบบ:**
   ```shell
   docker build -t node-express-mysql . 
   ```
2. **เปิดคอนเทนเนอร์ทำงานเบื้องหลัง (Background):**
   ```shell
   docker run -d --name express-mysql -p 8008:3000 node-express-mysql
   ```

![[Pasted image 20250617121125.png]]

![[Pasted image 20250617121154.png]]

![[Pasted image 20250617121411.png]]

### ทดสอบ CORS นอกตู้คอนเทนเนอร์:
![[Pasted image 20250617121225.png]]