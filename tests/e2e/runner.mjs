#!/usr/bin/env node
/**
 * Standalone Tiered E2E Test Runner for Portfolio Production-Hardening
 * Zero external test framework dependencies. Built on native Node.js ESM.
 * 
 * Supports:
 * - File discovery matching tests/e2e/**\/*.test.mjs
 * - CLI flags: --all, --tier=1..4, --verbose, --bail, --filter, --timeout, --help
 * - Test suite primitives: describe(), it(), test(), beforeEach(), afterEach(), beforeAll(), afterAll()
 * - Global assertion tracking and execution summary reporting
 * - Deterministic exit code: 0 on pass, 1 on fail
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { performance } from 'node:perf_hooks';
import { expect, getAssertionCount, resetAssertionCount } from './harness/assertions.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const testsRoot = path.resolve(projectRoot, 'tests', 'e2e');

// --- CLI Argument Parsing ---
let cliOptions = {
  all: false,
  tier: null,
  verbose: false,
  bail: false,
  filter: null,
  timeout: 10000,
  help: false,
};

try {
  const { values, positionals } = parseArgs({
    options: {
      all: { type: 'boolean', default: false },
      tier: { type: 'string', short: 't' },
      verbose: { type: 'boolean', short: 'v', default: false },
      bail: { type: 'boolean', short: 'b', default: false },
      filter: { type: 'string', short: 'f' },
      timeout: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  cliOptions.all = Boolean(values.all);
  cliOptions.tier = values.tier ? String(values.tier).replace(/^tier/i, '') : null;
  cliOptions.verbose = Boolean(values.verbose);
  cliOptions.bail = Boolean(values.bail);
  cliOptions.filter = values.filter || positionals[0] || null;
  cliOptions.timeout = values.timeout ? parseInt(values.timeout, 10) : 10000;
  cliOptions.help = Boolean(values.help);
} catch {
  // If parseArgs fails, fallback to defaults
}

if (cliOptions.help) {
  printHelp();
  process.exit(0);
}

function printHelp() {
  console.log(`
Portfolio E2E Standalone Test Runner
Usage:
  node tests/e2e/runner.mjs [options] [filter]

Options:
  --all               Run all test suites across all tiers (default)
  -t, --tier <number> Run only tests in specified tier (1, 2, 3, or 4)
  -v, --verbose       Print verbose diagnostics and stack traces
  -b, --bail          Stop execution immediately on first failure
  -f, --filter <str>  Filter test files or test names matching string/regex
  --timeout <ms>      Per-test timeout in milliseconds (default: 10000)
  -h, --help          Show this help message

Examples:
  node tests/e2e/runner.mjs
  node tests/e2e/runner.mjs --tier=1
  node tests/e2e/runner.mjs --tier=2 --verbose
  node tests/e2e/runner.mjs --bail
  node tests/e2e/runner.mjs --filter=smoke
`);
}

// --- Suite & Test Data Structures ---
class Suite {
  constructor(name, parent = null) {
    this.name = name;
    this.parent = parent;
    this.tests = [];
    this.suites = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }

  getFullName() {
    if (!this.parent || !this.parent.name) {
      return this.name;
    }
    return `${this.parent.getFullName()} > ${this.name}`;
  }
}

let rootSuites = [];
let currentSuite = null;

// --- Test Primitives ---
export function describe(name, fn) {
  const suite = new Suite(name, currentSuite);
  if (currentSuite) {
    currentSuite.suites.push(suite);
  } else {
    rootSuites.push(suite);
  }

  const prev = currentSuite;
  currentSuite = suite;
  try {
    fn();
  } finally {
    currentSuite = prev;
  }
}

export function it(name, fn, options = {}) {
  if (!currentSuite) {
    currentSuite = new Suite('Default Suite', null);
    rootSuites.push(currentSuite);
  }
  currentSuite.tests.push({
    name,
    fn,
    skip: false,
    options,
  });
}

it.skip = function (name, fn, options = {}) {
  if (!currentSuite) {
    currentSuite = new Suite('Default Suite', null);
    rootSuites.push(currentSuite);
  }
  currentSuite.tests.push({
    name,
    fn,
    skip: true,
    options,
  });
};

it.only = function (name, fn, options = {}) {
  it(name, fn, { ...options, only: true });
};

export const test = it;
export { expect } from './harness/assertions.mjs';
export function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEachHooks.push(fn);
}
export function afterEach(fn) {
  if (currentSuite) currentSuite.afterEachHooks.push(fn);
}
export function beforeAll(fn) {
  if (currentSuite) currentSuite.beforeAllHooks.push(fn);
}
export function afterAll(fn) {
  if (currentSuite) currentSuite.afterAllHooks.push(fn);
}

// Register primitives globally for frictionless test execution
globalThis.describe = describe;
globalThis.it = it;
globalThis.test = test;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.beforeAll = beforeAll;
globalThis.afterAll = afterAll;
globalThis.expect = expect;

// --- File Discovery & Tier Categorization ---
function discoverTestFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.next') {
        results.push(...discoverTestFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

function categorizeTier(filePath) {
  const relPath = path.relative(testsRoot, filePath).replace(/\\/g, '/');
  if (relPath.includes('tier2') || relPath.includes('tier2-boundaries')) return 'Tier 2';
  if (relPath.includes('tier1') || /\/f\d+-/.test(relPath)) return 'Tier 1';
  if (relPath.includes('tier3') || relPath.includes('combinations')) return 'Tier 3';
  if (relPath.includes('tier4') || relPath.includes('scenarios')) return 'Tier 4';
  if (relPath.includes('harness')) return 'Harness';
  return 'Other';
}

function filterTestFiles(files, options) {
  return files.filter((filePath) => {
    const rel = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    const tier = categorizeTier(filePath);

    // Tier filtering
    if (options.tier) {
      const targetTier = `Tier ${options.tier}`;
      if (tier !== targetTier) {
        return false;
      }
    }

    // Keyword filter
    if (options.filter) {
      const match = rel.toLowerCase().includes(options.filter.toLowerCase());
      if (!match) return false;
    }

    return true;
  });
}

// --- Execution Utilities ---
async function runWithTimeout(fn, timeoutMs) {
  let timerId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Test timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return await Promise.race([result, timeoutPromise]);
    }
    return result;
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

function collectAncestors(suite) {
  const ancestors = [];
  let cur = suite;
  while (cur) {
    ancestors.unshift(cur);
    cur = cur.parent;
  }
  return ancestors;
}

// --- Runner Engine ---
export async function run() {
  const startTime = performance.now();
  resetAssertionCount();

  console.log(`\n\x1b[1m\x1b[36m========================================================================\x1b[0m`);
  console.log(`\x1b[1m  PORTFOLIO E2E TEST RUNNER — Standalone Native ESM Engine\x1b[0m`);
  console.log(`  Node: ${process.version} | Platform: ${process.platform} | PID: ${process.pid}`);
  console.log(`\x1b[1m\x1b[36m========================================================================\x1b[0m\n`);

  const allFiles = discoverTestFiles(testsRoot);
  const matchedFiles = filterTestFiles(allFiles, cliOptions);

  if (matchedFiles.length === 0) {
    console.log(`\x1b[33mNo test files found matching criteria (tier: ${cliOptions.tier || 'all'}, filter: ${cliOptions.filter || 'none'})\x1b[0m\n`);
    return { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0, assertions: 0 };
  }

  console.log(`Discovered \x1b[1m${matchedFiles.length}\x1b[0m test file(s) across selected tiers:\n`);

  const stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    failures: [],
    tierBreakdown: {},
  };

  for (const file of matchedFiles) {
    const relFile = path.relative(projectRoot, file).replace(/\\/g, '/');
    const tierName = categorizeTier(file);
    if (!stats.tierBreakdown[tierName]) {
      stats.tierBreakdown[tierName] = { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0 };
    }

    const tierStats = stats.tierBreakdown[tierName];
    console.log(`\x1b[1m\x1b[34m[${tierName}] ${relFile}\x1b[0m`);

    rootSuites = [];
    currentSuite = null;

    try {
      // Dynamic import of test file with cache-busting query
      const fileUrl = `${pathToFileURL(file).href}?t=${Date.now()}`;
      await import(fileUrl);
    } catch (err) {
      console.log(`  \x1b[31m× Failed to load test module:\x1b[0m ${err.message}`);
      stats.failed++;
      stats.total++;
      tierStats.failed++;
      tierStats.total++;
      stats.failures.push({
        file: relFile,
        suite: 'Module Import',
        name: 'import',
        error: err,
      });
      if (cliOptions.bail) {
        break;
      }
      continue;
    }

    // Execute discovered suites
    async function executeSuite(suite) {
      const suiteStartTime = performance.now();
      const ancestors = collectAncestors(suite);
      console.log(`  \x1b[1m${suite.name}\x1b[0m`);

      // Run beforeAll hooks
      for (const hook of suite.beforeAllHooks) {
        try {
          await runWithTimeout(hook, cliOptions.timeout);
        } catch (err) {
          console.log(`    \x1b[31m× beforeAll hook failed in "${suite.name}":\x1b[0m ${err.message}`);
          throw err;
        }
      }

      // Execute tests
      for (const testCase of suite.tests) {
        stats.total++;
        tierStats.total++;

        if (testCase.skip) {
          stats.skipped++;
          tierStats.skipped++;
          console.log(`    \x1b[33m○\x1b[0m ${testCase.name} \x1b[90m(skipped)\x1b[0m`);
          continue;
        }

        const t0 = performance.now();
        const startAssertions = getAssertionCount();

        try {
          // Run chained beforeEach hooks
          for (const ancestor of ancestors) {
            for (const hook of ancestor.beforeEachHooks) {
              await runWithTimeout(hook, cliOptions.timeout);
            }
          }

          // Run test function
          const testTimeout = testCase.options.timeout || cliOptions.timeout;
          await runWithTimeout(testCase.fn, testTimeout);

          // Run chained afterEach hooks
          for (let i = ancestors.length - 1; i >= 0; i--) {
            for (const hook of ancestors[i].afterEachHooks) {
              await runWithTimeout(hook, cliOptions.timeout);
            }
          }

          const dt = (performance.now() - t0).toFixed(1);
          const assertionsRan = getAssertionCount() - startAssertions;
          const assertInfo = assertionsRan > 0 ? ` (${assertionsRan} assert${assertionsRan === 1 ? '' : 's'})` : '';
          console.log(`    \x1b[32m√\x1b[0m ${testCase.name} \x1b[90m(${dt}ms${assertInfo})\x1b[0m`);

          stats.passed++;
          tierStats.passed++;
        } catch (err) {
          const dt = (performance.now() - t0).toFixed(1);
          console.log(`    \x1b[31m×\x1b[0m ${testCase.name} \x1b[90m(${dt}ms)\x1b[0m`);
          console.log(`      \x1b[31mError: ${err.message}\x1b[0m`);
          if (cliOptions.verbose && err.stack) {
            const cleanStack = err.stack.split('\n').slice(1, 4).join('\n');
            console.log(`      \x1b[90m${cleanStack}\x1b[0m`);
          }

          stats.failed++;
          tierStats.failed++;
          stats.failures.push({
            file: relFile,
            suite: suite.getFullName(),
            name: testCase.name,
            error: err,
          });

          // Run afterEach cleanup on failure
          for (let i = ancestors.length - 1; i >= 0; i--) {
            for (const hook of ancestors[i].afterEachHooks) {
              try {
                await runWithTimeout(hook, 2000);
              } catch {
                // Ignore secondary cleanup error
              }
            }
          }

          if (cliOptions.bail) {
            console.log(`\n\x1b[31m[BAIL] Halting execution immediately on test failure.\x1b[0m`);
            return false;
          }
        }
      }

      // Run nested child suites
      for (const childSuite of suite.suites) {
        const cont = await executeSuite(childSuite);
        if (cont === false) return false;
      }

      // Run afterAll hooks
      for (const hook of suite.afterAllHooks) {
        try {
          await runWithTimeout(hook, cliOptions.timeout);
        } catch (err) {
          console.log(`    \x1b[31m× afterAll hook failed in "${suite.name}":\x1b[0m ${err.message}`);
        }
      }

      tierStats.duration += performance.now() - suiteStartTime;
      return true;
    }

    let shouldContinue = true;
    for (const suite of rootSuites) {
      shouldContinue = await executeSuite(suite);
      if (shouldContinue === false) break;
    }

    console.log();
    if (shouldContinue === false) break;
  }

  const totalDuration = performance.now() - startTime;
  renderSummaryTable(stats, totalDuration);

  return stats;
}

function renderSummaryTable(stats, totalDuration) {
  const pad = (str, len, align = 'left') => {
    const s = String(str);
    if (s.length >= len) return s.slice(0, len);
    const space = ' '.repeat(len - s.length);
    return align === 'right' ? space + s : s + space;
  };

  console.log(`\x1b[1m════════════════════════════════════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[1m  E2E TEST EXECUTION SUMMARY\x1b[0m`);
  console.log(`\x1b[1m════════════════════════════════════════════════════════════════════════════════\x1b[0m`);

  console.log(`┌──────────────────────────────┬────────┬────────┬────────┬────────┬──────────┐`);
  console.log(`│ ${pad('Tier / Category', 28)} │ ${pad('Total', 6, 'right')} │ ${pad('Passed', 6, 'right')} │ ${pad('Failed', 6, 'right')} │ ${pad('Skip', 6, 'right')} │ ${pad('Duration', 8, 'right')} │`);
  console.log(`├──────────────────────────────┼────────┼────────┼────────┼────────┼──────────┤`);

  for (const [tier, tStats] of Object.entries(stats.tierBreakdown)) {
    const durStr = `${(tStats.duration / 1000).toFixed(2)}s`;
    const passColor = tStats.failed === 0 ? '\x1b[32m' : '\x1b[31m';
    console.log(
      `│ ${pad(tier, 28)} │ ${pad(tStats.total, 6, 'right')} │ ${passColor}${pad(tStats.passed, 6, 'right')}\x1b[0m │ ${tStats.failed > 0 ? '\x1b[31m' : ''}${pad(tStats.failed, 6, 'right')}\x1b[0m │ ${pad(tStats.skipped, 6, 'right')} │ ${pad(durStr, 8, 'right')} │`
    );
  }

  console.log(`├──────────────────────────────┼────────┼────────┼────────┼────────┼──────────┤`);
  const totalDurStr = `${(totalDuration / 1000).toFixed(2)}s`;
  const overallColor = stats.failed === 0 ? '\x1b[1m\x1b[32m' : '\x1b[1m\x1b[31m';
  console.log(
    `│ ${pad('TOTAL', 28)} │ ${pad(stats.total, 6, 'right')} │ ${overallColor}${pad(stats.passed, 6, 'right')}\x1b[0m │ ${stats.failed > 0 ? '\x1b[1m\x1b[31m' : ''}${pad(stats.failed, 6, 'right')}\x1b[0m │ ${pad(stats.skipped, 6, 'right')} │ ${pad(totalDurStr, 8, 'right')} │`
  );
  console.log(`└──────────────────────────────┴────────┴────────┴────────┴────────┴──────────┘`);

  const assertionCount = getAssertionCount();
  console.log(`  \x1b[1mAssertions Verified:\x1b[0m \x1b[36m${assertionCount}\x1b[0m`);
  console.log(`  \x1b[1mTotal Time:\x1b[0m          \x1b[36m${totalDurStr}\x1b[0m`);

  if (stats.failed > 0) {
    console.log(`\n\x1b[1m\x1b[31mFAILURES (${stats.failed}):\x1b[0m`);
    stats.failures.forEach((f, idx) => {
      console.log(`\x1b[31m  ${idx + 1}) [${f.file}] ${f.suite} > ${f.name}\x1b[0m`);
      console.log(`     ${f.error.message}`);
    });
    console.log(`\n\x1b[1m\x1b[31m>>> RESULT: FAILED (${stats.failed} test failure(s))\x1b[0m\n`);
  } else {
    console.log(`\n\x1b[1m\x1b[32m>>> RESULT: ALL TESTS PASSED (100% pass rate)\x1b[0m\n`);
  }
}

// Auto-run if executed directly as entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run()
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Test Runner Error:', err);
      process.exit(1);
    });
}

const runner = {
  run,
  describe,
  it,
  test,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  expect,
};

export default runner;
