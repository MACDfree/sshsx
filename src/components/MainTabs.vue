<template>
  <n-tabs
    class="main-tabs"
    ref="tabsRef"
    v-model:value="currentTab"
    type="card"
    :addable="true"
    :closable="true"
    size="small"
    tab-style="min-width: 80px;"
    @close="closeTab"
    @add="addTab"
    @update:value="switchTab"
    animated
    style="--n-tab-padding: 4px 8px; --n-tab-gap: 2px; --n-pane-padding-top: 2px; height: 100vh"
    pane-wrapper-style="flex: 1;"
  >
    <n-tab-pane
      v-for="tab in tabs"
      :key="tab.id"
      :name="tab.id"
      :tab="tab.title"
      display-directive="show"
      style="height: 100%; overflow: auto"
    >
      <SSHTerminal
        v-if="tab.type === 'ssh'"
        :client-id="tab.id"
        :conn-id="tab.connId"
        :is-active="tab.id === currentTab"
        @close="closeTab"
      ></SSHTerminal>
      <FileBrowser
        v-else-if="tab.type === 'sftp'"
        :client-id="tab.id"
        :conn-id="tab.connId"
        :is-active="tab.id === currentTab"
        @close="closeTab"
      ></FileBrowser>
      <Settings v-else-if="tab.type === 'settings'"></Settings>
    </n-tab-pane>
    <template #suffix>
      <div class="tab-drag-area"></div>
      <n-button strong secondary circle size="small" @click="openSettingsTab">
        <template #icon>
          <n-icon><SettingsOutline /></n-icon>
        </template>
      </n-button>
      <div style="width: 145px; height: 100%"></div>
    </template>
  </n-tabs>
</template>

<script setup>
import { ref, watch, useTemplateRef, nextTick } from 'vue';
import { NTabPane, NTabs, NIcon, NButton } from 'naive-ui';
import SSHTerminal from './SSHTerminal.vue';
import FileBrowser from './FileBrowser.vue';
import SFTPBrowser from './SFTPBrowser.vue';
import Settings from './Settings.vue';
import { SettingsOutline } from '@vicons/ionicons5';

const emit = defineEmits(['tab-change', 'tab-close', 'tab-add']);
defineExpose({
  addTabFunc,
});

const tabs = ref([]);
const currentTab = ref('');
const tabsRef = useTemplateRef('tabsRef');

// 切换标签页
const switchTab = (tabId) => {
  emit('tab-change', tabId);
};

// 关闭标签页
const closeTab = (tabId) => {
  const index = tabs.value.findIndex((tab) => tab.id === tabId);
  if (index === -1) return;

  tabs.value = tabs.value.filter((tab) => tab.id !== tabId);

  // 如果关闭的是当前标签，切换到临近标签
  if (currentTab.value === tabId) {
    const nextTab = tabs.value[index] || tabs.value[index - 1];
    if (nextTab) {
      currentTab.value = nextTab.id;
      emit('tab-change', nextTab.id);
    }
  }

  window.sshAPI.disconnect(tabId);

  emit('tab-close', tabId);
};

// 添加标签页
const addTab = (evnet) => {
  emit('tab-add', evnet);
};

function addTabFunc(tab) {
  tabs.value.push(tab);
  currentTab.value = tab.id;
  nextTick(() => tabsRef.value?.syncBarPosition());
}

const openSettingsTab = () => {
  // 如果已经存在设置标签页，切换到该标签页
  const settingsTab = tabs.value.find((tab) => tab.id === 'settings');
  if (settingsTab) {
    currentTab.value = settingsTab.id;
    return;
  }
  addTabFunc({
    id: 'settings',
    title: '设置',
    type: 'settings',
  });
};
</script>

<style lang="less">
.main-tabs .n-tabs-pad {
  -webkit-app-region: drag;
}
.main-tabs .n-tabs-nav__suffix .tab-drag-area {
  -webkit-app-region: drag;
  min-width: 100px;
  height: 100%;
}
.n-tabs.main-tabs .n-tabs-nav__suffix {
  padding-left: 0;
}
</style>
