import { Icon } from '../../shared/icon';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitle } from '../shared/ui';
@Component({
  imports: [Icon, RouterLink, PageTitle],
  templateUrl: './home.html',
})
export class HomePage {}
