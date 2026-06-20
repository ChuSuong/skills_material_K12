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
const runBundleMatch = resultPath.match(/[/\\]runs[/\\]([^/\\]+)[/\\]attempts[/\\]([^/\\]+)[/\\]verification[/\\]result\.json$/);
const runId = runBundleMatch ? runBundleMatch[1] : null;
const attemptId = runBundleMatch ? runBundleMatch[2] : null;

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
      function rectHeightRatio(height, viewportHeight) {
        return viewportHeight > 0 ? height / viewportHeight : 0;
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
        stageHeightRatio: stage ? rectHeightRatio(stage.rect.height, window.innerHeight) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        fallbackPresent: /không tải|webgl|không hỗ trợ|fallback/i.test(text),
        primaryRunControlPresent: controlCount > 0 || buttonTexts.some((value) => /chạy|run|demo|pause|play|reset/i.test(value)),
        buttonTexts,
        canvasCount: document.querySelectorAll('canvas').length,
        visibleTextLength: text.trim().length
      };
    })()
  `;
}

function detectContractState() {
  return `
    (() => {
      const phaseValues = new Set(["predict", "observe", "compare", "explain", "complete"]);
      const revealPolicies = new Set(["immediate", "after-observe", "after-complete"]);
      const contractNode = document.querySelector('script[type="application/json"][data-role="test-contract"]');
      const semanticRoot = document.querySelector("[data-widget-family][data-phase]");
      const semanticHints = !!semanticRoot || !!contractNode;
      const mode = semanticHints ? "contract-aware" : "legacy";
      const requiredRoles = ["stage", "primary-action", "reset", "result"];

      let contract = null;
      let contractParseError = null;
      if (contractNode) {
        try {
          contract = JSON.parse(contractNode.textContent || "{}");
        } catch (error) {
          contractParseError = String(error);
        }
      }

      const rolePresence = {};
      for (const role of requiredRoles) {
        rolePresence[role] = !!document.querySelector('[data-role="' + role + '"]');
      }

      const phase = semanticRoot ? semanticRoot.getAttribute("data-phase") : null;
      const widgetFamily = semanticRoot ? semanticRoot.getAttribute("data-widget-family") : null;
      const resultEl = document.querySelector('[data-role="result"]');
      const primaryAction = document.querySelector('[data-role="primary-action"]');
      const resetAction = document.querySelector('[data-role="reset"]');

      const contractChecks = {
        semantic_hints_present: semanticHints,
        widget_root_present: !!semanticRoot,
        widget_family_present: !!widgetFamily,
        phase_present: !!phase,
        phase_valid: !!phase && phaseValues.has(phase),
        required_roles_present: requiredRoles.every((role) => rolePresence[role]),
        role_presence: rolePresence,
        contract_present: !!contractNode,
        contract_parse_ok: !!contractNode && !contractParseError,
        contract_schema_ok: !!contract &&
          contract.schema_version === "chem-lab.test-contract.v1" &&
          typeof contract.interaction_family === "string" &&
          revealPolicies.has(contract.answer_reveal_policy) &&
          typeof contract.primary_observation === "string" &&
          typeof contract.supports_reset === "boolean" &&
          typeof contract.supports_pause === "boolean",
        interaction_family: contract && typeof contract.interaction_family === "string" ? contract.interaction_family : null,
        answer_reveal_policy: contract && typeof contract.answer_reveal_policy === "string" ? contract.answer_reveal_policy : null,
        parse_error: contractParseError
      };

      const resultState = resultEl
        ? {
            revealed: resultEl.getAttribute("data-revealed") === "true",
            phase: resultEl.getAttribute("data-phase"),
            text_length: (resultEl.innerText || "").trim().length
          }
        : null;

      return {
        mode,
        widgetFamily,
        phase,
        contract,
        contractChecks,
        resultState,
        primaryActionPresent: !!primaryAction,
        resetPresent: !!resetAction
      };
    })()
  `;
}

function classifyRevealVisible(resultState, policy) {
  if (!resultState) return false;
  if (typeof resultState.revealed === "boolean") return resultState.revealed;
  if (policy === "immediate") return resultState.text_length > 0;
  return false;
}

async function runClassificationProbe(page, contractState) {
  const probe = {
    probe_id: "classification",
    interaction_family: "classification",
    status: "pass",
    assertions: {
      starts_in_predict: false,
      hidden_before_complete: false,
      reveals_on_complete: false,
      reset_restores_predict: false
    },
    details: {}
  };

  const revealPolicy = contractState.contractChecks.answer_reveal_policy;
  const initialState = {
    phase: contractState.phase,
    resultState: contractState.resultState
  };
  probe.assertions.starts_in_predict = initialState.phase === "predict";
  probe.assertions.hidden_before_complete =
    !classifyRevealVisible(initialState.resultState, revealPolicy) &&
    initialState.phase !== "complete";

  const primaryAction = page.locator('[data-role="primary-action"]');
  const resetAction = page.locator('[data-role="reset"]');
  const primaryCount = await primaryAction.count();
  const resetCount = await resetAction.count();

  if (primaryCount < 1 || resetCount < 1) {
    probe.status = "fail";
    probe.details.error = "Missing primary-action or reset control for classification probe.";
    return probe;
  }

  if (await primaryAction.first().isDisabled()) {
    await page.evaluate(() => {
      const samples = Array.from(
        new Set(
          Array.from(document.querySelectorAll('[data-role="classification-choice"][data-sample], [data-action="predict"][data-sample]'))
            .map((choice) => choice.getAttribute("data-sample"))
            .filter(Boolean)
        )
      );
      for (const sample of samples) {
        const choice = document.querySelector(
          '[data-role="classification-choice"][data-sample="' + sample + '"], [data-action="predict"][data-sample="' + sample + '"]'
        );
        if (choice) choice.click();
      }
    });
    await page.waitForFunction(
      () => {
        const action = document.querySelector('[data-role="primary-action"]');
        return action && !action.disabled;
      },
      { timeout: 3000 }
    ).catch(() => {});
  }

  await primaryAction.first().click();

  await page.waitForFunction(
    () => {
      const root = document.querySelector("[data-widget-family][data-phase]");
      return root && root.getAttribute("data-phase") === "complete";
    },
    { timeout: 15000 }
  ).catch(() => {});

  const afterComplete = await page.evaluate(() => {
    const root = document.querySelector("[data-widget-family][data-phase]");
    const resultEl = document.querySelector('[data-role="result"]');
    return {
      phase: root ? root.getAttribute("data-phase") : null,
      resultState: resultEl
        ? {
            revealed: resultEl.getAttribute("data-revealed") === "true",
            phase: resultEl.getAttribute("data-phase"),
            text_length: (resultEl.innerText || "").trim().length
          }
        : null
    };
  });

  probe.assertions.reveals_on_complete =
    afterComplete.phase === "complete" &&
    classifyRevealVisible(afterComplete.resultState, revealPolicy);

  await resetAction.first().click();
  await page.waitForTimeout(150);

  const afterReset = await page.evaluate(() => {
    const root = document.querySelector("[data-widget-family][data-phase]");
    const resultEl = document.querySelector('[data-role="result"]');
    return {
      phase: root ? root.getAttribute("data-phase") : null,
      resultState: resultEl
        ? {
            revealed: resultEl.getAttribute("data-revealed") === "true",
            phase: resultEl.getAttribute("data-phase"),
            text_length: (resultEl.innerText || "").trim().length
          }
        : null
    };
  });

  probe.assertions.reset_restores_predict =
    afterReset.phase === "predict" &&
    !classifyRevealVisible(afterReset.resultState, revealPolicy);

  probe.details.initial = initialState;
  probe.details.after_complete = afterComplete;
  probe.details.after_reset = afterReset;

  if (!Object.values(probe.assertions).every(Boolean)) {
    probe.status = "fail";
  }
  return probe;
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
  const contractState = await page.evaluate(detectContractState());
  let probeResult = null;
  if (
    contractState.mode === "contract-aware" &&
    contractState.contractChecks.interaction_family === "classification"
  ) {
    probeResult = await runClassificationProbe(page, contractState);
  }
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
    webgl,
    contractState,
    probeResult
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
  const stageOversizedPass = desktop.state.stageHeightRatio <= 1.15;
  const stageGrosslyOversized = desktop.state.stageHeightRatio > 1.6 || desktop.state.stageAreaRatio > 1.05;
  const autoplayOrPrimaryRunPass =
    desktop.state.primaryRunControlPresent &&
    (desktop.stateChanged || mobile.stateChanged || desktop.state.buttonTexts.length > 0);
  const mobileFitPass = mobile.state.scrollWidth <= mobile.state.innerWidth + 2;
  const fallbackPresent = desktop.state.fallbackPresent || mobile.state.fallbackPresent;
  const mode = desktop.contractState.mode;
  const contractChecks = desktop.contractState.contractChecks;
  const runtimeChecks = {
    stage_present: stagePresent,
    stage_dominance_pass: stageDominancePass,
    stage_oversized_pass: stageOversizedPass,
    stage_grossly_oversized: stageGrosslyOversized,
    autoplay_or_primary_run_pass: autoplayOrPrimaryRunPass,
    mobile_fit_pass: mobileFitPass,
    fallback_present: fallbackPresent
  };
  const probeResults = desktop.probeResult ? [desktop.probeResult] : [];

  if (!stagePresent) blockers.push("No detectable stage/canvas element found.");
  if (stageGrosslyOversized) blockers.push("Stage footprint is grossly oversized relative to the desktop viewport.");
  if (!stageDominancePass) warnings.push("Stage dominance ratio looks low on desktop.");
  if (!stageOversizedPass) warnings.push("Stage height looks oversized relative to the desktop viewport.");
  if (!autoplayOrPrimaryRunPass) warnings.push("Could not confirm autoplay change or a clear primary run flow.");
  if (!mobileFitPass) warnings.push("Mobile viewport may have horizontal overflow.");
  if (!desktop.webgl.supported) warnings.push("Desktop WebGL unsupported in verification environment.");

  if (mode === "contract-aware") {
    if (!contractChecks.widget_root_present) blockers.push("Contract-aware widget is missing a semantic root with data-widget-family and data-phase.");
    if (!contractChecks.required_roles_present) blockers.push("Contract-aware widget is missing one or more required data-role markers.");
    if (!contractChecks.contract_present) blockers.push("Contract-aware widget is missing test-contract JSON.");
    if (contractChecks.contract_present && !contractChecks.contract_parse_ok) blockers.push("Contract-aware widget has malformed test-contract JSON.");
    if (contractChecks.contract_parse_ok && !contractChecks.contract_schema_ok) blockers.push("Contract-aware widget test-contract JSON does not conform to chem-lab.test-contract.v1.");
    if (desktop.probeResult && desktop.probeResult.status !== "pass") blockers.push("Classification probe failed.");
  }

  if (blockers.length > 0) finalStatus = "fail";
  else if (warnings.length > 0) finalStatus = "pass-with-warnings";

  const humanReviewRequired = mode === "contract-aware";
  const humanReviewReason = humanReviewRequired
    ? "Visual signoff still required for evidence density, scene value, wording, and pacing."
    : "Legacy lane still depends on heuristics and manual review for semantic quality.";

  const result = {
    schema_version: "chem-lab.verification-result.v2",
    artifact_type: "verification_result",
    ...(runId ? { run_id: runId } : {}),
    ...(attemptId ? { attempt_id: attemptId } : {}),
    slug,
    html_file: htmlPath,
    final_status: finalStatus,
    mode,
    blockers,
    warnings,
    contract_checks: contractChecks,
    runtime_checks: runtimeChecks,
    probe_results: probeResults,
    human_review_required: humanReviewRequired,
    human_review_reason: humanReviewReason,
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
        ...runtimeChecks
      }
    },
    artifacts: {
      desktop_screenshot: desktop.screenshotPath,
      mobile_screenshot: mobile.screenshotPath,
      trace: artifactDir
    },
    checks: {
      desktop: desktop.state,
      mobile: mobile.state,
      desktop_contract: desktop.contractState,
      mobile_contract: mobile.contractState
    },
    created_at: new Date().toISOString()
  };

  writeFileSync(resultPath, JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  server.close();
}
