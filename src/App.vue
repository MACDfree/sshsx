<template>
  <n-dialog-provider>
    <n-message-provider>
      <MainTabs ref="tabsRef" @tab-change="handleTabChange" @tab-close="handleTabClose" @tab-add="handleTabAdd"> </MainTabs>
      <ConnectionDialog ref="connectionDialogRef" @login="handleLogin"></ConnectionDialog>
    </n-message-provider>
  </n-dialog-provider>
</template>

<script setup>
import { ref, useTemplateRef, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
// import DynamicTabs from './components/DynamicTabs.vue';
import MainTabs from './components/MainTabs.vue';
import ConnectionDialog from './components/ConnectionDialog.vue';
import { NDialogProvider, NMessageProvider } from 'naive-ui';

const tabsRef = ref(null);

const connectionDialogRef = ref(null);

const handleTabChange = (tabId) => {
  console.log('切换到标签:', tabId);
};

const handleTabClose = (tabId) => {
  console.log('关闭标签:', tabId);
};

const handleTabAdd = () => {
  connectionDialogRef.value.openConnInfoDialog();
};

const handleLogin = (connId, name, type) => {
  tabsRef.value.addTabFunc({
    id: uuidv4(),
    title: name,
    type: type,
    connId: connId,
    closable: true,
  });
};
</script>

<style lang="less" scoped></style>
