<div align="center">

# dependency-license

**Scan your npm dependencies for licenses — flag copyleft before it bites you.**

[![License: MIT](https://img.shields.io/badge/License-MIT-0B0A09?style=flat&labelColor=0B0A09&color=green)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-0B0A09?style=flat&labelColor=0B0A09&color=blue)](package.json)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-0B0A09?style=flat&labelColor=0B0A09&color=brightgreen)](package.json)

</div>

## Install

```bash
npx github:NickCirv/dependency-license
```

## Usage

```bash
# Default scan — flags copyleft (GPL, AGPL, LGPL) automatically
npx github:NickCirv/dependency-license

# Strict allowlist — flags anything not in the list, exit 1 on violation
npx github:NickCirv/dependency-license --allow "MIT,Apache-2.0,ISC,BSD-2-Clause,BSD-3-Clause"

# Explicit denylist for CI
npx github:NickCirv/dependency-license --deny "GPL,AGPL,LGPL" --production
```

| Flag | Description | Default |
|------|-------------|---------|
| `--allow "<list>"` | Flag any license NOT in this comma-separated list | — |
| `--deny "<list>"` | Flag if any listed license found; exit 1 | Copyleft auto-flagged |
| `--format table\|json\|csv` | Output format | `table` |
| `--output <file>` | Save report to file | stdout |
| `--production` | Only check non-devDependencies | false |
| `--depth <n>` | Scan depth (1 = direct deps only) | all |
| `--cwd <path>` | Project root | `process.cwd()` |
| `-h, --help` | Show help | — |

## What it does

Walks `node_modules`, reads each package's `package.json` and LICENSE file, and classifies licenses against your allow/deny rules. Copyleft families (GPL, AGPL, LGPL) are flagged by default with no configuration needed. Outputs a sorted table — flagged packages first — with exit code 1 on violations, making it drop-in for CI pipelines.

```
Package                      Version   License              Risk
────────────────────────────────────────────────────────────────
some-gpl-lib                 1.0.0     GPL-3.0              ⚠ FLAGGED
express                      4.18.2    MIT                  ✓
chalk                        5.3.0     MIT                  ✓

Total: 3  Unique licenses: 2  Unknown: 0  Flagged: 1
```

## CI Usage

```yaml
- name: License check
  run: npx github:NickCirv/dependency-license --deny "GPL,AGPL,LGPL" --production
```

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
