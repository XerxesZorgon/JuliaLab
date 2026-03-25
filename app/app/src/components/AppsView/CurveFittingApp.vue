<template>
  <div class="cf-app">
    <!-- Header -->
    <div class="cf-header">
      <div class="cf-header-left">
        <span class="cf-app-icon">📈</span>
        <span class="cf-title">Curve Fitting</span>
        <span class="cf-subtitle">Fit mathematical models to data using Julia</span>
      </div>
      <button class="cf-close" title="Close app" @click="$emit('close')">✕</button>
    </div>

    <!-- Body -->
    <div class="cf-body">
      <!-- LEFT: Controls -->
      <div class="cf-controls">
        <!-- Data input -->
        <section class="cf-section">
          <h3 class="cf-section-title">Data</h3>
          <p class="cf-hint">Paste X,Y pairs — one per line, comma-separated.</p>
          <textarea
            v-model="rawData"
            class="cf-textarea"
            placeholder="1, 2.1&#10;2, 3.9&#10;3, 6.2&#10;4, 8.1&#10;5, 10.3"
            spellcheck="false"
          />
          <p v-if="parseError" class="cf-error">{{ parseError }}</p>
          <p v-else-if="parsedPoints.length > 0" class="cf-ok">
            {{ parsedPoints.length }} points loaded
          </p>
        </section>

        <!-- Model -->
        <section class="cf-section">
          <h3 class="cf-section-title">Model</h3>
          <div class="cf-model-grid">
            <label
              v-for="m in MODELS"
              :key="m.id"
              class="cf-model-card"
              :class="{ selected: model === m.id }"
            >
              <input type="radio" :value="m.id" v-model="model" />
              <span class="cf-model-name">{{ m.label }}</span>
              <span class="cf-model-eq">{{ m.equation }}</span>
            </label>
          </div>

          <div v-if="model === 'poly'" class="cf-poly-degree">
            <label class="cf-label">Degree</label>
            <input type="range" min="2" max="6" v-model.number="polyDegree" class="cf-slider" />
            <span class="cf-slider-val">{{ polyDegree }}</span>
          </div>
        </section>

        <!-- Run -->
        <section class="cf-section">
          <button
            class="cf-run-btn"
            :disabled="parsedPoints.length < 2 || running"
            @click="runFit"
          >
            <span v-if="running" class="cf-spinner" />
            {{ running ? 'Fitting…' : '▶  Run Fit' }}
          </button>
          <p v-if="runError" class="cf-error">{{ runError }}</p>
        </section>

        <!-- Results -->
        <section v-if="result" class="cf-section">
          <h3 class="cf-section-title">Results</h3>
          <div class="cf-result-equation">{{ result.equation }}</div>
          <table class="cf-coeff-table">
            <thead>
              <tr><th>Parameter</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr v-for="(val, name) in result.coefficients" :key="name">
                <td>{{ name }}</td>
                <td>{{ formatNum(val) }}</td>
              </tr>
              <tr class="cf-r2-row">
                <td>R²</td>
                <td>{{ formatNum(result.r2) }}</td>
              </tr>
              <tr class="cf-r2-row">
                <td>RMSE</td>
                <td>{{ formatNum(result.rmse) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- RIGHT: Chart -->
      <div class="cf-chart-area">
        <div v-if="!result && !running" class="cf-chart-placeholder">
          <span>Enter data and click Run Fit</span>
        </div>
        <div v-else-if="running" class="cf-chart-placeholder">
          <span>Computing…</span>
        </div>
        <svg v-else-if="result" class="cf-svg" :viewBox="`0 0 ${SVG_W} ${SVG_H}`" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid lines -->
          <g class="cf-grid">
            <line v-for="tick in yTicks" :key="'yg'+tick.v"
              :x1="MARGIN.left" :y1="tick.py"
              :x2="SVG_W - MARGIN.right" :y2="tick.py"
              stroke="var(--jl-border)" stroke-width="1" />
            <line v-for="tick in xTicks" :key="'xg'+tick.v"
              :x1="tick.px" :y1="MARGIN.top"
              :x2="tick.px" :y2="SVG_H - MARGIN.bottom"
              stroke="var(--jl-border)" stroke-width="1" />
          </g>
          <!-- Axes -->
          <line :x1="MARGIN.left" :y1="MARGIN.top"
                :x2="MARGIN.left" :y2="SVG_H - MARGIN.bottom"
                stroke="var(--jl-text-muted)" stroke-width="1.5" />
          <line :x1="MARGIN.left" :y1="SVG_H - MARGIN.bottom"
                :x2="SVG_W - MARGIN.right" :y2="SVG_H - MARGIN.bottom"
                stroke="var(--jl-text-muted)" stroke-width="1.5" />
          <!-- Tick labels -->
          <text v-for="tick in yTicks" :key="'yl'+tick.v"
            :x="MARGIN.left - 6" :y="tick.py + 4"
            text-anchor="end" class="cf-tick-label">{{ formatNum(tick.v, 3) }}</text>
          <text v-for="tick in xTicks" :key="'xl'+tick.v"
            :x="tick.px" :y="SVG_H - MARGIN.bottom + 16"
            text-anchor="middle" class="cf-tick-label">{{ formatNum(tick.v, 3) }}</text>
          <!-- Fitted curve -->
          <polyline
            :points="fittedPolylinePoints"
            fill="none"
            stroke="var(--jl-accent-blue, #4a9eff)"
            stroke-width="2"
            stroke-linejoin="round" />
          <!-- Data points -->
          <circle v-for="(pt, i) in parsedPoints" :key="i"
            :cx="toSvgX(pt.x)" :cy="toSvgY(pt.y)"
            r="4"
            fill="var(--jl-accent-green)"
            stroke="var(--jl-panel-bg)"
            stroke-width="1.5" />
          <!-- Legend -->
          <circle :cx="MARGIN.left + 12" :cy="MARGIN.top + 14" r="4"
            fill="var(--jl-accent-green)" />
          <text :x="MARGIN.left + 22" :y="MARGIN.top + 18" class="cf-legend-label">Data</text>
          <line :x1="MARGIN.left + 40" :y1="MARGIN.top + 14"
                :x2="MARGIN.left + 60" :y2="MARGIN.top + 14"
                stroke="var(--jl-accent-blue, #4a9eff)" stroke-width="2" />
          <text :x="MARGIN.left + 66" :y="MARGIN.top + 18" class="cf-legend-label">Fit</text>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';

defineEmits<{ close: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────
const SVG_W = 560;
const SVG_H = 380;
const MARGIN = { top: 30, right: 20, bottom: 30, left: 60 };

const MODELS = [
  { id: 'linear',      label: 'Linear',      equation: 'y = a + b·x' },
  { id: 'poly',        label: 'Polynomial',   equation: 'y = Σ aₙxⁿ' },
  { id: 'exponential', label: 'Exponential',  equation: 'y = a·eᵇˣ' },
  { id: 'power',       label: 'Power',        equation: 'y = a·xᵇ' },
  { id: 'logarithmic', label: 'Logarithmic',  equation: 'y = a + b·ln(x)' },
];

// ── State ────────────────────────────────────────────────────────────────────
const rawData   = ref('1, 2.1\n2, 3.9\n3, 6.2\n4, 8.1\n5, 10.3');
const model     = ref('linear');
const polyDegree = ref(2);
const running   = ref(false);
const runError  = ref<string | null>(null);

interface FitResult {
  equation: string;
  coefficients: Record<string, number>;
  r2: number;
  rmse: number;
  fitted_x: number[];
  fitted_y: number[];
}
const result = ref<FitResult | null>(null);

// ── Data parsing ─────────────────────────────────────────────────────────────
interface Point { x: number; y: number }

const parseError = ref<string | null>(null);
const parsedPoints = computed<Point[]>(() => {
  const lines = rawData.value.split('\n').map(l => l.trim()).filter(Boolean);
  const pts: Point[] = [];
  parseError.value = null;
  for (const line of lines) {
    const parts = line.split(/[\s,;]+/);
    if (parts.length < 2) { parseError.value = `Bad line: "${line}"`; return []; }
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) { parseError.value = `Not a number in: "${line}"`; return []; }
    pts.push({ x, y });
  }
  return pts;
});

// Reset result when data or model changes
watch([rawData, model, polyDegree], () => { result.value = null; runError.value = null; });

// ── Julia execution ───────────────────────────────────────────────────────────
async function runFit() {
  if (parsedPoints.value.length < 2) return;
  running.value = true;
  runError.value = null;
  result.value = null;

  const xs = parsedPoints.value.map(p => p.x);
  const ys = parsedPoints.value.map(p => p.y);

  const code = buildJuliaCode(xs, ys, model.value, polyDegree.value);

  try {
    const raw = await invoke<string>('execute_julia_code', { code });
    // extract JSON from output (may have trailing newlines / debug output)
    const jsonStart = raw.indexOf('{');
    const jsonEnd   = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error(`No JSON in output:\n${raw}`);
    result.value = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as FitResult;
  } catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : String(e);
  } finally {
    running.value = false;
  }
}

function buildJuliaCode(xs: number[], ys: number[], mdl: string, deg: number): string {
  const xArr = `[${xs.join(', ')}]`;
  const yArr = `[${ys.join(', ')}]`;

  return `begin
  import JSON, Statistics

  x_data = Float64.(${xArr})
  y_data = Float64.(${yArr})
  n = length(x_data)

  # ── model-specific fit ──────────────────────────────────────
  ${modelBlock(mdl, deg)}

  # ── goodness of fit ─────────────────────────────────────────
  ss_res = sum((y_data .- y_fitted).^2)
  ss_tot = sum((y_data .- Statistics.mean(y_data)).^2)
  r2   = 1.0 - ss_res / ss_tot
  rmse = sqrt(ss_res / n)

  # ── dense fitted curve for plotting ─────────────────────────
  x_plot = collect(LinRange(minimum(x_data), maximum(x_data), 200))
  y_plot = fitted_fn.(x_plot)

  result = Dict(
    "equation"     => equation_str,
    "coefficients" => coeff_dict,
    "r2"           => r2,
    "rmse"         => rmse,
    "fitted_x"     => x_plot,
    "fitted_y"     => y_plot,
  )
  JSON.json(result)
end`;
}

function modelBlock(mdl: string, deg: number): string {
  switch (mdl) {
    case 'linear': return `
  # Linear: y = a + b*x  (via OLS)
  X = hcat(ones(n), x_data)
  b = X \\ y_data
  a_coef, b_coef = b[1], b[2]
  y_fitted = X * b
  fitted_fn = x -> a_coef + b_coef * x
  equation_str = "y = $(round(a_coef,digits=4)) + $(round(b_coef,digits=4))·x"
  coeff_dict = Dict("a" => a_coef, "b" => b_coef)`;

    case 'poly': return `
  # Polynomial degree ${deg}: y = Σ cₙxⁿ  (via Vandermonde OLS)
  X = hcat([x_data.^k for k in 0:${deg}]...)
  coeffs = X \\ y_data
  y_fitted = X * coeffs
  fitted_fn = x -> sum(coeffs[k+1] * x^k for k in 0:${deg})
  terms = join(["$(round(coeffs[k+1],digits=4))·x^$k" for k in 0:${deg}], " + ")
  equation_str = "y = " * terms
  coeff_dict = Dict("c$k" => coeffs[k+1] for k in 0:${deg})`;

    case 'exponential': return `
  # Exponential: y = a*exp(b*x)  — linearise via ln(y)
  mask = y_data .> 0
  xl, yl = x_data[mask], log.(y_data[mask])
  X = hcat(ones(sum(mask)), xl)
  b = X \\ yl
  a_coef = exp(b[1]); b_coef = b[2]
  y_fitted = a_coef .* exp.(b_coef .* x_data)
  fitted_fn = x -> a_coef * exp(b_coef * x)
  equation_str = "y = $(round(a_coef,digits=4))·e^($(round(b_coef,digits=4))·x)"
  coeff_dict = Dict("a" => a_coef, "b" => b_coef)`;

    case 'power': return `
  # Power: y = a*x^b  — linearise via ln(y) = ln(a) + b*ln(x)
  mask = (x_data .> 0) .& (y_data .> 0)
  xl, yl = log.(x_data[mask]), log.(y_data[mask])
  X = hcat(ones(sum(mask)), xl)
  b = X \\ yl
  a_coef = exp(b[1]); b_coef = b[2]
  y_fitted = a_coef .* x_data.^b_coef
  fitted_fn = x -> a_coef * x^b_coef
  equation_str = "y = $(round(a_coef,digits=4))·x^$(round(b_coef,digits=4))"
  coeff_dict = Dict("a" => a_coef, "b" => b_coef)`;

    case 'logarithmic': return `
  # Logarithmic: y = a + b*ln(x)
  mask = x_data .> 0
  xl = log.(x_data[mask])
  X = hcat(ones(sum(mask)), xl)
  b = X \\ y_data[mask]
  a_coef, b_coef = b[1], b[2]
  y_fitted = a_coef .+ b_coef .* log.(x_data)
  fitted_fn = x -> a_coef + b_coef * log(x)
  equation_str = "y = $(round(a_coef,digits=4)) + $(round(b_coef,digits=4))·ln(x)"
  coeff_dict = Dict("a" => a_coef, "b" => b_coef)`;

    default: return '# unknown model';
  }
}

// ── SVG chart helpers ─────────────────────────────────────────────────────────
const allX = computed(() => {
  const pts = parsedPoints.value.map(p => p.x);
  if (result.value) return [...pts, ...result.value.fitted_x];
  return pts;
});
const allY = computed(() => {
  const pts = parsedPoints.value.map(p => p.y);
  if (result.value) return [...pts, ...result.value.fitted_y];
  return pts;
});

const xMin = computed(() => Math.min(...allX.value));
const xMax = computed(() => Math.max(...allX.value));
const yMin = computed(() => Math.min(...allY.value));
const yMax = computed(() => Math.max(...allY.value));
const xRange = computed(() => xMax.value - xMin.value || 1);
const yRange = computed(() => yMax.value - yMin.value || 1);

const plotW = SVG_W - MARGIN.left - MARGIN.right;
const plotH = SVG_H - MARGIN.top  - MARGIN.bottom;

function toSvgX(x: number) {
  return MARGIN.left + ((x - xMin.value) / xRange.value) * plotW;
}
function toSvgY(y: number) {
  return MARGIN.top + (1 - (y - yMin.value) / yRange.value) * plotH;
}

const fittedPolylinePoints = computed(() => {
  if (!result.value) return '';
  return result.value.fitted_x
    .map((x, i) => `${toSvgX(x)},${toSvgY(result.value!.fitted_y[i])}`)
    .join(' ');
});

function niceTicks(min: number, max: number, count = 5) {
  const range = max - min;
  const step  = Math.pow(10, Math.floor(Math.log10(range / count)));
  const nice  = [1, 2, 2.5, 5, 10].map(f => f * step).find(s => range / s <= count + 1) ?? step;
  const start = Math.ceil(min / nice) * nice;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += nice) ticks.push(parseFloat(v.toPrecision(6)));
  return ticks;
}

const xTicks = computed(() => niceTicks(xMin.value, xMax.value).map(v => ({ v, px: toSvgX(v) })));
const yTicks = computed(() => niceTicks(yMin.value, yMax.value).map(v => ({ v, py: toSvgY(v) })));

// ── Formatting ────────────────────────────────────────────────────────────────
function formatNum(v: number, sig = 5): string {
  if (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0)) return v.toExponential(3);
  return parseFloat(v.toPrecision(sig)).toString();
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.cf-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--jl-panel-bg);
  color: var(--jl-text-primary);
  font-family: var(--jl-font-ui);
  overflow: hidden;
}

.cf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}
.cf-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cf-app-icon { font-size: 18px; }
.cf-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--jl-text-primary);
}
.cf-subtitle {
  font-size: 11px;
  color: var(--jl-text-muted);
}
.cf-close {
  background: none;
  border: none;
  color: var(--jl-text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.cf-close:hover { background: var(--jl-panel-hover, rgba(255,255,255,0.08)); color: var(--jl-text-primary); }

.cf-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Controls panel ──────────────────────────────────────────────────────── */
.cf-controls {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  border-right: 1px solid var(--jl-border);
  padding: 12px;
}

.cf-section { margin-bottom: 16px; }
.cf-section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--jl-text-muted);
  margin: 0 0 6px;
}
.cf-hint {
  font-size: 11px;
  color: var(--jl-text-muted);
  margin: 0 0 6px;
}
.cf-textarea {
  width: 100%;
  height: 120px;
  background: var(--jl-terminal-bg, #1e1e1e);
  color: var(--jl-text-primary);
  border: 1px solid var(--jl-border);
  border-radius: 4px;
  padding: 6px 8px;
  font-family: var(--jl-font-mono);
  font-size: 12px;
  resize: vertical;
  box-sizing: border-box;
}
.cf-textarea:focus { outline: none; border-color: var(--jl-accent-blue, #4a9eff); }

.cf-error { font-size: 11px; color: var(--jl-accent-red, #e6192a); margin: 4px 0 0; }
.cf-ok    { font-size: 11px; color: var(--jl-accent-green);         margin: 4px 0 0; }

/* ── Model cards ─────────────────────────────────────────────────────────── */
.cf-model-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cf-model-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--jl-border);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.cf-model-card input[type=radio] { display: none; }
.cf-model-card.selected {
  background: color-mix(in srgb, var(--jl-matlab-blue) 15%, transparent);
  border-color: var(--jl-matlab-blue);
}
.cf-model-card:hover:not(.selected) {
  background: var(--jl-panel-hover, rgba(255,255,255,0.05));
}
.cf-model-name { font-size: 12px; font-weight: 600; flex: 1; }
.cf-model-eq   { font-size: 10px; color: var(--jl-text-muted); font-family: var(--jl-font-mono); }

.cf-poly-degree {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.cf-label      { font-size: 11px; color: var(--jl-text-muted); }
.cf-slider     { flex: 1; accent-color: var(--jl-matlab-blue); }
.cf-slider-val { font-size: 12px; font-weight: 700; min-width: 16px; text-align: right; }

/* ── Run button ──────────────────────────────────────────────────────────── */
.cf-run-btn {
  width: 100%;
  padding: 10px;
  background: var(--jl-matlab-blue);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
}
.cf-run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cf-run-btn:hover:not(:disabled) { opacity: 0.88; }

.cf-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Results table ───────────────────────────────────────────────────────── */
.cf-result-equation {
  font-family: var(--jl-font-mono);
  font-size: 12px;
  color: var(--jl-accent-blue, #4a9eff);
  margin-bottom: 8px;
  word-break: break-all;
}
.cf-coeff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.cf-coeff-table th, .cf-coeff-table td {
  padding: 4px 8px;
  border: 1px solid var(--jl-border);
  text-align: left;
}
.cf-coeff-table th {
  background: var(--jl-panel-bg-alt);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--jl-text-muted);
}
.cf-r2-row td { font-weight: 600; color: var(--jl-accent-green); }

/* ── Chart area ──────────────────────────────────────────────────────────── */
.cf-chart-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--jl-panel-bg);
  overflow: hidden;
}
.cf-chart-placeholder {
  color: var(--jl-text-muted);
  font-size: 13px;
  font-style: italic;
}
.cf-svg {
  width: 100%;
  max-width: 560px;
  height: auto;
}

/* ── SVG text ────────────────────────────────────────────────────────────── */
.cf-tick-label {
  font-size: 9px;
  fill: var(--jl-text-muted);
  font-family: var(--jl-font-mono, monospace);
}
.cf-legend-label {
  font-size: 10px;
  fill: var(--jl-text-muted);
  font-family: var(--jl-font-ui, sans-serif);
}
</style>