import { Icon } from '../components/icon';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitle } from '../components/page-title';
@Component({
  imports: [Icon, RouterLink, PageTitle],
  templateUrl: './home.html',
})
export class HomePage {}
