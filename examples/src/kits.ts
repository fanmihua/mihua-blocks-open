import type { Kit } from '@mihua/react';
import type { VueKit } from '@mihua/vue';
import type { AuditKit } from '@mihua/audit/page/types';
import { antdKit } from '@mihua/react/kits/antd';
import { arcoKit } from '@mihua/react/kits/arco';
import { shadcnKit } from '@mihua/react/kits/shadcn';
import { elementKit } from '@mihua/vue/kits/element';
import { tdesignKit } from '@mihua/vue/kits/tdesign';

/**
 * 组件库登记表：演示页和检查页都读它，自动检查也按它决定比哪些组件库。
 *
 * 接一个新组件库：写好套件（含部件地图）以后，在这里加一行；
 * 它如果有自己的样式表，再在 kits.css 里登记一行。检查工具本身不用改。
 *
 * 顺序就是页面上从左到右的顺序。检查时所有组件库互相比，不分主次。
 */
export type RegisteredKit = { framework: 'react'; kit: Kit } | { framework: 'vue'; kit: VueKit };

export const KITS: RegisteredKit[] = [
  { framework: 'react', kit: antdKit },
  { framework: 'vue', kit: elementKit },
  { framework: 'react', kit: shadcnKit },
  { framework: 'react', kit: arcoKit },
  { framework: 'vue', kit: tdesignKit },
];

/** 检查工具只需要知道：叫什么、哪个框架、部件在哪。 */
export const auditKits = (): AuditKit[] =>
  KITS.map(({ framework, kit }) => ({ id: kit.id, name: kit.name, framework, parts: kit.parts }));
