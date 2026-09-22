# dependency-license — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `c4b29211fd79266ffe847ded02493dc011229aea`. Commands are source-inspected; no execution results are asserted.

## Workflow

Reads package manifests and falls back to license-file text. Reports package, version, detected license and a summary in table, JSON or CSV form. Explicit allow/deny lists change the classification; --output writes a report.

Install the target project dependencies before scanning. Exit 1 means flagged licenses; missing node_modules or an output-write error exits 2.

```bash
node index.js --cwd ../your-project --depth 1 --format json
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--cwd PATH` | Select the project whose installed dependencies are scanned |
| `--depth N` | Bound physical node_modules nesting |
| `--allow LIST` | Classify against a comma-separated allowlist |
| `--deny LIST` | Flag matching license strings |
| `--format json` | Emit summary and package records |

## Interpretation and side effects

The scanner follows physical node_modules nesting and filters the top level to declared dependencies, so hoisted transitive packages can be missed. License matching uses string patterns, not a complete SPDX expression evaluator; CC0 can match the default CC family. UNKNOWN does not itself fail the command. This is a review aid, not a legal determination.

## Implementation reference

- [package.json](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/package.json)
- [index.js](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/test/smoke.test.js)
