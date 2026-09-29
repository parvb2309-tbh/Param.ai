import * as chatRenderer from './chatRenderer.js';

/**
 * Demo: Industry-level Code Generation & Sandbox Execution
 * Demonstrates:
 * 1. User requesting production-grade distributed token bucket rate limiter in Python.
 * 2. Model replying with write_file tool creating rate_limiter.py (visual diff).
 * 3. Model executing code in sandbox using bash tool, verifying concurrency & zero race conditions.
 * 4. Model providing structured architectural breakdown and verification stats.
 */

export function isCodeDemoActive() {
  const box = document.getElementById('chat-history');
  return !!(box && (box.querySelector('[data-demo-type="code"]') || box.querySelector('[data-demo="code"]')));
}

export function clearCodeDemoIfPresent() {
  const box = document.getElementById('chat-history');
  if (!box) return false;
  const demoElements = box.querySelectorAll('[data-demo-type="code"], [data-demo="code"]');
  if (demoElements.length > 0) {
    box.innerHTML = '';
    return true;
  }
  return false;
}

export function renderCodeDemoChat(force = false) {
  const box = document.getElementById('chat-history');
  if (!box) return;

  const realMsgs = box.querySelectorAll('.msg:not([data-demo]):not([data-demo="true"])');
  if (!force && realMsgs.length > 0) return;
  if (!force && box.querySelector('[data-demo-type="code"]')) return;

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
