#!/usr/bin/env node
/**
 * ADR-0034 gate: LocaleRoute wrapper + absolute nested paths crash SPA init.
 *
 * Umi `wrappers` inserts an extra route node at the parent path; the layout route
 * gets path "" and React Router flattenRoutes joins parentPath as "/catalog/".
 * Absolute child paths like "/catalog" or "/catalog/publish" do NOT start with
 * "/catalog/" and throw during client route matching — entire SPA white-screens.
 *
 * Rule: after getConfigRoutes (same as umi), build the client route tree and run
 * the same flattenRoutes prefix assertion as @remix-run/router.
 *
 * Usage:
 *   node scripts/check-routes.mjs              # validate frontend/config/routes.ts
 *   node scripts/check-routes.mjs --self-test  # inline bad/good fixtures
 *
 * Exit: 0 pass, 1 fail.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const ROUTES_TS = path.join(FRONTEND, 'config', 'routes.ts');

const requireFromFrontend = createRequire(path.join(FRONTEND, 'package.json'));
const { getConfigRoutes } = requireFromFrontend('@umijs/core');

/** @typedef {{ path?: string | null, children?: RouteNode[], index?: boolean }} RouteNode */

/**
 * Mirrors @umijs/renderer-react createClientRoutes (path + parentId tree only).
 * @param {Record<string, { path?: string, parentId?: string }>} routesById
 * @param {string | undefined} parentId
 * @returns {RouteNode[]}
 */
function createClientRouteTree(routesById, parentId = undefined) {
  return Object.keys(routesById)
    .filter((id) => routesById[id].parentId === parentId)
    .map((id) => {
      /** @type {RouteNode} */
      const route = { path: routesById[id].path };
      const children = createClientRouteTree(routesById, id);
      if (children.length) route.children = children;
      return route;
    });
}

/** @param {string[]} paths */
function joinPaths(paths) {
  return paths.join('/').replace(/\/\/+/g, '/');
}

/**
 * Same invariant as @remix-run/router flattenRoutes (absolute child prefix).
 * @param {RouteNode[]} routes
 * @param {{ path: string }[]} [branches]
 * @param {string} [parentPath]
 * @returns {{ branches: { path: string }[], count: number }}
 */
function flattenRoutes(routes, branches = [], parentPath = '') {
  const flattenRoute = (route, relativePath) => {
    const meta = {
      relativePath: relativePath === undefined ? route.path || '' : relativePath,
    };

    if (meta.relativePath.startsWith('/')) {
      if (!meta.relativePath.startsWith(parentPath)) {
        throw new Error(
          `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. ` +
            'An absolute child route path must start with the combined path of all its parent routes. ' +
            'Under LocaleRoute wrappers use relative child paths (\'\', \':id\', \'publish\', …).',
        );
      }
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    const joined = joinPaths([parentPath, meta.relativePath]);

    if (route.children?.length) {
      flattenRoutes(route.children, branches, joined);
    }

    if (route.path == null && !route.index) return;

    branches.push({ path: joined });
  };

  for (const route of routes) flattenRoute(route, undefined);
  return { branches, count: branches.length };
}

/**
 * @param {unknown[]} configRoutes
 * @returns {{ branches: { path: string }[], count: number }}
 */
function validateConfigRoutes(configRoutes) {
  const flat = getConfigRoutes({
    routes: configRoutes,
    onResolveComponent: (component) => component,
  });
  const tree = createClientRouteTree(flat);
  return flattenRoutes(tree);
}

/** Incident fixture: absolute /catalog children under LocaleRoute wrapper (a5a2da2c). */
const FIXTURE_BAD_LOCALE_WRAPPER = [
  {
    path: '/catalog',
    wrappers: ['@/components/LocaleRoute'],
    component: '../layouts/CatalogLayout',
    routes: [
      { path: '/catalog', component: './catalog' },
      { path: '/catalog/publish', component: './catalog/publish' },
    ],
  },
];

const FIXTURE_GOOD_LOCALE_WRAPPER = [
  {
    path: '/catalog',
    wrappers: ['@/components/LocaleRoute'],
    component: '../layouts/CatalogLayout',
    routes: [
      { path: '', component: './catalog' },
      { path: 'publish', component: './catalog/publish' },
    ],
  },
];

function runSelfTest() {
  let failed = false;

  try {
    validateConfigRoutes(FIXTURE_BAD_LOCALE_WRAPPER);
    console.error('[check-routes] self-test FAIL: bad fixture should throw');
    failed = true;
  } catch (err) {
    console.log('[check-routes] self-test OK: bad fixture rejected');
    console.log(`  → ${err.message.split('\n')[0]}`);
  }

  try {
    const { count } = validateConfigRoutes(FIXTURE_GOOD_LOCALE_WRAPPER);
    console.log(`[check-routes] self-test OK: good fixture flattened (${count} branches)`);
  } catch (err) {
    console.error('[check-routes] self-test FAIL: good fixture should pass');
    console.error(`  → ${err.message}`);
    failed = true;
  }

  if (failed) process.exit(1);
  console.log('[check-routes] self-test PASS');
  process.exit(0);
}

function loadRoutesFromTs() {
  const loader = path.join(__dirname, 'load-routes-for-check.ts');
  const json = execFileSync('npx', ['--yes', 'tsx', loader], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(json);
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }

  let configRoutes;
  try {
    configRoutes = loadRoutesFromTs();
  } catch (err) {
    console.error('[check-routes] failed to load frontend/config/routes.ts');
    console.error(err.message || err);
    process.exit(1);
  }

  try {
    const { count } = validateConfigRoutes(configRoutes);
    console.log(
      `[check-routes] PASS — ${path.relative(ROOT, ROUTES_TS)} flattens OK (${count} branches)`,
    );
    process.exit(0);
  } catch (err) {
    console.error(`[check-routes] FAIL — ${path.relative(ROOT, ROUTES_TS)}`);
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
