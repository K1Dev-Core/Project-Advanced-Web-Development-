import { Icon } from '../../components/ui/icon';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitle } from '../../components/ui/page-title';
@Component({
  imports: [Icon, RouterLink, PageTitle],
  templateUrl: './home.html',
})
export class HomePage {}
