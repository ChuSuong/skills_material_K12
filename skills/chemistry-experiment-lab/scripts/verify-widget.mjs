import { chromium, devices } from "playwright";
import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { basename, dirname, extname, join, resolve } from "path";

const htmlPath = resolve(process.argv[2]);
const artifactDir = resolve(process.argv[3]);
const resultPath = resolve(process.argv[4]);

mkdirSync(artifactDir, { recursive: true });

const serveDir = dirname(htmlPath);
const htmlFile = basename(htmlPath);
const slug = basename(htmlPath, extname(htmlPath));

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function fileResponse(reqPath) {
  const rel = decodeURIComponent(reqPath === "/" ? `/${htmlFile}` : reqPath);
  const filePath = join(serveDir, rel);
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    return { status: 200, content, type: mimeTypes[ext] || "application/octet-stream" };
  } catch {
    return { status: 404, content: Buffer.from("Not found"), type: "text/plain" };
  }
}

const server = createServer((req, res) => {
  const response = fileResponse(req.url || "/");
  res.writeHead(response.status, { "Content-Type": response.type });
  res.end(response.content);
});

function detectRuntimeSelectors() {
  return `
    (() => {
      const candidates = [
        '[data-role="stage"]',
        '.stage',
        '.stage-card',
        '.gk-stage',
        'canvas'
      ];
      function largestRect(selectors) {
        let best = null;
        for (const selector of selectors) {
          for (const el of document.querySelectorAll(selector)) {
            const rect = el.getBoundingClientRect();
            const area = Math.max(0, rect.width) * Math.max(0, rect.height);
            if (!best || area > best.area) best = { selector, area, rect };
          }
        }
        return best;
      }
      const stage = largestRect(candidates);
      const text = document.body.innerText || '';
      const buttonTexts = Array.from(document.querySelectorAll('button')).map((el) => el.textContent || '');
      const controlSelectors = [
        '[data-role="toggle"]',
        '[data-role="reset"]',
        '[data-role="run"]',
        '[data-role="replay"]',
        'button'
      ];
      const controlCount = controlSelectors.reduce((sum, selector) => {
        return sum + document.querySelectorAll(selector).length;
      }, 0);
      return {
        title: document.title,
        stagePresent: !!stage,
        stageAreaRatio: stage ? stage.area / (window.innerWidth * window.innerHeight) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        fallbackPresent: /không tải|webgl|không hỗ trợ|fallback/i.test(text),
        primaryRunControlPresent: controlCount > 0 || buttonTexts.some((value) => /chạy|run|demo|pause|play|reset/i.test(value)),
        buttonTexts
      };
    })()
  `;
}

async function samplePageState(page) {
  const before = await page.evaluate(detectRuntimeSelectors());
  const beforeHtml = await page.evaluate(() => document.body.innerHTML);
  const beforeTitle = await page.title();
  await page.waitForTimeout(2500);
  const afterText = await page.evaluate(() => document.body.innerText || "");
  const afterHtml = await page.evaluate(() => document.body.innerHTML);
  const afterTitle = await page.title();
  const changed = beforeHtml !== afterHtml || beforeTitle !== afterTitle || afterText.length > 0;
  return { before, changed };
}

async function inspectWebGL(page) {
  return page.evaluate(() => {
    const test = document.createElement("canvas");
    let supported = false;
    let rendererType = "none";
    try {
      const gl = test.getContext("webgl") || test.getContext("experimental-webgl");
      supported = !!gl;
      if (gl) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        rendererType = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "webgl";
      }
    } catch {
      supported = false;
    }
    return { supported, rendererType };
  });
}

async function runContext(browser, options) {
  const context = await browser.newContext(options.contextOptions);
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await page.goto(options.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const state = await samplePageState(page);
  const webgl = await inspectWebGL(page);
  const screenshotPath = join(artifactDir, options.screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const tracePath = join(artifactDir, options.traceName);
  await context.tracing.stop({ path: tracePath });
  await context.close();

  return {
    viewport: options.viewportLabel,
    screenshotPath,
    tracePath,
    state: state.before,
    stateChanged: state.changed,
    webgl
  };
}

const port = await new Promise((resolvePort) => {
  server.listen(0, () => resolvePort(server.address().port));
});

const url = `http://127.0.0.1:${port}/${htmlFile}`;
const browser = await chromium.launch({ headless: true });

let desktop;
let mobile;
let finalStatus = "pass";
let blockers = [];
let warnings = [];

try {
  desktop = await runContext(browser, {
    url,
    screenshotName: "desktop.png",
    traceName: "desktop-trace.zip",
    viewportLabel: "desktop-1280x800",
    contextOptions: {
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1
    }
  });

  mobile = await runContext(browser, {
    url,
    screenshotName: "mobile.png",
    traceName: "mobile-trace.zip",
    viewportLabel: "mobile-390x844",
    contextOptions: {
      ...devices["iPhone 13"]
    }
  });

  const stagePresent = desktop.state.stagePresent && mobile.state.stagePresent;
  const stageDominancePass = desktop.state.stageAreaRatio >= 0.25;
  const autoplayOrPrimaryRunPass =
    desktop.state.primaryRunControlPresent &&
    (desktop.stateChanged || mobile.stateChanged || desktop.state.buttonTexts.length > 0);
  const mobileFitPass = mobile.state.scrollWidth <= mobile.state.innerWidth + 2;
  const fallbackPresent = desktop.state.fallbackPresent || mobile.state.fallbackPresent;

  if (!stagePresent) blockers.push("No detectable stage/canvas element found.");
  if (!stageDominancePass) warnings.push("Stage dominance ratio looks low on desktop.");
  if (!autoplayOrPrimaryRunPass) warnings.push("Could not confirm autoplay change or a clear primary run flow.");
  if (!mobileFitPass) warnings.push("Mobile viewport may have horizontal overflow.");
  if (!desktop.webgl.supported) warnings.push("Desktop WebGL unsupported in verification environment.");

  if (blockers.length > 0) finalStatus = "fail";
  else if (warnings.length > 0) finalStatus = "pass-with-warnings";

  const result = {
    slug,
    html_file: htmlPath,
    final_status: finalStatus,
    blockers,
    warnings,
    verification: {
      environment: {
        browser: "chromium",
        headless: true,
        os: process.platform,
        viewport: "desktop-1280x800 + mobile-iPhone13"
      },
      webgl: {
        supported: desktop.webgl.supported,
        renderer_type: desktop.webgl.rendererType,
        fallback_used: desktop.webgl.rendererType !== "webgl" && desktop.webgl.rendererType !== "none"
      },
      invariants: {
        stage_present: stagePresent,
        stage_dominance_pass: stageDominancePass,
        autoplay_or_primary_run_pass: autoplayOrPrimaryRunPass,
        mobile_fit_pass: mobileFitPass,
        fallback_present: fallbackPresent
      }
    },
    artifacts: {
      desktop_screenshot: desktop.screenshotPath,
      mobile_screenshot: mobile.screenshotPath,
      trace: artifactDir
    },
    checks: {
      desktop: desktop.state,
      mobile: mobile.state
    }
  };

  writeFileSync(resultPath, JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  server.close();
}
