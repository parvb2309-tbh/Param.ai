import * as chatRenderer from './chatRenderer.js';

/**
 * Demo / sample conversations demonstrating Param features:
 * 1. PDF analysis, tool usage (read_file & write_file diff), and summarization.
 * 2. Industry-level code generation, thread-safe concurrency, and sandbox execution (bash).
 */

export function isDemoChatActive() {
  const box = document.getElementById('chat-history');
  return !!(box && (box.querySelector('[data-demo]') || box.querySelector('[data-demo="true"]')));
}

export function clearDemoChatIfPresent() {
  const box = document.getElementById('chat-history');
  if (!box) return false;
  const demoElements = box.querySelectorAll('[data-demo], [data-demo="true"], .demo-approval-resolved, .demo-approval-reset-bar');
  if (demoElements.length > 0) {
    const allMsgs = box.querySelectorAll('.msg, .agent-thread');
    if (allMsgs.length === box.querySelectorAll('.msg[data-demo], .agent-thread[data-demo], .msg[data-demo="true"], .agent-thread[data-demo="true"]').length) {
      box.innerHTML = '';
      return true;
    }
  }
  return false;
}

/**
 * Demo 1: PDF Key Findings & File Creation
 */
export function renderDemoChat(force = false) {
  const box = document.getElementById('chat-history');
  if (!box) return;

  const realMsgs = box.querySelectorAll('.msg:not([data-demo="true"])');
  if (!force && realMsgs.length > 0) return;
  if (!force && (box.querySelector('[data-demo="pdf"]') || box.querySelector('[data-demo-type="pdf"]'))) return;

  box.innerHTML = '';

  const userContent = 'I have uploaded `Market_Research_Report_2024.pdf`. Could you please review it, extract the key findings, and summarize them into a text file named `key_findings.txt`?';

  const userMeta = {
    attachments: [
      {
        name: 'Market_Research_Report_2024.pdf',
        mime: 'application/pdf',
        size: 2490368
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('user', userContent, null, userMeta);

  const diffContent = `@@ -0,0 +1,27 @@
+# Key Findings Summary: Global Enterprise AI Market 2024
+# Source: Market_Research_Report_2024.pdf
+
+1. Accelerating Adoption:
+   - Enterprise generative AI deployments grew 142% year-over-year.
+   - 74% of surveyed Fortune 500 enterprises have active multi-agent pilots.
+
+2. Measurable Operational ROI:
+   - Support workflows demonstrated an average 18.4% cost reduction.
+   - Engineering teams reported a 28% increase in code delivery velocity.
+
+3. Primary Deployment Roadblocks:
+   - 68% of enterprise IT leaders cited data compliance and hallucination risk.
+   - Integration latency with on-prem legacy databases remains a bottleneck.
+
+4. Vendor & Tooling Trends:
+   - Shift towards open-weights models and private on-prem harnesses.
+   - Tool-calling agent architectures saw 3.2x higher adoption.
+
+5. Strategic Recommendations:
+   - Prioritize deterministic tool boundaries and guardrails.
+   - Implement human-in-the-loop validation checkpoints for write operations.
+   - Unify document retrieval using hybrid vector + lexical indexing.`;

  const assistantMeta = {
    model: 'qwen3-vl:4b-instruct',
    requested_model: 'qwen3-vl:4b-instruct',
    round_texts: [
      "I'll analyze `Market_Research_Report_2024.pdf`, extract the key findings across its sections, and save a structured summary into `key_findings.txt`.\n\nFirst, let me read and parse the PDF document.",
      "I have reviewed `Market_Research_Report_2024.pdf` and generated `key_findings.txt` with a structured breakdown.\n\n### Summary of Key Findings:\n\n1. **Accelerating Adoption**: Enterprise generative AI deployment surged by **142% year-over-year**, with **74% of Fortune 500 organizations** now actively running agentic workflow pilots.\n2. **Quantified ROI**: Customer-facing and support workflows demonstrated an **average 18.4% operational cost reduction**, while software engineering productivity saw a **28% velocity gain**.\n3. **Primary Roadblocks**: **68% of IT executives** highlighted regulatory compliance, data privacy, and model reliability as primary deployment hurdles, followed by legacy database integration.\n4. **Agentic Workflows**: Multi-step tool-calling architectures saw **3.2x higher adoption** compared to single-turn prompt models.\n5. **Strategic Guidance**: Organizations are advised to establish deterministic tool boundaries, enforce human-in-the-loop checkpoints for write operations, and deploy hybrid vector + lexical indexing.\n\nThe complete summary has been saved to **`key_findings.txt`** ✓"
    ],
    round_models: ['qwen3-vl:4b-instruct', 'qwen3-vl:4b-instruct'],
    tool_events: [
      {
        round: 1,
        tool: 'read_file',
        command: 'read_file("Market_Research_Report_2024.pdf")',
        output: 'Reading Market_Research_Report_2024.pdf (48 pages, ~16,200 words)...\n\n[PDF Document Metadata]\nTitle: 2024 Global Enterprise AI & Automation Market Analysis\nAuthor: Strategic Market Research Institute\nPublished: Q3 2024\n\n--- Identified Sections ---\n- Section 1: Executive Overview & Highlights\n- Section 2: Enterprise Adoption Metrics (YoY Growth: +142%)\n- Section 3: ROI Analysis & Operational Cost Reduction (Average 18.4% savings)\n- Section 4: Key Bottlenecks & Compliance Constraints (Security concerns in 68% of firms)\n- Section 5: Vendor Landscape & Agentic Workflow Projections\n- Section 6: Strategic Recommendations for FY2025\n\n[Document successfully parsed: 6 major findings identified]',
        exit_code: 0
      },
      {
        round: 1,
        tool: 'write_file',
        command: 'write_file("key_findings.txt")',
        output: 'Wrote 1,480 bytes to key_findings.txt',
        exit_code: 0,
        diff: {
          file: 'key_findings.txt',
          new_file: true,
          added: 27,
          removed: 0,
          text: diffContent
        }
      }
    ],
    response_time: 4.82,
    time_to_first_token: 0.95,
    tokens_per_second: 36.4,
    input_tokens: 2840,
    output_tokens: 396,
    total_tokens: 3236,
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', assistantMeta);

  box.querySelectorAll('.msg, .agent-thread').forEach(el => {
    el.dataset.demo = 'true';
    el.dataset.demoType = 'pdf';
  });

  const nodes = box.querySelectorAll('.agent-thread-node');
  nodes.forEach(node => {
    node.classList.add('open');
    const details = node.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));
  });

  // Add Reset button bar so user can re-try the demo anytime
  const resetBar = document.createElement('div');
  resetBar.className = 'demo-approval-reset-bar';
  resetBar.dataset.demo = 'true';
  resetBar.innerHTML = `
    <button type="button" class="demo-approval-reset-btn" aria-label="Restart Demo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      <span>Restart Demo</span>
    </button>
  `;
  resetBar.querySelector('button').addEventListener('click', () => {
    renderDemoChat(true);
  });
  box.appendChild(resetBar);

  chatRenderer.hideWelcomeScreen();

  const metaEl = document.getElementById('current-meta');
  if (metaEl) metaEl.textContent = 'Demo: PDF Key Findings';

  box.scrollTop = 0;
}

/**
 * Demo 2: Industry-level Code Generation & Sandbox Execution
 */
export function renderCodeDemoChat(force = false) {
  const box = document.getElementById('chat-history');
  if (!box) return;

  const realMsgs = box.querySelectorAll('.msg:not([data-demo="true"])');
  if (!force && realMsgs.length > 0) return;
  if (!force && (box.querySelector('[data-demo="code"]') || box.querySelector('[data-demo-type="code"]'))) return;

  box.innerHTML = '';

  // 1. User prompt requesting production-grade code and sandbox execution
  const userContent = 'Write an industry-level, production-ready Distributed Token Bucket Rate Limiter in Python with thread-safe concurrency, bursting support, and metrics logging. Then execute it in the sandbox to verify that it correctly handles concurrent requests, prevents race conditions, and reports accurate throughput stats.';

  const userMeta = {
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('user', userContent, null, userMeta);

  // 2. Assistant Response using write_file diff and bash sandbox execution
  const codeDiff = `@@ -0,0 +1,60 @@
+import time
+import threading
+from typing import Dict, Any
+
+class TokenBucketRateLimiter:
+    """Thread-safe Token Bucket Rate Limiter with burst capacity and telemetry."""
+    def __init__(self, rate: float, capacity: float):
+        if rate <= 0 or capacity <= 0:
+            raise ValueError("Rate and capacity must be positive numbers")
+        self.rate = float(rate)          # Sustained refill rate (tokens/sec)
+        self.capacity = float(capacity)  # Maximum burst capacity
+        self.tokens = float(capacity)
+        self.last_update = time.monotonic_ns()
+        self._lock = threading.RLock()
+        self.stats = {"total": 0, "allowed": 0, "throttled": 0}
+
+    def _replenish(self) -> None:
+        now = time.monotonic_ns()
+        elapsed_sec = (now - self.last_update) / 1e9
+        self.tokens = min(self.capacity, self.tokens + elapsed_sec * self.rate)
+        self.last_update = now
+
+    def acquire(self, tokens: float = 1.0) -> bool:
+        """Atomically attempt to acquire tokens without blocking."""
+        with self._lock:
+            self.stats["total"] += 1
+            self._replenish()
+            if self.tokens >= tokens:
+                self.tokens -= tokens
+                self.stats["allowed"] += 1
+                return True
+            self.stats["throttled"] += 1
+            return False
+
+    def get_metrics(self) -> Dict[str, Any]:
+        with self._lock:
+            return {**self.stats, "available_tokens": round(self.tokens, 2)}
+
+if __name__ == "__main__":
+    # Concurrent stress benchmark
+    limiter = TokenBucketRateLimiter(rate=100.0, capacity=20.0)
+    def worker(worker_id: int, count: int = 50):
+        for _ in range(count):
+            limiter.acquire(1.0)
+            time.sleep(0.002)
+    threads = [threading.Thread(target=worker, args=(i,)) for i in range(8)]
+    start = time.perf_counter()
+    for t in threads: t.start()
+    for t in threads: t.join()
+    duration = time.perf_counter() - start
+    m = limiter.get_metrics()
+    print(f"BENCHMARK COMPLETED IN {duration:.3f}s (8 threads, 400 requests)")
+    print(f"Total Requests  : {m['total']}")
+    print(f"Allowed (Pass)  : {m['allowed']}")
+    print(f"Throttled (429) : {m['throttled']}")
+    print(f"Tokens Remaining: {m['available_tokens']}")
+    print("Invariant Check : PASSED (0 race conditions, lock contention <0.05ms)")`;

  const sandboxOutput = `==================================================================
⚡ SANDBOX EXECUTION: python rate_limiter.py
==================================================================
[INFO] Environment: Python 3.11.9 (Sandboxed worker, 8 threads)
[INFO] Initialized TokenBucketRateLimiter: rate=100.0 req/s, capacity=20.0 burst
[INFO] Spawning 8 worker threads (50 requests/worker = 400 total)...

==================================================================
BENCHMARK COMPLETED IN 1.042s (8 threads, 400 requests)
==================================================================
Total Requests  : 400
Allowed (Pass)  : 124
Throttled (429) : 276
Tokens Remaining: 0.12
Invariant Check : PASSED (0 race conditions, lock contention <0.05ms)
OK (All concurrency and thread-safety tests passed)`;

  const assistantMeta = {
    model: 'qwen3-vl:4b-instruct',
    requested_model: 'qwen3-vl:4b-instruct',
    round_texts: [
      "I'll implement a production-grade, thread-safe Token Bucket Rate Limiter in Python with sub-millisecond precision, burst capacity tolerance, and automated concurrency stress benchmarks.\n\nFirst, let me create the module `rate_limiter.py` with the complete implementation and test suite.",
      "The industry-level **Token Bucket Rate Limiter** has been implemented, executed, and verified inside the sandbox environment.\n\n### Key Architectural Features:\n1. **Thread-Safe Atomic Execution**: Uses `threading.RLock` to guarantee mutual exclusion during token replenishment and deduction, eliminating race conditions under high concurrency.\n2. **Nanosecond Monotonic Timing**: Leverages `time.monotonic_ns()` to defend against system clock jumps (NTP synchronization) and ensure deterministic replenishment rates.\n3. **Burst Tolerance with Hard Ceilings**: Adopts an immediate burst capacity ($20$ tokens) while strictly enforcing sustained throughput ($100$ req/s).\n4. **Observable Metrics**: Built-in rolling telemetry tracking total admissions, throttled attempts, and available token headroom.\n\n### Sandbox Benchmark Verification:\n- **Concurrency Test**: 8 concurrent threads executed a combined 400 requests over ~1.04s.\n- **Accurate Throttling**: Exactly 124 requests were admitted (initial 20 burst + ~104 tokens refilled over 1.04s) while 276 excess requests were throttled.\n- **Invariant Guarantee**: Zero race conditions, lock deadlocks, or token leakage detected (`Invariant Check: PASSED`).\n\nThe code is saved to **`rate_limiter.py`** and validated for production deployment."
    ],
    round_models: ['qwen3-vl:4b-instruct', 'qwen3-vl:4b-instruct'],
    tool_events: [
      {
        round: 1,
        tool: 'write_file',
        command: 'write_file("rate_limiter.py")',
        output: 'Wrote 2,140 bytes to rate_limiter.py',
        exit_code: 0,
        diff: {
          file: 'rate_limiter.py',
          new_file: true,
          added: 60,
          removed: 0,
          text: codeDiff
        }
      },
      {
        round: 1,
        tool: 'bash',
        command: 'python rate_limiter.py',
        output: sandboxOutput,
        exit_code: 0
      }
    ],
    response_time: 5.12,
    time_to_first_token: 0.98,
    tokens_per_second: 41.5,
    input_tokens: 1780,
    output_tokens: 480,
    total_tokens: 2260,
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', assistantMeta);

  box.querySelectorAll('.msg, .agent-thread').forEach(el => {
    el.dataset.demo = 'true';
    el.dataset.demoType = 'code';
  });

  // Open both tool nodes so the user sees file creation AND sandbox execution output
  const nodes = box.querySelectorAll('.agent-thread-node');
  nodes.forEach(node => {
    node.classList.add('open');
    const details = node.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));
  });

  // Add Reset button bar so user can re-try the demo anytime
  const resetBar = document.createElement('div');
  resetBar.className = 'demo-approval-reset-bar';
  resetBar.dataset.demo = 'true';
  resetBar.innerHTML = `
    <button type="button" class="demo-approval-reset-btn" aria-label="Restart Code Demo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      <span>Restart Demo</span>
    </button>
  `;
  resetBar.querySelector('button').addEventListener('click', () => {
    renderCodeDemoChat(true);
  });
  box.appendChild(resetBar);

  chatRenderer.hideWelcomeScreen();

  const metaEl = document.getElementById('current-meta');
  if (metaEl) metaEl.textContent = 'Demo: Code & Sandbox Run';

  box.scrollTop = 0;
}

/**
 * Demo 3: MRPL (Mangalore Refinery and Petrochemicals Limited) Operations & Supervisor Tool Approval
 */
export function renderMRPLDemoChat(force = false) {
  const box = document.getElementById('chat-history');
  if (!box) return;

  const realMsgs = box.querySelectorAll('.msg:not([data-demo]):not([data-demo="true"])');
  if (!force && realMsgs.length > 0) return;
  if (!force && (box.querySelector('[data-demo="mrpl"]') || box.querySelector('[data-demo-type="mrpl"]'))) return;

  box.innerHTML = '';

  // 1. User Prompt representing a high-consequence refinery operations challenge
  const userContent = '[MRPL Alert CDU-4] At Mangalore Refinery and Petrochemicals Limited (MRPL), incoming crude batch "Mangalore Blend #09" has sulfur content surging to 3.85 wt% (nominal limit: 2.20 wt%). Column 04 overhead temperature is spiking at +3.2°C/min (currently 168.4°C). Run SCADA unit telemetry diagnostics, calculate emergency bypass parameters, and prepare valve actuation setpoint on Control Valve CV-402 to avert coking and column shutdown.';

  const userMeta = {
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('user', userContent, null, userMeta);

  // 2. SCADA Telemetry & Kinetics Diagnostic Outputs
  const scadaOutput = `[MRPL DCS SCADA INTERFACE - UNIT-4 CRUDE DISTILLATION - MANGALORE]
Connection: SECURE MODBUS/TCP (10.14.88.22:502) - Status: CONNECTED
Refinery Facility: Mangalore Refinery and Petrochemicals Limited (MRPL Kuthethoor)
Telemetry Snapshot @ 2026-09-11 21:10:45 IST:
- TI_168 (Column Overhead Temp)  : 168.4 °C [HIGH-HIGH TRIP: 170.0 °C]
- PI_402 (Desalter Outlet Press) : 18.4 bar [NOMINAL: 16-20 bar]
- SULFUR_WT (Crude Feed Sulfur)  : 3.85 wt% [MAX SPEC: 2.20 wt% - EXCURSION]
- FEED_BPD (Current Crude Rate)  : 65,400 bpd (Basrah Heavy + Arab Heavy blend)
- CAT_DIFF_P (Hydrotreater dP)   : 2.35 bar (Approaching coking limit: 2.50 bar)
- CV_402_POS (Bypass Valve)      : 48.0% [CURRENT POSITION]
Diagnostic Verdict: Severe high-sulfur crude excursion causing rapid thermal cracking & tray fouling in Column 04 overhead. Immediate quench bypass required.`;

  const kineticsOutput = `[MRPL KINETICS & HYDRAULIC REFLUX OPTIMIZER]
Kinetic Simulation Results (Model: MRPL-Refinery-Opt v4.2 - Mangalore Refinery):
- Target Overhead Temperature : 153.0 °C (Margin: -15.4 °C below threshold)
- Required Quench Divert Flow : 14,715 bpd (22.5% of total feed) to Exchanger Bank B
- Recommended CV-402 Setpoint : 70.5% (+22.5% step increase from 48.0%)
- Treat-Gas H2/Oil Ratio Boost: 320 Nm³/m³ -> 395 Nm³/m³ (+75 Nm³/m³)
- Expected Column Stabilization: Within 3.5 minutes of valve transit
- Economic Impact Mitigation  : Averts unscheduled shutdown & catalyst replacement (~₹3.4 Crore / $410,000)
- Safety Gate                  : OISD-169 SIL-3 Interlock ACTIVE. Hardware setpoint write locked pending Supervisor approval.`;

  const assistantInitialText = `Initiating MRPL Refinery Diagnostic & Safety Response Protocol for **Unit-4 Crude Distillation Unit (CDU/ADU)** at **Mangalore Refinery and Petrochemicals Limited (MRPL)**.

### Diagnostic Plan:
1. **SCADA Diagnostics**: Query real-time Modbus telemetry for Column 04 overhead temperature, desalter differential pressure, and crude sulfur content.
2. **Kinetics & Hydraulic Optimization**: Model the thermal reflux curve to determine optimal quench bypass diversion and hydrotreater hydrogen treat-gas boost.
3. **Safety Interlock Gating**: Formulate the Distributed Control System (DCS) setpoint override for Emergency Bypass Valve **CV-402**.

> ⚠️ **MRPL Operational Safety Notice (SIL-3 / OISD-169)**:
> Automated write operations to critical refinery unit controllers are locked. Physical setpoint dispatch to **Control Valve CV-402** requires explicit **Shift Supervisor Authorization**.`;

  const assistantMeta = {
    model: 'qwen3-vl:4b-instruct',
    requested_model: 'qwen3-vl:4b-instruct',
    round_texts: [assistantInitialText],
    round_models: ['qwen3-vl:4b-instruct'],
    tool_events: [
      {
        round: 1,
        tool: 'mrpl_scada_diagnostics',
        command: 'scada.read_sensors(unit="CDU-04", tags=["TI_168", "PI_402", "SULFUR_WT", "FEED_BPD", "CV_402_POS"])',
        output: scadaOutput,
        exit_code: 0
      },
      {
        round: 1,
        tool: 'mrpl_kinetics_calc',
        command: 'kinetics.optimize_quench(unit="CDU-04", crude_bpd=65400, sulfur_wt=3.85, target_temp=153.0)',
        output: kineticsOutput,
        exit_code: 0
      }
    ],
    response_time: 3.84,
    time_to_first_token: 0.82,
    tokens_per_second: 42.1,
    input_tokens: 1940,
    output_tokens: 420,
    total_tokens: 2360,
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', assistantMeta);

  box.querySelectorAll('.msg, .agent-thread').forEach(el => {
    el.dataset.demo = 'true';
    el.dataset.demoType = 'mrpl';
  });

  // Open both tool nodes so telemetry and kinetics calculation are visible
  const nodes = box.querySelectorAll('.agent-thread-node');
  nodes.forEach(node => {
    node.classList.add('open');
    const details = node.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));
  });

  // 3. Render the interactive Tool Approval Card asking for approval from the supervisor
  const approvalPayload = {
    kind: 'tool_approval',
    approval_id: 'mrpl-scada-cv402-' + Date.now(),
    question: '⚠️ MRPL Safety Interlock (SIL-3) — Shift Supervisor Authorization Required:\nAuthorize DCS setpoint override on Control Valve CV-402 (Unit-4 CDU Quench Bypass to 70.5%) and Hydrogen Treat-Gas boost (+75 Nm³/m³)?',
    action: {
      tool: 'mrpl_dcs.dispatch_setpoint_override',
      content: 'UNIT: CDU-04 (Mangalore Refinery and Petrochemicals Limited - MRPL Complex)\nTAG: CV-402.SP_OUT = 70.5% (Transit: 48.0% -> 70.5%)\nH2_BOOST: 395 Nm³/m³ (+75 Nm³/m³)\nEFFECT: Diverts 14,715 bpd crude to Quench Bank B\nINTERLOCK: OISD-169 SIL-3 Override Protocol (15-min timeout)',
      effects: [
        'Dispatches real-time DCS setpoint override to Honeywell Experion controller at MRPL Kuthethoor site',
        'Modulates hydraulic bypass valve CV-402 to 70.5% open',
        'Suppresses high-temperature coking trip on Column 04 Overhead (168.4°C -> 153.2°C)',
        'Generates cryptographically stamped regulatory audit event in MRPL Central Historian'
      ],
      workspace: 'MRPL Sector-4 Refinery Control Room (Mangalore Refinery and Petrochemicals Limited)',
      digest: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
    },
    options: [
      {
        label: 'Authorize & Dispatch to DCS',
        value: 'approve',
        description: 'Confirm supervisor override credentials and execute valve setpoint immediately.'
      },
      {
        label: 'Authorize for Full Shift (8 hrs)',
        value: 'chat_session',
        description: 'Grant supervisor approval for subsequent Unit-4 CDU thermal recalibrations today.'
      },
      {
        label: 'Deny & Trigger Safe Slop Diversion',
        value: 'deny',
        description: 'Reject DCS override. Direct high-sulfur feed to off-spec slop storage tanks.'
      }
    ]
  };

  chatRenderer.renderAskUserCard(approvalPayload, {
    root: box,
    onSubmit: (result) => {
      handleMRPLApprovalDecision(result, box);
      return true;
    }
  });

  chatRenderer.hideWelcomeScreen();

  const metaEl = document.getElementById('current-meta');
  if (metaEl) metaEl.textContent = 'Demo: MRPL Refinery Supervisor Approval';

  box.scrollTop = 0;
}

function handleMRPLApprovalDecision(result, box) {
  const isApproved = result.decision === 'approve' || result.decision === 'chat_session';
  const label = result.label || (isApproved ? 'Authorize & Dispatch to DCS' : 'Deny & Trigger Safe Slop Diversion');

  // 1. Insert resolution banner
  const resBanner = document.createElement('div');
  resBanner.className = 'demo-approval-resolved ' + (isApproved ? 'approved' : 'denied');
  resBanner.dataset.demo = 'true';
  resBanner.dataset.demoType = 'mrpl';
  resBanner.innerHTML = `
    <span class="demo-approval-icon">${isApproved ? '✓' : '✗'}</span>
    <div>
      <strong>${isApproved ? 'Authorized by Shift Supervisor' : 'Override Denied by Shift Supervisor'}</strong>
      <span style="opacity:0.85;margin-left:6px;">(${label})</span>
      <div style="font-size:11px;opacity:0.75;margin-top:2px;">
        ${isApproved ? 'DCS Setpoint Dispatched • SIL-3 Interlock Momentarily Lifted • Historian #MRPL-2026-TX-994182' : 'DCS Setpoint Cancelled • Feed Diverted to Slop Tank TK-408 • Incident Log #MRPL-2026-INC-402'}
      </div>
    </div>
  `;
  box.appendChild(resBanner);

  if (isApproved) {
    // 2. Render DCS execution tool event and final assistant message
    const dcsExecutionOutput = `[HONEYWELL EXPERION DCS GATEWAY - ACKNOWLEDGED]
Timestamp: ${new Date().toISOString()}
SCADA Loop: ADU4-CV402-LOOP (Station 10.14.88.22)
Auth Token: SUP-MRPL-9042 (VERIFIED - Shift Supervisor Grade-1)
Dispatched Setpoint: 70.50% OPEN
Actuator Feedback  : 70.48% (LVDT linear confirmation in 3.2s)
Real-Time Telemetry Trend:
- TI_168 (Overhead Temp)  : 168.4 °C -> 153.2 °C [STABILIZED, Target <160 °C]
- PI_402 (Desalter Press) : 18.4 bar -> 17.9 bar [STABLE]
- Quench Bank B Flow Rate : 14,715 bpd active
- H2 Treat-Gas Ratio      : 395 Nm³/m³ locked (+75 Nm³/m³)
- Hydrotreater Bed Delta-P: 1.82 bar (Thermal coking prevented)
Plant Historian: Committed Transaction #MRPL-2026-TX-994182
Safety Integrity: SIL-3 Safety Interlock restored to Normal Monitoring State.`;

    const assistantResolutionText = `### ✓ MRPL Unit-4 Telemetry Successfully Stabilized

Following your supervisor authorization, the DCS setpoint override was successfully transmitted to **Control Valve CV-402** and downstream hydroprocessing units.

#### Summary of Operating Metrics:
- **Column Overhead Temperature**: Successfully decreased from **168.4°C to 153.2°C** (-15.2°C reduction), remaining well below the 160°C coking threshold.
- **Crude Quench Bypass**: **14,715 bpd** (22.5% of total feed) safely diverted through Secondary Exchanger Bank B.
- **Catalyst Protection**: Hydrotreater differential pressure normalized to **1.82 bar**, preventing premature catalyst deactivation and saving an estimated **₹3.4 Crore** in turnaround costs.
- **Regulatory Audit**: Operation cryptographically verified and recorded in the MRPL Plant Historian under **OISD-169 & SIL-3 compliance**.

Unit-4 Atmospheric & Crude Distillation is operating safely at full rated throughput.`;

    const resolutionMeta = {
      model: 'qwen3-vl:4b-instruct',
      requested_model: 'qwen3-vl:4b-instruct',
      round_texts: [assistantResolutionText],
      round_models: ['qwen3-vl:4b-instruct'],
      tool_events: [
        {
          round: 1,
          tool: 'mrpl_dcs_scada',
          command: 'dcs.dispatch_setpoint(unit="CDU-04", tag="CV-402.SP_OUT", value=70.5, h2_ratio=395)',
          output: dcsExecutionOutput,
          exit_code: 0
        }
      ],
      response_time: 2.15,
      time_to_first_token: 0.45,
      tokens_per_second: 48.0,
      input_tokens: 1120,
      output_tokens: 380,
      total_tokens: 1500,
      timestamp: new Date().toISOString(),
      _isDemo: true
    };

    chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', resolutionMeta);
  } else {
    // 2. Denied flow
    const assistantDenialText = `### 🛑 DCS Setpoint Override Cancelled per Supervisor Order

The setpoint command on **Control Valve CV-402 was not dispatched**. In accordance with MRPL Emergency Standard Operating Procedures (SOP-CDU-04-REV3):

1. **Feed Rate Throttled**: Incoming high-sulfur crude feed (3.85 wt%) has been curtailed to minimum turndown (**42,000 bpd**).
2. **Slop Diversion**: Off-spec crude stream diverted to intermediate storage tank **TK-408** to avert column overhead fouling.
3. **Field Dispatch**: Alerted Field Shift Marshall to perform manual desalter brine conductivity and chemical demulsifier checks.
4. **Safety System**: SIL-3 hardware interlocks remain intact with zero unauthorized SCADA modifications.

*Awaiting manual field inspection report or further supervisor directive.*`;

    const denialMeta = {
      model: 'qwen3-vl:4b-instruct',
      requested_model: 'qwen3-vl:4b-instruct',
      round_texts: [assistantDenialText],
      round_models: ['qwen3-vl:4b-instruct'],
      response_time: 1.45,
      time_to_first_token: 0.38,
      tokens_per_second: 52.0,
      input_tokens: 850,
      output_tokens: 240,
      total_tokens: 1090,
      timestamp: new Date().toISOString(),
      _isDemo: true
    };

    chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', denialMeta);
  }

  // Tag newly created messages
  box.querySelectorAll('.msg, .agent-thread').forEach(el => {
    el.dataset.demo = 'true';
    el.dataset.demoType = 'mrpl';
  });

  // Open any new tool nodes
  box.querySelectorAll('.agent-thread-node').forEach(node => {
    node.classList.add('open');
    const details = node.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));
  });

  // Add Reset button bar so user can re-try the demo anytime
  const resetBar = document.createElement('div');
  resetBar.className = 'demo-approval-reset-bar';
  resetBar.dataset.demo = 'true';
  resetBar.dataset.demoType = 'mrpl';
  resetBar.innerHTML = `
    <button type="button" class="demo-approval-reset-btn" aria-label="Restart MRPL Demo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      <span>Restart MRPL Approval Demo</span>
    </button>
  `;
  resetBar.querySelector('button').addEventListener('click', () => {
    renderMRPLDemoChat(true);
  });
  box.appendChild(resetBar);

  box.scrollTop = box.scrollHeight;
}

/**
 * Demo 4: PDF Document to PowerPoint (.pptx) Presentation Deck
 */
export function renderPPTDemoChat(force = false) {
  const box = document.getElementById('chat-history');
  if (!box) return;

  const realMsgs = box.querySelectorAll('.msg:not([data-demo="true"])');
  if (!force && realMsgs.length > 0) return;
  if (!force && (box.querySelector('[data-demo="ppt"]') || box.querySelector('[data-demo-type="ppt"]'))) return;

  box.innerHTML = '';

  const userContent = 'I have uploaded `Market_Research_Report_2024.pdf`. Could you review the report, extract the key growth trends, ROI statistics, and strategic recommendations, and generate a polished PowerPoint presentation deck saved as `Market_Research_Presentation.pptx`?';

  const userMeta = {
    attachments: [
      {
        name: 'Market_Research_Report_2024.pdf',
        mime: 'application/pdf',
        size: 2490368
      }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('user', userContent, null, userMeta);

  const pptScriptDiff = `@@ -0,0 +1,65 @@
+import pptx
+from pptx import Presentation
+from pptx.util import Inches, Pt
+from pptx.dml.color import RGBColor
+from pptx.enum.text import PP_ALIGN
+
+# Initialize Presentation Deck
+prs = Presentation()
+prs.slide_width = Inches(13.333)  # 16:9 Widescreen
+prs.slide_height = Inches(7.5)
+
+# Theme Palette (Dark Executive Theme)
+DARK_BG = RGBColor(15, 23, 42)
+ACCENT_RED = RGBColor(224, 108, 117)
+TEXT_MAIN = RGBColor(241, 245, 249)
+TEXT_MUTED = RGBColor(148, 163, 184)
+
+# Slide 1: Executive Title Slide
+slide_layout = prs.slide_layouts[6] # Blank
+slide = prs.slides.add_slide(slide_layout)
+title_box = slide.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.3), Inches(3.0))
+tf = title_box.text_frame
+p1 = tf.paragraphs[0]
+p1.text = "2024 Global Enterprise AI & Automation Report"
+p1.font.bold = True
+p1.font.size = Pt(40)
+p1.font.color.rgb = ACCENT_RED
+
+p2 = tf.add_paragraph()
+p2.text = "Executive Presentation Deck • Source: Market_Research_Report_2024.pdf"
+p2.font.size = Pt(20)
+p2.font.color.rgb = TEXT_MUTED
+
+# Slide 2: Market Adoption Metrics
+slide = prs.slides.add_slide(slide_layout)
+tb = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
+tb.text_frame.text = "1. Enterprise GenAI Adoption Surge"
+tb.text_frame.paragraphs[0].font.size = Pt(32)
+tb.text_frame.paragraphs[0].font.bold = True
+
+# Slide 3: Operational ROI & Velocity Gains
+slide = prs.slides.add_slide(slide_layout)
+tb = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.0))
+tb.text_frame.text = "2. Quantified Operational ROI"
+tb.text_frame.paragraphs[0].font.size = Pt(32)
+
+# Save output deck
+prs.save("Market_Research_Presentation.pptx")
+print("Successfully compiled Market_Research_Presentation.pptx (6 slides, 1.85 MB)")`;

  const pptSandboxOutput = `==================================================================
⚡ SANDBOX EXECUTION: python build_ppt_deck.py
==================================================================
[INFO] Loading python-pptx engine v0.6.23...
[INFO] Reading document structure from Market_Research_Report_2024.pdf
[INFO] Compiling Slide 1: Executive Title & Market Overview
[INFO] Compiling Slide 2: Global Enterprise Adoption Surge (+142% YoY)
[INFO] Compiling Slide 3: Operational & Financial ROI Breakdown (18.4% cost cut)
[INFO] Compiling Slide 4: Critical Deployment Bottlenecks & Compliance Gates
[INFO] Compiling Slide 5: Agentic Tool-Calling Trends (3.2x Adoption Shift)
[INFO] Compiling Slide 6: Strategic Recommendations & FY2025 Action Roadmap
==================================================================
COMPILATION COMPLETED IN 0.842s
Output File: Market_Research_Presentation.pptx (6 widescreen 16:9 slides, 1.85 MB)
Status     : Ready for executive distribution`;

  const assistantMeta = {
    model: 'qwen3-vl:4b-instruct',
    requested_model: 'qwen3-vl:4b-instruct',
    round_texts: [
      "I'll analyze `Market_Research_Report_2024.pdf`, extract the core metrics, ROI figures, and strategic insights, and generate a 16:9 widescreen executive PowerPoint presentation deck `Market_Research_Presentation.pptx`.\n\nFirst, let me parse the PDF and construct the presentation generator script.",
      "I have reviewed `Market_Research_Report_2024.pdf` and compiled a 6-slide PowerPoint presentation deck saved as **`Market_Research_Presentation.pptx`** ✓\n\n### Presentation Slide Deck Breakdown:\n\n1. **Slide 1: Executive Overview**: 2024 Global Enterprise AI & Automation Market Analysis.\n2. **Slide 2: Adoption Velocity**: Highlights the **142% YoY surge in enterprise GenAI deployments** and **74% Fortune 500 pilot adoption**.\n3. **Slide 3: Quantified Financial ROI**: Details the **18.4% operational cost reduction** in support workflows and **28% code delivery velocity increase**.\n4. **Slide 4: Enterprise Bottlenecks**: Analyzes security, regulatory compliance (68% concern rate), and legacy DB latency challenges.\n5. **Slide 5: Agentic Architecture Shift**: Covers the **3.2x market transition** toward tool-calling agentic workflows.\n6. **Slide 6: Strategic FY2025 Roadmap**: Deterministic tool boundaries, SIL-3 human-in-the-loop gates, and hybrid indexing.\n\nThe complete presentation file **`Market_Research_Presentation.pptx`** (1.85 MB, 16:9 HD widescreen format) has been created and validated."
    ],
    round_models: ['qwen3-vl:4b-instruct', 'qwen3-vl:4b-instruct'],
    tool_events: [
      {
        round: 1,
        tool: 'read_file',
        command: 'read_file("Market_Research_Report_2024.pdf")',
        output: 'Reading Market_Research_Report_2024.pdf (48 pages, ~16,200 words)...\n[Document successfully parsed: 6 major slide topics identified]',
        exit_code: 0
      },
      {
        round: 1,
        tool: 'write_file',
        command: 'write_file("build_ppt_deck.py")',
        output: 'Wrote 2,450 bytes to build_ppt_deck.py',
        exit_code: 0,
        diff: {
          file: 'build_ppt_deck.py',
          new_file: true,
          added: 65,
          removed: 0,
          text: pptScriptDiff
        }
      },
      {
        round: 1,
        tool: 'bash',
        command: 'python build_ppt_deck.py',
        output: pptSandboxOutput,
        exit_code: 0
      }
    ],
    response_time: 4.95,
    time_to_first_token: 0.91,
    tokens_per_second: 38.2,
    input_tokens: 2950,
    output_tokens: 430,
    total_tokens: 3380,
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    _isDemo: true
  };

  chatRenderer.addMessage('assistant', null, 'qwen3-vl:4b-instruct', assistantMeta);

  box.querySelectorAll('.msg, .agent-thread').forEach(el => {
    el.dataset.demo = 'true';
    el.dataset.demoType = 'ppt';
  });

  const nodes = box.querySelectorAll('.agent-thread-node');
  nodes.forEach(node => {
    node.classList.add('open');
    const details = node.querySelectorAll('details');
    details.forEach(d => d.setAttribute('open', ''));
  });

  // Render the interactive PPT Presentation Viewer & Download Card in chat
  renderPPTViewerCard(box);

  // Add Reset button bar so user can re-try the demo anytime
  const resetBar = document.createElement('div');
  resetBar.className = 'demo-approval-reset-bar';
  resetBar.dataset.demo = 'true';
  resetBar.dataset.demoType = 'ppt';
  resetBar.innerHTML = `
    <button type="button" class="demo-approval-reset-btn" aria-label="Restart PPT Demo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      <span>Restart PPT Demo</span>
    </button>
  `;
  resetBar.querySelector('button').addEventListener('click', () => {
    renderPPTDemoChat(true);
  });
  box.appendChild(resetBar);

  chatRenderer.hideWelcomeScreen();

  const metaEl = document.getElementById('current-meta');
  if (metaEl) metaEl.textContent = 'Demo: PDF to PPT Deck';

  box.scrollTop = 0;
}

function renderPPTViewerCard(box) {
  const slides = [
    {
      tag: "Slide 1 of 6 • Executive Overview",
      title: "2024 Global Enterprise AI & Automation Report",
      content: "A strategic synthesis of multi-agent deployment velocity, operational cost reduction, compliance barriers, and architecture roadmaps derived from Market_Research_Report_2024.pdf.",
      stats: [
        { num: "48", label: "Pages Analyzed" },
        { num: "16:9", label: "HD Widescreen" },
        { num: "6", label: "Executive Slides" }
      ]
    },
    {
      tag: "Slide 2 of 6 • Enterprise Adoption Surge",
      title: "142% YoY Growth in Enterprise AI Deployments",
      content: "Generative AI deployment in production environments expanded by 142% year-over-year. Over 74% of surveyed Fortune 500 organizations have active multi-agent pilots.",
      stats: [
        { num: "+142%", label: "YoY Growth Rate" },
        { num: "74%", label: "Fortune 500 Pilots" },
        { num: "3.2x", label: "Agentic Tool Shift" }
      ]
    },
    {
      tag: "Slide 3 of 6 • Financial & Operational Impact",
      title: "Measurable ROI & Code Velocity Gains",
      content: "Automated support workflows demonstrated an average 18.4% operational cost reduction, while engineering teams reported a 28% boost in overall code delivery speed.",
      stats: [
        { num: "18.4%", label: "Cost Reduction" },
        { num: "28%", label: "Dev Velocity" },
        { num: "$410k", label: "Avg Savings/Unit" }
      ]
    },
    {
      tag: "Slide 4 of 6 • Enterprise Roadblocks",
      title: "Compliance & Legacy Integration Hurdles",
      content: "68% of IT executives highlighted regulatory compliance and data privacy as primary roadblocks, followed by high latency during legacy database queries.",
      stats: [
        { num: "68%", label: "Compliance Risk" },
        { num: "Latency", label: "Legacy DB Bottleneck" },
        { num: "SIL-3", label: "Required Gate" }
      ]
    },
    {
      tag: "Slide 5 of 6 • Vendor & Architecture Trends",
      title: "Transition to Deterministic Tool-Calling Agents",
      content: "Organizations are shifting away from standalone prompts towards open-weights models connected to deterministic tool-calling frameworks with SIL-3 safety boundaries.",
      stats: [
        { num: "3.2x", label: "Tool-Calling Shift" },
        { num: "Open", label: "Weights Preference" },
        { num: "Hybrid", label: "Vector Search" }
      ]
    },
    {
      tag: "Slide 6 of 6 • Strategic FY2025 Recommendations",
      title: "Action Plan: Boundaries, Gating & Indexing",
      content: "1. Enforce strict tool execution boundaries.\n2. Implement human-in-the-loop validation for critical writes.\n3. Deploy hybrid vector + lexical indexing for high-precision retrieval.",
      stats: [
        { num: "SOP-1", label: "Tool Boundaries" },
        { num: "SOP-2", label: "Human-in-Loop" },
        { num: "SOP-3", label: "Hybrid RAG" }
      ]
    }
  ];

  let currentIdx = 0;

  const card = document.createElement('div');
  card.className = 'ppt-demo-card';
  card.dataset.demo = 'true';
  card.dataset.demoType = 'ppt';

  // Header with Download button
  const head = document.createElement('div');
  head.className = 'ppt-card-header';
  head.innerHTML = `
    <div class="ppt-card-title-flex">
      <span class="ppt-icon-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </span>
      <div>
        <strong>Market_Research_Presentation.pptx</strong>
        <span style="font-size:11px;opacity:0.7;margin-left:6px;">(6 slides • 1.85 MB)</span>
      </div>
    </div>
    <button type="button" class="ppt-download-btn" id="ppt-download-trigger" title="Download PowerPoint File">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>Download Presentation (.pptx)</span>
    </button>
  `;
  card.appendChild(head);

  // Stage
  const stage = document.createElement('div');
  stage.className = 'ppt-slide-stage';

  function renderSlide() {
    const s = slides[currentIdx];
    stage.innerHTML = `
      <div>
        <div class="ppt-slide-header-tag">${s.tag}</div>
        <div class="ppt-slide-title">${s.title}</div>
        <div class="ppt-slide-content">${s.content.replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="ppt-slide-stats-grid">
        ${s.stats.map(st => `
          <div class="ppt-stat-box">
            <div class="ppt-stat-number">${st.num}</div>
            <div class="ppt-stat-label">${st.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  renderSlide();
  card.appendChild(stage);

  // Controls
  const ctrl = document.createElement('div');
  ctrl.className = 'ppt-slide-controls';
  ctrl.innerHTML = `
    <button type="button" class="ppt-ctrl-btn" id="ppt-prev-btn">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      <span>Prev Slide</span>
    </button>
    <span class="ppt-slide-indicator" id="ppt-indicator">Slide 1 of 6</span>
    <button type="button" class="ppt-ctrl-btn" id="ppt-next-btn">
      <span>Next Slide</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;
  card.appendChild(ctrl);

  // Event Listeners for slide navigation
  const prevBtn = ctrl.querySelector('#ppt-prev-btn');
  const nextBtn = ctrl.querySelector('#ppt-next-btn');
  const indicator = ctrl.querySelector('#ppt-indicator');

  prevBtn.addEventListener('click', () => {
    if (currentIdx > 0) {
      currentIdx--;
      renderSlide();
      indicator.textContent = `Slide ${currentIdx + 1} of ${slides.length}`;
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIdx < slides.length - 1) {
      currentIdx++;
      renderSlide();
      indicator.textContent = `Slide ${currentIdx + 1} of ${slides.length}`;
    }
  });

  // Download Event Listener
  head.querySelector('#ppt-download-trigger').addEventListener('click', () => {
    const pptxHeader = 'PK\x03\x04\x14\x00\x06\x00\x08\x00\x00\x00!';
    const blob = new Blob([pptxHeader + '\nMarket_Research_Presentation.pptx (Executive Presentation Deck - 6 Widescreen Slides)\nCreated via Param Agentic AI\nSource: Market_Research_Report_2024.pdf\n'], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Market_Research_Presentation.pptx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  box.appendChild(card);
}
