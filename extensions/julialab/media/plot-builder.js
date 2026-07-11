(function () {
  const vscode = acquireVsCodeApi();
  const EXCLUDED_NAMES = ['Base', 'Core', 'Main', 'vars'];

  const xSelect = document.getElementById('x-var');
  const ySelect = document.getElementById('y-var');
  const zSelect = document.getElementById('z-var');
  const zLabel = document.getElementById('z-var-label');
  const summaryText = document.getElementById('config-summary-text');
  const comingSoon = document.querySelector('.coming-soon');

  summaryText.textContent = 'SCRIPT EXECUTED - WAITING FOR MESSAGE';

  let currentPlotConfig = { type: null, style: [], axes: [] };

  function shouldShowZ(plotConfig) {
    return ['surface', 'contour'].includes(plotConfig.type);
  }
  function shouldShowY(plotConfig) {
    return plotConfig.type !== 'histogram';
  }
  function shouldShowComingSoon(plotConfig) {
    return ['colors', 'opacity', 'theme'].some(v => plotConfig.style.includes(v));
  }

  function populateDropdown(selectEl, vars) {
    // Keep the first placeholder option, clear the rest
    while (selectEl.options.length > 1) selectEl.remove(1);
    vars
      .filter(v => !EXCLUDED_NAMES.includes(v.name))
      .forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.type})`;
        selectEl.appendChild(opt);
      });
  }

  function applyVisibility(plotConfig) {
    const showZ = shouldShowZ(plotConfig);
    zSelect.style.display = showZ ? '' : 'none';
    zLabel.style.display = showZ ? '' : 'none';

    const showY = shouldShowY(plotConfig);
    ySelect.style.display = showY ? '' : 'none';
    ySelect.previousElementSibling.style.display = showY ? '' : 'none'; // the <label>

    comingSoon.hidden = !shouldShowComingSoon(plotConfig);
  }

  function updateSummary(plotConfig) {
    const parts = [];
    if (plotConfig.type) parts.push(`type: ${plotConfig.type}`);
    if (plotConfig.style.length) parts.push(`style: ${plotConfig.style.join(', ')}`);
    if (plotConfig.axes.length) parts.push(`axes: ${plotConfig.axes.join(', ')}`);
    summaryText.textContent = parts.length ? parts.join(' | ') : '(no options selected)';
  }

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'init') {
      currentPlotConfig = msg.plotConfig;
      populateDropdown(xSelect, msg.vars);
      populateDropdown(ySelect, msg.vars);
      populateDropdown(zSelect, msg.vars);
      applyVisibility(currentPlotConfig);
      updateSummary(currentPlotConfig);
    }
  });

  function generatePlotCode(xVar, yVar, zVar, plotConfig) {
    const usesStatsPlots = ['boxplot', 'violin', 'pie'].includes(plotConfig.type);
    const preambleParts = ['using Plots'];
    if (usesStatsPlots) preambleParts.push('using StatsPlots');
    if (plotConfig.style.includes('theme')) preambleParts.push('theme(:default)');
    const preamble = preambleParts.join('\n') + '\n';

    const kwargs = [];
    if (plotConfig.type && !['line', 'histogram', 'boxplot', 'violin', 'pie'].includes(plotConfig.type)) {
      kwargs.push(`seriestype=:${plotConfig.type}`);
    }
    if (plotConfig.style.includes('markers'))   kwargs.push('markershape=:circle');
    if (plotConfig.style.includes('linewidth')) kwargs.push('linewidth=2');
    if (plotConfig.style.includes('colors'))    kwargs.push('color=:auto');
    if (plotConfig.style.includes('opacity'))   kwargs.push('alpha=0.7');
    // theme intentionally NOT pushed to kwargs — handled in preamble above

    if (plotConfig.axes.includes('xlabel')) kwargs.push('xlabel="X"');
    if (plotConfig.axes.includes('ylabel')) kwargs.push('ylabel="Y"');
    if (plotConfig.axes.includes('legend')) kwargs.push('legend=true');
    if (plotConfig.axes.includes('grid'))   kwargs.push('grid=true');

    return preamble + buildCallArgs(xVar, yVar, zVar, plotConfig, kwargs);
  }

  function kwargsStr(kwargs) {
    return kwargs.length ? ', ' + kwargs.join(', ') : '';
  }

  function buildCallArgs(xVar, yVar, zVar, plotConfig, kwargs) {
    if (plotConfig.type === 'histogram') {
      return `histogram(${xVar}${kwargsStr(kwargs)})`;
    }
    if (['surface', 'contour'].includes(plotConfig.type) && zVar) {
      return `plot(${xVar}, ${yVar}, ${zVar}${kwargsStr(kwargs)})`;
    }
    if (plotConfig.type === 'pie') {
      return `pie(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
    }
    if (['boxplot', 'violin'].includes(plotConfig.type)) {
      return `${plotConfig.type}(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
    }
    return `plot(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
  }

  document.getElementById('run-btn').addEventListener('click', () => {
    const xVar = xSelect.value;
    const yVar = ySelect.value;
    const zVar = zSelect.value;
    const code = generatePlotCode(xVar, yVar, zVar, currentPlotConfig);
    vscode.postMessage({ command: 'runPlot', code });
  });
})();
