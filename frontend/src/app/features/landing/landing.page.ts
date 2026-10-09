import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { BrandComponent } from '../../shared/components/brand.component';
import { RiderIllustrationComponent } from '../../shared/illustrations/rider-illustration.component';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, LucideAngularModule, BrandComponent, RiderIllustrationComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage {
  protected readonly auth = inject(AuthService);

  protected readonly highlights = [
    { icon: 'timer', title: 'ถึงมือก่อน 12:30', text: 'ออกรถ 11:30 ระบบเช็กทุกจุดให้ส่งทันใน 1 ชั่วโมง' },
    { icon: 'bike', title: 'คนละไม่เกิน 3 ออเดอร์', text: 'แบ่งงานไรเดอร์อัตโนมัติตามเงื่อนไขที่ตกลงกันไว้' },
    { icon: 'route', title: 'เส้นทางถนนจริง', text: 'คำนวณระยะขับรถจริง ไม่วิ่งย้อนไขว้กันไปมา' },
    { icon: 'wallet', title: 'เห็นกำไรก่อนออกรถ', text: 'สรุปค่าส่ง ต้นทุน และกำไรทุกครั้งที่จัดเส้นทาง' },
  ];

  protected readonly steps = [
    { icon: 'shopping-bag', title: 'รับออเดอร์', text: 'ออเดอร์ 20–30 รายการเข้ามาช่วง 10 โมง' },
    { icon: 'wand-sparkles', title: 'กดจัดเส้นทาง', text: 'ระบบแบ่งงานและเลือกเส้นทางที่ถูกที่สุด' },
    { icon: 'smartphone', title: 'ไรเดอร์เปิดใบงาน', text: 'กรอกเลขใบงาน เห็นลำดับจุดส่งและแผนที่' },
  ];
}
