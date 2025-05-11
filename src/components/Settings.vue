<script setup>
import { NIcon, NTabs, NTabPane } from 'naive-ui';
import { Link } from '@vicons/ionicons5';
import ConnectionSetting from './ConnectionSetting.vue';
</script>

<template>
  <n-tabs type="line" placement="left" style="height: 100%" tab-style="width: 120px;">
    <n-tab-pane name="connection-setting">
      <ConnectionSetting />
      <template #tab>
        <n-icon size="20">
          <Link /> </n-icon
        >&nbsp;&nbsp;连接配置
      </template>
    </n-tab-pane>
  </n-tabs>
</template>
