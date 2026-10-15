import { DateControl } from '../../shared/date-control';
import { Icon } from '../../components/ui/icon';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Api } from '../../services/api';
import { Dashboard, today } from '../../models/models';
import { PageTitle } from '../../components/ui/page-title';
import { RequestState } from '../../components/ui/request-state';
import { Task } from '../../shared/task';
@Component({
  imports: [DateControl, Icon, FormsModule, RouterLink, DecimalPipe, PageTitle, RequestState],
  templateUrl: './overview.html',
})
export class OverviewPage {
  api = inject(Api);
  task = new Task();
  date = today();
  data = signal<Dashboard | null>(null);
  constructor() {
    this.load();
  }
  @HostListener('window:dev-data-created') refreshFromDev() {
    this.load();
  }
  load() {
    return this.task.run(async () => {
      this.data.set(null);
      this.data.set((await this.api.request<Dashboard>('/dashboard?date=' + this.date)).data);
    });
  }
}
