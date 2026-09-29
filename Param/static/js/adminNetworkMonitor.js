// Admin → Network Monitor tab: live view of the in-memory hash-chained
// action/network log, rendered as a bar chart (counts by type) and a
// per-minute line chart of network-call volume. No charting library in this
// repo, so both charts are hand-rolled inline SVG.

let _pollTimer = null;
let _events = [];
const MAX_ROWS = 200;

const TYPE_LABELS = {
  network_call: 'Network call',
  chat_message_sent: 'Chat message',
  tool_executed: 'Tool executed',
  model_switch: 'Model switch',
  settings_changed: 'Settings changed',
};
const TYPE_ORDER = Object.keys(TYPE_LABELS);
const TYPE_COLORS = {
  network_call: '#5b9dd9',
  chat_message_sent: '#6fbf73',
  tool_executed: '#e0a95a',
  model_switch: '#b48ee0',
  settings_changed: '#9aa5b1',
};

function _fmtTime(ts) {
  try { return new Date(ts * 1000).toLocaleTimeString(); } catch (_) { return ''; }
}
function _shortHash(h) {
  return h ? `${h.slice(0, 8)}…${h.slice(-6)}` : '';
}
function _detailSummary(e) {
  const d = e.detail || {};
  switch (e.type) {
    case 'network_call': return [d.host, d.model, d.provider || d.kind].filter(Boolean).join(' · ');
    case 'chat_message_sent': return `${d.chars || 0} chars` + (d.mode ? ` · ${d.mode}` : '');
    case 'tool_executed': return d.tool || '';
    case 'model_switch': return `${d.from_model || '(none)'} → ${d.to_model || ''}`;
    case 'settings_changed': return d.key || '';
    default: return '';
  }
}

function _renderStatus(chain) {
  const statusEl = document.getElementById('adm-monitorStatus');
  if (!statusEl || !chain) return;
  const ok = chain.valid;
  statusEl.innerHTML = `
    <span class="sm-badge ${ok ? 'ok' : 'bad'}">${ok ? '✓ Hash-chain verified' : '✗ Hash-chain broken'}</span>
    <span class="sm-badge-detail">${chain.count} event${chain.count === 1 ? '' : 's'} logged
      ${chain.flagged_count ? ` · ${chain.flagged_count} flagged` : ''}
      · last hash <code>${_shortHash(chain.last_hash)}</code></span>
  `;
}

function _renderEventsAndFlags() {
  const eventsEl = document.getElementById('adm-monitorEvents');
  const flaggedCard = document.getElementById('adm-monitorFlaggedCard');
  const flaggedEl = document.getElementById('adm-monitorFlagged');
  if (!eventsEl) return;

  const rows = _events.slice(-MAX_ROWS).reverse();
  eventsEl.innerHTML = rows.map(e => `
    <div class="security-monitor-row${e.flagged ? ' flagged' : ''}">
      <span class="sm-time">${_fmtTime(e.ts)}</span>
      <span class="sm-type">${TYPE_LABELS[e.type] || e.type}</span>
      <span class="sm-detail">${(_detailSummary(e) || '').replace(/</g, '&lt;')}</span>
      <span class="sm-hash" title="${e.hash}">${_shortHash(e.hash)}</span>
    </div>
  `).join('') || '<div style="opacity:0.5;font-size:12px;">No activity logged yet.</div>';

  const flagged = _events.filter(e => e.flagged);
  if (flaggedCard) flaggedCard.hidden = flagged.length === 0;
  if (flaggedEl) {
    flaggedEl.innerHTML = flagged.slice(-20).reverse().map(e => `
      <div class="security-monitor-row flagged">
        <span class="sm-time">${_fmtTime(e.ts)}</span>
        <span class="sm-type">${TYPE_LABELS[e.type] || e.type}</span>
        <span class="sm-detail">${(e.flag_reason || '').replace(/</g, '&lt;')}</span>
      </div>
    `).join('');
  }
}

function _renderBarChart() {
  const el = document.getElementById('adm-monitorBarChart');
  if (!el) return;
  const counts = {};
  TYPE_ORDER.forEach(t => { counts[t] = 0; });
  _events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
  const max = Math.max(1, ...Object.values(counts));

  if (!_events.length) {
    el.innerHTML = '<div style="opacity:0.5;font-size:12px;">No activity to chart yet.</div>';
    return;
  }

  el.innerHTML = TYPE_ORDER.map(t => {
    const pct = Math.round((counts[t] / max) * 100);
    return `
      <div class="monitor-bar-row">
        <span class="monitor-bar-label">${TYPE_LABELS[t]}</span>
        <div class="monitor-bar-track">
          <div class="monitor-bar-fill" style="width:${pct}%;background:${TYPE_COLORS[t]}"></div>
        </div>
        <span class="monitor-bar-count">${counts[t]}</span>
      </div>
    `;
  }).join('');
}

function _renderLineChart() {
  const el = document.getElementById('adm-monitorLineChart');
  if (!el) return;

  const BUCKETS = 15; // minutes
  const now = Math.floor(Date.now() / 1000 / 60);
  const buckets = new Array(BUCKETS).fill(0);
  _events.forEach(e => {
    if (e.type !== 'network_call') return;
    const minute = Math.floor(e.ts / 60);
    const idx = BUCKETS - 1 - (now - minute);
    if (idx >= 0 && idx < BUCKETS) buckets[idx]++;
  });

  const max = Math.max(1, ...buckets);
  const w = 360, h = 90, pad = 6;
  const stepX = (w - pad * 2) / (BUCKETS - 1);
  const points = buckets.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const dots = buckets.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#5b9dd9"><title>${v} call${v === 1 ? '' : 's'}</title></circle>`;
  }).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="monitor-line-svg" preserveAspectRatio="none">
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="currentColor" opacity="0.15"/>
      <polyline points="${points}" fill="none" stroke="#5b9dd9" stroke-width="1.5"/>
      ${dots}
    </svg>
    <div class="monitor-line-caption">last ${BUCKETS} minutes · peak ${max} call${max === 1 ? '' : 's'}/min</div>
  `;
}

function _renderAll() {
  _renderEventsAndFlags();
  _renderBarChart();
  _renderLineChart();
}

async function _poll() {
  try {
    // Admin panel is opened rarely — refetch the full in-memory history each
    // tick (capped at 5000 entries server-side) rather than tracking a
    // since_seq cursor, so the charts always reflect the complete window.
    const r = await fetch('/api/monitor/events?since_seq=-1', { credentials: 'same-origin' });
    if (!r.ok) return;
    const data = await r.json();
    _events = Array.isArray(data.events) ? data.events : _events;
    _renderStatus(data.chain);
    _renderAll();
  } catch (_) { /* network hiccup — keep last known state */ }
}

export function startNetworkMonitorPolling() {
  if (_pollTimer) return;
  _poll();
  _pollTimer = setInterval(_poll, 4000);
}

export function stopNetworkMonitorPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}
