<template>
  <div class="panel panel--ai">
    <!-- Header -->
    <div class="panel-header">
      <div class="panel-header-left">
        <span class="ai-logo">✦</span>
        <span class="ai-title">Gemini AI</span>
        <span v-if="isGenerating" class="ai-status-badge">Streaming…</span>
      </div>
      <div class="panel-header-actions">
        <NButton quaternary circle size="tiny" title="Clear conversation" @click="clearConversation">
          <template #icon><NIcon><TrashOutline /></NIcon></template>
        </NButton>
        <NButton quaternary circle size="tiny" @click="layoutStore.toggleAiPanel()">
          <template #icon><NIcon><ChevronForwardOutline /></NIcon></template>
        </NButton>
      </div>
    </div>

    <!-- Messages -->
    <div class="ai-messages" ref="messagesContainer">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">✦</div>
        <p>How can I help with your Julia code?</p>
        <div class="suggestion-chips">
          <button class="chip" @click="usePrompt('Explain this code')">Explain this code</button>
          <button class="chip" @click="usePrompt('Help me debug this error')">Debug an error</button>
          <button class="chip" @click="usePrompt('Convert this from MATLAB to Julia')">MATLAB → Julia</button>
        </div>
      </div>

      <!-- Message bubbles -->
      <TransitionGroup name="msg" tag="div" class="messages-list">
        <div
          v-for="(msg, i) in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <!-- User bubble -->
          <div v-if="msg.role === 'user'" class="bubble bubble--user">
            <span class="bubble-text">{{ msg.content }}</span>
          </div>

          <!-- Assistant bubble -->
          <div v-else class="bubble bubble--assistant">
            <!-- Auth error hint -->
            <div v-if="msg.isAuthError" class="auth-error-hint">
              <span class="auth-error-icon">🔐</span>
              <div>
                <strong>Gemini CLI not authenticated.</strong><br />
                Run <code>gemini auth</code> in your terminal or set
                <code>GOOGLE_API_KEY</code>.
              </div>
            </div>
            <!-- Markdown content -->
            <div
              v-else
              class="markdown-content"
              v-html="renderMarkdown(msg.content || '&nbsp;')"
            />
            <!-- Typing cursor while streaming -->
            <span v-if="isGenerating && i === messages.length - 1" class="cursor-blink">▍</span>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Input Area -->
    <div class="ai-input-section">
      <!-- Context toggle row -->
      <div class="ai-options-row">
        <label class="context-toggle">
          <NSwitch v-model:value="includeContext" size="small" />
          <span class="option-label">Include IDE context</span>
        </label>
        <span v-if="includeContext" class="context-preview">Editor + Workspace</span>
      </div>

      <!-- Textarea + actions -->
      <div class="ai-input-row">
        <NInput
          v-model:value="currentPrompt"
          type="textarea"
          placeholder="Ask Gemini about your Julia code…"
          :autosize="{ minRows: 2, maxRows: 8 }"
          :disabled="isGenerating"
          @keydown.enter.exact.prevent="handleSend"
          @keydown.shift.enter.exact="() => {}"
          class="ai-textarea"
          id="ai-prompt-input"
        />
      </div>

      <div class="ai-action-row">
        <!-- Stop button (visible while generating) -->
        <Transition name="fade">
          <NButton
            v-if="isGenerating"
            type="error"
            size="small"
            ghost
            @click="handleStop"
            id="ai-stop-btn"
          >
            <template #icon><NIcon><StopCircleOutline /></NIcon></template>
            Stop
          </NButton>
        </Transition>

        <div class="ai-action-right">
          <span class="send-hint">Shift+Enter for newline</span>
          <NButton
            type="primary"
            size="small"
            :disabled="!currentPrompt.trim() || isGenerating"
            @click="handleSend"
            id="ai-send-btn"
          >
            <template #icon><NIcon><SendOutline /></NIcon></template>
            Send
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onUnmounted } from 'vue';
import { NButton, NIcon, NInput, NSwitch } from 'naive-ui';
import {
  ChevronForwardOutline,
  TrashOutline,
  SendOutline,
  StopCircleOutline,
} from '@vicons/ionicons5';
import { useLayoutStore } from '../../store/layoutStore';
import { marked } from 'marked';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getIdeContext } from '../../services/aiContext';

// ─── Store ────────────────────────────────────────────────────────────────────

const layoutStore = useLayoutStore();

// ─── Configure marked ─────────────────────────────────────────────────────────

marked.setOptions({ breaks: true, gfm: true });

/**
 * Render markdown to safe HTML.  We use a custom renderer to add
 * language class names to `<code>` blocks so that a future highlight.js
 * pass (or CSS) can style them correctly.
 */
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const cls = lang ? ` class="language-${lang}"` : '';
  return `<pre><code${cls}>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
};
marked.use({ renderer });

const renderMarkdown = (text: string): string => marked(text) as string;

// ─── State ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAuthError?: boolean;
}

const includeContext = ref(true);
const currentPrompt = ref('');
const messages = ref<Message[]>([]);
const isGenerating = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// Active message index for routing streaming chunks
const activeAssistantIndex = ref<number>(-1);

// ─── Listeners ────────────────────────────────────────────────────────────────

let unlistenChunk: UnlistenFn | null = null;
let unlistenEnd: UnlistenFn | null = null;
let unlistenError: UnlistenFn | null = null;

const teardownListeners = () => {
  unlistenChunk?.();
  unlistenEnd?.();
  unlistenError?.();
  unlistenChunk = null;
  unlistenEnd = null;
  unlistenError = null;
};

onUnmounted(teardownListeners);

// ─── Scroll helpers ───────────────────────────────────────────────────────────

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Auto-scroll whenever the last assistant message grows.
watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => {
    if (isGenerating.value) scrollToBottom();
  }
);

// ─── UX helpers ───────────────────────────────────────────────────────────────

const usePrompt = (text: string) => {
  currentPrompt.value = text;
};

const clearConversation = () => {
  if (isGenerating.value) return;
  messages.value = [];
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Stop generation ─────────────────────────────────────────────────────────

const handleStop = async () => {
  try {
    await invoke('kill_gemini_stream');
  } catch (e) {
    console.warn('[AI] kill_gemini_stream failed:', e);
  }
  // isGenerating will be set false when gemini-stream-end arrives.
};

// ─── Send a message ───────────────────────────────────────────────────────────

const handleSend = async () => {
  const promptText = currentPrompt.value.trim();
  if (!promptText || isGenerating.value) return;

  currentPrompt.value = '';

  // User bubble
  messages.value.push({ id: makeId(), role: 'user', content: promptText });
  scrollToBottom();

  // Placeholder assistant bubble — will be filled by stream events
  const assistantMsg: Message = { id: makeId(), role: 'assistant', content: '' };
  messages.value.push(assistantMsg);
  activeAssistantIndex.value = messages.value.length - 1;

  isGenerating.value = true;

  // Tear down any lingering listeners from a previous turn.
  teardownListeners();

  // ── 1. Listen for text chunks ──────────────────────────────────────────────
  unlistenChunk = await listen<{ text: string }>('gemini-stream-chunk', (event) => {
    const idx = activeAssistantIndex.value;
    if (idx < 0 || idx >= messages.value.length) return;
    messages.value[idx].content += event.payload.text;
  });

  // ── 2. Listen for structured errors ───────────────────────────────────────
  unlistenError = await listen<{ message: string; is_auth_error: boolean }>(
    'gemini-stream-error',
    (event) => {
      const idx = activeAssistantIndex.value;
      if (idx < 0 || idx >= messages.value.length) return;

      const { message, is_auth_error } = event.payload;

      if (is_auth_error) {
        // Replace the bubble content with the auth error flag so the template
        // shows the specialised hint instead of raw markdown.
        messages.value[idx].content = message;
        messages.value[idx].isAuthError = true;
      } else {
        messages.value[idx].content += `\n\n> ⚠️ **Error:** ${message}`;
      }
      scrollToBottom();
    }
  );

  // ── 3. Listen for stream termination ──────────────────────────────────────
  unlistenEnd = await listen<{ exit_code: number | null }>(
    'gemini-stream-end',
    (event) => {
      isGenerating.value = false;
      activeAssistantIndex.value = -1;
      teardownListeners();

      // If the stream ended cleanly but the assistant bubble is empty, show a
      // generic failure notice.
      const last = messages.value[messages.value.length - 1];
      if (last?.role === 'assistant' && !last.content.trim()) {
        const code = event.payload.exit_code;
        if (code === -2) {
          last.content = '_Generation stopped by user._';
        } else {
          last.content = '_No response received. The CLI may have exited early._';
        }
      }
      scrollToBottom();
    }
  );

  // ── 4. Invoke the backend command ─────────────────────────────────────────
  try {
    let contextData: string | null = null;
    if (includeContext.value) {
      try {
        contextData = getIdeContext();
      } catch (ctxErr) {
        console.warn('[AI] Failed to collect IDE context:', ctxErr);
      }
    }

    await invoke('call_gemini_stream', {
      payload: { prompt: promptText, context: contextData },
    });
  } catch (invokeErr) {
    // Tauri invocation itself failed (unlikely once registered, but handle it).
    console.error('[AI] invoke error:', invokeErr);
    const idx = activeAssistantIndex.value;
    if (idx >= 0 && idx < messages.value.length) {
      messages.value[idx].content = `> ⚠️ **Failed to start stream:** ${String(invokeErr)}`;
    }
    isGenerating.value = false;
    teardownListeners();
    scrollToBottom();
  }
};
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.panel--ai {
  background: var(--jl-panel-bg);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--jl-border);
  background: var(--jl-panel-bg);
  flex-shrink: 0;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-logo {
  color: var(--jl-accent-green, #4ade80);
  font-size: 14px;
}

.ai-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--jl-text-primary);
}

.ai-status-badge {
  font-size: 0.7rem;
  color: var(--jl-text-secondary);
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
  padding: 1px 6px;
  border-radius: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.panel-header-actions {
  display: flex;
  gap: 4px;
}

/* ── Messages area ───────────────────────────────────────────────────────── */
.ai-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 12px;
  scroll-behavior: smooth;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 40px;
  gap: 10px;
  color: var(--jl-text-secondary);
}

.empty-icon {
  font-size: 28px;
  color: var(--jl-accent-green, #4ade80);
  opacity: 0.6;
}

.empty-state p {
  font-size: 0.9rem;
  margin: 0;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
}

.chip {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid var(--jl-border);
  background: var(--jl-panel-bg-alt, rgba(255,255,255,0.05));
  color: var(--jl-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.chip:hover {
  border-color: var(--jl-accent-green, #4ade80);
  color: var(--jl-accent-green, #4ade80);
}

/* ── Bubbles ─────────────────────────────────────────────────────────────── */
.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 88%;
  border-radius: 10px;
  font-size: 0.875rem;
  line-height: 1.6;
  position: relative;
}

.bubble--user {
  background: var(--jl-accent-green, #4ade80);
  color: #0a1a0a;
  padding: 9px 13px;
  border-top-right-radius: 3px;
  word-break: break-word;
}

.bubble--assistant {
  background: var(--jl-panel-bg-alt, #1a1d2e);
  border: 1px solid var(--jl-border, rgba(255,255,255,0.1));
  padding: 12px 14px;
  border-top-left-radius: 3px;
  color: var(--jl-text-primary);
  width: 100%;
  max-width: 100%;
}

/* Streaming cursor */
.cursor-blink {
  display: inline-block;
  color: var(--jl-accent-green, #4ade80);
  animation: blink 0.8s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Auth error hint */
.auth-error-hint {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--jl-text-primary);
  line-height: 1.5;
}

.auth-error-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.auth-error-hint code {
  background: rgba(255,255,255,0.08);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: var(--jl-font-mono, monospace);
  font-size: 0.85em;
}

/* ── Markdown Content ────────────────────────────────────────────────────── */
.markdown-content {
  min-height: 1.4em; /* prevent bubble collapse on empty stream start */
}

.markdown-content :deep(p) {
  margin: 0 0 8px 0;
}
.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(pre) {
  background: #0d1117;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 0.82rem;
}

.markdown-content :deep(code) {
  font-family: var(--jl-font-mono, 'IBM Plex Mono', monospace);
}

/* Inline code */
.markdown-content :deep(p code),
.markdown-content :deep(li code) {
  background: rgba(255,255,255,0.08);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.85em;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--jl-accent-green, #4ade80);
  margin: 8px 0;
  padding: 4px 10px;
  color: var(--jl-text-secondary);
  font-size: 0.87em;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 18px;
  margin: 6px 0;
}

.markdown-content :deep(li) {
  margin: 3px 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin: 10px 0 6px;
  color: var(--jl-text-primary);
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.82rem;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--jl-border, rgba(255,255,255,0.1));
  padding: 5px 8px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: rgba(255,255,255,0.05);
}

/* ── Input section ───────────────────────────────────────────────────────── */
.ai-input-section {
  border-top: 1px solid var(--jl-border);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--jl-panel-bg);
  flex-shrink: 0;
}

.ai-options-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--jl-text-secondary);
}

.context-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.context-preview {
  font-size: 0.72rem;
  opacity: 0.6;
  flex: 1;
}

.ai-input-row {
  width: 100%;
}

.ai-textarea {
  width: 100%;
}

.ai-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-action-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-hint {
  font-size: 0.7rem;
  color: var(--jl-text-secondary);
  opacity: 0.6;
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.msg-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.msg-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
