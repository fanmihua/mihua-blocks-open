import { adminScene } from './admin';
import { controlsScene } from './controls';
import { customersScene } from './customers';
import { loginScene } from './login';
import type { Scene } from './types';

/** 演示页和检查页上的所有场景。加一个场景（以后的列表页）：写好以后在这里加一行。 */
export const SCENES: Scene[] = [loginScene, controlsScene, adminScene, customersScene];
