# The Expo export succeeds on canonical — which sharpens the diagnosis rather than closing it

**Yesterday I showed that the Replit build swallows a failed Expo web export and serves the previous bundle. That mechanism is real. I then ran the export myself rather than leaving it as a mechanism.**

**It succeeds. `EXPO_EXIT=0`, 3,541 modules, 19 MB, a valid `index.html`.**

**So the Cars UI does not fail to build because of a code defect. If it fails on Replit, it fails for a resource reason — and I must say that plainly rather than let yesterday's report imply the code is broken.**

`canonical @ 4f2c81c` · full install, real Metro run. **2026-08-23.**

---

# §1 · The run

```
$ node node_modules/expo/bin/cli export --output-dir /tmp/expo-probe --platform web

React Compiler enabled
Starting Metro Bundler
… (3479/3541) modules

› web bundles (2):
  _expo/static/js/web/entry-48196ab1f19097ca31a33111c50b2e44.js   7.16 MB
  _expo/static/js/web/index-51f0d3bb5161e62167c43aa799dc8a1d.js   11.2 kB
› Files (3): favicon.ico · index.html (1.21 kB) · metadata.json

Exported: /tmp/expo-probe          EXPO_EXIT=0          total 19 MB
```

**On a 15 GB machine, with a warm `pnpm install --frozen-lockfile`, it completes.**

---

# §2 · ⚠️ What this corrects in yesterday's report

**Yesterday I wrote:**
> *"the Expo web export fails — any cause"*

**as step 3 of the chain. I never tested whether it does.** *The mechanism I proved is that a failure would be swallowed. Whether a failure occurs is a separate question, and I had folded the two together.*

**Corrected statement:**

> **The build is unsafe by construction — a failed export cannot fail the deploy. That is proven and it is worth fixing regardless.**
> **Whether the export is currently failing on Replit is unproven, and the export is healthy on canonical.**

---

# §3 · What would make it fail there and not here — measured, then labelled as hypothesis

**The job's shape, measured:**
```
modules bundled       3,541
single entry bundle   7.16 MB
total output          19 MB
this machine          15 GB RAM
.replit resource declaration   none
```

**A Metro run over 3,541 modules producing a 7.16 MB bundle is memory-hungry, and Replit build containers are far smaller than 15 GB.** *An OOM kill is the most likely candidate, and an OOM-killed process returns non-zero — straight into `|| warn`.*

> **I am labelling that a hypothesis, not a finding. I have not observed the Replit container's limits and I will not assert a cause I have not measured.**

**And it connects to something already in the register:** my first audit, 2026-08-11, filed **M-6 — Web bundle weight: 19 MB total with a single 7.13 MB JS chunk.** *Twelve days later it measures 7.16 MB. It has not been addressed, and it may be the thing that makes this build unable to complete anywhere smaller than a laptop.*

---

# §4 · 🔴 THE CONSEQUENCE THE OWNER MUST BE TOLD BEFORE HE MERGES

**The build fix makes the failure visible. It does not make the export succeed.**

```
today          export fails  →  || warn  →  deploy "successful"  →  stale Cars bundle
after the fix  export fails  →  build FAILS  →  deploy FAILS      →  no stale bundle, and no deploy
```

> **If the export is genuinely being OOM-killed on Replit, then merging the fix converts a silent staleness into a loud failure.** *That is strictly better — a deploy that refuses is honest, and a deploy that lies is not — but it must be said in advance, or the first red deploy will look like the merge caused it.*

**It did not. It revealed it.**

**So the order gains a step:**
**① merge the trunk candidate** (the build stops lying) → **② if the deploy now fails, that is the real error surfacing** → **③ read it, and if it is memory, M-6 becomes urgent instead of Medium.**

---

# §5 · The one command that separates the two worlds

**From the Replit shell, before merging anything:**

```bash
cd artifacts/banco-mobile && node node_modules/expo/bin/cli export --output-dir /tmp/probe --platform web
```

- **It completes** → the export is fine there too, and the staleness has another cause. **I will chase that cause with a real reproduction.**
- **It is killed, or exits non-zero** → the error it prints is the error the build script is currently throwing away. **Paste that line and the diagnosis closes.**

**Ten minutes, and it is the difference between fixing the right thing and fixing a plausible thing.**

---

# §6 · Standing

**No new register class. `M-6` is upgraded from Medium to a candidate root cause pending the command in §5.**

**Thirty-four corrections published** — this one narrows a claim of my own from "the export fails" to "the export cannot fail *the build*, and that is what is proven".

> **The mechanism was real and I proved it. The trigger I implied was not measured, and I ran it instead of leaving it. It succeeded, which is a worse outcome for my report and a better one for the diagnosis.**

---
*Export run to completion on a full canonical install with the pinned pnpm 11.9.0 and the pinned toolchain; module count, bundle size and total output taken from Metro's own summary. The OOM hypothesis stated as a hypothesis with the measurement that motivates it and no claim about the Replit container. The consequence of merging stated before the merge rather than after the first red deploy. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
