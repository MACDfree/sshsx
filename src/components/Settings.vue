<script setup>
import { NIcon, NTabs, NTabPane } from 'naive-ui';
import { Link, CreateOutline, Create, ReaderOutline } from '@vicons/ionicons5';
import ConnectionSetting from './ConnectionSetting.vue';
import EditorSetting from './EditorSetting.vue';
</script>

<template>
  <n-tabs type="line" placement="left" style="height: 100%" tab-style="width: 150px;">
    <n-tab-pane name="connection-setting">
      <ConnectionSetting />
      <template #tab>
        <n-icon size="20">
          <Link /> </n-icon
        >&nbsp;&nbsp;连接配置
      </template>
    </n-tab-pane>
    <n-tab-pane name="editor-setting">
      <EditorSetting />
      <template #tab>
        <n-icon size="20">
          <ReaderOutline /> </n-icon
        >&nbsp;&nbsp;编辑器配置
      </template>
    </n-tab-pane>
  </n-tabs>
</template>
