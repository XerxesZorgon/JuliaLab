<!-- app/src/components/TerminalView.vue -->
<template>
  <div class="terminal-wrapper">
    <!-- Spinner overlay when Julia is restarting -->
    <div v-if="isRestarting" class="restart-spinner-overlay">
      <div class="spinner-container">
        <n-spin size="large" />
        <div class="spinner-text">Restarting Julia...</div>
        <div class="spinner-subtext">Please wait while Julia restarts</div>
      </div>
    </div>

    <!-- Terminal container (hidden when restarting) -->
    <div class="terminal-container" ref="terminalContainer" :class="{ hidden: isRestarting }"></div>
  </div>
</template>

<script>
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css'; // Import xterm.css
import { FitAddon } from '@xterm/addon-fit';
import { SerializeAddon } from '@xterm/addon-serialize';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { NSpin } from 'naive-ui';
import { useTerminalStore } from '../../store/terminalStore';
import { useAppStore } from '../../store/appStore';
import { useSettingsStore } from '../../store/settingsStore';
import { debug, info, error, warn } from '../../utils/logger';

export default {
  name: 'TerminalView',
  components: {
    NSpin,
  },
  data() {
    return {
      terminalStore: null,
      appStore: null,
      settingsStore: null,
      term: null,
      fitAddon: null,
      serializeAddon: null,
      resizeObserver: null,
      unlistenOutput: null,
      unlistenError: null,
      unlistenStatus: null,
      unlistenCalculationComplete: null,
      unlistenJulialabReady: null,
      unlistenRestartStarted: null,
      unlistenRestartCompleted: null,
      // Note: Execution and backend busy listeners are now handled centrally in App.vue
      isUnmounting: false,
      inputBuffer: '', // Buffer for Julia REPL input
      sessionActive: false,
      isReady: false, // Track if terminal is ready for input
      startupCleared: false, // Clear terminal after startup noise ends
      isRestarting: false, // Track if Julia restart is in progress
      isExecuting: false, // Track if a command is currently being executed
      pollingInterval: null, // Polling interval for backend readiness
      promptWrittenAfterRestart: false, // Track if prompt was written after restart
      promptWrittenThisSession: false, // Track if prompt was written for this mounted terminal session
      isInitialMount: true, // Track if this is the initial mount
      _workspaceRefreshTimer: null, // Debounce timer for workspace refresh after REPL prompt
    };
  },

  watch: {
    isRestarting(newVal, oldVal) {
      console.log('TerminalView: isRestarting changed from', oldVal, 'to', newVal);
    },
    // Watch for settings changes and update terminal
    'settingsStore.settings.terminal_font_family'() {
      if (this.term && this.settingsStore) {
        this.term.options.fontFamily = this.settingsStore.getTerminalFontFamily();
        debug('TerminalView: Terminal font family updated from settings');
      }
    },
    'settingsStore.settings.terminal_font_size'() {
      if (this.term && this.settingsStore) {
        this.term.options.fontSize = this.settingsStore.getTerminalFontSize();
        debug('TerminalView: Terminal font size updated from settings');
        // Refit terminal after font size change
        if (this.fitAddon) {
          this.$nextTick(() => {
            try {
              this.fitAddon.fit();
            } catch (e) {
              error('TerminalView: Failed to fit terminal after font size change:', e);
            }
          });
        }
      }
    },
  },

  async mounted() {
    this.terminalStore = useTerminalStore();
    this.appStore = useAppStore();
    this.settingsStore = useSettingsStore();

    // Load settings
    try {
      await this.settingsStore.loadSettings();
    } catch (err) {
      debug('TerminalView: Failed to load settings, using defaults:', err);
    }

    // Initialize Julia REPL session
    await this.initializeJuliaSession();

    // Set up listener for when Julia Junction is ready
    await this.setupReadyListener();

    // Set up clear terminal event listener
    window.addEventListener('clear-terminal', this.clearTerminal);

    // Watch for theme changes (data-theme attribute on <html>) and update xterm
    this._themeObserver = new MutationObserver(() => {
      if (this.term) {
        this.term.options.theme = this.getTerminalTheme();
      }
    });
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Set up Julia restart event listeners
    this.setupRestartEventListeners();

    this.term.focus();
  },
  activated() {
    debug('TerminalView: activated');
    // Ensure terminal is visible and has dimensions before fitting
    this.$nextTick(() => {
      if (
        this.term &&
        this.fitAddon &&
        this.$refs.terminalContainer &&
        this.$refs.terminalContainer.clientWidth > 0
      ) {
        try {
          this.fitAddon.fit();
          this.term.focus();
        } catch (e) {
          error('TerminalView: Failed to fit terminal on activation:', e);
        }
      }
    });
    // Don't restart polling interval when component is activated - it should only run once
    // The backend is already ready, so no need to poll again
  },
  deactivated() {
    debug('TerminalView: deactivated');
    // Clear polling interval when component is deactivated to prevent prompt from appearing
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  },
  updated() {
    // Keep xterm rows in sync after tab/pane layout changes.
    this.$nextTick(() => {
      this.handleResize();
    });
  },
  beforeUnmount() {
    debug('TerminalView: beforeUnmount');
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
    this.isUnmounting = true;

    // Clear polling interval to prevent prompts from appearing after unmount
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Clear pending workspace refresh timer
    clearTimeout(this._workspaceRefreshTimer);
    this._workspaceRefreshTimer = null;

    // Save terminal state before unmounting
    this.saveTerminalState();

    // Remove clear terminal event listener
    window.removeEventListener('clear-terminal', this.clearTerminal);

    // Remove Julia restart event listeners
    this.removeRestartEventListeners();

    this.cleanupTerminalResources();
  },
  methods: {
    clearSavedTerminalState() {
      // Clear in-memory serialized terminal snapshot used across remounts.
      this.terminalStore.clearTerminalSerializedState();

      // Clear legacy persisted key (if present) so old sessions are never replayed.
      try {
        localStorage.removeItem('julialab-terminal-state');
      } catch {
        // Ignore storage errors (e.g. privacy mode/quota)
      }
    },

    ensurePromptVisible() {
      if (!this.term || this.promptWrittenThisSession) {
        return;
      }

      this.term.write('\x1b[1;32mjulia> \x1b[0m');
      this.promptWrittenThisSession = true;
      this.terminalStore.setHasShownInitialPrompt(true);
    },

    getTerminalTheme() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return isDark
        ? { background: '#1e1e1e', foreground: '#e0e0e0', cursor: '#e0e0e0', selectionBackground: '#264f78' }
        : { background: '#ffffff', foreground: '#1a1a1a', cursor: '#1a1a1a', selectionBackground: '#b3d0f0' };
    },
    async initializeJuliaSession() {
      try {
        debug('Initializing Julia session');

        // Reset input buffer and execution flag
        this.inputBuffer = '';
        this.isExecuting = false;

        // Initialize global Julia streams
        try {
          await this.terminalStore.initializeGlobalStream();
          debug('Global Julia streams initialized successfully');
        } catch (streamError) {
          debug('Failed to initialize global Julia streams:', streamError);
          // Continue anyway - the REPL will still work without global streams
        }

        if (this.term) {
          // If an old terminal exists, ensure it's cleaned up
          debug(
            'TerminalView: Existing terminal instance found during initializeJuliaSession. Cleaning up first.'
          );
          await this.cleanupTerminalResources(true);
        }

        // Get font settings from store (with defaults)
        const terminalFontFamily = this.settingsStore.getTerminalFontFamily();
        const terminalFontSize = this.settingsStore.getTerminalFontSize();

        this.term = new Terminal({
          cursorBlink: true,
          convertEol: true,
          fontFamily: terminalFontFamily,
          fontSize: terminalFontSize,
          allowProposedApi: true, // Enable clipboard API
          theme: this.getTerminalTheme(),
        });
        this.fitAddon = new FitAddon();
        this.serializeAddon = new SerializeAddon();
        this.term.loadAddon(this.fitAddon);
        this.term.loadAddon(this.serializeAddon);

        const terminalContainer = this.$refs.terminalContainer;
        if (!terminalContainer) {
          error(
            'TerminalView: terminalContainer ref not found during Julia session initialization.'
          );
          return;
        }
        this.term.open(terminalContainer);
        this.fitAddon.fit(); // Initial fit

        // Try to restore previous terminal state only on initial mount
        if (this.isInitialMount) {
          this.restoreTerminalState();
          this.isInitialMount = false; // Mark that initial mount is complete
        }

        // Check if Julia session is already active (started by backend)
        try {
          debug('Checking Julia session status');
          const isActive = await invoke('get_session_status');
          this.sessionActive = isActive;
          if (isActive) {
            debug('Julia session is already active');
          } else {
            debug(
              'Julia session is not active - it should be started automatically by the backend'
            );
          }
        } catch (sessionError) {
          error('Failed to check Julia session status:', sessionError);
          this.term.write(
            `\r\n\x1b[1;31m[ERROR] Failed to check Julia session status: ${sessionError}\x1b[0m\r\n`
          );
          return;
        }

        // Listen for Julia output events
        this.unlistenOutput = await listen('julia:output', (event) => {
          console.log('TerminalView: Julia output received, isRestarting:', this.isRestarting);

          // Don't write Julia output to terminal during restart (spinner is showing)
          if (this.isRestarting) {
            return;
          }

          // Detect end of startup noise: _start() is always the
          // last stack frame printed during Julia initialization.
          // Clear terminal 800ms after seeing it to let any
          // final output flush before wiping.
          const payloadStr = Array.isArray(event.payload)
            ? event.payload.map((p) => p.content || '').join('')
            : (typeof event.payload === 'string' ? event.payload : '');
          if (!this.startupCleared && payloadStr.includes('_start()')) {
            this.startupCleared = true;
            setTimeout(() => {
              if (this.term) {
                this.term.clear();
                // Small delay after clear to ensure it's visually
                // complete before writing the prompt
                setTimeout(() => {
                  if (this.term && this.isReady) {
                    this.term.write('\x1b[1;32mjulia> \x1b[0m');
                  }
                }, 100);
              }
            }, 1500);
          }

          if (event.payload && Array.isArray(event.payload)) {
            // debug('TerminalView: Processing', event.payload.length, 'outputs');
            for (const output of event.payload) {
              if (output.content && this.term) {
                console.log(
                  'TerminalView: Writing output to terminal:',
                  JSON.stringify(output.content)
                );
                console.log(
                  'TerminalView: Output content type:',
                  typeof output.content,
                  'length:',
                  output.content.length
                );

                let cleanContent = output.content;

                // Ensure proper line endings but don't filter out newlines
                cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                // Check if this is a Julia prompt
                if (cleanContent.includes('julia>')) {
                  this.term.write(cleanContent);
                  // Debounced workspace refresh — fire 600ms after the last prompt, so
                  // variables created directly in the REPL appear in the Workspace panel.
                  clearTimeout(this._workspaceRefreshTimer);
                  this._workspaceRefreshTimer = setTimeout(async () => {
                    try {
                      await invoke('refresh_workspace_variables');
                    } catch (_) {
                      // Julia may not be ready yet — silently ignore
                    }
                  }, 600);
                } else {
                  // Write the cleaned content immediately for regular output
                  this.term.write(cleanContent);
                }
              }
            }
          } else {
            // debug('TerminalView: Received julia-output event with invalid payload:', event.payload);
          }
        });

        // Listen for Julia error events
        this.unlistenError = await listen('julia:error', (event) => {
          console.log('TerminalView: Received julia-error event:', event.payload);
          if (event.payload && typeof event.payload === 'string') {
            const error = event.payload;
            console.log('TerminalView: Processing julia-error:', error);
            if (error && this.term) {
              this.term.write(`\r\n\x1b[1;31m[ERROR] ${error}\x1b[0m\r\n`);
            }
          }
        });

        // Listen for session status events
        this.unlistenStatus = await listen('communication:session-status', (event) => {
          if (event.payload && typeof event.payload === 'string') {
            const status = event.payload;
            debug('TerminalView: Session status:', status);
            this.sessionActive = status.includes('active');
          }
        });

        // Listen for calculation completion events (just for logging, don't display to user)
        this.unlistenCalculationComplete = await listen(
          'julia-calculation-complete',
          async (event) => {
            if (event.payload && typeof event.payload === 'object') {
              const payload = event.payload;
              const id = payload.id;
              const calculationType = payload.calculation_type;
              const success = payload.success;

              // debug(`TerminalView: Received calculation complete event - ID: ${id}, Type: ${calculationType}, Success: ${success}`);
              // debug('TerminalView: Calculation complete payload:', payload);

              // Backend will automatically send a new prompt via julia-output event
            }
          }
        );

        // Listen for Julia busy state events (new implementation)
        this.unlistenBusyState = await listen('julia-busy-state', (event) => {
          if (event.payload && typeof event.payload === 'object') {
            const payload = event.payload;
            const isBusy = payload.is_busy;
            const requestId = payload.request_id;

            // debug(`TerminalView: Received busy state event - isBusy: ${isBusy}, requestId: ${requestId}`);

            if (isBusy) {
              // debug('TerminalView: Setting terminal to busy state');
              this.terminalStore.setBusy(true);
            } else {
              // debug('TerminalView: Clearing terminal busy state');
              this.terminalStore.setBusy(false);
            }
          }
        });

        // Note: Execution events are now handled centrally in App.vue
        // No need to duplicate the busy state management here

        // Note: Backend busy state is now managed centrally in App.vue
        // No need to duplicate the busy state management here

        // Handle clipboard operations
        // Enable right-click paste and Ctrl+Shift+V
        this.term.attachCustomKeyEventHandler((event) => {
          // Handle Ctrl+Shift+V (paste) - standard terminal shortcut
          if (event.ctrlKey && event.shiftKey && event.key === 'V' && event.type === 'keydown') {
            navigator.clipboard.readText().then(text => {
              this.handlePaste(text);
            });
            return false;
          }
          // Handle Ctrl+Shift+C (copy) - standard terminal shortcut
          if (event.ctrlKey && event.shiftKey && event.key === 'C' && event.type === 'keydown') {
            const selection = this.term.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection);
            }
            return false;
          }
          return true;
        });

        // Handle paste events (right-click paste)
        const terminalElement = this.$refs.terminalContainer;
        if (terminalElement) {
          terminalElement.addEventListener('paste', (event) => {
            event.preventDefault();
            const pastedText = event.clipboardData?.getData('text');
            if (pastedText) {
              this.handlePaste(pastedText);
            }
          });
        }

        // Handle terminal input
        this.term.onData(async (data) => {
          // Only accept input if terminal is ready and not busy
          if (!this.isReady || this.appStore.getBackendBusyStatus() || this.isExecuting) {
            return;
          }

          // Handle special keys
          if (data === '\r' || data === '\n') {
            // Enter pressed - write newline first, then send buffered input
            this.term.write('\r\n'); // Move cursor to next line immediately

            // Ensure input buffer is clean before processing
            const currentInput = this.inputBuffer.trim();

            if (currentInput) {
              try {
                // Set execution flag to prevent concurrent executions
                this.isExecuting = true;
                // CRITICAL: Clear input buffer IMMEDIATELY before sending to prevent concatenation
                this.inputBuffer = '';

                // Execute code - output will come via the 'julia-output' event
                await invoke('execute_julia_code', {
                  code: currentInput,
                });

                // debug('TerminalView: Successfully sent code to Julia session');
              } catch (err) {
                error(`Failed to execute Julia code:`, err);

                // if (err.includes('Julia session is not available')) {
                //   this.term.write(`\r\n\x1b[1;31m[ERROR] Julia session is not available. Please restart the session.\x1b[0m\r\n`);
                // } else {
                //   this.term.write(`\r\n\x1b[1;31m[ERROR] ${err}\x1b[0m\r\n`);
                // }
              } finally {
                // Always clear the execution flag
                this.isExecuting = false;
              }
            } else {
              // Empty line - don't send anything, let Julia handle it automatically
              // Julia should automatically show a prompt after any execution
            }
          } else if (data === '\u007f') {
            // Backspace - remove last character from buffer
            if (this.inputBuffer.length > 0) {
              this.inputBuffer = this.inputBuffer.slice(0, -1);
              // Move cursor back and clear character
              this.term.write('\b \b');
            }
          } else if (data.charCodeAt(0) >= 32) {
            // Printable character - add to buffer and echo
            this.inputBuffer += data;
            this.term.write(data);
          }
        });

        // Set up resize observer
        if (!this.resizeObserver) {
          this.resizeObserver = new ResizeObserver(() => {
            this.handleResize();
          });
        }
        this.resizeObserver.observe(terminalContainer);
        this.handleResize(); // Initial resize
      } catch (initError) {
        error('Failed to initialize Julia session:', initError);
        if (this.term) {
          this.term.write(`\r\n[APP INIT ERROR: ${initError}]\r\n`);
        }
      }
      if (this.term) {
        this.term.focus();
      }
    },

    handleResize() {
      if (this.fitAddon && this.term) {
        try {
          this.fitAddon.fit();
        } catch (e) {
          error('TerminalView: Failed to handle resize:', e);
        }
      }
    },

    async cleanupTerminalResources(keepTerminal = false) {
      debug('TerminalView: Cleaning up terminal resources');

      // Clean up polling interval
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Clean up event listeners
      if (this.unlistenOutput) {
        this.unlistenOutput();
        this.unlistenOutput = null;
      }
      if (this.unlistenError) {
        this.unlistenError();
        this.unlistenError = null;
      }
      if (this.unlistenStatus) {
        this.unlistenStatus();
        this.unlistenStatus = null;
      }
      if (this.unlistenCalculationComplete) {
        this.unlistenCalculationComplete();
        this.unlistenCalculationComplete = null;
      }
      if (this.unlistenJulialabReady) {
        this.unlistenJulialabReady();
        this.unlistenJulialabReady = null;
      }
      // Note: Execution and backend busy listeners are now handled centrally in App.vue

      // Clean up resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      // Clean up terminal
      if (this.term && !keepTerminal) {
        this.term.dispose();
        this.term = null;
      }

      // Reset state
      this.inputBuffer = '';
      this.sessionActive = false;
      this.isReady = false; // Reset ready state
      this.isExecuting = false; // Reset execution flag

      debug('TerminalView: Terminal resources cleaned up');
    },

    async getSessionStatus() {
      try {
        const isActive = await invoke('get_session_status');
        this.sessionActive = isActive;
        return isActive;
      } catch (err) {
        error('Failed to get session status:', err);
        return false;
      }
    },

    async setupReadyListener() {
      this.unlistenJulialabReady = await listen('orchestrator:startup-ready', () => {
        debug('TerminalView: Orchestrator startup is ready. Enabling input.');
        this.isReady = true;
        this.clearSavedTerminalState();
        this.ensurePromptVisible();
        this.term.focus();

        // Emit event to notify StartupModal that terminal is ready
        window.dispatchEvent(new CustomEvent('terminal-ready'));
      });

      // Start polling for backend readiness
      this.startPollingInterval();
    },

    startPollingInterval() {
      // Clear existing interval if any to prevent multiple intervals
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Start polling for backend readiness
      this.pollingInterval = setInterval(async () => {
        try {
          const isBackendReady = await invoke('is_backend_ready');
          if (isBackendReady) {
            debug('TerminalView: Backend is ready. Attempting to enable input.');
            this.isReady = true;
            this.clearSavedTerminalState();
            this.term.focus();

            // Emit event to notify StartupModal that terminal is ready
            window.dispatchEvent(new CustomEvent('terminal-ready'));
            clearInterval(this.pollingInterval); // Stop polling if backend is ready
          } else {
            debug('TerminalView: Backend not ready yet. Polling...');
          }
        } catch (err) {
          error('TerminalView: Polling for backend readiness failed:', err);
          clearInterval(this.pollingInterval); // Stop polling on error
        }
      }, 1000); // Poll every 1 second
    },

    async handlePaste(pastedText) {
      // Only accept paste if terminal is ready and not busy
      if (!this.isReady || this.appStore.getBackendBusyStatus() || this.isExecuting) {
        return;
      }

      if (!pastedText) return;

      // Check if pasted text contains newlines (multi-line paste)
      if (pastedText.includes('\n') || pastedText.includes('\r')) {
        // Multi-line paste: execute each line separately
        const lines = pastedText
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Write the line to terminal for visual feedback
          this.term.write(line + '\r\n');
          
          try {
            this.isExecuting = true;
            await invoke('execute_julia_code', { code: line });
          } catch (err) {
            error(`Failed to execute pasted line:`, err);
          } finally {
            this.isExecuting = false;
          }
          
          // Small delay between lines to prevent overwhelming Julia
          if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Clear input buffer after multi-line paste
        this.inputBuffer = '';
      } else {
        // Single-line paste: add to input buffer
        this.inputBuffer += pastedText;
        this.term.write(pastedText);
      }
    },

    clearTerminal() {
      debug('TerminalView: Clearing terminal');
      if (this.term) {
        this.term.clear();
        // Write a new prompt after clearing
        //this.term.write('\x1b[1;32mjulia> \x1b[0m');
        this.term.focus();
      }

      debug('TerminalView: Cleared terminal state');
    },

    saveTerminalState() {
      if (this.term && this.serializeAddon) {
        try {
          const serializedState = this.serializeAddon.serialize();
          // Store in terminalStore to persist in-memory across component unmounts
          this.terminalStore.setTerminalSerializedState(serializedState);
          debug('TerminalView: Terminal state saved to store');
          return serializedState;
        } catch (error) {
          error('TerminalView: Failed to save terminal state:', error);
          return null;
        }
      }
      return null;
    },

    restoreTerminalState() {
      if (this.term && this.serializeAddon) {
        try {
          const savedState = this.terminalStore.getTerminalSerializedState();
          if (savedState) {
            this.term.write(savedState);
            this.term.write('\r\n\x1b[90m---------- previous session restored; new session starts below ----------\x1b[0m\r\n');
            debug('TerminalView: Terminal state restored from store');
            return true;
          }
        } catch (error) {
          error('TerminalView: Failed to restore terminal state:', error);
        }
      }
      return false;
    },

    setupRestartEventListeners() {
      console.log('TerminalView: Setting up restart event listeners');

      // Listen for Julia restart started event
      this.unlistenRestartStarted = listen('orchestrator:julia_restart_started', (event) => {
        console.log('TerminalView: Received orchestrator:julia_restart_started event');
        console.log('TerminalView: Event payload:', event.payload);
        console.log('TerminalView: Stack trace for restart started:', new Error().stack);
        debug('TerminalView: Julia restart started, showing spinner');
        this.showRestartSpinner();
      });

      // Listen for Julia restart completed event
      this.unlistenRestartCompleted = listen('orchestrator:julia_restart_completed', (event) => {
        console.log('TerminalView: Received orchestrator:julia_restart_completed event');
        console.log('TerminalView: Event payload:', event.payload);
        console.log('TerminalView: Stack trace for restart completed:', new Error().stack);
        debug('TerminalView: Julia restart completed, hiding spinner and preserving terminal');
        this.hideRestartSpinner();
      });

      console.log('TerminalView: Restart event listeners set up successfully');
    },

    removeRestartEventListeners() {
      if (this.unlistenRestartStarted && typeof this.unlistenRestartStarted === 'function') {
        this.unlistenRestartStarted();
        this.unlistenRestartStarted = null;
      }
      if (this.unlistenRestartCompleted && typeof this.unlistenRestartCompleted === 'function') {
        this.unlistenRestartCompleted();
        this.unlistenRestartCompleted = null;
      }
    },

    showRestartSpinner() {
      console.log('TerminalView: showRestartSpinner called');
      console.log('TerminalView: Current isRestarting state:', this.isRestarting);

      // Set restarting state to show spinner overlay and block Julia output
      this.isRestarting = true;
      this.promptWrittenAfterRestart = false; // Reset prompt flag

      console.log('TerminalView: Set isRestarting to:', this.isRestarting);

      if (this.term) {
        // Clear the terminal and serialized state when Julia restarts
        this.term.clear();
        this.terminalStore.clearTerminalSerializedState();
      }

      // Disable input during restart
      this.isReady = false;

      // Stop the polling interval during restart to prevent it from writing prompts
      if (this.pollingInterval) {
        console.log('TerminalView: Stopping polling interval during restart');
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      console.log(
        'TerminalView: Spinner overlay shown, terminal hidden, input disabled, Julia output blocked'
      );
    },

    hideRestartSpinner() {
      console.log('TerminalView: hideRestartSpinner called');
      console.log('TerminalView: Current isRestarting state:', this.isRestarting);

      if (this.term) {
        console.log(
          'TerminalView: Terminal exists, clearing terminal - letting Julia send its own prompt'
        );
        // Clear the terminal to remove any leftover output from restart
        this.term.clear();
        // Don't write a prompt here - let Julia send its own prompt
        this.term.focus();
      }

      // Add a small delay before allowing Julia output again to let any pending restart output be ignored
      setTimeout(() => {
        console.log('TerminalView: Allowing Julia output again after restart delay');
        // Clear restarting state to hide spinner overlay and allow Julia output again
        this.isRestarting = false;
        // Re-enable input
        this.isReady = true;
        this.promptWrittenThisSession = false;
        this.ensurePromptVisible();

        // Restart the polling interval to ensure backend readiness is monitored
        this.startPollingInterval();

        console.log(
          'TerminalView: Spinner overlay hidden, terminal cleared, fresh prompt written, input enabled, Julia output restored'
        );
      }, 100); // 100ms delay to let any pending Julia output be processed and ignored
    },
  },
};
</script>

<style scoped>
.terminal-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}

.terminal-container {
  width: 100%;
  height: 100%;
  background-color: var(--jl-terminal-bg);
  transition: opacity 0.3s ease;
}

.terminal-container.hidden {
  display: none;
}

.restart-spinner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--jl-terminal-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner-container {
  text-align: center;
  color: var(--jl-text-primary);
}

.spinner-text {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: #389826;
}

.spinner-subtext {
  font-size: 14px;
  color: #cccccc;
}
</style>
