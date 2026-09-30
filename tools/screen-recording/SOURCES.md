# Local code provenance

These are editable copies in this repository, not remote runtime dependencies. Keep their original license notices when adapting or distributing substantial portions of their code.

| Local path | Upstream source at inspected commit | License / notes |
| --- | --- | --- |
| `vendor/demotale/` | `https://github.com/pesuto-dev/demotale`, `006dc19` | Apache-2.0. Original `LICENSE` and `NOTICE` included. Copied source, tests, templates, examples, install script, and package/build metadata; large documentation/media omitted. |
| `vendor/pagecast/` | `https://github.com/mcpware/pagecast`, `6bbf3c9` | MIT. Original `LICENSE` included. Copied source and package metadata; demo recordings/media omitted. |
| `vendor/demo-gif-template/` | `https://github.com/conorbronsdon/demo-gif-skill`, `059cb0f` | MIT. Original `LICENSE` included. Copied skill instructions and example browser script as a planning reference, not as an activated skill. |

Also inspected `https://github.com/G0d2i11a/demosmith-mcp` at `209f2b7`. Its `package.json` declares MIT but this checkout contains no LICENSE file. **No Demosmith code was copied.** Its approach is summarized in `PLAN.md`.

Local changes so far: removed two `vendor/demotale/test/package.test.ts` checks for upstream-only `.plan/`/`CLAUDE.md` files not copied into this repo. Modified `vendor/demotale/src/check.ts` to skip an intentional `about:blank` opening title card in the wrong-origin check; added a regression test in `test/check.test.ts`. Added configurable `captions.display` (`banner`, `dark-screen`, `light-screen`) in `src/config.ts`, full-screen fading interstitial markup/styles in `src/overlay.ts`, and an explanation-before-action hold/fade in `src/demo.ts`, with tests. Demotale typecheck, 233 tests, and build pass on local Node 26.3.1 with `npm ci --ignore-scripts`. Daybreak installs it as a local `file:` dependency; no upstream recorder package is needed at runtime. Keep documenting local changes and retain the original notices.
