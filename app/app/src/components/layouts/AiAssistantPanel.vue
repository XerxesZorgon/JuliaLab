<template>
  <div class="ai-panel" v-if="show">
    <div class="ai-panel-header">
      <span class="ai-panel-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3l1.5 4.5H18l-3.75 2.7 1.5 4.5L12 12l-3.75 2.7 1.5-4.5L6 7.5h4.5z"/>
        </svg>
        AI Assistant
      </span>
      <button
        class="ai-panel-close"
        @click="showKeyInput = !showKeyInput"
        title="API Key settings"
        style="font-size:12px;margin-right:4px">⚙</button>
      <button class="ai-panel-close" @click="$emit('close')">×</button>
    </div>
    <div class="ai-panel-context" v-if="fileContext">
      <span class="ai-context-label">Context:</span>
      <span class="ai-context-file">{{ fileContext.filename }}</span>
      <button class="ai-context-btn" @click="loadFileContext">↺</button>
    </div>
    <div v-if="showKeyInput" class="ai-key-input">
      <p style="font-size:11px;color:#666;margin-bottom:6px;">
        Enter your Anthropic API key to use AI Assistant.
        <a href="#" @click.prevent="openDocs" style="color:#005A9C">Get a key</a>
      </p>
      <div style="display:flex;gap:6px">
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-ant-..."
          style="flex:1;padding:6px 8px;border:1px solid #d0d0d0;border-radius:4px;font-size:12px"
        />
        <button
          @click="saveKey"
          style="padding:6px 12px;background:#005A9C;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px"
        >Save</button>
      </div>
    </div>
    <div class="ai-panel-messages" ref="messagesEl">
      <div v-if="messages.length === 0" class="ai-welcome">
        <p>Ask me about your Julia code!</p>
        <div class="ai-suggestions">
          <button class="ai-suggestion" @click="askSuggestion('Explain this code')">Explain this code</button>
          <button class="ai-suggestion" @click="askSuggestion('Find potential bugs')">Find potential bugs</button>
          <button class="ai-suggestion" @click="askSuggestion('Suggest improvements')">Suggest improvements</button>
          <button class="ai-suggestion" @click="askSuggestion('Add docstrings')">Add docstrings</button>
        </div>
      </div>
      <div v-for="(msg, i) in messages" :key="i"
           :class="['ai-message', msg.role === 'user' ? 'ai-message--user' : 'ai-message--assistant']">
        <div class="ai-message-content" v-html="renderMarkdown(msg.content)"></div>
      </div>
      <div v-if="loading" class="ai-message ai-message--assistant">
        <div class="ai-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="ai-panel-input">
      <textarea
        v-model="inputText"
        placeholder="Ask about your code..."
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="inputText += '\n'"
        rows="2"
      />
      <button class="ai-send-btn" @click="sendMessage" :disabled="loading || !inputText.trim()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(['close']);

interface Message { role: 'user' | 'assistant'; content: string; }
interface FileContext { content: string; filename: string; path: string; }

const messages = ref<Message[]>([]);
const inputText = ref('');
const loading = ref(false);
const messagesEl = ref<HTMLElement | null>(null);
const fileContext = ref<FileContext | null>(null);
const apiKey = ref(localStorage.getItem('julialab-anthropic-key') || '');
const showKeyInput = ref(!apiKey.value);

function loadFileContext() {
  window.dispatchEvent(new CustomEvent('ai:request-file-content'));
}

function handleFileContent(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail?.content) {
    fileContext.value = detail;
  }
}

onMounted(() => {
  window.addEventListener('ai:file-content', handleFileContent as EventListener);
  loadFileContext();
});

onUnmounted(() => {
  window.removeEventListener('ai:file-content', handleFileContent as EventListener);
});

watch(() => props.show, (val) => {
  if (val) {
    loadFileContext();
    nextTick(() => scrollToBottom());
  }
});

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function saveKey() {
  if (apiKey.value.trim()) {
    localStorage.setItem('julialab-anthropic-key', apiKey.value.trim());
    showKeyInput.value = false;
  }
}

async function openDocs() {
  window.open('https://console.anthropic.com/', '_blank');
}

function askSuggestion(text: string) {
  inputText.value = text;
  sendMessage();
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  loading.value = true;
  await nextTick();
  scrollToBottom();

  try {
    // Build system prompt with file context
    const systemPrompt = fileContext.value?.content
      ? `You are a helpful Julia programming assistant. The user has the following Julia file open:\n\nFilename: ${fileContext.value.filename}\n\`\`\`julia\n${fileContext.value.content.substring(0, 8000)}\n\`\`\`\n\nHelp the user with their questions about this code. Be concise and practical.`
      : 'You are a helpful Julia programming assistant. Be concise and practical.';

    // Build conversation history
    const apiMessages = messages.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));
    apiMessages.push({ role: 'user', content: text });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.value,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    const data = await response.json();
    console.log('[AI] Response status:', response.status, 'data:', JSON.stringify(data).substring(0, 200));
    if (!response.ok) {
      const errMsg = data.error?.message || JSON.stringify(data);
      messages.value.push({ role: 'assistant', content: `API Error (${response.status}): ${errMsg}` });
    } else {
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      messages.value.push({ role: 'assistant', content: reply });
    }
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: 'Error connecting to AI service. Please check your connection.'
    });
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}
</script>

<style scoped>
.ai-panel {
  position: fixed;
  right: 0;
  top: 72px;
  bottom: 0;
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 12px rgba(0,0,0,0.1);
  font-family: var(--jl-font-ui);
}
.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #005A9C;
  color: white;
  flex-shrink: 0;
}
.ai-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.ai-panel-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  opacity: 0.8;
}
.ai-panel-close:hover { opacity: 1; }
.ai-panel-context {
  padding: 6px 12px;
  background: #f0f4f8;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  flex-shrink: 0;
}
.ai-context-label { color: #666; }
.ai-context-file { color: #005A9C; font-family: var(--jl-font-mono); font-weight: 600; }
.ai-context-btn {
  background: none; border: none; cursor: pointer;
  color: #666; font-size: 13px; padding: 0 2px;
}
.ai-key-input {
  padding: 10px 12px;
  background: #fffbea;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}
.ai-panel-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ai-welcome { text-align: center; color: #666; padding: 20px 0; }
.ai-welcome p { font-size: 13px; margin-bottom: 12px; }
.ai-suggestions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.ai-suggestion {
  padding: 5px 10px;
  background: #f0f4f8;
  border: 1px solid #d0d8e4;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  color: #005A9C;
}
.ai-suggestion:hover { background: #e0ebf5; }
.ai-message {
  max-width: 90%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}
.ai-message--user {
  align-self: flex-end;
  background: #005A9C;
  color: white;
  border-radius: 8px 8px 2px 8px;
}
.ai-message--assistant {
  align-self: flex-start;
  background: #f0f4f8;
  color: #1a1a1a;
  border-radius: 8px 8px 8px 2px;
}
.ai-message-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  margin: 4px 0;
}
.ai-message-content :deep(code) {
  font-family: var(--jl-font-mono);
  font-size: 11px;
}
.ai-message--user .ai-message-content :deep(code) {
  background: rgba(255,255,255,0.2);
  padding: 1px 4px;
  border-radius: 3px;
}
.ai-typing {
  display: flex; gap: 4px; align-items: center; padding: 4px 0;
}
.ai-typing span {
  width: 6px; height: 6px;
  background: #005A9C;
  border-radius: 50%;
  animation: typing 1.2s infinite;
}
.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
.ai-panel-input {
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}
.ai-panel-input textarea {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 12px;
  font-family: var(--jl-font-ui);
  resize: none;
  outline: none;
  line-height: 1.4;
}
.ai-panel-input textarea:focus { border-color: #005A9C; }
.ai-send-btn {
  padding: 8px;
  background: #005A9C;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ai-send-btn:hover:not(:disabled) { background: #004a84; }
</style>
