<template>
  <div class="sc-container">
    <!-- Header -->
    <div class="sc-header">
      <span class="sc-title">Source Control</span>
      <div class="sc-actions">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <n-button text size="small" @click="refresh" :loading="loading">
              <n-icon><RefreshOutline /></n-icon>
            </n-button>
          </template>
          Refresh
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <n-button text size="small" @click="pullChanges" :loading="pulling">
              <n-icon><CloudDownloadOutline /></n-icon>
            </n-button>
          </template>
          Pull
        </n-tooltip>
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <n-button text size="small" @click="pushChanges" :loading="pushing">
              <n-icon><CloudUploadOutline /></n-icon>
            </n-button>
          </template>
          Push
        </n-tooltip>
      </div>
    </div>

    <!-- Not a git repo -->
    <div v-if="!isGitRepo" class="sc-empty">
      <n-icon size="40" color="#ccc"><GitBranchOutline /></n-icon>
      <p>No Git repository found</p>
      <n-button size="small" type="primary" @click="initRepo">
        Initialize Repository
      </n-button>
    </div>

    <template v-else>
      <!-- Commit input -->
      <div class="sc-commit">
        <n-input
          v-model:value="commitMessage"
          type="textarea"
          placeholder="Commit message..."
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
        <n-button
          type="primary"
          size="small"
          :disabled="!commitMessage.trim() || stagedFiles.length === 0"
          @click="commit"
          :loading="committing"
          style="margin-top: 6px; width: 100%"
        >
          Commit {{ stagedFiles.length > 0 ? `(${stagedFiles.length})` : '' }}
        </n-button>
      </div>

      <!-- Staged changes -->
      <div class="sc-section" v-if="stagedFiles.length > 0">
        <div class="sc-section-header">
          <span>Staged Changes ({{ stagedFiles.length }})</span>
          <n-button text size="tiny" @click="unstageAll">Unstage All</n-button>
        </div>
        <div v-for="file in stagedFiles" :key="file.path" class="sc-file">
          <span :class="['sc-status', `sc-status--${file.status}`]">{{ file.status }}</span>
          <span class="sc-filename" :title="file.path">{{ file.name }}</span>
          <n-button text size="tiny" @click="unstageFile(file.path)">
            <n-icon><RemoveCircleOutline /></n-icon>
          </n-button>
        </div>
      </div>

      <!-- Unstaged changes -->
      <div class="sc-section" v-if="unstagedFiles.length > 0">
        <div class="sc-section-header">
          <span>Changes ({{ unstagedFiles.length }})</span>
          <n-button text size="tiny" @click="stageAll">Stage All</n-button>
        </div>
        <div v-for="file in unstagedFiles" :key="file.path" class="sc-file">
          <span :class="['sc-status', `sc-status--${file.status}`]">{{ file.status }}</span>
          <span class="sc-filename" :title="file.path">{{ file.name }}</span>
          <n-button text size="tiny" @click="stageFile(file.path)">
            <n-icon><AddCircleOutline /></n-icon>
          </n-button>
        </div>
      </div>

      <!-- No changes -->
      <div v-if="stagedFiles.length === 0 && unstagedFiles.length === 0 && !loading" class="sc-empty">
        <n-icon size="32" color="#ccc"><CheckmarkCircleOutline /></n-icon>
        <p style="color: #999; font-size: 12px">No changes</p>
      </div>

      <!-- Recent commits -->
      <div class="sc-section" v-if="recentCommits.length > 0">
        <div class="sc-section-header">
          <span>Recent Commits</span>
        </div>
        <div v-for="commit in recentCommits" :key="commit.hash" class="sc-commit-item">
          <span class="sc-commit-hash">{{ commit.hash }}</span>
          <span class="sc-commit-msg">{{ commit.message }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useMessage, NButton, NInput, NIcon, NTooltip } from 'naive-ui';
import {
  RefreshOutline, CloudDownloadOutline, CloudUploadOutline,
  GitBranchOutline, AddCircleOutline, RemoveCircleOutline,
  CheckmarkCircleOutline
} from '@vicons/ionicons5';
import { useAppStore } from '../store/appStore';

const appStore = useAppStore();
const message = useMessage();

interface GitFile { path: string; name: string; status: string; staged: boolean; }
interface GitCommit { hash: string; message: string; }

const loading = ref(false);
const pulling = ref(false);
const pushing = ref(false);
const committing = ref(false);
const isGitRepo = ref(false);
const commitMessage = ref('');
const allFiles = ref<GitFile[]>([]);
const recentCommits = ref<GitCommit[]>([]);

const stagedFiles = computed(() => allFiles.value.filter(f => f.staged));
const unstagedFiles = computed(() => allFiles.value.filter(f => !f.staged));

const projectPath = computed(() => appStore.projectPath || '');

watch(projectPath, () => refresh(), { immediate: false });

onMounted(() => refresh());

async function refresh() {
  if (!projectPath.value) return;
  loading.value = true;
  try {
    const status = await invoke<string>('git_status', {
      projectPath: projectPath.value
    });
    isGitRepo.value = true;
    parseStatus(status);
    await loadLog();
  } catch (e) {
    isGitRepo.value = false;
  } finally {
    loading.value = false;
  }
}

function parseStatus(raw: string) {
  const files: GitFile[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const xy = line.substring(0, 2);
    const path = line.substring(3).trim();
    const name = path.split(/[\\/]/).pop() || path;
    const x = xy[0]; // staged status
    const y = xy[1]; // unstaged status
    if (x !== ' ' && x !== '?') {
      files.push({ path, name, status: statusLabel(x), staged: true });
    }
    if (y !== ' ' && y !== '?') {
      files.push({ path, name, status: statusLabel(y), staged: false });
    }
    if (xy === '??') {
      files.push({ path, name, status: 'U', staged: false });
    }
  }
  allFiles.value = files;
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { M: 'M', A: 'A', D: 'D', R: 'R', C: 'C', U: 'U' };
  return map[s] || s;
}

async function loadLog() {
  try {
    const log = await invoke<string>('git_log', { projectPath: projectPath.value });
    recentCommits.value = log.split('\n')
      .filter(l => l.trim())
      .slice(0, 10)
      .map(l => ({ hash: l.substring(0, 7), message: l.substring(8) }));
  } catch {}
}

async function stageFile(path: string) {
  try {
    await invoke('git_stage', { projectPath: projectPath.value, filePath: path });
    await refresh();
  } catch (e) { message.error(`Failed to stage: ${e}`); }
}

async function unstageFile(path: string) {
  try {
    await invoke('git_unstage', { projectPath: projectPath.value, filePath: path });
    await refresh();
  } catch (e) { message.error(`Failed to unstage: ${e}`); }
}

async function stageAll() {
  try {
    await invoke('git_stage', { projectPath: projectPath.value, filePath: '.' });
    await refresh();
  } catch (e) { message.error(`Failed to stage all: ${e}`); }
}

async function unstageAll() {
  try {
    await invoke('git_unstage', { projectPath: projectPath.value, filePath: '.' });
    await refresh();
  } catch (e) { message.error(`Failed to unstage all: ${e}`); }
}

async function commit() {
  if (!commitMessage.value.trim()) return;
  committing.value = true;
  try {
    await invoke('git_commit', {
      projectPath: projectPath.value,
      message: commitMessage.value
    });
    commitMessage.value = '';
    message.success('Committed successfully');
    await refresh();
  } catch (e) { message.error(`Commit failed: ${e}`); }
  finally { committing.value = false; }
}

async function pullChanges() {
  pulling.value = true;
  try {
    await invoke('git_pull', { projectPath: projectPath.value });
    message.success('Pull successful');
    await refresh();
  } catch (e) { message.error(`Pull failed: ${e}`); }
  finally { pulling.value = false; }
}

async function pushChanges() {
  pushing.value = true;
  try {
    await invoke('git_push', { projectPath: projectPath.value });
    message.success('Push successful');
  } catch (e) { message.error(`Push failed: ${e}`); }
  finally { pushing.value = false; }
}

async function initRepo() {
  try {
    await invoke('git_init', { projectPath: projectPath.value });
    message.success('Repository initialized');
    await refresh();
  } catch (e) { message.error(`Init failed: ${e}`); }
}
</script>

<style scoped>
.sc-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-size: 12px;
}
.sc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}
.sc-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #444;
}
.sc-actions { display: flex; gap: 4px; }
.sc-commit {
  padding: 8px;
  border-bottom: 1px solid #e8e8e8;
}
.sc-section {
  border-bottom: 1px solid #e8e8e8;
}
.sc-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f9f9f9;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.sc-file {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  gap: 6px;
  border-bottom: 1px solid #f0f0f0;
}
.sc-file:hover { background: #f5f8ff; }
.sc-status {
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.sc-status--M { color: #d4860a; }
.sc-status--A { color: #28a745; }
.sc-status--D { color: #dc3545; }
.sc-status--U { color: #6c757d; }
.sc-status--R { color: #007bff; }
.sc-filename {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}
.sc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  gap: 10px;
  color: #999;
}
.sc-commit-item {
  display: flex;
  gap: 8px;
  padding: 4px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 11px;
}
.sc-commit-hash {
  font-family: monospace;
  color: #005A9C;
  flex-shrink: 0;
}
.sc-commit-msg {
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
