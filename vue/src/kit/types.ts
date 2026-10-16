import type { Component } from 'vue';
import type { Adaptation, LibraryProfile, PartMap } from '@mihua/spec';

/**
 * Vue 版控件套件，与 React 版的接口一一对应：
 * Button（variant / size / block / loading，点击触发 click）、Input（v-model，suffix 插槽）、
 * Checkbox（v-model）、Tabs（v-model + items）、Select（v-model + options）、
 * Switch（v-model + disabled + ariaLabel）、
 * NavMenu（items + collapsed + ariaLabel，v-model:selected、v-model:open）、
 * Breadcrumb（items + ariaLabel，选了能点的上级触发 navigate(key)）、
 * Dropdown（items + ariaLabel，默认插槽是触发按钮，选了一项触发 select(key)）、
 * Avatar（text）、Badge（count，默认插槽是被标注的东西）、
 * Table（columns、rows、loading、selectLabel、selectAllLabel、ariaLabel，v-model:selected、v-model:sort；
 *   cell 插槽 { row, column } 画格子，empty 插槽是没有行时的内容）、
 * Pagination（page、pageSize、total、totalText、pageLabel、prevLabel、nextLabel、ariaLabel，v-model:page）、
 * Tag（tone，默认插槽是文字）、
 * DateRange（placeholder、separator、labels、ariaLabel，v-model）、
 * Dialog（open、title、closeLabel，关的时候触发 close；默认插槽是内容、footer 插槽是底部按钮）、
 * Radio（options、ariaLabel，v-model）、Textarea（v-model，name、placeholder、rows、invalid）。
 * 键盘、读屏的要求和 React 版接口注释里写的一样。
 * 数据形状（NavItem、BreadcrumbItem、DropdownItem）和 React 版共用，在 @mihua/spec。
 * 换组件库 = 换套件，视图模板一行不改。
 */
/** 组件库的名字，比如 element。接新组件库不用改这里。 */
export type VueKitId = string;

export interface VueKit {
  id: VueKitId;
  name: string;
  /**
   * 接收 tokens（为 null 时保留组件库原生外观）和 aligned（为 false 时只把取值交给主题变量，
   * 不按控件规格对齐），把它们交给组件库的主题接口。
   */
  Provider: Component;
  Button: Component;
  Input: Component;
  Checkbox: Component;
  Tabs: Component;
  Select: Component;
  Switch: Component;
  NavMenu: Component;
  Breadcrumb: Component;
  Dropdown: Component;
  Avatar: Component;
  Badge: Component;
  Table: Component;
  Pagination: Component;
  Tag: Component;
  DateRange: Component;
  Dialog: Component;
  Radio: Component;
  Textarea: Component;
  /** 这个组件库默认和统一设计不一样的地方，以及套件是怎么对齐的（文档和演示页直接读它）。 */
  adaptations: Adaptation[];
  /** 这个组件库本身是怎么写的（文档介绍组件库时读它）。 */
  profile: LibraryProfile;
  /** 部件地图：用户看得见的每个部件在这个组件库里是哪个元素（自动检查读它）。 */
  parts: PartMap;
}
