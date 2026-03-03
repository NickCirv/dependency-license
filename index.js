#!/usr/bin/env node
// dependency-license — scan npm dependencies for licenses
// Zero external dependencies. Node 18+ required.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

// ─── License detection patterns ───────────────────────────────────────────────

const LICENSE_PATTERNS = [
  { id: 'MIT',          re: /\bMIT\b/i },
  { id: 'ISC',          re: /\bISC\b/i },
  { id: 'Apache-2.0',   re: /Apache[- ]License[,\s]+Version\s*2\.0|Apache-2\.0/i },
  { id: 'BSD-3-Clause', re: /BSD[- ]3[- ]Clause|3[- ]Clause BSD|redistributions? in binary/i },
  { id: 'BSD-2-Clause', re: /BSD[- ]2[- ]Clause|2[- ]Clause BSD/i },
  { id: 'BSD',          re: /\bBSD\b/i },
  { id: 'GPL-3.0',      re: /GNU GENERAL PUBLIC LICENSE[^]*?Version\s*3|GPL-3\.0|GPLv3/i },
  { id: 'GPL-2.0',      re: /GNU GENERAL PUBLIC LICENSE[^]*?Version\s*2|GPL-2\.0|GPLv2/i },
  { id: 'GPL',          re: /GNU GENERAL PUBLIC LICENSE|GPL/i },
  { id: 'AGPL-3.0',     re: /GNU AFFERO GENERAL PUBLIC LICENSE|AGPL-3\.0|AGPLv3/i },
  { id: 'AGPL',         re: /AGPL/i },
  { id: 'LGPL-3.0',     re: /GNU LESSER GENERAL PUBLIC LICENSE[^]*?Version\s*3|LGPL-3\.0|LGPLv3/i },
  { id: 'LGPL-2.1',     re: /GNU LESSER GENERAL PUBLIC LICENSE[^]*?Version\s*2\.1|LGPL-2\.1/i },
  { id: 'LGPL',         re: /GNU LESSER GENERAL PUBLIC LICENSE|LGPL/i },
  { id: 'MPL-2.0',      re: /Mozilla Public License[,\s]+Version\s*2\.0|MPL-2\.0/i },
  { id: 'MPL',          re: /Mozilla Public License/i },
  { id: 'CC0-1.0',      re: /CC0|Creative Commons Zero|Public Domain Dedication/i },
  { id: 'Unlicense',    re: /This is free and unencumbered software released into the public domain|UNLICENSE/i },
  { id: 'WTFPL',        re: /WTFPL|DO WHAT THE FUCK YOU WANT/i },
];

const COPYLEFT_FAMILIES = ['GPL', 'AGPL', 'LGPL', 'MPL', 'CC'];
const DEFAULT_DENY      = ['GPL', 'AGPL', 'LGPL'];
const DEFAULT_ALLOW     = ['MIT', 'Apache-2.0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD', 'CC0-1.0', 'Unlicense', '0BSD'];

// ─── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    allow:      null,   // comma-separated or null
    deny:       null,   // comma-separated or null
    format:     'table',
    output:     null,
    production: false,
    depth:      Infinity,
    help:       false,
    cwd:        process.cwd(),
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h')        { opts.help = true; continue; }
    if (a === '--production')                { opts.production = true; continue; }
    if (a === '--allow')                     { opts.allow = args[++i]; continue; }
    if (a === '--deny')                      { opts.deny  = args[++i]; continue; }
    if (a === '--format')                    { opts.format = args[++i]; continue; }
    if (a === '--output')                    { opts.output = args[++i]; continue; }
    if (a === '--depth')                     { opts.depth = parseInt(args[++i], 10); continue; }
    if (a.startsWith('--allow='))            { opts.allow = a.slice(8); continue; }
    if (a.startsWith('--deny='))             { opts.deny  = a.slice(7); continue; }
    if (a.startsWith('--format='))           { opts.format = a.slice(9); continue; }
    if (a.startsWith('--output='))           { opts.output = a.slice(9); continue; }
    if (a.startsWith('--depth='))            { opts.depth = parseInt(a.slice(8), 10); continue; }
    if (a === '--cwd')                       { opts.cwd = args[++i]; continue; }
  }

  if (opts.allow) opts.allowList = opts.allow.split(',').map(s => s.trim().toUpperCase());
  if (opts.deny)  opts.denyList  = opts.deny.split(',').map(s => s.trim().toUpperCase());

  return opts;
}

// ─── License detection from file text ────────────────────────────────────────

function detectLicenseFromText(text) {
  const sample = text.slice(0, 600);
  for (const { id, re } of LICENSE_PATTERNS) {
    if (re.test(sample)) return id;
  }
  return null;
}

// ─── Normalise a license string from package.json ─────────────────────────────

function normaliseLicense(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && raw.type) raw = raw.type;
  if (typeof raw !== 'string') return null;
  return raw.trim();
}

// ─── Scan a single package directory ─────────────────────────────────────────

function readPackageInfo(pkgDir) {
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) return null;

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  } catch {
    return null;
  }

  const name    = pkg.name    || '';
  const version = pkg.version || '';
  let   license = normaliseLicense(pkg.license) || normaliseLicense(pkg.licenses?.[0]);

  // Fallback: scan LICENSE file
  if (!license) {
    for (const fname of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'LICENCE.txt']) {
      const lpath = join(pkgDir, fname);
      if (existsSync(lpath)) {
        try {
          const text = readFileSync(lpath, 'utf8');
          license = detectLicenseFromText(text);
          if (license) break;
        } catch { /* ignore */ }
      }
    }
  }

  return { name, version, license: license || 'UNKNOWN', pkgJsonPath };
}

// ─── Collect direct deps from root package.json ───────────────────────────────

function getRootDeps(rootDir, productionOnly) {
  const pkgPath = join(rootDir, 'package.json');
  if (!existsSync(pkgPath)) return null; // no filter set
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = new Set([
      ...Object.keys(pkg.dependencies   || {}),
      ...(productionOnly ? [] : Object.keys(pkg.devDependencies || {})),
      ...(productionOnly ? [] : Object.keys(pkg.peerDependencies || {})),
      ...(productionOnly ? [] : Object.keys(pkg.optionalDependencies || {})),
    ]);
    return deps;
  } catch {
    return null;
  }
}

// ─── Walk node_modules recursively ───────────────────────────────────────────

function walkNodeModules(nmDir, currentDepth, maxDepth, seen, results, directDeps) {
  if (!existsSync(nmDir)) return;

  let entries;
  try {
    entries = readdirSync(nmDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === '.bin') continue;

    // Scoped packages (@org/name)
    if (entry.startsWith('@')) {
      const scopeDir = join(nmDir, entry);
      try {
        const scoped = readdirSync(scopeDir);
        for (const scopedPkg of scoped) {
          if (scopedPkg.startsWith('.')) continue;
          const pkgDir = join(scopeDir, scopedPkg);
          processPackage(pkgDir, `${entry}/${scopedPkg}`, currentDepth, maxDepth, seen, results, directDeps, nmDir);
        }
      } catch { /* ignore */ }
      continue;
    }

    const pkgDir = join(nmDir, entry);
    processPackage(pkgDir, entry, currentDepth, maxDepth, seen, results, directDeps, nmDir);
  }
}

function processPackage(pkgDir, name, currentDepth, maxDepth, seen, results, directDeps, nmDir) {
  try {
    if (!statSync(pkgDir).isDirectory()) return;
  } catch {
    return;
  }

  // Depth 1 means only direct deps
  if (currentDepth === 1 && directDeps && !directDeps.has(name)) return;

  const info = readPackageInfo(pkgDir);
  if (!info) return;

  const key = `${info.name}@${info.version}`;
  if (seen.has(key)) return;
  seen.add(key);

  results.push(info);

  // Recurse into nested node_modules if depth allows
  if (currentDepth < maxDepth) {
    const nestedNm = join(pkgDir, 'node_modules');
    if (existsSync(nestedNm)) {
      walkNodeModules(nestedNm, currentDepth + 1, maxDepth, seen, results, null);
    }
  }
}

// ─── Risk assessment ──────────────────────────────────────────────────────────

function assessRisk(license, opts) {
  const upper = license.toUpperCase();

  if (opts.denyList) {
    for (const d of opts.denyList) {
      if (upper.includes(d)) return 'FLAGGED';
    }
    return license === 'UNKNOWN' ? 'UNKNOWN' : 'OK';
  }

  if (opts.allowList) {
    if (license === 'UNKNOWN') return 'UNKNOWN';
    for (const a of opts.allowList) {
      if (upper === a || upper.startsWith(a)) return 'OK';
    }
    return 'FLAGGED';
  }

  // Default mode: flag copyleft
  if (license === 'UNKNOWN') return 'UNKNOWN';
  for (const family of COPYLEFT_FAMILIES) {
    if (upper.includes(family)) return 'FLAGGED';
  }
  return 'OK';
}

function riskIcon(risk) {
  if (risk === 'OK')      return '✓';
  if (risk === 'FLAGGED') return '⚠ FLAGGED';
  return '?';
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTable(rows, summary) {
  const COL = { pkg: 28, ver: 10, lic: 20, risk: 12 };
  const header = 'Package'.padEnd(COL.pkg) + 'Version'.padEnd(COL.ver) + 'License'.padEnd(COL.lic) + 'Risk';
  const sep    = '─'.repeat(COL.pkg + COL.ver + COL.lic + COL.risk);

  const lines = [header, sep];
  for (const r of rows) {
    lines.push(
      r.name.slice(0, COL.pkg - 1).padEnd(COL.pkg) +
      r.version.slice(0, COL.ver - 1).padEnd(COL.ver) +
      r.license.slice(0, COL.lic - 1).padEnd(COL.lic) +
      riskIcon(r.risk)
    );
  }
  lines.push('');
  lines.push(`Total: ${summary.total}  Unique licenses: ${summary.uniqueLicenses}  Unknown: ${summary.unknown}  Flagged: ${summary.flagged}`);
  return lines.join('\n');
}

function formatJson(rows, summary) {
  return JSON.stringify({ summary, packages: rows }, null, 2);
}

function formatCsv(rows) {
  const header = 'Package,Version,License,Risk';
  const body   = rows.map(r =>
    `"${r.name}","${r.version}","${r.license}","${r.risk}"`
  );
  return [header, ...body].join('\n');
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(rows) {
  const licenses = new Set(rows.map(r => r.license));
  return {
    total:          rows.length,
    uniqueLicenses: licenses.size,
    unknown:        rows.filter(r => r.license === 'UNKNOWN').length,
    flagged:        rows.filter(r => r.risk === 'FLAGGED').length,
    licenses:       [...licenses].sort(),
  };
}

// ─── Help ────────────────────────────────────────────────────────────────────

function printHelp() {
  process.stdout.write(`
dependency-license — scan npm dependencies for licenses

USAGE
  dlicense [options]
  dependency-license [options]

OPTIONS
  --allow "MIT,Apache-2.0,ISC"   Only flag licenses NOT in this list
  --deny "GPL,AGPL,LGPL"         Flag if any denied license found (exit 1)
  --format table|json|csv        Output format (default: table)
  --output <file>                Save report to file
  --production                   Only check non-devDependencies
  --depth <n>                    Scan depth (1 = direct deps only)
  --cwd <path>                   Project directory (default: cwd)
  -h, --help                     Show this help

EXIT CODES
  0   All licenses clean
  1   Flagged licenses found
  2   Error (no node_modules, parse failure, etc.)

EXAMPLES
  dlicense
  dlicense --deny "GPL,AGPL,LGPL" --format json
  dlicense --allow "MIT,Apache-2.0,ISC,BSD-2-Clause,BSD-3-Clause"
  dlicense --production --depth 1 --output licenses.csv --format csv

LICENSE RISK LEVELS
  ✓           Allowed / not flagged
  ⚠ FLAGGED   Matches deny list or copyleft by default
  ?           License could not be determined

`.trimStart());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const rootDir = resolve(opts.cwd);
  const nmDir   = join(rootDir, 'node_modules');

  if (!existsSync(nmDir)) {
    process.stderr.write(`Error: no node_modules found at ${nmDir}\nRun 'npm install' first.\n`);
    process.exit(2);
  }

  // Collect direct deps for --depth 1 / --production filtering
  const directDeps = getRootDeps(rootDir, opts.production);

  // Walk node_modules
  const seen    = new Set();
  const results = [];
  walkNodeModules(nmDir, 1, opts.depth, seen, results, directDeps);

  // Assess risk
  for (const r of results) {
    r.risk = assessRisk(r.license, opts);
  }

  // Sort: flagged first, then unknown, then OK, alpha within groups
  results.sort((a, b) => {
    const rank = { FLAGGED: 0, UNKNOWN: 1, OK: 2 };
    const rd   = (rank[a.risk] ?? 2) - (rank[b.risk] ?? 2);
    if (rd !== 0) return rd;
    return a.name.localeCompare(b.name);
  });

  const summary = buildSummary(results);

  // Render
  let output;
  if (opts.format === 'json') {
    output = formatJson(results, summary);
  } else if (opts.format === 'csv') {
    output = formatCsv(results);
  } else {
    output = formatTable(results, summary);
  }

  if (opts.output) {
    try {
      writeFileSync(opts.output, output, 'utf8');
      process.stdout.write(`Saved to ${opts.output}\n`);
    } catch (err) {
      process.stderr.write(`Error writing file: ${err.message}\n`);
      process.exit(2);
    }
  } else {
    process.stdout.write(output + '\n');
  }

  // Exit code
  if (summary.flagged > 0) {
    // Only exit 1 if deny list was explicitly set, or default copyleft check triggered
    process.exit(1);
  }
  process.exit(0);
}

main();
