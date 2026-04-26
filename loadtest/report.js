/**
 * Genera un reporte HTML completo a partir del summary de k6.
 * Uso: import { generateHtmlReport } from "./report.js";
 *      export function handleSummary(data) { ... }
 */

export function generateHtmlReport(data) {
  const metrics = data.metrics;
  const now = new Date().toLocaleString("es");
  const thresholds = [];
  const metricRows = [];

  for (const [name, metric] of Object.entries(metrics)) {
    const v = metric.values || {};
    const type = metric.type;

    // Thresholds
    if (metric.thresholds) {
      for (const [expr, result] of Object.entries(metric.thresholds)) {
        thresholds.push({
          metric: name,
          expression: expr,
          ok: result.ok,
        });
      }
    }

    // Metric rows
    if (type === "counter") {
      metricRows.push({ name, type, value: fmt(v.count), rate: fmt(v.rate, "/s") });
    } else if (type === "gauge") {
      metricRows.push({ name, type, value: fmt(v.value), min: fmt(v.min), max: fmt(v.max) });
    } else if (type === "rate") {
      metricRows.push({ name, type, value: pct(v.rate), passes: fmt(v.passes), fails: fmt(v.fails) });
    } else if (type === "trend") {
      metricRows.push({
        name, type,
        avg: ms(v.avg), min: ms(v.min), med: ms(v.med),
        max: ms(v.max), p90: ms(v["p(90)"]), p95: ms(v["p(95)"]),
      });
    }
  }

  const passedChecks = thresholds.filter((t) => t.ok).length;
  const failedChecks = thresholds.filter((t) => !t.ok).length;
  const totalChecks = thresholds.length;
  const allPassed = failedChecks === 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>k6 Load Test Report — Avatares</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; background: linear-gradient(135deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 0.75rem; padding: 1.25rem; }
  .card-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card-value { font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; }
  .card-value.green { color: #10b981; }
  .card-value.red { color: #ef4444; }
  .card-value.cyan { color: #06b6d4; }
  .card-value.purple { color: #8b5cf6; }
  h2 { font-size: 1.125rem; margin: 2rem 0 1rem; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { text-align: left; padding: 0.625rem 0.75rem; background: rgba(255,255,255,0.03); color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.6875rem; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.08); }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
  tr:hover td { background: rgba(255,255,255,0.02); }
  .pass { color: #10b981; }
  .fail { color: #ef4444; font-weight: 600; }
  .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; }
  .badge-pass { background: rgba(16,185,129,0.15); color: #10b981; }
  .badge-fail { background: rgba(239,68,68,0.15); color: #ef4444; }
  .badge-type { background: rgba(139,92,246,0.15); color: #8b5cf6; }
  .mono { font-family: 'SF Mono', Monaco, monospace; font-size: 0.8125rem; }
  .section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem; overflow-x: auto; }
  footer { margin-top: 3rem; text-align: center; color: #475569; font-size: 0.75rem; }
</style>
</head>
<body>
<div class="container">
  <h1>📊 k6 Load Test Report</h1>
  <p class="subtitle">Avatares API — ${now}</p>

  <div class="cards">
    <div class="card">
      <div class="card-label">Total Requests</div>
      <div class="card-value cyan">${fmt(metrics.http_reqs?.values?.count)}</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Response Time</div>
      <div class="card-value purple">${ms(metrics.http_req_duration?.values?.avg)}</div>
    </div>
    <div class="card">
      <div class="card-label">p95 Response Time</div>
      <div class="card-value purple">${ms(metrics.http_req_duration?.values?.["p(95)"])}</div>
    </div>
    <div class="card">
      <div class="card-label">Thresholds</div>
      <div class="card-value ${allPassed ? "green" : "red"}">${passedChecks}/${totalChecks} ${allPassed ? "✓" : "✗"}</div>
    </div>
    <div class="card">
      <div class="card-label">Data Received</div>
      <div class="card-value cyan">${bytes(metrics.data_received?.values?.count)}</div>
    </div>
    <div class="card">
      <div class="card-label">Data Sent</div>
      <div class="card-value cyan">${bytes(metrics.data_sent?.values?.count)}</div>
    </div>
  </div>

  ${totalChecks > 0 ? `
  <h2>🎯 Thresholds</h2>
  <div class="section">
  <table>
    <thead><tr><th>Metric</th><th>Expression</th><th>Result</th></tr></thead>
    <tbody>
      ${thresholds.map((t) => `<tr>
        <td class="mono">${t.metric}</td>
        <td class="mono">${t.expression}</td>
        <td><span class="badge ${t.ok ? "badge-pass" : "badge-fail"}">${t.ok ? "PASS" : "FAIL"}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
  </div>` : ""}

  <h2>⏱️ HTTP Timing (Trends)</h2>
  <div class="section">
  <table>
    <thead><tr><th>Metric</th><th>Avg</th><th>Min</th><th>Med</th><th>p90</th><th>p95</th><th>Max</th></tr></thead>
    <tbody>
      ${metricRows.filter((m) => m.type === "trend").map((m) => `<tr>
        <td class="mono">${m.name}</td>
        <td>${m.avg}</td><td>${m.min}</td><td>${m.med}</td>
        <td>${m.p90}</td><td>${m.p95}</td><td>${m.max}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  </div>

  <h2>📈 Counters & Rates</h2>
  <div class="section">
  <table>
    <thead><tr><th>Metric</th><th>Type</th><th>Value</th><th>Detail</th></tr></thead>
    <tbody>
      ${metricRows.filter((m) => m.type === "counter").map((m) => `<tr>
        <td class="mono">${m.name}</td>
        <td><span class="badge badge-type">counter</span></td>
        <td>${m.value}</td><td>${m.rate}</td>
      </tr>`).join("")}
      ${metricRows.filter((m) => m.type === "rate").map((m) => `<tr>
        <td class="mono">${m.name}</td>
        <td><span class="badge badge-type">rate</span></td>
        <td>${m.value}</td><td class="pass">${m.passes} pass</td>
      </tr>`).join("")}
      ${metricRows.filter((m) => m.type === "gauge").map((m) => `<tr>
        <td class="mono">${m.name}</td>
        <td><span class="badge badge-type">gauge</span></td>
        <td>${m.value}</td><td>${m.min} — ${m.max}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  </div>

  <footer>Generated by k6 + Avatares Load Test Suite</footer>
</div>
</body>
</html>`;
}

function fmt(n, suffix) {
  if (n == null) return "—";
  suffix = suffix || "";
  const num = Number(n);
  const rounded = Math.round(num * 10) / 10;
  return String(rounded) + suffix;
}

function ms(n) {
  if (n == null) return "—";
  return Number(n).toFixed(1) + " ms";
}

function pct(n) {
  if (n == null) return "—";
  return (Number(n) * 100).toFixed(2) + "%";
}

function bytes(n) {
  if (n == null) return "—";
  if (n > 1048576) return (n / 1048576).toFixed(1) + " MB";
  if (n > 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}
