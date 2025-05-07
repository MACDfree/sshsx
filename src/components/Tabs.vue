<template>
  <n-tabs
    ref="tabsRef"
    v-model:value="currentTab"
    type="card"
    :addable="true"
    :closable="true"
    size="small"
    tab-style="min-width: 80px;"
    @close="closeTab"
    @add="addTab"
    style="--n-tab-padding: 4px 8px;--n-tab-gap: 2px;--n-pane-padding-top: 2px;"
  >
    <n-tab-pane v-for="tab in tabs" :key="tab.id" :name="tab.id" :tab="tab.title" display-directive="show">
      <SSHTerminal
        v-if="tab.type === 'ssh'"
        :client-id="tab.id"
        :conn-id="tab.connId"
        :is-active="tab.id === currentTab"
        @close="closeTab"
      ></SSHTerminal>
      <FileBrowser
        v-else
        :client-id="tab.id"
        :conn-id="tab.connId"
        :is-active="tab.id === currentTab"
        @close="closeTab"
      ></FileBrowser>
    </n-tab-pane>
    <template #suffix>关闭</template>
  </n-tabs>
</template>

<script setup>
import { ref, watch, useTemplateRef, nextTick } from 'vue';
import { NTabPane, NTabs } from 'naive-ui';
import SSHTerminal from './SSHTerminal.vue';
import FileBrowser from './FileBrowser.vue';

const emit = defineEmits(['tab-change', 'tab-close', 'tab-add']);
defineExpose({
  addTabFunc,
});

const tabs = ref([]);
const currentTab = ref('');
const tabsRef = useTemplateRef('tabsRef');

// 切换标签页
const switchTab = (tabId) => {
  currentTab.value = tabId;
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
  // const newTab = {
  //   id: `tab-${Date.now()}`,
  //   title: `新标签页 ${tabs.value.length + 1}`,
  //   closable: true,
  // };
  emit('tab-add', evnet);
  // tabs.value.push(newTab);
  // currentTab.value = newTab.id;

  // // 滚动到新标签
  // setTimeout(() => {
  //   const tabsEl = tabsList.value;
  //   if (tabsEl) {
  //     tabsEl.scrollLeft = tabsEl.scrollWidth;
  //   }
  // });
};

function addTabFunc(tab) {
  tabs.value.push(tab);
  currentTab.value = tab.id;
  nextTick(() => tabsRef.value?.syncBarPosition());
}
</script>

<style lang="less" scoped>

</style>
