import { Component, input } from '@angular/core';

@Component({
  selector: 'page-title',
  template: `<div class="page-title">
    <div>
      <h1>{{ title() }}</h1>
      <p>{{ description() }}</p>
    </div>
    <ng-content />
  </div>`,
})
export class PageTitle {
  title = input.required<string>();
  description = input('');
}
