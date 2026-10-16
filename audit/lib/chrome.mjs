import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * 一个最小的 Chrome 遥控器（Chrome DevTools 协议）：打开页面、在页面里执行代码、
 * 真实的鼠标点击和悬停、真实的按键。不依赖 puppeteer 之类的大包。
 */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 找一个 Chrome：CHROME_PATH，或者常见的安装位置，或者 puppeteer 下载的 chrome-headless-shell。 */
export function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH))
    return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const cache = join(homedir(), '.cache/puppeteer/chrome-headless-shell');
  if (existsSync(cache))
    for (const version of readdirSync(cache, { withFileTypes: true }))
      if (version.isDirectory())
        for (const dir of readdirSync(join(cache, version.name)))
          candidates.push(join(cache, version.name, dir, 'chrome-headless-shell'));
  return candidates.find((p) => existsSync(p));
}

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
};

export async function launch(chromePath, { width = 3400, height = 1500 } = {}) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = join(tmpdir(), `mihua-audit-${process.pid}`);
  const chrome = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);
  let targets = [];
  for (let i = 0; i < 100 && !targets.length; i++) {
    try {
      targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter(
        (t) => t.type === 'page',
      );
    } catch {}
    await sleep(100);
  }
  if (!targets.length) throw new Error('Chrome 没有启动');
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}, timeout = 30000) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      const timer = setTimeout(() => {
        pending.delete(n);
        reject(new Error(`浏览器没有响应：${method}`));
      }, timeout);
      pending.set(n, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');
  // 无头浏览器的页面默认没有焦点，:focus 之类的样式不会出现；打开焦点模拟
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.result?.exceptionDetails)
      throw new Error(
        `页面里出错：${res.result.exceptionDetails.exception?.description ?? res.result.exceptionDetails.text}`,
      );
    return res.result?.result?.value;
  };
  const mouse = async (type, x, y) =>
    send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  return {
    /** 打开页面，等页面上的 window.__audit.ready。 */
    async goto(url) {
      await send('Page.navigate', { url });
      for (let i = 0; i < 200; i++) {
        await sleep(100);
        const ok = await evaluate('!!window.__audit').catch(() => false);
        if (ok) break;
      }
      await evaluate('window.__audit.ready');
    },
    evaluate,
    async click([x, y]) {
      await mouse('mouseMoved', x, y);
      await mouse('mousePressed', x, y);
      await mouse('mouseReleased', x, y);
    },
    async hover([x, y]) {
      await mouse('mouseMoved', x, y);
    },
    /** 截图（PNG 的 base64）。clip 是页面上的一块区域 { x, y, width, height }，不给就截整个窗口。 */
    async screenshot(clip) {
      // 区域超出窗口时才截窗口外的部分：captureBeyondViewport 会临时改变窗口大小，
      // 组件库会跟着重新摆弹层（antd 的下拉在截图里错位）
      const beyond = clip && (clip.x + clip.width > width || clip.y + clip.height > height);
      const res = await send('Page.captureScreenshot', {
        format: 'png',
        ...(clip ? { clip: { ...clip, scale: 1 }, captureBeyondViewport: !!beyond } : {}),
      });
      return res.result.data;
    },
    /** 打一串字（像输入法上屏一样一次插入，会触发 input 事件）。 */
    async type(text) {
      await send('Input.insertText', { text });
    },
    async press(name) {
      const k = KEYS[name];
      if (!k) throw new Error(`不认识的按键：${name}`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...k });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...k, text: undefined });
    },
    close() {
      ws.close();
      chrome.kill();
      // Chrome 退出时可能还在写临时目录，删不掉就重试几次
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    },
  };
}
