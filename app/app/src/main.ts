import { createApp, h, defineComponent } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { create, NConfigProvider } from 'naive-ui';
import { themeOverrides } from './theme';
import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
import plaintext from 'highlight.js/lib/languages/plaintext';
import router from './router';
import { usePlotStore } from './store/plotStore';
import { debug } from './utils/logger';
import { startPlotNavigatorBridge } from './services/plotEventsBridge';
import { startLspStatusBridge } from './services/lspEventsBridge';
import { startOrchestratorEventsBridge } from './services/orchestratorEventsBridge';
// FontAwesome removed - now using Ionicons

// JuliaLab theme CSS variables
import './styles/theme.css';
import 'golden-layout/dist/css/goldenlayout-base.css';

// General Fonts (Local bundled)
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';

// Monospace Fonts (Local bundled)
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
// Ionicons CSS will be imported by the icon components

// Register languages we need
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('text', plaintext);

const naive = create();
const pinia = createPinia();

const RootComponent = defineComponent({
  render() {
    // Use null for light theme (MATLAB-style), can be changed to darkTheme for dark mode
    return h(
      NConfigProvider,
      { theme: null, themeOverrides: themeOverrides, hljs: hljs },
      { default: () => h(App) }
    );
  },
});

const app = createApp(RootComponent);

app.use(naive);
app.use(pinia);
app.use(router);

// FontAwesome component registration removed - now using Ionicons

// Initialize plot store early to ensure global plot listening is set up
// Initialize plot store to register event listeners
usePlotStore();
void debug('Main: Plot store initialized');

app.mount('#app');

window.addEventListener('beforeunload', async () => { });

// Phase 5: start event bridges (plots, LSP, orchestrator)
void startPlotNavigatorBridge();
void startLspStatusBridge();
void startOrchestratorEventsBridge();
