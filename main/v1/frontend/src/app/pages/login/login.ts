import { Icon } from '../../components/ui/icon';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../../services/api';
import { PageTitle } from '../../components/ui/page-title';
import { RequestState } from '../../components/ui/request-state';
import { Task } from '../../shared/task';
@Component({
  imports: [Icon, FormsModule, PageTitle, RequestState],
  templateUrl: './login.html',
})
export class LoginPage {
  api = inject(Api);
  router = inject(Router);
  task = new Task();
  username = '';
  password = '';
  login() {
    return this.task.run(async () => {
      if (!this.username.trim() || !this.password)
        throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      await this.api.login(this.username.trim(), this.password);
      await this.router.navigateByUrl('/admin');
    });
  }
}
