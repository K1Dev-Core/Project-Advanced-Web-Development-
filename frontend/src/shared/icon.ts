import { Component, input, computed } from '@angular/core';
import {
  LucideDynamicIcon,
  LucideIcon,
  LucideHouse,
  LucidePackage,
  LucideSearch,
  LucideMapPin,
  LucideArrowRight,
  LucideChevronRight,
  LucideUserRound,
  LucideUsersRound,
  LucideRoute,
  LucideTruck,
  LucideSettings2,
  LucideClock3,
  LucideCheck,
  LucidePlus,
  LucideX,
  LucidePhone,
  LucideWallet,
  LucideLogOut,
  LucideSquarePen,
  LucideTrash2,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideSparkles,
  LucideChartNoAxesCombined,
  LucideCircleHelp,
  LucideCopy,
  LucideExternalLink,
  LucideLocateFixed,
  LucideMaximize2,
  LucideLink,
  LucideEye,
} from '@lucide/angular';
const icons: Record<string, LucideIcon> = {
  home: LucideHouse,
  box: LucidePackage,
  search: LucideSearch,
  pin: LucideMapPin,
  arrow: LucideArrowRight,
  chevron: LucideChevronRight,
  user: LucideUserRound,
  users: LucideUsersRound,
  route: LucideRoute,
  truck: LucideTruck,
  settings: LucideSettings2,
  clock: LucideClock3,
  check: LucideCheck,
  plus: LucidePlus,
  close: LucideX,
  phone: LucidePhone,
  wallet: LucideWallet,
  logout: LucideLogOut,
  edit: LucideSquarePen,
  trash: LucideTrash2,
  refresh: LucideRefreshCw,
  shield: LucideShieldCheck,
  spark: LucideSparkles,
  chart: LucideChartNoAxesCombined,
  help: LucideCircleHelp,
  copy: LucideCopy,
  external: LucideExternalLink,
  locate: LucideLocateFixed,
  expand: LucideMaximize2,
  link: LucideLink,
  eye: LucideEye,
};
@Component({
  selector: 'ui-icon',
  imports: [LucideDynamicIcon],
  template: `<svg [lucideIcon]="selected()" [size]="22" [strokeWidth]="1.8" aria-hidden="true" />`,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        vertical-align: middle;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class Icon {
  name = input('box');
  selected = computed(() => icons[this.name()] || LucidePackage);
}
