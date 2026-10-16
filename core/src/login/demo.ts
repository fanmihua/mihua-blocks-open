import type { Locale } from '../shared/contract';
import type { LoginAdapter, LoginResult } from './types';

/**
 * 演示用的宿主适配器：只在内存里模拟，不发短信、不连任何服务。
 * 网站预览和源码包里的示例都用它；接入真实业务时，把它换成调用你自己接口的实现即可。
 */
export const DEMO_CODE = '123456';
export const DEMO_PASSWORD = 'mihua2026';

const copy = {
  zh: {
    requestFirst: '请先获取验证码',
    wrongCode: `验证码错误。演示验证码是 ${DEMO_CODE}`,
    wrongPassword: `密码错误。演示密码是 ${DEMO_PASSWORD}`,
  },
  en: {
    requestFirst: 'Request a code first',
    wrongCode: `Incorrect code. The demo code is ${DEMO_CODE}`,
    wrongPassword: `Incorrect password. The demo password is ${DEMO_PASSWORD}`,
  },
} satisfies Record<Locale, Record<string, string>>;

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/** 用会话 ID 生成一张确定的「二维码」图案，只用于演示，扫不出任何内容。 */
export function demoQrImage(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const random = () => ((hash = (hash * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  let path = '';
  const finder = (x: number, y: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++)
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i > 1 && i < 5 && j > 1 && j < 5))
          path += `M${x + i} ${y + j}h1v1h-1z`;
  };
  finder(0, 0);
  finder(22, 0);
  finder(0, 22);
  for (let x = 0; x < 29; x++)
    for (let y = 0; y < 29; y++) {
      const inFinder = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
      if (!inFinder && random() > 0.52) path += `M${x} ${y}h1v1h-1z`;
    }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 33 33" shape-rendering="crispEdges"><rect x="-2" y="-2" width="33" height="33" fill="#fff"/><path d="${path}" fill="#0a0a0a"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createLoginDemoAdapter(
  options: {
    locale?: Locale;
    /** 登录后是否需要选择组织。 */
    organizations?: boolean;
    /** 二维码有效期，单位秒。 */
    qrLifetime?: number;
    /** 模拟网络延迟，单位毫秒。 */
    latency?: number;
    onEvent?: LoginAdapter['onEvent'];
  } = {},
): LoginAdapter {
  const t = copy[options.locale ?? 'zh'];
  const latency = options.latency ?? 600;
  const lifetime = (options.qrLifetime ?? 60) * 1000;
  let codeRequested = false;
  const loadedAt = new Map<string, number>();
  const user = { id: 'demo', name: options.locale === 'en' ? 'Alex' : '米花' };
  const result = (): LoginResult =>
    options.organizations
      ? {
          status: 'organization-required',
          challengeToken: 'demo-challenge',
          organizations: [
            {
              id: 'hq',
              name: options.locale === 'en' ? 'Mihua HQ' : '米花科技',
              description: '1,284',
            },
            {
              id: 'lab',
              name: options.locale === 'en' ? 'Mihua Lab' : '米花实验室',
              description: '36',
            },
          ],
        }
      : { status: 'authenticated', user };

  return {
    async sendCode(_input, signal) {
      await wait(latency, signal);
      codeRequested = true;
      return { retryAfterSeconds: 60 };
    },
    async authenticate(credentials, signal) {
      await wait(latency, signal);
      if (credentials.verification === 'otp') {
        if (!codeRequested) throw new Error(t.requestFirst);
        if (credentials.code !== DEMO_CODE) throw new Error(t.wrongCode);
      } else if (credentials.password !== DEMO_PASSWORD) throw new Error(t.wrongPassword);
      return result();
    },
    async loadQr(signal) {
      await wait(latency / 2, signal);
      const id = `demo-${Date.now().toString(36)}`;
      loadedAt.set(id, Date.now());
      return { id, imageUrl: demoQrImage(id), expiresAt: Date.now() + lifetime };
    },
    async pollQr(sessionId, signal) {
      await wait(200, signal);
      const age = Date.now() - (loadedAt.get(sessionId) ?? Date.now());
      return { status: age > 8000 ? 'scanned' : 'waiting' };
    },
    async social(_provider, signal) {
      await wait(latency, signal);
      return result();
    },
    async selectOrganization(_input, signal) {
      await wait(latency, signal);
      return { status: 'authenticated', user };
    },
    onEvent: options.onEvent,
  };
}
