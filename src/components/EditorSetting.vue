<script setup>
import { NFlex, NButton, NDynamicInput, NInput, useMessage } from 'naive-ui';
import { ref, onMounted, toRaw } from 'vue';

const editors = ref([]);
const message = useMessage();

onMounted(async () => {
  let res = await window.configAPI.getEditorConfigs();
  editors.value = res;
});

const newEditor = () => {
  return { name: '', path: '' };
};

const save = async () => {
  let res = JSON.stringify(toRaw(editors.value));
  res = JSON.parse(res);
  console.log(res);
  res = res.filter((item) => item.name && item.path);
  await window.configAPI.saveEditorConfigs(res);
  message.success('保存成功');
  editors.value = res;
};
</script>

<template>
  <n-flex vertical style="padding: 10px 20px">
    <div>
      <n-button type="primary" size="small" @click="save">保存配置</n-button>
    </div>
    <div>
      <n-dynamic-input v-model:value="editors" item-style="margin-bottom: 5px;" :on-create="newEditor" #="{ index }">
        <div style="display: flex; flex-grow: 1">
          <n-input v-model:value="editors[index].name" placeholder="编辑器名称" style="width: 160px" />
          <div style="height: 34px; line-height: 34px; margin: 0 8px">=</div>
          <n-input v-model:value="editors[index].path" placeholder="编辑器地址" style="min-width: 250px" />
        </div>
      </n-dynamic-input>
    </div>
  </n-flex>
</template>
