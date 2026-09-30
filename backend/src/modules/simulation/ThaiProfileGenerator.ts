import { SeededRandom } from "../../shared/random/SeededRandom";

export interface GeneratedProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export class ThaiProfileGenerator {
  private static readonly FIRST_NAMES = [
    "สมชาย", "สมหญิง", "กิตติ", "ณัฐวุฒิ", "ปิยะนุช", "วรรณา", "ธนากร", "สุภาวดี", "อนุชา", "พิมพ์ชนก",
    "ศุภชัย", "จิราพร", "ธีรภัทร", "กมลชนก", "วีรยุทธ", "ชลธิชา", "ภานุวัฒน์", "นภัสสร", "เกียรติศักดิ์", "อรอุมา",
    "ปรีชา", "มาลัย", "สุรเชษฐ์", "รัชนี", "ธนพล", "ศิริพร", "อภิสิทธิ์", "ปวีณา", "ชยพล", "กัญญาณัฐ",
  ];

  private static readonly LAST_NAMES = [
    "ใจดี", "ศรีสุข", "บุญมา", "แก้วประเสริฐ", "ทองดี", "วงศ์ไทย", "สุขสวัสดิ์", "พรหมมา", "จันทร์เพ็ญ", "ศรีวงศ์",
    "มณีรัตน์", "ภูมิพัฒน์", "สายทอง", "คำภู", "พลศรี", "ประทุมวัน", "นาคสวัสดิ์", "อินทร์แก้ว", "ชัยมงคล", "บุญเรือง",
  ];

  private static readonly PLACES = [
    "หอพักนิสิต มมส",
    "อาคารเรียนรวม มมส",
    "ตลาดน้อย ขามเรียง",
    "หมู่บ้านท่าขอนยาง",
    "หอพักเอกชน ซอยวิทยวิภาส",
    "หมู่บ้านดอนนา",
    "คอนโดหน้า มมส",
    "ร้านค้าหลังมอ",
    "บ้านเช่าซอยสุขเจริญ",
    "หมู่บ้านขามเรียง",
  ];

  constructor(private readonly random: SeededRandom) {}

  next(): GeneratedProfile {
    const place = this.random.pick(ThaiProfileGenerator.PLACES);
    return {
      firstName: this.random.pick(ThaiProfileGenerator.FIRST_NAMES),
      lastName: this.random.pick(ThaiProfileGenerator.LAST_NAMES),
      phone: `0${this.random.pick(["6", "8", "9"])}${String(this.random.int(0, 99999999)).padStart(8, "0")}`,
      address: `${this.random.int(1, 299)}/${this.random.int(1, 40)} ${place} ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม 44150`,
    };
  }
}
