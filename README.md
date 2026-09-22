![dependency-license — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# dependency-license

Inspect license metadata in an installed npm dependency tree before a dependency review.


<a id="usage"></a>

## What it does

Reads package manifests and falls back to license-file text. Reports package, version, detected license and a summary in table, JSON or CSV form. Explicit allow/deny lists change the classification; --output writes a report. See the pinned [implementation](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Install the target project dependencies before scanning. Exit 1 means flagged licenses; missing node_modules or an output-write error exits 2.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/dependency-license.git
cd dependency-license
git checkout c4b29211fd79266ffe847ded02493dc011229aea
npm install --ignore-scripts
node index.js --cwd ../your-project --depth 1 --format json
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`dependency-license` | `dlicense` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--cwd PATH` | Select the project whose installed dependencies are scanned |
| `--depth N` | Bound physical node_modules nesting |
| `--allow LIST` | Classify against a comma-separated allowlist |
| `--deny LIST` | Flag matching license strings |
| `--format json` | Emit summary and package records |

## Limits and operational notes

The scanner follows physical node_modules nesting and filters the top level to declared dependencies, so hoisted transitive packages can be missed. License matching uses string patterns, not a complete SPDX expression evaluator; CC0 can match the default CC family. UNKNOWN does not itself fail the command. This is a review aid, not a legal determination.


<a id="ci-usage"></a>

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
