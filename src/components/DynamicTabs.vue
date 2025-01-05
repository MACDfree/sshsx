<template>
  <div class="tabs-container">
    <!-- 标签页头部 -->
    <div class="tabs-header">
      <div class="tabs-list" ref="tabsList">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: currentTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <span v-if="tab.closable" class="tab-close" @click.stop="closeTab(tab.id)">×</span>
        </div>
        <div class="tab-add" @click="addTab">+</div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="tabs-content">
      <div v-for="tab in tabs" :key="tab.id" v-show="tab.id === currentTab">
        <SSHTerminal v-if="tab.type==='ssh'" :client-id="tab.id" :conn-id="tab.connId" :is-active="tab.id === currentTab" @close="closeTab"></SSHTerminal>
        <FileBrowser v-else :client-id="tab.id" :conn-id="tab.connId" :is-active="tab.id === currentTab" @close="closeTab"></FileBrowser>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import SSHTerminal from './SSHTerminal.vue';
import FileBrowser from './FileBrowser.vue';

const emit = defineEmits(['tab-change', 'tab-close', 'tab-add']);
defineExpose({
  addTabFunc,
});

const tabs = ref([]);
const currentTab = ref('');
const tabsList = ref(null);

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

  // 滚动到新标签
  setTimeout(() => {
    const tabsEl = tabsList.value;
    if (tabsEl) {
      tabsEl.scrollLeft = tabsEl.scrollWidth;
    }
  });
}
</script>

<style lang="less" scoped>
.tabs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  // border: 1px solid #e8e8e8;
}

.tabs-header {
  position: relative;
  border-bottom: 1px solid #e8e8e8;
  background: #f0f0f0;
  font-size: 12px;
}

.tabs-list {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  margin-right: 1px;
  background: #f3f3f3;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;

  &.active {
    background: #fff;
    border-color: #e8e8e8;
    border-bottom: 1px solid #fff;
    // margin-bottom: -1px;
  }

  &.active:hover {
    background: #fdfdfd;
  }

  &:hover {
    background-color: #ededed;
  }
}

.tab-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 50%;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.tab-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  margin: 2px;
  background: #f0f0f0;
  border: 1px dashed #d9d9d9;
  border-radius: 2px;
  cursor: pointer;

  &:hover {
    background-color: #ededed;
  }
}

.tabs-content {
  flex: 1;
  overflow: auto;
  // padding: 5px;

  &>div {
    height: 100%;
  }
}
</style>
