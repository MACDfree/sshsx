<template>
  <DynamicTabs ref="tabsRef" :initial-tabs="tabs" @tab-change="handleTabChange" @tab-close="handleTabClose" @tab-add="handleTabAdd">
    <template #tab-content="tab">
      <SSHTerminal v-if="tab.type === 'ssh'" :client-id="tab.id" :conn-id="tab.connId"></SSHTerminal>
    </template>
  </DynamicTabs>

  <ConnectionDialog ref="connectionDialogRef" @login="handleLogin"></ConnectionDialog>
</template>

<script setup>
import SSHTerminal from './components/SSHTerminal.vue';

import { ref, useTemplateRef, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import DynamicTabs from './components/DynamicTabs.vue';
import ConnectionDialog from './components/ConnectionDialog.vue';

const tabsRef = ref(null);
const tabs = ref([]);

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

const handleLogin = (connId, name) => {
  tabsRef.value.addTabFunc({
    id: uuidv4(),
    title: name,
    type: "ssh",
    connId: connId,
    closable: true,
  })
};

</script>

<style lang="less" scoped>
</style>
