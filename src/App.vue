<template>
  <DynamicTabs :initial-tabs="tabs" @tab-change="handleTabChange" @tab-close="handleTabClose" @tab-add="handleTabAdd">
  </DynamicTabs>

  <ConnectionDialog></ConnectionDialog>
</template>

<script setup>
import SSHTerminal from './components/SSHTerminal.vue';

import { ref, useTemplateRef, onMounted } from 'vue';
import DynamicTabs from './components/DynamicTabs.vue';
import ConnectionDialog from './components/ConnectionDialog.vue';

const tabs = ref([
  { id: 'tab1', title: '标签1111111111111111', closable: true },
  { id: 'tab2', title: '标签2', closable: true },
]);

const handleTabChange = (tabId) => {
  console.log('切换到标签:', tabId);
};

const handleTabClose = (tabId) => {
  console.log('关闭标签:', tabId);
};

const handleTabAdd = (newTab) => {
  console.log('新增标签:', newTab);
};

</script>

<style lang="less" scoped>
</style>
