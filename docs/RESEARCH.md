# dependency-license — research record

## Revision and scope

- Repository: [NickCirv/dependency-license](https://github.com/NickCirv/dependency-license)
- Commit: `c4b29211fd79266ffe847ded02493dc011229aea`
- Tree: `d8d55579348bbdce067d4c2c9c4510fe6ce7d8c0`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/package.json) | verified in manifest; installation unverified |
| Inspect license metadata in an installed npm dependency tree before a dependency review. | [implementation](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The scanner follows physical node_modules nesting and filters the top level to declared dependencies, so hoisted transitive packages can be missed. License matching uses string patterns, not a complete SPDX expression evaluator; CC0 can match the default CC family. UNKNOWN does not itself fail the command. This is a review aid, not a legal determination.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `8edf13ba2a2e443fa49e42493414f6952a4a14b6c407983a7c95162ab37f6265`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/LICENSE) · blob `481c289c06c96c07330f8c7dedd847c5c07ca384`.
- [README.md](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/README.md) · blob `4fcfef8274e502850f1b284ac721f3b35a54e117`.
- [package.json](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/package.json) · blob `8731f880000fce08008e2be0d6c1586ec00a4f10`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/index.js) · blob `ac56d09edcf737f066fa4224a086166b59be645a`.
- [test/smoke.test.js](https://github.com/NickCirv/dependency-license/blob/c4b29211fd79266ffe847ded02493dc011229aea/test/smoke.test.js) · blob `42b17878c6bb27b0cb7662526abe7ae2ae846ec2`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `banner.svg`
